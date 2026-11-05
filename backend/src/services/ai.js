import Anthropic from '@anthropic-ai/sdk';
import { categorizeByKeyword } from './categorizer.js';

const CATEGORIES = [
  'Food',
  'Rent',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Travel',
  'Salary',
  'Investments',
  'Other'
];

function hasGeminiKey() {
  const key = process.env.GEMINI_API_KEY;
  return key && key.trim() !== '' && key !== 'your-gemini-api-key-here';
}

function hasAnthropicKey() {
  const key = process.env.ANTHROPIC_API_KEY;
  return key && key.trim() !== '' && key !== 'your-api-key-here';
}

async function callGemini(prompt, systemInstruction = '') {
  const apiKey = process.env.GEMINI_API_KEY;
  const candidateModels = [
    process.env.GEMINI_MODEL,
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-2.5-flash-lite',
  ].filter(Boolean);

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      };
      if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(`Gemini API (${model}) ${response.status}: ${errorText}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini model candidates failed');
}

async function callAnthropic(prompt) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });
  return message.content[0].text;
}

export async function categorizeTransaction(description, amount, type) {
  const prompt = `Categorize this financial transaction into exactly one of these categories: ${CATEGORIES.join(', ')}.
Transaction: "${description}", Amount: ${amount}, Type: ${type}
Respond with valid JSON only in this exact shape:
{"category": "CategoryName", "confidence": 0.95}
where confidence is a number between 0.5 and 1.0.`;

  // 1. Try Gemini
  if (hasGeminiKey()) {
    try {
      const text = await callGemini(prompt, 'You are an accurate transaction categorizer that responds strictly with valid JSON.');
      const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
      const json = JSON.parse(cleaned);
      if (CATEGORIES.includes(json.category)) {
        return { category: json.category, confidence: Number(json.confidence) || 0.9, source: 'ai' };
      }
    } catch (err) {
      console.warn('Gemini categorization failed, checking fallbacks:', err.message);
    }
  }

  // 2. Try Anthropic
  if (hasAnthropicKey()) {
    try {
      const text = await callAnthropic(prompt);
      const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
      const json = JSON.parse(cleaned);
      if (CATEGORIES.includes(json.category)) {
        return { category: json.category, confidence: Number(json.confidence) || 0.9, source: 'ai' };
      }
    } catch (err) {
      console.warn('Anthropic categorization failed, checking keyword fallback:', err.message);
    }
  }

  // 3. Fallback to keyword rules
  return { ...categorizeByKeyword(description), source: 'keyword' };
}

export async function getAIRecommendations(userId, analytics) {
  const prompt = `You are an expert personal finance advisor. Analyze this user's financial summary and provide 5 practical, actionable recommendations to improve their savings.

Financial Summary:
- Total Income: $${analytics.totalIncome}
- Total Expenses: $${analytics.totalExpenses}
- Net Savings: $${analytics.netSavings}
- Savings Rate: ${analytics.savingsRate}%
- Top Spending Categories: ${JSON.stringify(analytics.categoryBreakdown)}
- Monthly Trend: ${JSON.stringify(analytics.monthlyTrend)}

Respond with JSON in this format:
{
  "recommendations": [
    {
      "title": "Short title",
      "description": "Specific action to take",
      "priority": "high",
      "potentialSaving": 120,
      "category": "Food"
    }
  ]
}
priority must be one of: "high", "medium", "low". potentialSaving should be a number (0 if not quantifiable).`;

  // 1. Try Gemini
  if (hasGeminiKey()) {
    try {
      const text = await callGemini(prompt, 'You are an expert personal finance advisor responding strictly in JSON.');
      const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
      const json = JSON.parse(cleaned);
      if (Array.isArray(json.recommendations) && json.recommendations.length > 0) {
        return json;
      }
    } catch (err) {
      console.warn('Gemini recommendation failed, checking fallback:', err.message);
    }
  }

  // 2. Try Anthropic
  if (hasAnthropicKey()) {
    try {
      const text = await callAnthropic(prompt);
      const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
      const json = JSON.parse(cleaned);
      if (Array.isArray(json.recommendations) && json.recommendations.length > 0) {
        return json;
      }
    } catch (err) {
      console.warn('Anthropic recommendation failed:', err.message);
    }
  }

  // 3. Fallback rule-based recommendations
  return generateFallbackRecommendations(analytics);
}

function generateFallbackRecommendations(analytics) {
  const recommendations = [];
  const income = Number(analytics.totalIncome) || 0;
  const rate = Number(analytics.savingsRate) || 0;

  if (rate < 20) {
    recommendations.push({
      title: 'Boost Your Savings Rate to 20%',
      description: 'Your current savings rate is below the recommended 20%. Try setting up an automatic recurring transfer on payday.',
      priority: 'high',
      potentialSaving: income > 0 ? Math.round(income * 0.05) : 100,
      category: 'Savings'
    });
  }

  const topCategories = Object.entries(analytics.categoryBreakdown || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  for (const [cat, amt] of topCategories) {
    const amount = Number(amt) || 0;
    recommendations.push({
      title: `Optimize ${cat} Expenses`,
      description: `You spent $${amount.toFixed(0)} on ${cat}. Review recurring charges or set a weekly cap to save ~15%.`,
      priority: amount > 500 ? 'high' : 'medium',
      potentialSaving: Math.round(amount * 0.15),
      category: cat
    });
  }

  if (recommendations.length < 5) {
    recommendations.push({
      title: 'Establish a 3-Month Emergency Fund',
      description: 'Maintain liquid funds covering at least 3 months of essential living expenses for security against emergencies.',
      priority: 'high',
      potentialSaving: 0,
      category: 'General'
    });
  }

  if (recommendations.length < 5) {
    recommendations.push({
      title: 'Audit Recurring Subscriptions',
      description: 'Check your entertainment, gym, and digital subscriptions. Cancel any service you have not used in the past 30 days.',
      priority: 'low',
      potentialSaving: 30,
      category: 'Entertainment'
    });
  }

  return { recommendations: recommendations.slice(0, 5) };
}
