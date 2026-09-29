const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const app = require('../app');
const User = require('../models/User');

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

const registerAndLogin = async (overrides = {}) => {
  const payload = {
    name: 'Test User',
    email: `user${Date.now()}${Math.random()}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  // promote role directly in DB since self-registration can't set Admin
  if (overrides.role === 'Admin') {
    await User.findOneAndUpdate({ email: payload.email }, { role: 'Admin' });
  }
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: payload.email, password: payload.password });
  return { token: login.body.data.token, user: login.body.data.user };
};

describe('Project & Task RBAC', () => {
  it('allows a Project Manager to create a project', async () => {
    const { token } = await registerAndLogin({ role: 'ProjectManager' });
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Website Revamp' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe('Website Revamp');
  });

  it('blocks a Team Member from creating a project', async () => {
    const { token } = await registerAndLogin({ role: 'TeamMember' });
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Unauthorized Project' });
    expect(res.statusCode).toBe(403);
  });

  it('blocks a Team Member from creating a task directly (not via project management)', async () => {
    const pm = await registerAndLogin({ role: 'ProjectManager' });
    const member = await registerAndLogin({ role: 'TeamMember' });

    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${pm.token}`)
      .send({ name: 'Mobile App' });
    const projectId = projectRes.body.data._id;

    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ title: 'Design mockups', project: projectId });

    expect(taskRes.statusCode).toBe(403);
  });

  it('allows a Project Manager to create and assign a task, and the assignee to update its status', async () => {
    const pm = await registerAndLogin({ role: 'ProjectManager' });
    const member = await registerAndLogin({ role: 'TeamMember' });

    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${pm.token}`)
      .send({ name: 'API Backend' });
    const projectId = projectRes.body.data._id;

    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pm.token}`)
      .send({
        title: 'Build auth module',
        project: projectId,
        assignedTo: member.user._id,
        priority: 'High',
      });
    expect(taskRes.statusCode).toBe(201);

    const taskId = taskRes.body.data._id;
    const updateRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ status: 'InProgress' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.status).toBe('InProgress');
  });
});
