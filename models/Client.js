/**
 * Client Model (Buyers/Retailers)
 * Represents a customer who buys milk products from the dairy
 */

import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Retail Shop', 'Supermarket', 'Cooperative', 'Hotel/Restaurant', 'Sweet Shop', 'Hospital/Clinic', 'Customer', 'Other'],
      required: [true, 'Client type is required'],
      default: 'Retail Shop',
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },

    // ── Address fields ──────────────────────────────────────────────────────
    address: {
      type: String,
      trim: true,
      default: '',
    },
    addressLine1: {
      type: String,
      trim: true,
      default: '',
    },
    addressLine2: {
      type: String,
      trim: true,
      default: '',
    },
    landmark: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      required: [true, 'City is required'],
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    pincode: {
      type: String,
      trim: true,
      default: '',
    },
    // ───────────────────────────────────────────────────────────────────────

    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },

    // ✅ creditLimit is now optional (no longer required)
    creditLimit: {
      type: Number,
      min: [0, 'Credit limit cannot be negative'],
      default: 0,
    },
    outstandingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Outstanding amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },

    // Credit tracking
    totalPurchases: {
      type: Number,
      default: 0,
      min: [0, 'Total purchases cannot be negative'],
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative'],
    },
    lastPurchaseDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Virtual for available credit
 * Calculated as: creditLimit - outstandingAmount
 */
clientSchema.virtual('creditAvailable').get(function () {
  return this.creditLimit - this.outstandingAmount;
});

/**
 * Virtual for credit utilization percentage
 * Calculated as: (outstandingAmount / creditLimit) * 100
 */
clientSchema.virtual('creditUtilization').get(function () {
  if (this.creditLimit === 0) return 0;
  return Math.round((this.outstandingAmount / this.creditLimit) * 100);
});

/** Index for efficient queries */
clientSchema.index({ status: 1 });
clientSchema.index({ city: 1 });
clientSchema.index({ type: 1 });
clientSchema.index({ joinDate: -1 });

const Client = mongoose.model('Client', clientSchema);

export default Client;
