import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import listingRoutes from './routes/listings.routes';

const app = express();

// Allow all Vercel preview URLs + the main domain
const ALLOWED_ORIGINS = [
  env.CLIENT_URL,
  'https://hostello-frontend-two.vercel.app',
  'https://hostello-frontend-git-main-eshana-s-projects.vercel.app',
  'http://localhost:3000',
].filter(Boolean);

app.use(helmet());
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any vercel.app subdomain for this project
    if (origin.includes('hostello') || origin.includes('localhost') || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Hostello API is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ── Error Handler (must stay last) ────────────────────────────────────────────
app.use(errorHandler);

export default app;
