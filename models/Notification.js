/**
 * Notification Model
 * Represents a system notification for the dairy manager
 */

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['warning', 'danger', 'info', 'success'],
      required: [true, 'Notification type is required'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    time: {
      type: String,
      required: [true, 'Notification time is required'],
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/** Index for unread notifications */
notificationSchema.index({ read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
