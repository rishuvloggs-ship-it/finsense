import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding FinSense database...');

  // 1. Create Demo User
  const email = 'demo@finsense.io';
  const passwordHash = await bcrypt.hash('password123', 10);

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: 'Alex Johnson',
        passwordHash,
      },
    });
    console.log(`Created user: ${user.email}`);
  } else {
    console.log(`User already exists: ${user.email}`);
  }

  // Clear existing transactions for fresh demo
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.merchantRule.deleteMany({ where: { userId: user.id } });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Helper date function (d days ago)
  const daysAgo = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };

  // 2. Create Realistic Transactions
  const transactions = [
    // Income
    { description: 'Tech Corp Monthly Salary', amount: 5200, type: 'income', category: 'Salary', paymentMethod: 'bank', date: daysAgo(5), confidence: 0.99, aiCategorized: true },
    { description: 'Tech Corp Monthly Salary', amount: 5200, type: 'income', category: 'Salary', paymentMethod: 'bank', date: daysAgo(35), confidence: 0.99, aiCategorized: true },
    { description: 'Tech Corp Monthly Salary', amount: 5200, type: 'income', category: 'Salary', paymentMethod: 'bank', date: daysAgo(65), confidence: 0.99, aiCategorized: true },
    { description: 'Freelance UI Design Project', amount: 850, type: 'income', category: 'Salary', paymentMethod: 'bank', date: daysAgo(12), confidence: 0.92, aiCategorized: true },
    { description: 'Dividend Payout Vanguard ETF', amount: 145, type: 'income', category: 'Investments', paymentMethod: 'bank', date: daysAgo(18), confidence: 0.95, aiCategorized: true },

    // Rent & Utilities
    { description: 'Monthly Apartment Rent', amount: 1650, type: 'expense', category: 'Rent', paymentMethod: 'bank', date: daysAgo(4), confidence: 0.98, aiCategorized: true },
    { description: 'Monthly Apartment Rent', amount: 1650, type: 'expense', category: 'Rent', paymentMethod: 'bank', date: daysAgo(34), confidence: 0.98, aiCategorized: true },
    { description: 'Monthly Apartment Rent', amount: 1650, type: 'expense', category: 'Rent', paymentMethod: 'bank', date: daysAgo(64), confidence: 0.98, aiCategorized: true },
    { description: 'City Electric & Power Bill', amount: 125.40, type: 'expense', category: 'Bills', paymentMethod: 'card', date: daysAgo(8), confidence: 0.94, aiCategorized: true },
    { description: 'High-Speed Fiber Internet', amount: 79.99, type: 'expense', category: 'Bills', paymentMethod: 'card', date: daysAgo(10), confidence: 0.96, aiCategorized: true },

    // Food & Dining
    { description: 'Whole Foods Market Groceries', amount: 142.80, type: 'expense', category: 'Food', paymentMethod: 'card', date: daysAgo(2), confidence: 0.95, aiCategorized: true },
    { description: 'Trader Joe\'s Weekly Haul', amount: 96.50, type: 'expense', category: 'Food', paymentMethod: 'card', date: daysAgo(9), confidence: 0.94, aiCategorized: true },
    { description: 'Luigi\'s Italian Bistro Dinner', amount: 74.20, type: 'expense', category: 'Food', paymentMethod: 'card', date: daysAgo(3), confidence: 0.93, aiCategorized: true },
    { description: 'Blue Bottle Coffee', amount: 6.75, type: 'expense', category: 'Food', paymentMethod: 'card', date: daysAgo(1), confidence: 0.91, aiCategorized: true },
    { description: 'Chipotle Mexican Grill', amount: 16.50, type: 'expense', category: 'Food', paymentMethod: 'card', date: daysAgo(6), confidence: 0.94, aiCategorized: true },

    // Transport
    { description: 'Shell Gas Station Fuel', amount: 55.00, type: 'expense', category: 'Transport', paymentMethod: 'card', date: daysAgo(7), confidence: 0.97, aiCategorized: true },
    { description: 'Uber Ride to Downtown', amount: 24.80, type: 'expense', category: 'Transport', paymentMethod: 'card', date: daysAgo(11), confidence: 0.96, aiCategorized: true },
    { description: 'Metro Monthly Transit Pass', amount: 90.00, type: 'expense', category: 'Transport', paymentMethod: 'card', date: daysAgo(28), confidence: 0.95, aiCategorized: true },

    // Shopping
    { description: 'Amazon.com Home Essentials', amount: 88.50, type: 'expense', category: 'Shopping', paymentMethod: 'card', date: daysAgo(14), confidence: 0.96, aiCategorized: true },
    { description: 'Uniqlo Winter Jacket', amount: 129.00, type: 'expense', category: 'Shopping', paymentMethod: 'card', date: daysAgo(20), confidence: 0.94, aiCategorized: true },

    // Entertainment & Subscriptions
    { description: 'Netflix 4K Subscription', amount: 22.99, type: 'expense', category: 'Entertainment', paymentMethod: 'card', date: daysAgo(15), confidence: 0.99, aiCategorized: true },
    { description: 'Spotify Premium Family', amount: 16.99, type: 'expense', category: 'Entertainment', paymentMethod: 'card', date: daysAgo(16), confidence: 0.99, aiCategorized: true },
    { description: 'AMC Movie Tickets (2x)', amount: 35.00, type: 'expense', category: 'Entertainment', paymentMethod: 'card', date: daysAgo(13), confidence: 0.92, aiCategorized: true },

    // Health
    { description: 'Equinox Gym Membership', amount: 140.00, type: 'expense', category: 'Health', paymentMethod: 'card', date: daysAgo(5), confidence: 0.95, aiCategorized: true },
    { description: 'CVS Pharmacy Prescription', amount: 28.40, type: 'expense', category: 'Health', paymentMethod: 'card', date: daysAgo(22), confidence: 0.94, aiCategorized: true },

    // Investments
    { description: 'Vanguard S&P 500 Index Fund (VOO)', amount: 500.00, type: 'expense', category: 'Investments', paymentMethod: 'bank', date: daysAgo(6), confidence: 0.98, aiCategorized: true },
  ];

  await prisma.transaction.createMany({
    data: transactions.map((t) => ({ ...t, userId: user.id })),
  });
  console.log(`Created ${transactions.length} sample transactions`);

  // 3. Create Sample Budgets for Current Month
  const currentMonth = month + 1;
  const budgets = [
    { category: 'Food', amount: 600, month: currentMonth, year },
    { category: 'Rent', amount: 1700, month: currentMonth, year },
    { category: 'Transport', amount: 250, month: currentMonth, year },
    { category: 'Shopping', amount: 300, month: currentMonth, year },
    { category: 'Bills', amount: 250, month: currentMonth, year },
    { category: 'Entertainment', amount: 150, month: currentMonth, year },
    { category: 'Health', amount: 200, month: currentMonth, year },
    { category: 'Investments', amount: 800, month: currentMonth, year },
  ];

  for (const b of budgets) {
    await prisma.budget.create({
      data: { ...b, userId: user.id },
    });
  }
  console.log(`Created ${budgets.length} budgets for ${currentMonth}/${year}`);

  // 4. Sample Merchant Override Rule
  await prisma.merchantRule.create({
    data: {
      userId: user.id,
      merchant: 'blue bottle coffee',
      category: 'Food',
    },
  });
  console.log('Created merchant rule for "blue bottle coffee" -> Food');

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

