
import request from 'supertest';
import express from 'express';

const app = express();
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

describe('Health Check', () => {
  it('should return 200 ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('ok');
  });
});
