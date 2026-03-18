import mongoose from 'mongoose';
import { emailRegex } from '../utils/validation';

const accessRequestSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employeeName: { type: String, maxlength: 100 },
  email: {
    type: String,
    required: true,
    maxlength: 100,
    match: [emailRegex, 'Por favor, insira um email válido']
  },
  message: { type: String, required: true, maxlength: 1000 },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  resolutionNote: { type: String, maxlength: 500 }
}, { timestamps: true });

export const AccessRequest = mongoose.model('AccessRequest', accessRequestSchema);
