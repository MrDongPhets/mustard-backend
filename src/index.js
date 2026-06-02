import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import homeRouter          from './routes/home.js';
import portfolioRouter     from './routes/portfolio.js';
import portfolioDetailRouter from './routes/portfolioDetail.js';
import servicesRouter      from './routes/services.js';
import testimonialsRouter  from './routes/testimonials.js';
import contactRouter       from './routes/contact.js';
import freeTrialRouter     from './routes/freeTrial.js';

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin:         process.env.ALLOWED_ORIGIN || 'https://mustarddigitals.com',
  methods:        ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            100,
  standardHeaders: true,
  legacyHeaders:  false,
}));

app.use('/api/home',             homeRouter);
app.use('/api/portfolio-detail', portfolioDetailRouter);
app.use('/api/portfolio',        portfolioRouter);
app.use('/api/services',         servicesRouter);
app.use('/api/testimonials',     testimonialsRouter);
app.use('/api/contact',          contactRouter);
app.use('/api/free-trial',       freeTrialRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Mustard API running on port ${PORT}`));
