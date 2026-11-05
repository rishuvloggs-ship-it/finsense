import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /api/budgets
router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month, 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year, 10) : now.getFullYear();

    const budgets = await prisma.budget.findMany({
      where: { userId: req.userId, month, year },
      orderBy: { category: 'asc' },
    });

    // Calculate actual expenses for this month/year
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

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

    const enrichedBudgets = budgets.map((b) => {
      const spent = spentByCategory[b.category] || 0;
      return {
        ...b,
        spent,
        remaining: b.amount - spent,
        percentUsed: b.amount > 0 ? parseFloat(((spent / b.amount) * 100).toFixed(1)) : 0,
      };
    });

    res.json({ budgets: enrichedBudgets, data: enrichedBudgets, month, year });
  } catch (err) {
    next(err);
  }
});

// POST /api/budgets — create or update (upsert)
router.post('/', async (req, res, next) => {
  try {
    const { category, amount, month, year } = req.body;

    if (!category || amount === undefined || !month || !year) {
      return res.status(400).json({ error: 'category, amount, month, and year are required' });
    }

    const parsedAmount = parseFloat(amount);
    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ error: 'amount must be a non-negative number' });
    }
    if (parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({ error: 'month must be between 1 and 12' });
    }

    const budget = await prisma.budget.upsert({
      where: {
        userId_category_month_year: {
          userId: req.userId,
          category,
          month: parsedMonth,
          year: parsedYear,
        },
      },
      update: { amount: parsedAmount },
      create: {
        userId: req.userId,
        category,
        amount: parsedAmount,
        month: parsedMonth,
        year: parsedYear,
      },
    });

    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    const existing = await prisma.budget.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await prisma.budget.delete({ where: { id } });
    res.json({ message: 'Budget deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
