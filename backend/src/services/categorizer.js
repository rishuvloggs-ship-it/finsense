const KEYWORD_RULES = {
  Food: ['restaurant', 'cafe', 'pizza', 'burger', 'grocery', 'supermarket', 'zomato', 'swiggy', 'food', 'lunch', 'dinner', 'breakfast', 'hotel', 'bakery', 'eat'],
  Rent: ['rent', 'lease', 'housing', 'apartment', 'flat', 'pg', 'room'],
  Transport: ['uber', 'ola', 'taxi', 'metro', 'bus', 'fuel', 'petrol', 'diesel', 'auto', 'cab', 'train', 'flight', 'parking'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'mall', 'shop', 'store', 'purchase', 'buy', 'meesho', 'ajio'],
  Bills: ['electricity', 'water', 'internet', 'wifi', 'phone', 'mobile', 'bill', 'recharge', 'broadband', 'gas', 'utility'],
  Entertainment: ['netflix', 'spotify', 'youtube', 'movie', 'cinema', 'game', 'gaming', 'subscription', 'prime', 'hotstar'],
  Health: ['hospital', 'doctor', 'medicine', 'pharmacy', 'health', 'gym', 'fitness', 'clinic', 'dental', 'medical'],
  Education: ['school', 'college', 'university', 'course', 'book', 'tuition', 'fee', 'udemy', 'coursera', 'educat'],
  Travel: ['hotel', 'resort', 'trip', 'tour', 'travel', 'vacation', 'holiday', 'booking', 'airbnb', 'makemytrip'],
  Salary: ['salary', 'payroll', 'wage', 'income', 'stipend', 'bonus'],
  Investments: ['mutual fund', 'stock', 'sip', 'invest', 'zerodha', 'groww', 'crypto', 'nps', 'ppf', 'fd', 'deposit'],
};

export function categorizeByKeyword(description) {
  const lower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(KEYWORD_RULES)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return { category, confidence: 0.7 };
    }
  }
  return { category: 'Other', confidence: 0.5 };
}
