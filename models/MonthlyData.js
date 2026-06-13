/**
 * MonthlyData Model
 * Represents monthly analytics data for the dairy
 */

import mongoose from 'mongoose';

const monthlyDataSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: [true, 'Month label is required'],
      trim: true,
    },
    collected: {
      type: Number,
      required: [true, 'Collected liters is required'],
      min: 0,
    },
    revenue: {
      type: Number,
      required: [true, 'Revenue is required'],
      min: 0,
    },
    profit: {
      type: Number,
      required: [true, 'Profit is required'],
    },
    expense: {
      type: Number,
      required: [true, 'Expense is required'],
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const MonthlyData = mongoose.model('MonthlyData', monthlyDataSchema);

export default MonthlyData;
