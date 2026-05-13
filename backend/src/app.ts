import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import requestRoutes from './modules/requests/request.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'NGO API is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/requests', requestRoutes);

app.use(errorHandler);

export default app;