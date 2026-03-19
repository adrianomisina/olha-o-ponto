import mongoose from 'mongoose';
import { emailRegex } from '../utils/validation';

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    maxlength: 100,
    match: [emailRegex, 'Por favor, insira um email válido']
  },
  phone: { type: String, maxlength: 20 },
  address: { type: String, maxlength: 200 },
  plan: { type: String, enum: ['basic', 'professional', 'enterprise'], default: 'basic' },
  mercadoPagoCustomerId: String,
  mercadoPagoPreferenceId: String,
  subscriptionStatus: { type: String, default: 'pending' },
  trialEndsAt: Date,
  employeesLimit: { type: Number, default: 10 },
}, { timestamps: true });

export const Company = mongoose.model('Company', companySchema);
