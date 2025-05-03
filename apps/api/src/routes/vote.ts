import express from 'express';
import { sendVoteToQueue } from '../services/voteService';

const router = express.Router();

router.post('/', async (req, res) => {
  const { participant } = req.body;
  
  if (!participant) {
    res.status(400).json({ error: 'participant is required' });
  }

  const formattedParticipant = `@${participant.toLowerCase()}`;
  await sendVoteToQueue(formattedParticipant);
  res.status(202).json({ message: 'vote received' });
});

export default router;
