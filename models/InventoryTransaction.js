/**
 * InventoryTransaction Model
 * Tracks all stock movements (in/out) for inventory items
 */

import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: [true, 'Item reference is required'],
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['In', 'Out'],
      required: [true, 'Transaction type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than 0'],
    },
    unit: {
      type: String,
      enum: ['L', 'kg', 'pcs'],
      default: 'L',
    },
    reason: {
      type: String,
      enum: [
        'Fresh collection',
        'Processing usage',
        'Sale to customer',
        'Damaged/Spillage',
        'Quality check discard',
        'Transfer between storage',
        'Adjustment',
        'Other'
      ],
      required: [true, 'Reason is required'],
    },
    reference: {
      type: String,
      trim: true,
      default: null,
      // Can be collection ID, sale ID, production ID, etc.
    },
    referenceType: {
      type: String,
      enum: ['MilkCollection', 'MilkSale', 'Production', 'Manual', 'Other'],
      default: 'Manual',
    },
    date: {
      type: Date,
      default: Date.now,
      required: [true, 'Transaction date is required'],
    },
    createdBy: {
      type: String,
      default: 'Admin',
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

/** Index for efficient queries */
inventoryTransactionSchema.index({ itemId: 1 });
inventoryTransactionSchema.index({ date: -1 });
inventoryTransactionSchema.index({ type: 1 });
inventoryTransactionSchema.index({ itemId: 1, date: -1 });

const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);

export default InventoryTransaction;
