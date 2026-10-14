# Ledgerly — Smart Personal Finance Management System

A full-stack personal finance app: track income & expenses, set monthly budgets,
build savings goals, manage recurring bills, and see it all on a live dashboard
with charts.

- **Frontend:** React (Vite) + Tailwind CSS + Recharts
- **Backend:** Node.js + Express + Sequelize
- **Database:** PostgreSQL
- **Auth:** JWT + bcrypt

---

## 1. Prerequisites

- **Node.js** v18 or newer — https://nodejs.org
- **PostgreSQL** — you already have this installed, along with **pgAdmin4** for
  browsing your data visually.

Check versions:
```bash
node -v
npm -v
psql --version
```

---

## 2. Project structure

```
finance-app/
├── backend/
│   ├── sql/
│   │   ├── schema.sql            # reference CREATE TABLE statements (for your report)
│   │   └── sample_queries.sql    # ready-to-run SELECT/JOIN/GROUP BY examples
│   ├── models/                   # Sequelize models (Users, Categories, Transactions, ...)
│   ├── routes/                   # Express routes (raw SQL used for dashboard/budget stats)
│   └── server.js
└── frontend/                     # React (Vite) app — unchanged, no setup differences
```

---

## 3. Create the PostgreSQL database

**Option A — using pgAdmin4 (GUI):**
1. Open pgAdmin4, connect to your local PostgreSQL server (it'll ask for the
   password you set during install).
2. Right-click **Databases** → **Create** → **Database...**
3. Name it `smart_finance` → Save.

**Option B — using the terminal:**
```bash
psql -U postgres
```
Then:
```sql
CREATE DATABASE smart_finance;
\q
```

Either way, you do **not** need to manually create tables. When you start the
backend in step 4, Sequelize automatically creates every table for you
(`users`, `categories`, `transactions`, `budgets`, `goals`,
`goal_contributions`, `recurring_expenses`).

If you'd rather see the tables in plain SQL first (useful for your DBMS
report), the schema is written out in `backend/sql/schema.sql` — open it in
pgAdmin4's Query Tool to read through it, or run it yourself if you prefer
full manual control.

---

## 4. Backend setup (in VS Code)

Open a terminal in VS Code:
```bash
cd backend
npm install
```

Create your environment file:
```bash
cp .env.example .env
```
(Windows Command Prompt: `copy .env.example .env`)

Open `backend/.env` and fill in your real PostgreSQL credentials:
```
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=smart_finance
DB_USER=postgres
DB_PASSWORD=your_actual_postgres_password
JWT_SECRET=change_this_to_a_long_random_secret_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
Only `DB_PASSWORD` (and `DB_USER` if you don't use the default `postgres` user) usually need changing.

Start the backend:
```bash
npm run dev
```
You should see:
```
PostgreSQL connected
All tables synced
Server running on port 5000
```
The "All tables synced" line means Sequelize just created all 7 tables in your
`smart_finance` database automatically — refresh pgAdmin4's Tables list under
`smart_finance → Schemas → public → Tables` and you'll see them appear.

Verify it's alive: open http://localhost:5000/api/health in a browser.

---

## 5. Frontend setup

Open a **second terminal** in VS Code (keep the backend running in the first one):
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open the printed URL — usually **http://localhost:5173**

---

## 6. Using the app

1. Go to http://localhost:5173/register and create an account.
   - Default categories (Salary, Food & Dining, Rent, etc.) are created for you automatically.
2. Log in, then explore: **Transactions**, **Budgets**, **Savings Goals**, **Recurring**, **Categories**, and the **Dashboard**.

---

## 7. Viewing your data directly in SQL (pgAdmin4)

Since this is a DBMS project, you'll probably want to show the raw data/queries too.

1. Open pgAdmin4 → expand your server → **Databases** → `smart_finance`
2. Right-click `smart_finance` → **Query Tool**
3. Run queries like:
```sql
SELECT * FROM transactions;

SELECT t.description, t.amount, c.name AS category
FROM transactions t
JOIN categories c ON c.id = t.category_id
ORDER BY t.date DESC;
```

A full set of ready-made queries — including JOINs, GROUP BY aggregations,
subqueries, and a `CREATE VIEW` example — is in
**`backend/sql/sample_queries.sql`**. Just open that file and copy/paste
queries into pgAdmin4's Query Tool (swap `user_id = 1` for your own user id,
which you can find by running `SELECT id, email FROM users;`).

There's also a built-in API endpoint that returns everything for the logged-in
user at once (transactions, budgets, goals, recurring items, categories, all
joined with category names) — useful if you want to show it working live in
the app itself:
```
GET /api/dashboard/everything
```
(requires the `Authorization: Bearer <token>` header, same as other endpoints)

---

## 8. DBMS concepts demonstrated (SQL / PostgreSQL)

- 7 normalized tables with proper primary keys and foreign key constraints
- One-to-many relationships: User → Categories, User → Transactions,
  Category → Transactions, Goal → Contributions, etc.
- `ON DELETE CASCADE` so deleting a user cleans up their data automatically
- Composite unique constraints (one budget per category/month/year, unique
  category name per user per type)
- Indexes on frequently-queried columns (`user_id + date`, `user_id + type + date`)
- Custom ENUM types (transaction type, payment method, frequency, goal status)
- Raw SQL `JOIN`s across multiple tables (transactions ↔ categories, budgets ↔ categories, recurring ↔ categories)
- Aggregation with `GROUP BY`, `SUM()`, `COUNT()` for monthly totals, category breakdowns, and trend charts
- A subquery example (budget vs. actual spend)
- A `CREATE VIEW` example (`transaction_details`)
- `EXTRACT()` for date-part grouping (month/year trend charts)

See `backend/sql/schema.sql` and `backend/sql/sample_queries.sql` for the exact SQL.

---

## 9. Troubleshooting

- **"Unable to connect to the database"** → Make sure your PostgreSQL server
  is actually running (check pgAdmin4 can connect on its own first), and that
  `DB_USER`/`DB_PASSWORD` in `backend/.env` match a real PostgreSQL login.
- **"password authentication failed for user"** → Your `DB_PASSWORD` in
  `.env` is wrong. This is the password you set when installing PostgreSQL.
- **"database does not exist"** → You haven't created the `smart_finance`
  database yet — see step 3.
- **CORS errors in the browser** → Make sure `CLIENT_URL` in `backend/.env`
  matches the URL the frontend is actually running on.
- **Port already in use** → Change `PORT` in `backend/.env` and update
  `VITE_API_URL` in `frontend/.env` to match. (Note: PostgreSQL's default
  port is `5432`, not `3306` like MySQL — already set correctly in `.env.example`.)
- **Table changes not showing up** → The backend uses `sequelize.sync({ alter: true })`,
  which updates tables automatically on every restart to match the models —
  just restart `npm run dev` in the backend terminal.
