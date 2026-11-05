# FinSense — AI-Powered Personal Finance Management System

FinSense is a full-stack personal finance web application built with **React**, **Node.js/Express**, **Prisma ORM**, and **SQLite**, with AI auto-categorization and personalized financial recommendations powered by **Google Gemini** (and Anthropic Claude), plus a rule-based offline fallback.

---

## 🌟 Key Features

1. **Authentication**
   - JWT-based registration, login, and secure session management with `bcryptjs` password hashing.
   - User data isolation (each user sees only their own transactions, budgets, and rules).

2. **Transaction Management**
   - Create, edit, and delete transactions (Amount, Date, Description, Type, Category, Payment Method).
   - Search, filter by type/category/date range, sort, and paginate.
   - Smart CSV import with interactive column mapping and client-side PapaParse preview.

3. **AI Auto-Categorization & Merchant Memory**
   - Automatically assigns categories (Food, Rent, Transport, Shopping, Bills, Entertainment, Health, Education, Travel, Salary, Investments, Other).
   - Powered by **Google Gemini API** (`GEMINI_API_KEY`) or **Anthropic Claude** (`ANTHROPIC_API_KEY`).
   - If no API key is provided, a comprehensive **keyword rule engine** categorizes transactions seamlessly offline.
   - Shows confidence score badge (e.g. `🧠 95%`).
   - Category overrides update the merchant memory (`MerchantRule`) so future transactions from the same merchant are automatically mapped to your preference.

4. **Interactive Dashboard**
   - 4 Summary Stat Cards: Total Income, Total Expenses, Net Savings, and Savings Rate (%).
   - Responsive Recharts Monthly Income vs. Expenses Bar Chart.
   - Expenses by Category Pie Chart.
   - Recent Transactions table with quick actions.

5. **Deep Analytics**
   - Extended 12-month bar chart comparison.
   - Category breakdown table with proportional progress bars.
   - Daily spending trend line chart.

6. **AI Financial Advisor (Insights)**
   - Actionable recommendations with priority badges (High, Medium, Low), category chips, and estimated potential savings per month.
   - Rule-based financial heuristic fallback when offline.

7. **Category Budgets**
   - Set monthly spending limits per category.
   - Real-time progress bars indicating consumption (yellow when near limit, red when over budget).
   - Overall monthly budget health score.

---

## 🚀 Quick Start

### 1. Configure Your API Key (Optional)
Open `finsense/backend/.env` and paste your Gemini API key:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="finsense-jwt-secret-change-in-production"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
PORT=5000
```
> **Note**: Even without an API key, FinSense operates completely offline with its built-in rule-based categorizer and financial recommendation engine!

### 2. Start Both Backend & Frontend
Double-click `start.bat` in `finsense/` or run:
```powershell
C:\Users\Dell\.antigravity\finsense\start.bat
```
This automatically launches:
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`
- Opens your browser to the app.

---

## 🔑 Demo Account

A seeded demo account is pre-loaded with 3 months of realistic transactions and budgets:
- **Email**: `demo@finsense.io`
- **Password**: `password123`

You can also register a brand-new account at any time!

---

## 📁 Testing CSV Import
A sample bank statement CSV file is provided at:
`finsense/sample_bank_statement.csv`
You can import it directly via the **Import CSV** button on the Transactions or Dashboard page.

