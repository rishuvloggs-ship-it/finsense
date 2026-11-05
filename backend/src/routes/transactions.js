import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { categorizeTransaction } from '../services/ai.js';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authenticateToken);

// GET /api/transactions
router.get('/', async (req, res, next) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      type,
      category,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const where = { userId: req.userId };

    if (type) where.type = type;
    if (category) where.category = category;
    if (search) {
      where.description = { contains: search };
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const allowedSortFields = ['date', 'amount', 'category', 'createdAt'];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : 'date';
    const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { [orderByField]: orderDir },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      transactions,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions
router.post('/', async (req, res, next) => {
  try {
    const { amount, type, description, date, paymentMethod, category, aiCategorize } = req.body;

    if (!amount || !type || !description || !date) {
      return res.status(400).json({ error: 'amount, type, description, and date are required' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'type must be "income" or "expense"' });
    }

    let finalCategory = category;
    let confidence = null;
    let aiCategorized = false;

    // Check merchant rules first
    if (!finalCategory || aiCategorize) {
      const merchantRule = await prisma.merchantRule.findUnique({
        where: {
          userId_merchant: {
            userId: req.userId,
            merchant: description.toLowerCase().trim(),
          },
        },
      });

      if (merchantRule) {
        finalCategory = merchantRule.category;
        confidence = 1.0;
        aiCategorized = false;
      } else if (!finalCategory || aiCategorize) {
        const result = await categorizeTransaction(description, amount, type);
        finalCategory = result.category;
        confidence = result.confidence;
        aiCategorized = result.source === 'ai';
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.userId,
        amount: parseFloat(amount),
        type,
        category: finalCategory,
        description,
        paymentMethod: paymentMethod || 'other',
        date: new Date(date),
        confidence,
        aiCategorized,
      },
    });

    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const { amount, type, description, date, paymentMethod, category } = req.body;

    // If category changed, upsert a MerchantRule for this description
    if (category && category !== existing.category && description) {
      await prisma.merchantRule.upsert({
        where: {
          userId_merchant: {
            userId: req.userId,
            merchant: (description || existing.description).toLowerCase().trim(),
          },
        },
        update: { category },
        create: {
          userId: req.userId,
          merchant: (description || existing.description).toLowerCase().trim(),
          category,
        },
      });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(type !== undefined && { type }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(paymentMethod !== undefined && { paymentMethod }),
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await prisma.transaction.delete({ where: { id } });
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions/import
router.post('/import', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    let mapping;
    try {
      mapping = typeof req.body.mapping === 'string'
        ? JSON.parse(req.body.mapping)
        : req.body.mapping;
    } catch {
      return res.status(400).json({ error: 'Invalid column mapping JSON' });
    }

    if (!mapping || !mapping.amount || !mapping.description || !mapping.date) {
      return res.status(400).json({ error: 'mapping must include at least: amount, description, date' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const records = await new Promise((resolve, reject) => {
      parse(csvContent, { columns: true, skip_empty_lines: true, trim: true }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const imported = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const amount = parseFloat(row[mapping.amount]);
        const description = row[mapping.description] || '';
        const dateStr = row[mapping.date];
        const type = mapping.type ? row[mapping.type] : (amount < 0 ? 'expense' : 'income');
        const paymentMethod = mapping.paymentMethod ? row[mapping.paymentMethod] : 'other';

        if (isNaN(amount)) throw new Error(`Invalid amount: ${row[mapping.amount]}`);
        if (!dateStr) throw new Error('Missing date');

        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) throw new Error(`Invalid date: ${dateStr}`);

        const result = await categorizeTransaction(description, Math.abs(amount), type);

        imported.push({
          userId: req.userId,
          amount: Math.abs(amount),
          type: ['income', 'expense'].includes(type) ? type : (amount < 0 ? 'expense' : 'income'),
          category: result.category,
          description,
          paymentMethod: paymentMethod || 'other',
          date: parsedDate,
          confidence: result.confidence,
          aiCategorized: result.source === 'ai',
        });
      } catch (err) {
        errors.push({ row: i + 1, error: err.message });
      }
    }

    if (imported.length > 0) {
      await prisma.transaction.createMany({ data: imported });
    }

    res.json({ imported: imported.length, errors });
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions/:id/override-category
const handleOverrideCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'category is required' });
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update transaction category
    const updated = await prisma.transaction.update({
      where: { id },
      data: { category, aiCategorized: false },
    });

    // Create/update merchant rule
    await prisma.merchantRule.upsert({
      where: {
        userId_merchant: {
          userId: req.userId,
          merchant: existing.description.toLowerCase().trim(),
        },
      },
      update: { category },
      create: {
        userId: req.userId,
        merchant: existing.description.toLowerCase().trim(),
        category,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

router.post('/:id/override-category', handleOverrideCategory);
router.patch('/:id/category', handleOverrideCategory);

export default router;
