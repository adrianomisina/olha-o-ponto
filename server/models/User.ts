import mongoose from 'mongoose';
import { emailRegex } from '../utils/validation';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    maxlength: 100,
    match: [emailRegex, 'Por favor, insira um email válido']
  },
  password: { type: String, required: true, maxlength: 128 },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  position: { type: String, maxlength: 100 },
  department: { type: String, maxlength: 100 },
  hireDate: Date,
  isActive: { type: Boolean, default: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  pushSubscriptions: [{
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    }
  }]
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
