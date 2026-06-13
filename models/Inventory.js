import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    item: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Raw Milk', 'Processed Milk', 'Dairy Products', 'Packaging', 'Other'],
      required: [true, 'Category is required'],
      default: 'Raw Milk',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
      enum: ['L', 'kg', 'pcs'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [0, 'Capacity cannot be negative'],
    },
    minStock: {
      type: Number,
      default: 100,
      min: [0, 'Min stock cannot be negative'],
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    expiry: {
      type: String,
      required: [true, 'Expiry date is required'],
    },
    location: {
      type: String,
      enum: ['Cold Storage 1', 'Cold Storage 2', 'Dry Storage', 'Processing Unit', 'Other'],
      default: 'Cold Storage 1',
    },
    status: {
      type: String,
      enum: ['Good', 'Low', 'Critical', 'Out of Stock'],
      default: 'Good',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: inventory value
inventorySchema.virtual('value').get(function () {
  return this.quantity * (this.price || 0);
});

// Virtual: percentage utilization
inventorySchema.virtual('utilizationPercent').get(function () {
  if (this.capacity === 0) return 0;
  return Math.round((this.quantity / this.capacity) * 100);
});

inventorySchema.index({ status: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ location: 1 });

/**
 * Pre-save hook — async style (Mongoose 7+)
 * DO NOT use function(next) callback style — next is not passed reliably in Mongoose 7+
 * Auto-calculates status based on quantity/capacity/minStock
 */
inventorySchema.pre('save', async function () {
  if (
    this.isModified('quantity') ||
    this.isModified('capacity') ||
    this.isModified('minStock')
  ) {
    if (this.quantity <= 0) {
      this.status = 'Out of Stock';
    } else {
      const ratio = this.capacity > 0 ? this.quantity / this.capacity : 0;
      if (this.quantity <= this.minStock) {
        this.status = 'Critical';
      } else if (ratio >= 0.5) {
        this.status = 'Good';
      } else if (ratio >= 0.2) {
        this.status = 'Low';
      } else {
        this.status = 'Critical';
      }
    }
  }
});

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
