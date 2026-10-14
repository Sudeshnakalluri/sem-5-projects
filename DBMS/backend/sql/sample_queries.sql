-- ============================================================
-- Sample SQL queries — run these in pgAdmin4's Query Tool
-- (right-click your database -> Query Tool), or via `psql`.
-- Replace the user_id/email in each query with your own.
-- ============================================================

-- ------------------------------------------------------------
-- 1. See EVERYTHING in every table (simplest option)
-- ------------------------------------------------------------
SELECT * FROM users;
SELECT * FROM categories;
SELECT * FROM transactions;
SELECT * FROM budgets;
SELECT * FROM goals;
SELECT * FROM goal_contributions;
SELECT * FROM recurring_expenses;

-- ------------------------------------------------------------
-- 2. Find your user id first (needed for the queries below)
-- ------------------------------------------------------------
SELECT id, name, email FROM users WHERE email = 'you@example.com';

-- ------------------------------------------------------------
-- 3. All transactions for one user, with category name (JOIN)
-- ------------------------------------------------------------
SELECT
  t.id,
  t.type,
  t.amount,
  t.description,
  t.date,
  t.payment_method,
  c.name AS category_name
FROM transactions t
JOIN categories c ON c.id = t.category_id
WHERE t.user_id = 1
ORDER BY t.date DESC;

-- ------------------------------------------------------------
-- 4. Total income vs. total expense for a given month (GROUP BY + aggregation)
-- ------------------------------------------------------------
SELECT
  type,
  SUM(amount) AS total,
  COUNT(*) AS transaction_count
FROM transactions
WHERE user_id = 1
  AND date >= '2026-07-01'
  AND date < '2026-08-01'
GROUP BY type;

-- ------------------------------------------------------------
-- 5. Spending broken down by category, highest first (JOIN + GROUP BY + ORDER BY)
-- ------------------------------------------------------------
SELECT
  c.name AS category,
  SUM(t.amount) AS total_spent,
  COUNT(*) AS num_transactions
FROM transactions t
JOIN categories c ON c.id = t.category_id
WHERE t.user_id = 1 AND t.type = 'expense'
GROUP BY c.name
ORDER BY total_spent DESC;

-- ------------------------------------------------------------
-- 6. Budget vs. actual spend per category this month
--    (JOIN + subquery + calculated column)
-- ------------------------------------------------------------
SELECT
  c.name AS category,
  b.limit_amount,
  COALESCE(spent.total, 0) AS actual_spent,
  b.limit_amount - COALESCE(spent.total, 0) AS remaining,
  ROUND(COALESCE(spent.total, 0) / b.limit_amount * 100, 1) AS percent_used
FROM budgets b
JOIN categories c ON c.id = b.category_id
LEFT JOIN (
  SELECT category_id, SUM(amount) AS total
  FROM transactions
  WHERE user_id = 1 AND type = 'expense'
    AND date >= '2026-07-01' AND date < '2026-08-01'
  GROUP BY category_id
) spent ON spent.category_id = b.category_id
WHERE b.user_id = 1 AND b.month = 7 AND b.year = 2026;

-- ------------------------------------------------------------
-- 7. Savings goal progress (calculated percentage column)
-- ------------------------------------------------------------
SELECT
  title,
  saved_amount,
  target_amount,
  ROUND(saved_amount / target_amount * 100, 1) AS percent_complete,
  status
FROM goals
WHERE user_id = 1
ORDER BY percent_complete DESC;

-- ------------------------------------------------------------
-- 8. Monthly income vs. expense trend, last 6 months
--    (GROUP BY date parts using EXTRACT)
-- ------------------------------------------------------------
SELECT
  EXTRACT(YEAR FROM date) AS yr,
  EXTRACT(MONTH FROM date) AS mo,
  type,
  SUM(amount) AS total
FROM transactions
WHERE user_id = 1
  AND date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date), type
ORDER BY yr, mo;

-- ------------------------------------------------------------
-- 9. Upcoming recurring bills due soon (JOIN + WHERE + ORDER BY)
-- ------------------------------------------------------------
SELECT
  r.title,
  r.amount,
  r.frequency,
  r.next_due_date,
  c.name AS category
FROM recurring_expenses r
JOIN categories c ON c.id = r.category_id
WHERE r.user_id = 1 AND r.is_active = TRUE
ORDER BY r.next_due_date ASC;

-- ------------------------------------------------------------
-- 10. A reusable VIEW that always shows transactions with category names
--     (demonstrates VIEW as a DBMS concept)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW transaction_details AS
SELECT
  t.id,
  t.user_id,
  t.type,
  t.amount,
  t.description,
  t.date,
  c.name AS category_name,
  c.color AS category_color
FROM transactions t
JOIN categories c ON c.id = t.category_id;

-- Now you can simply run:
SELECT * FROM transaction_details WHERE user_id = 1 ORDER BY date DESC;
