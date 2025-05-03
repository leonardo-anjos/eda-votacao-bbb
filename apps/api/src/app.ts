import express from 'express';

import voteRouter from './routes/vote';

const app = express();

app.use(express.json());

app.use('/vote', voteRouter);

export default app;
