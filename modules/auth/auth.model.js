const mongoose = require('mongoose');

/**
 * ─── AUTH MODEL (User Schema) ──────────────────────────
 * Only schema definition — no business logic
 */

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // exclude from queries by default
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    
    role: {
      type: String,
      enum: ['customer', 'sales_agent', 'support_agent', 'admin', 'super_admin'],
      default: 'customer',
    },
    isActive: {
      type: Boolean,
      default: true,
      
    },
    isVerified: {
      type: Boolean,
      default: false, 
    },
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: String,
      default: null 
     } // who created the user like superadmin for crm
    // otp will be added later 
  },
  {
    timestamps: true, 
  }
);

userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
