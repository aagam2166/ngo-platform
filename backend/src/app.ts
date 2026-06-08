import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import requestRoutes from './modules/requests/request.routes';
import ngoRoutes from './modules/ngo/ngo.routes';
import adminRoutes from './modules/admin/admin.routes';
import volunteerRoutes from './modules/volunteers/volunteer.routes';
import resourceRoutes from './modules/resources/resource.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import donationRoutes from './modules/donations/donation.routes';
const app = express();

app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'NGO API is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/ngo', ngoRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/volunteers', volunteerRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/donations', donationRoutes);

app.use(errorHandler);

export default app;