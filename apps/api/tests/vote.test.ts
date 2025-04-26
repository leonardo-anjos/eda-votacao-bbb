import request from 'supertest';
import app from '../src/app';

describe('POST /vote', () => {
  it('should accept a vote', async () => {
    const res = await request(app)
      .post('/vote')
      .send({ participant: 'jhon doe' });

    expect(res.statusCode).toBe(202);
    expect(res.body.message).toBe('vote received');
  });

  it('should return 400 without participant', async () => {
    const res = await request(app).post('/vote').send({});
    expect(res.statusCode).toBe(400);
  });
});
