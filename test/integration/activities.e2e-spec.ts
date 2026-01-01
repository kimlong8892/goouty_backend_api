import { TestApp } from '../utils/test-app';

describe('Activities API (e2e)', () => {
  let testApp: TestApp;
  let tripId: number;
  let dayId: number;
  let activityId: number;

  beforeAll(async () => {
    testApp = await TestApp.create();

    // Create a trip and day first since activities belong to days
    const tripData = {
      title: 'Trip for Activities Test',
      destination: 'Test Destination',
      startDate: '2025-10-01T00:00:00.000Z',
      userId: testApp.userId,
    };

    const tripResponse = await testApp.getRequest()
      .post('/trips')
      .send(tripData);

    tripId = tripResponse.body.id;

    const dayData = {
      title: 'Day for Activities',
      date: '2025-10-01T00:00:00.000Z',
      tripId: tripId
    };

    const dayResponse = await testApp.getRequest()
      .post('/days')
      .send(dayData);

    dayId = dayResponse.body.id;
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('should create a new activity', async () => {
    const activityData = {
      title: 'Morning Activity',
      startTime: '2025-10-01T09:00:00.000Z',
      durationMin: 60,
      location: 'Test Location',
      notes: 'Activity notes',
      important: true,
      dayId: dayId
    };

    const response = await testApp.getRequest()
      .post('/activities')
      .send(activityData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('title', activityData.title);
    expect(response.body).toHaveProperty('dayId', dayId);
    expect(response.body).toHaveProperty('important', true);

    activityId = response.body.id;
  });

  it('should get all activities for a specific day', async () => {
    const response = await testApp.getRequest()
      .get(`/days/${dayId}/activities`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('dayId', dayId);
  });

  it('should get a specific activity by id', async () => {
    const response = await testApp.getRequest()
      .get(`/activities/${activityId}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', activityId);
    expect(response.body).toHaveProperty('dayId', dayId);
  });

  it('should update an activity', async () => {
    const updateData = {
      title: 'Updated Activity Title',
      durationMin: 90,
      important: false
    };

    const response = await testApp.getRequest()
      .patch(`/activities/${activityId}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toHaveProperty('id', activityId);
    expect(response.body).toHaveProperty('title', updateData.title);
    expect(response.body).toHaveProperty('durationMin', updateData.durationMin);
    expect(response.body).toHaveProperty('important', updateData.important);
  });

  it('should delete an activity', async () => {
    await testApp.getRequest()
      .delete(`/activities/${activityId}`)
      .expect(200);

    // Verify it's deleted
    await testApp.getRequest()
      .get(`/activities/${activityId}`)
      .expect(404);
  });
});
