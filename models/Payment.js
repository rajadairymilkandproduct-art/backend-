import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    date: {
      type: String,
      required: [true, 'Payment date is required'],
    },
    method: {
      type: String,
      enum: ['UPI', 'Bank Transfer', 'Cash'],
      required: [true, 'Payment method is required'],
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Pending',
    },
    reference: {
      type: String,
      trim: true,
      default: '-',
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
  },
  { timestamps: true }
);

paymentSchema.index({ status: 1 });
paymentSchema.index({ distributorId: 1 });
paymentSchema.index({ date: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
