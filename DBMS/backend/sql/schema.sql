-- ============================================================
-- Smart Personal Finance Management System — PostgreSQL Schema
-- ============================================================
-- NOTE: You do NOT need to run this file by hand.
-- The backend (server.js -> sequelize.sync) creates and updates
-- these tables automatically the first time you run `npm run dev`.
-- This file is provided purely as a reference for your DBMS
-- report/documentation, so you can show the schema in SQL form
-- (e.g. in pgAdmin4's Query Tool).
-- ============================================================

-- Run once, before starting the backend for the first time:
-- CREATE DATABASE smart_finance;

-- Custom ENUM types (PostgreSQL requires these to be created before use)
CREATE TYPE txn_type AS ENUM ('income', 'expense');
CREATE TYPE payment_method_type AS ENUM ('cash', 'card', 'bank_transfer', 'upi', 'other');
CREATE TYPE frequency_type AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
CREATE TYPE goal_status_type AS ENUM ('active', 'completed', 'abandoned');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  monthly_income_goal NUMERIC(12,2) DEFAULT 0,
  avatar_color VARCHAR(10) DEFAULT '#D4AF37',
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(60) NOT NULL,
  type txn_type NOT NULL,
  color VARCHAR(10) DEFAULT '#4C6FFF',
  icon VARCHAR(30) DEFAULT 'tag',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE (user_id, name, type)
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES categories(id),
  recurring_expense_id INT NULL,
  type txn_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description VARCHAR(200) DEFAULT '',
  date DATE NOT NULL,
  payment_method payment_method_type DEFAULT 'other',
  is_recurring BOOLEAN DEFAULT FALSE,
  tags VARCHAR(300) DEFAULT '',
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_user_date ON transactions (user_id, date);
CREATE INDEX idx_user_type_date ON transactions (user_id, type, date);

CREATE TABLE budgets (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES categories(id),
  month INT NOT NULL,
  year INT NOT NULL,
  limit_amount NUMERIC(12,2) NOT NULL,
  notify_at_percent INT DEFAULT 80,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE (user_id, category_id, month, year)
);

CREATE TABLE goals (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL,
  saved_amount NUMERIC(12,2) DEFAULT 0,
  target_date DATE NULL,
  icon VARCHAR(30) DEFAULT 'target',
  color VARCHAR(10) DEFAULT '#2FBF9F',
  status goal_status_type DEFAULT 'active',
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE goal_contributions (
  id SERIAL PRIMARY KEY,
  goal_id INT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  date TIMESTAMP NOT NULL,
  note VARCHAR(200) DEFAULT '',
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE recurring_expenses (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES categories(id),
  title VARCHAR(100) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type txn_type DEFAULT 'expense',
  frequency frequency_type DEFAULT 'monthly',
  start_date DATE NOT NULL,
  next_due_date DATE NOT NULL,
  end_date DATE NULL,
  is_active BOOLEAN DEFAULT TRUE,
  auto_add BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Now that recurring_expenses exists, add the deferred foreign key:
ALTER TABLE transactions
  ADD CONSTRAINT fk_transactions_recurring
  FOREIGN KEY (recurring_expense_id) REFERENCES recurring_expenses(id);
