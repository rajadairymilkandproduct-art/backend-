/**
 * MilkCollection Model
 * Represents a single milk collection entry (morning/evening shift)
 */

import mongoose from 'mongoose';

const milkCollectionSchema = new mongoose.Schema(
  {
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Distributor',
      required: [true, 'Distributor reference is required'],
    },
    distributorName: {
      type: String,
      required: [true, 'Distributor name is required'],
      trim: true,
    },
    cowType: {
      type: String,
      enum: ['Cow', 'Buffalo'],
      required: [true, 'Cow type is required'],
      default: 'Cow',
    },
    date: {
      type: String,
      required: [true, 'Collection date is required'],
      // Stored as "YYYY-MM-DD" string to match the original format
    },
    shift: {
      type: String,
      enum: ['Morning', 'Evening'],
      required: [true, 'Shift is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    fat: {
      type: Number,
      required: [true, 'Fat percentage is required'],
      min: [0, 'Fat cannot be negative'],
      max: [15, 'Fat percentage seems too high'],
    },
    pricePerLiter: {
      type: Number,
      required: [true, 'Price per liter is required'],
      min: [0, 'Price cannot be negative'],
    },
    total: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

/** Index for efficient date-based queries */
milkCollectionSchema.index({ date: -1 });
/** Index for distributor lookups */
milkCollectionSchema.index({ distributorId: 1, date: -1 });

const MilkCollection = mongoose.model('MilkCollection', milkCollectionSchema);

export default MilkCollection;
