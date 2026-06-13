/**
 * Business Settings Model
 * Stores company/dairy information and production level settings
 */
import mongoose from 'mongoose';

const businessSettingsSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, default: 'Shri Ram Dairy' },
    ownerName: { type: String, required: true, default: 'Mohan Lal' },
    phone: { type: String, required: true, default: '9876543210' },
    email: { type: String, required: true, lowercase: true, default: 'admin@shriram.dairy' },
    address: { type: String, required: true, default: 'Village Road, Sundarpur, UP - 226001' },
    
    // Production capacity settings
    productionLevel: {
      name: { type: String, enum: ['Starter', 'Growing', 'Established', 'Enterprise'], default: 'Starter' },
      maxDailyLitres: { type: Number, default: 100 },
      maxDistributors: { type: Number, default: 10 },
      maxClients: { type: Number, default: 20 },
      features: [{ type: String }], // e.g., 'Advanced Analytics', 'Multiple Users', 'API Access'
    },
    
    // Additional settings
    gstNumber: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    logo: { type: String, default: null }, // URL to logo image
    timezone: { type: String, default: 'Asia/Kolkata' },
    
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('BusinessSettings', businessSettingsSchema);
