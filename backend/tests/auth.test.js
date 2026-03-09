const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User.model');

// Use in-memory test DB or a test-specific URI
beforeAll(async () => {
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/primetrade_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth API', () => {
  const validUser = { name: 'Test User', email: 'test@example.com', password: 'SecurePass123' };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(validUser);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should return 409 if email already exists', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
      const res = await request(app).post('/api/v1/auth/register').send(validUser);
      expect(res.status).toBe(409);
    });

    it('should return 422 on missing fields', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ email: 'bad@test.com' });
      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('errors');
    });

    it('should return 422 for weak password', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ ...validUser, password: '12345' });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ email: validUser.email, password: validUser.password });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ email: validUser.email, password: 'WrongPass123' });
      expect(res.status).toBe(401);
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ email: 'nobody@test.com', password: 'Pass123ABC' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const reg = await request(app).post('/api/v1/auth/register').send(validUser);
      const token = reg.body.data.accessToken;
      const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(validUser.email);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });
});

describe('Health Check', () => {
  it('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });
});
