import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// GET /api/analytics/summary
router.get('/summary', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = { userId: req.userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({ where });

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const t of transactions) {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpenses += t.amount;
    }

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? parseFloat(((netSavings / totalIncome) * 100).toFixed(2)) : 0;

    res.json({
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      transactionCount: transactions.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/monthly
router.get('/monthly', async (req, res, next) => {
  try {
    const months = parseInt(req.query.months, 10) || 6;

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.userId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    // Build month buckets
    const buckets = {};
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const key = `${yr}-${mIdx + 1}`;
      buckets[key] = {
        month: `${MONTH_NAMES[mIdx]} '${String(yr).slice(-2)}`,
        rawMonth: mIdx + 1,
        year: yr,
        income: 0,
        expenses: 0,
        net: 0,
      };
    }

    for (const t of transactions) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (buckets[key]) {
        if (t.type === 'income') buckets[key].income += t.amount;
        else buckets[key].expenses += t.amount;
      }
    }

    const result = Object.values(buckets).map(b => ({
      ...b,
      net: b.income - b.expenses,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/categories
router.get('/categories', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = { userId: req.userId, type: 'expense' };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({ where });

    const categoryMap = {};
    let total = 0;

    for (const t of transactions) {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      total += t.amount;
    }

    const categories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        amount,
        total: amount,
        percentage: total > 0 ? parseFloat(((amount / total) * 100).toFixed(2)) : 0,
      }));

    res.json({ categories, data: categories, total });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/trends
router.get('/trends', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = { userId: req.userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    const dailyMap = {};
    for (const t of transactions) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!dailyMap[key]) {
        dailyMap[key] = { date: key, income: 0, expenses: 0, net: 0 };
      }
      if (t.type === 'income') dailyMap[key].income += t.amount;
      else dailyMap[key].expenses += t.amount;
      dailyMap[key].net = dailyMap[key].income - dailyMap[key].expenses;
    }

    const trends = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    res.json(trends);
  } catch (err) {
    next(err);
  }
});

export default router;
