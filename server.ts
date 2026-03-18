import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import path from 'path';

import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// MongoDB Connection
async function connectDB() {
  let MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    if (isProduction) {
      throw new Error('MONGODB_URI is required in production. Configure it in the Render environment variables.');
    }

    console.log('No MONGODB_URI provided, starting in-memory MongoDB...');
    const mongoServer = await MongoMemoryServer.create();
    MONGODB_URI = mongoServer.getUri();
  }

  await mongoose.connect(MONGODB_URI);
  const isAtlas = MONGODB_URI.includes('mongodb.net');
  console.log(`Connected to MongoDB ${isAtlas ? '(Atlas)' : '(Local/Memory)'}`);
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Olha o Ponto API is running' });
});

// Import routes (to be created)
import authRoutes from './server/routes/auth';
import employeeRoutes from './server/routes/employee';
import adminRoutes from './server/routes/admin';
import paymentRoutes from './server/routes/payments';
import notificationRoutes from './server/routes/notifications';

app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

async function startServer() {
  await connectDB();

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
