/**
 * DailyData Model
 * Represents daily milk collection analytics (morning vs evening shift)
 */

import mongoose from 'mongoose';

const dailyDataSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: [true, 'Day label is required'],
      trim: true,
    },
    morning: {
      type: Number,
      required: [true, 'Morning collection is required'],
      min: 0,
    },
    evening: {
      type: Number,
      required: [true, 'Evening collection is required'],
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const DailyData = mongoose.model('DailyData', dailyDataSchema);

export default DailyData;
