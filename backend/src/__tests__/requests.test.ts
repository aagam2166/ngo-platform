import supertest from 'supertest';
import app from '../app';
import prisma from '../config/prisma';

const PREFIX = 'test_req_';
const authBase = '/api/v1/auth';
const reqBase = '/api/v1/requests';

let citizenToken: string;
let otherCitizenToken: string;
let ngoToken: string;
let testRequestId: string;

beforeAll(async () => {
  const citizenRes = await supertest(app)
    .post(`${authBase}/register`)
    .send({
      email: `${PREFIX}citizen@example.com`,
      password: 'password123',
      firstName: 'Req',
      lastName: 'Citizen',
      role: 'CITIZEN',
    });
  citizenToken = citizenRes.body.data.token;

  const otherRes = await supertest(app)
    .post(`${authBase}/register`)
    .send({
      email: `${PREFIX}other@example.com`,
      password: 'password123',
      firstName: 'Other',
      lastName: 'Citizen',
      role: 'CITIZEN',
    });
  otherCitizenToken = otherRes.body.data.token;

  const ngoRes = await supertest(app)
    .post(`${authBase}/register`)
    .send({
      email: `${PREFIX}ngo@example.com`,
      password: 'password123',
      firstName: 'NGO',
      lastName: 'Admin',
      role: 'NGO_ADMIN',
      ngoProfile: {
        name: 'Request Test NGO',
        registrationNo: 'REQ-TEST-NGO-2025',
        address: '10 NGO Road',
        city: 'NGO City',
        state: 'NGO State',
      },
    });
  ngoToken = ngoRes.body.data.token;

  const reqRes = await supertest(app)
    .post(reqBase)
    .set('Authorization', `Bearer ${citizenToken}`)
    .send({
      title: 'Urgent food help needed now',
      description: 'My family of five has not eaten in two days and needs immediate food assistance from any NGO.',
      category: 'FOOD',
      urgencyLevel: 5,
      address: '88 Poverty Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
    });
  testRequestId = reqRes.body.data.id;
});

afterAll(async () => {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: PREFIX } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  await prisma.request.deleteMany({ where: { citizenId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
});

describe('POST /api/v1/requests', () => {
  it('creates a help request as a citizen', async () => {
    const res = await supertest(app)
      .post(reqBase)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Need shelter for winter months',
        description: 'Our family was evicted and we need temporary shelter for the coming winter season please help us.',
        category: 'SHELTER',
        urgencyLevel: 4,
        address: '22 Homeless St',
        city: 'Delhi',
        state: 'Delhi',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.category).toBe('SHELTER');
    expect(res.body.data.citizenId).toBeDefined();
  });

  it('returns 401 when no auth token is provided', async () => {
    const res = await supertest(app)
      .post(reqBase)
      .send({
        title: 'Unauthenticated request attempt',
        description: 'This should be rejected because there is no bearer token attached to the request.',
        category: 'FOOD',
        urgencyLevel: 1,
        address: '1 Nowhere',
        city: 'Nowhere',
        state: 'Nowhere',
      });

    expect(res.status).toBe(401);
  });

  it('returns 400 when title is too short', async () => {
    const res = await supertest(app)
      .post(reqBase)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Hi',
        description: 'This description is long enough to pass the minimum character count validation check.',
        category: 'FOOD',
        urgencyLevel: 1,
        address: '1 Test St',
        city: 'City',
        state: 'State',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when description is too short', async () => {
    const res = await supertest(app)
      .post(reqBase)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Valid title here please',
        description: 'Too short',
        category: 'FOOD',
        urgencyLevel: 1,
        address: '1 Test St',
        city: 'City',
        state: 'State',
      });

    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid category', async () => {
    const res = await supertest(app)
      .post(reqBase)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Valid title for category test',
        description: 'This description is definitely long enough to pass the minimum length validation that is required.',
        category: 'UNKNOWN',
        urgencyLevel: 1,
        address: '1 Test St',
        city: 'City',
        state: 'State',
      });

    expect(res.status).toBe(400);
  });

  it('returns 400 when address fields are missing', async () => {
    const res = await supertest(app)
      .post(reqBase)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Valid title for address test',
        description: 'Description is long enough to pass the validation check for minimum character requirement.',
        category: 'FOOD',
        urgencyLevel: 1,
      });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/requests/mine', () => {
  it('returns the authenticated citizen\'s requests', async () => {
    const res = await supertest(app)
      .get(`${reqBase}/mine`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('returns an empty array for a citizen with no requests', async () => {
    const res = await supertest(app)
      .get(`${reqBase}/mine`)
      .set('Authorization', `Bearer ${otherCitizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns 401 without a token', async () => {
    const res = await supertest(app).get(`${reqBase}/mine`);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/requests/:id', () => {
  it('allows a citizen to view their own request', async () => {
    const res = await supertest(app)
      .get(`${reqBase}/${testRequestId}`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(testRequestId);
    expect(res.body.data.citizen).toBeDefined();
    expect(res.body.data.citizen.email).toBeDefined();
  });

  it('allows an NGO admin to view any request', async () => {
    const res = await supertest(app)
      .get(`${reqBase}/${testRequestId}`)
      .set('Authorization', `Bearer ${ngoToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(testRequestId);
  });

  it('returns 403 when a citizen tries to view another citizen\'s request', async () => {
    const res = await supertest(app)
      .get(`${reqBase}/${testRequestId}`)
      .set('Authorization', `Bearer ${otherCitizenToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('returns 404 for a non-existent request id', async () => {
    const res = await supertest(app)
      .get(`${reqBase}/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without a token', async () => {
    const res = await supertest(app).get(`${reqBase}/${testRequestId}`);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/requests', () => {
  it('returns all PENDING and UNDER_REVIEW requests', async () => {
    const res = await supertest(app)
      .get(reqBase)
      .set('Authorization', `Bearer ${ngoToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((r: any) => {
      expect(['PENDING', 'UNDER_REVIEW']).toContain(r.status);
    });
  });

  it('includes citizen details in each request', async () => {
    const res = await supertest(app)
      .get(reqBase)
      .set('Authorization', `Bearer ${ngoToken}`);

    expect(res.status).toBe(200);
    if (res.body.data.length > 0) {
      expect(res.body.data[0].citizen).toBeDefined();
      expect(res.body.data[0].citizen.email).toBeDefined();
    }
  });

  it('returns 401 without a token', async () => {
    const res = await supertest(app).get(reqBase);
    expect(res.status).toBe(401);
  });
});
