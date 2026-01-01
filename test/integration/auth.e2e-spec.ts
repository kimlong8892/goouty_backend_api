import { TestApp } from '../utils/test-app';

describe('Auth API (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await TestApp.create();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('should return user profile when authenticated', async () => {
    const response = await testApp.getRequest().get('/users/profile').expect(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email', testApp.testEmail);
    expect(response.body).toHaveProperty('fullName', testApp.testFullName);
  });

  it('should register a new user', async () => {
    const newUser = {
      email: Math.floor(Math.random() * 999999999999).toString() + 'new@example.com',
      password: 'password123',
      fullName: 'New User'
    };

    const response = await testApp.getPublicRequest()
      .post('/auth/register')
      .send(newUser)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email', newUser.email);
    expect(response.body).toHaveProperty('fullName', newUser.fullName);
    expect(response.body).toHaveProperty('accessToken');
  });

  it('should login an existing user', async () => {
    const loginData = {
      email: testApp.testEmail,
      password: testApp.testPassword
    };

    const response = await testApp.getPublicRequest()
      .post('/auth/login')
      .send(loginData)
      .expect(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email', testApp.testEmail);
    expect(response.body).toHaveProperty('accessToken');
  });

  it('should reject login with invalid credentials', async () => {
    const loginData = {
      email: testApp.testEmail,
      password: 'wrongpassword'
    };

    await testApp.getPublicRequest()
      .post('/auth/login')
      .send(loginData)
      .expect(401);
  });
});
