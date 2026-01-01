import { TestApp } from '../utils/test-app';

describe('Users API (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await TestApp.create();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('should return the current user profile', async () => {
    const response = await testApp.getRequest()
      .get('/users/profile')
      .expect(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email', testApp.testEmail);
    expect(response.body).toHaveProperty('fullName', testApp.testFullName);
  });

  it('should reject unauthorized requests', async () => {
    await testApp.getPublicRequest()
      .get('/users/profile')
      .expect(401);
  });

  it('should update user profile', async () => {
    const updateData = {
      fullName: 'Test User'
    };

    const response = await testApp.getRequest()
      .put('/users/profile')
      .send(updateData)
      .expect(200);

    expect(response.body).toHaveProperty('fullName', updateData.fullName);
    expect(response.body).toHaveProperty('email', testApp.testEmail);
  });
});
