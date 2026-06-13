/**
 * Expense Model
 * Represents a business expense record
 */

import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Expense category is required'],
      trim: true,
      enum: [
        'Transportation',
        'Storage',
        'Electricity',
        'Staff Salary',
        'Maintenance',
        'Other',
      ],
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    date: {
      type: String,
      required: [true, 'Expense date is required'],
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

/** Index for date-based queries */
expenseSchema.index({ date: -1 });
/** Index for category grouping */
expenseSchema.index({ category: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
