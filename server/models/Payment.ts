import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  mercadoPagoPaymentId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  status: { type: String, required: true }, // approved, pending, rejected, etc.
  plan: { type: String, required: true },
  paymentMethod: String,
  date: { type: Date, default: Date.now },
}, { timestamps: true });

export const Payment = mongoose.model('Payment', paymentSchema);
