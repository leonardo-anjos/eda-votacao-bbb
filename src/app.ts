import express from 'express';

import healthRouter from './routes/health';
import voteRouter from './routes/vote';

const app = express();

app.use(express.json());

app.use('/health', healthRouter);
app.use('/vote', voteRouter);

export default app;
