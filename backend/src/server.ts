import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
  })
);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'smartflood-v4-backend',
    version: '0.1.0',
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`SmartFlood V4 backend running on port ${PORT}`);
});
