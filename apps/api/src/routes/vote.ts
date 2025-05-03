import express from 'express';
import { z } from 'zod';
import { sendVoteToQueue } from '../services/voteService';

// request validation
const voteSchema = z.object({
  participant: z.string().min(1, 'participant must be a non-empty string'),
});

// request body interface
interface VoteRequest {
  participant: string;
}

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { participant }: VoteRequest = voteSchema.parse(req.body);

    const formattedParticipant = `@${participant.toLowerCase()}`;
    await sendVoteToQueue(formattedParticipant);

    res.status(202).json({ message: 'vote received' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message) });
    }
    console.error('[api] error processing vote:', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

export default router;