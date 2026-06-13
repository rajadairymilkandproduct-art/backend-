/**
 * MilkSale Model
 * Represents a sales transaction - selling milk/products to clients
 */

import mongoose from 'mongoose';

const milkSaleSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client reference is required'],
    },
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    product: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      default: null,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      enum: ['L', 'kg', 'pcs'],
      required: [true, 'Unit is required'],
      default: 'L',
    },
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0, 'Price cannot be negative'],
    },
    total: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total cannot be negative'],
    },
    date: {
      type: Date,
      default: Date.now,
      required: [true, 'Sale date is required'],
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Credit'],
      default: 'Credit',
    },
    reference: {
      type: String,
      trim: true,
      unique: true,
      // Format: INV + timestamp
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paidBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/** Index for efficient queries */
milkSaleSchema.index({ clientId: 1 });
milkSaleSchema.index({ date: -1 });
milkSaleSchema.index({ paymentStatus: 1 });
milkSaleSchema.index({ clientId: 1, date: -1 });

/**
 * Pre-save hook to generate reference if not provided
 */
milkSaleSchema.pre('save', function () {
  if (!this.reference) {
    this.reference = 'INV' + Date.now().toString().slice(-6);
  }
});

const MilkSale = mongoose.model('MilkSale', milkSaleSchema);

export default MilkSale;