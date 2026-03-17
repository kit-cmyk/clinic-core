import request from 'supertest';
import app from '../app.js';

describe('Server bootstrap', () => {
  it('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /health includes env field', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toHaveProperty('env');
  });

  it('unknown route returns 404 with error not_found', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('not_found');
  });

  it('response includes CORS header for allowed origin', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', process.env.FRONTEND_URL || 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});
