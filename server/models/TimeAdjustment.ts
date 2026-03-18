import mongoose from 'mongoose';

const timeAdjustmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  originalRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeRecord' }, // Optional, if editing an existing one
  proposedTimestamp: { type: Date, required: true },
  proposedType: { type: String, enum: ['in', 'out', 'break_start', 'break_end'], required: true },
  reason: { type: String, required: true, maxlength: 500 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }
}, { timestamps: true });

export const TimeAdjustment = mongoose.model('TimeAdjustment', timeAdjustmentSchema);
