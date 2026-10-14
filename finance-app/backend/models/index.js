const sequelize = require("../config/db");
const User = require("./User");
const Category = require("./Category");
const Transaction = require("./Transaction");
const Budget = require("./Budget");
const Goal = require("./Goal");
const GoalContribution = require("./GoalContribution");
const RecurringExpense = require("./RecurringExpense");

// ----- User has many of everything -----
User.hasMany(Category, { foreignKey: "userId", onDelete: "CASCADE" });
Category.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Transaction, { foreignKey: "userId", onDelete: "CASCADE" });
Transaction.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Budget, { foreignKey: "userId", onDelete: "CASCADE" });
Budget.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Goal, { foreignKey: "userId", onDelete: "CASCADE" });
Goal.belongsTo(User, { foreignKey: "userId" });

User.hasMany(RecurringExpense, { foreignKey: "userId", onDelete: "CASCADE" });
RecurringExpense.belongsTo(User, { foreignKey: "userId" });

// ----- Category relationships (aliased as "category" to match the frontend) -----
Category.hasMany(Transaction, { foreignKey: "categoryId" });
Transaction.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

Category.hasMany(Budget, { foreignKey: "categoryId" });
Budget.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

Category.hasMany(RecurringExpense, { foreignKey: "categoryId" });
RecurringExpense.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

// ----- Recurring expense -> generated transactions -----
RecurringExpense.hasMany(Transaction, { foreignKey: "recurringExpenseId" });
Transaction.belongsTo(RecurringExpense, { foreignKey: "recurringExpenseId", as: "recurring" });

// ----- Goal -> contributions -----
Goal.hasMany(GoalContribution, { foreignKey: "goalId", as: "contributions", onDelete: "CASCADE" });
GoalContribution.belongsTo(Goal, { foreignKey: "goalId" });

// ----- Add a Mongo-style "_id" alias to every model's JSON output -----
// (keeps the existing React frontend, which expects `_id`, working unchanged)
[User, Category, Transaction, Budget, Goal, GoalContribution, RecurringExpense].forEach((Model) => {
  Model.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = String(values.id);
    return values;
  };
});

module.exports = {
  sequelize,
  User,
  Category,
  Transaction,
  Budget,
  Goal,
  GoalContribution,
  RecurringExpense,
};
