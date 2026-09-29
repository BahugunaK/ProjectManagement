const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const app = require('../app');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Auth API', () => {
  const userPayload = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password123',
  };

  it('registers a new user and returns a JWT', async () => {
    const res = await request(app).post('/api/auth/register').send(userPayload);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(userPayload.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send(userPayload);
    const res = await request(app).post('/api/auth/register').send(userPayload);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(userPayload);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userPayload.email, password: userPayload.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    await request(app).post('/api/auth/register').send(userPayload);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userPayload.email, password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
  });

  it('blocks access to protected route without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('allows access to /me with a valid token', async () => {
    const register = await request(app).post('/api/auth/register').send(userPayload);
    const token = register.body.data.token;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe(userPayload.email);
  });
});
