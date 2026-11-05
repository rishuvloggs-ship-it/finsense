import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { getAIRecommendations } from '../services/ai.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /api/ai/recommendations
router.get('/recommendations', async (req, res, next) => {
  try {
    // Build analytics from the last 3 months
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.userId,
        date: { gte: threeMonthsAgo },
      },
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryBreakdown = {};
    const monthlyMap = {};

    for (const t of transactions) {
      if (t.type === 'income') totalIncome += t.amount;
      else {
        totalExpenses += t.amount;
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
      }

      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: d.getMonth() + 1, year: d.getFullYear(), income: 0, expenses: 0 };
      }
      if (t.type === 'income') monthlyMap[key].income += t.amount;
      else monthlyMap[key].expenses += t.amount;
    }

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? parseFloat(((netSavings / totalIncome) * 100).toFixed(2)) : 0;
    const monthlyTrend = Object.values(monthlyMap);

    const analytics = {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      categoryBreakdown,
      monthlyTrend,
    };

    const result = await getAIRecommendations(req.userId, analytics);
    res.json({ ...result, analytics });
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/budgets
router.get('/budgets', async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    // Get budgets for month/year
    const budgets = await prisma.budget.findMany({
      where: { userId: req.userId, month, year },
    });

    // Get start/end of that month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get actual spending per category for that month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.userId,
        type: 'expense',
        date: { gte: startDate, lte: endDate },
      },
    });

    const spentByCategory = {};
    for (const t of transactions) {
      spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
    }

    const result = budgets.map(b => ({
      ...b,
      spent: spentByCategory[b.category] || 0,
      remaining: b.amount - (spentByCategory[b.category] || 0),
      percentUsed: b.amount > 0
        ? parseFloat((((spentByCategory[b.category] || 0) / b.amount) * 100).toFixed(2))
        : 0,
    }));

    res.json({ budgets: result, month, year });
  } catch (err) {
    next(err);
  }
});

export default router;
