import { TestApp } from '../utils/test-app';

describe('Days API (e2e)', () => {
  let testApp: TestApp;
  let tripId: number;
  let dayId: number;

  beforeAll(async () => {
    testApp = await TestApp.create();

    // Create a trip first since days belong to trips
    const tripData = {
      title: 'Trip for Days Test',
      destination: 'Test Destination',
      startDate: '2025-10-01T00:00:00.000Z',
      endDate: '2025-10-10T00:00:00.000Z',
      userId: testApp.userId,
    };

    const tripResponse = await testApp.getRequest()
      .post('/trips')
      .send(tripData);

    tripId = tripResponse.body.id;
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('should create a new day', async () => {
    const dayData = {
      title: 'Day 1',
      date: '2025-10-01T00:00:00.000Z',
      startTime: '2025-10-01T08:00:00.000Z',
      tripId: tripId
    };

    const response = await testApp.getRequest()
      .post('/days')
      .send(dayData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('title', dayData.title);
    expect(response.body).toHaveProperty('tripId', tripId);

    dayId = response.body.id;
  });

  it('should get all days for a specific trip', async () => {
    const response = await testApp.getRequest()
      .get(`/trips/${tripId}/days`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('tripId', tripId);
  });

  it('should get a specific day by id', async () => {
    const response = await testApp.getRequest()
      .get(`/days/${dayId}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', dayId);
    expect(response.body).toHaveProperty('tripId', tripId);
  });

  it('should update a day', async () => {
    const updateData = {
      title: 'Updated Day Title',
      startTime: '2025-10-01T09:00:00.000Z'
    };

    const response = await testApp.getRequest()
      .patch(`/days/${dayId}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toHaveProperty('id', dayId);
    expect(response.body).toHaveProperty('title', updateData.title);
  });

  it('should delete a day', async () => {
    await testApp.getRequest()
      .delete(`/days/${dayId}`)
      .expect(200);

    // Verify it's deleted
    await testApp.getRequest()
      .get(`/days/${dayId}`)
      .expect(404);
  });
});
