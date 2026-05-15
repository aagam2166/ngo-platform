import supertest from 'supertest';
import app from '../app';
import prisma from '../config/prisma';

const PREFIX = 'test_auth_';
const base = '/api/v1/auth';

afterAll(async () => {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: PREFIX } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  await prisma.request.deleteMany({ where: { citizenId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
});

describe('POST /api/v1/auth/register', () => {
  it('registers a citizen and returns token', async () => {
    const res = await supertest(app)
      .post(`${base}/register`)
      .send({
        email: `${PREFIX}citizen@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'Citizen',
        role: 'CITIZEN',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(`${PREFIX}citizen@example.com`);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.token).toBeDefined();
  });

  it('registers an NGO admin with organisation profile', async () => {
    const res = await supertest(app)
      .post(`${base}/register`)
      .send({
        email: `${PREFIX}ngo@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'NGO',
        role: 'NGO_ADMIN',
        ngoProfile: {
          name: 'Test NGO Org',
          registrationNo: 'TEST-NGO-2025-001',
          description: 'An NGO created for tests',
          address: '1 NGO Lane',
          city: 'Testpur',
          state: 'Testland',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('NGO_ADMIN');
  });

  it('registers a volunteer with profile', async () => {
    const res = await supertest(app)
      .post(`${base}/register`)
      .send({
        email: `${PREFIX}vol@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'Volunteer',
        role: 'VOLUNTEER',
        volunteerProfile: {
          bio: 'Loves helping people',
          skills: ['Teaching', 'Medical'],
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('VOLUNTEER');
  });

  it('rejects a duplicate email', async () => {
    const payload = {
      email: `${PREFIX}dup@example.com`,
      password: 'password123',
      firstName: 'Dup',
      lastName: 'User',
    };
    await supertest(app).post(`${base}/register`).send(payload);

    const res = await supertest(app).post(`${base}/register`).send(payload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects an invalid email format', async () => {
    const res = await supertest(app)
      .post(`${base}/register`)
      .send({
        email: 'not-an-email',
        password: 'password123',
        firstName: 'Bad',
        lastName: 'Email',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects a password shorter than 6 characters', async () => {
    const res = await supertest(app)
      .post(`${base}/register`)
      .send({
        email: `${PREFIX}shortpw@example.com`,
        password: '123',
        firstName: 'Short',
        lastName: 'Pass',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects missing firstName', async () => {
    const res = await supertest(app)
      .post(`${base}/register`)
      .send({
        email: `${PREFIX}nofirst@example.com`,
        password: 'password123',
        lastName: 'NoFirst',
      });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  const email = `${PREFIX}login@example.com`;
  const password = 'loginpass123';

  beforeAll(async () => {
    await supertest(app)
      .post(`${base}/register`)
      .send({ email, password, firstName: 'Login', lastName: 'User' });
  });

  it('returns token for valid credentials', async () => {
    const res = await supertest(app)
      .post(`${base}/login`)
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects a wrong password', async () => {
    const res = await supertest(app)
      .post(`${base}/login`)
      .send({ email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('rejects a non-existent email', async () => {
    const res = await supertest(app)
      .post(`${base}/login`)
      .send({ email: 'nobody@nowhere.com', password: 'anything' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('rejects missing password field', async () => {
    const res = await supertest(app)
      .post(`${base}/login`)
      .send({ email });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/auth/me', () => {
  let token: string;

  beforeAll(async () => {
    const res = await supertest(app)
      .post(`${base}/register`)
      .send({
        email: `${PREFIX}me@example.com`,
        password: 'password123',
        firstName: 'Me',
        lastName: 'User',
      });
    token = res.body.data.token;
  });

  it('returns the current user profile with a valid token', async () => {
    const res = await supertest(app)
      .get(`${base}/me`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(`${PREFIX}me@example.com`);
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('returns 401 when no token is provided', async () => {
    const res = await supertest(app).get(`${base}/me`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for a tampered token', async () => {
    const res = await supertest(app)
      .get(`${base}/me`)
      .set('Authorization', 'Bearer this.is.not.valid');

    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header is missing Bearer prefix', async () => {
    const res = await supertest(app)
      .get(`${base}/me`)
      .set('Authorization', token);

    expect(res.status).toBe(401);
  });
});
