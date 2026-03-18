import mongoose from 'mongoose';

const timeRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  type: { type: String, enum: ['in', 'out', 'break_start', 'break_end'], required: true },
  location: {
    lat: Number,
    lng: Number
  },
  notes: { type: String, maxlength: 500 },
}, { timestamps: true });

export const TimeRecord = mongoose.model('TimeRecord', timeRecordSchema);
