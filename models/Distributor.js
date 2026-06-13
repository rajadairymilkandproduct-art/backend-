/**
 * Distributor Model
 * Represents a milk distributor/farmer in the DairyFlow system
 */

import mongoose from 'mongoose';

const distributorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Distributor name is required'],
      trim: true,
    },
    village: {
      type: String,
      required: [true, 'Village is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    aadhaar: {
      type: String,
      trim: true,
      default: '',
    },
    bank: {
      type: String,
      trim: true,
      default: '',
    },
    accountNumber: {
      type: String,
      trim: true,
      default: '',
    },
    ifscCode: {
      type: String,
      trim: true,
      default: '',
    },
    bankName: {
      type: String,
      trim: true,
      default: '',
    },
    milkType: {
      type: String,
      enum: ['Cow', 'Buffalo'],
      required: [true, 'Milk type is required'],
      default: 'Cow',
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    totalLiters: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/** Virtual for milk collections associated with this distributor */
distributorSchema.virtual('collections', {
  ref: 'MilkCollection',
  localField: '_id',
  foreignField: 'distributorId',
  justOne: false,
});

/** Virtual for payments associated with this distributor */
distributorSchema.virtual('payments', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'distributorId',
  justOne: false,
});

const Distributor = mongoose.model('Distributor', distributorSchema);

export default Distributor;
