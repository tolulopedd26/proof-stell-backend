import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    // ------------------------------------------------------------
    // Create a fresh NestJS testing module before each test run
    // This ensures test isolation and avoids shared state between tests
    // ------------------------------------------------------------
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // ------------------------------------------------------------
    // Initialize a full NestJS application instance for E2E testing
    // This boots the app exactly like production (controllers, pipes, etc.)
    // ------------------------------------------------------------
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    // ------------------------------------------------------------
    // Sends an HTTP request to the running test server
    // and verifies the root endpoint behaves as expected
    // ------------------------------------------------------------
    return request(app.getHttpServer())
      .get('/')
      .expect(200) // Ensure HTTP OK response
      .expect('Hello World!'); // Validate response body
  });
});

// feat-email-integration
describe('Auth Email Verification (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let testEmail = `test${Date.now()}@example.com`;
  let testUsername = `user${Date.now()}`;
  let testPassword = 'TestPass123!';
  let verificationToken: string;

describe('User Profile (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register and send verification email (token in db)', async () => {
    const res = await request(server)
      .post('/auth/register')
      .send({ email: testEmail, username: testUsername, password: testPassword });
    expect(res.body.user).toBeDefined();
    expect(res.body.user.isEmailVerified).toBe(false);
    // Get token from DB (simulate, in real test use repo or mock mail)
    // For now, fetch user via API or DB (pseudo):
    // const user = await getUserByEmail(testEmail);
    // verificationToken = user.emailVerificationToken;
  });

  it('should block login for unverified user', async () => {
    const res = await request(server)
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/verify your email/i);
  });

  it('should resend verification email for unverified user', async () => {
    const res = await request(server)
      .post('/auth/resend-verification')
      .send({ email: testEmail });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/resent/i);
  });

  // The following test assumes you can fetch the token from DB or mock mail
  // it('should verify email with token', async () => {
  //   const res = await request(server)
  //     .get(`/auth/verify-email?token=${verificationToken}`);
  //   expect(res.status).toBe(200);
  //   expect(res.body.message).toMatch(/verified/i);
  // });

  // it('should allow login after verification', async () => {
  //   const res = await request(server)
  //     .post('/auth/login')
  //     .send({ email: testEmail, password: testPassword });
  //   expect(res.status).toBe(201);
  //   expect(res.body.access_token).toBeDefined();
  // });

    // Register a user
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'profiletest@example.com',
        username: 'profiletest',
        password: 'TestPass123!',
      });
    userId = res.body.id;

    // Login to get JWT
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'profiletest@example.com',
        password: 'TestPass123!',
      });
    accessToken = loginRes.body.accessToken;
  });

  it('should update profile fields', async () => {
    const update = {
      displayName: 'Test User',
      avatarUrl: 'http://localhost/uploads/test.png',
      emailPreferences: { promotional: false, transactional: true },
    };
    const res = await request(app.getHttpServer())
      .patch('/api/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(update)
      .expect(200);
    expect(res.body.displayName).toBe(update.displayName);
    expect(res.body.avatarUrl).toBe(update.avatarUrl);
    expect(res.body.emailPreferences).toEqual(update.emailPreferences);
  });

  it('should upload an avatar', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'avatar.png');
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, Buffer.from([137,80,78,71,13,10,26,10])); // PNG header
    }
    const res = await request(app.getHttpServer())
      .post('/api/v1/users/profile/avatar')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', filePath)
      .expect(201);
    expect(res.body.avatarUrl).toMatch(/\/uploads\//);
  });

  afterAll(async () => {
    await app.close();
  });

});
