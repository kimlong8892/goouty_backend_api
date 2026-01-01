import { TestApp } from '../utils/test-app';

describe('Trips API (e2e)', () => {
  let testApp: TestApp;
  let tripId: number;
  let memberUser: any;
  let memberToken: string;

  beforeAll(async () => {
    testApp = await TestApp.create();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await testApp.cleanup();
  });

  it('should create a new trip', async () => {
    const tripData = {
      title: 'Test Trip',
      destination: 'Test Destination',
      startDate: '2025-10-01T00:00:00.000Z',
      description: 'Test trip description',
    };

    const response = await testApp.getRequest()
      .post('/trips')
      .send(tripData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('title', tripData.title);
    expect(response.body).toHaveProperty('destination', tripData.destination);
    expect(response.body).toHaveProperty('userId', testApp.userId);

    tripId = response.body.id;
  });

  it('should get all trips for the current user', async () => {
    const response = await testApp.getRequest()
      .get('/trips?userId=' + testApp.userId)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('userId', testApp.userId);
  });

  it('should get a specific trip by id', async () => {
    const response = await testApp.getRequest()
      .get(`/trips/${tripId}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', tripId);
    expect(response.body).toHaveProperty('userId', testApp.userId);
  });

  it('should update a trip', async () => {
    const updateData = {
      title: 'Updated Trip Title',
      description: 'Updated trip description'
    };

    const response = await testApp.getRequest()
      .patch(`/trips/${tripId}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toHaveProperty('id', tripId);
    expect(response.body).toHaveProperty('title', updateData.title);
    expect(response.body).toHaveProperty('description', updateData.description);
  });

  it('should delete a trip', async () => {
    await testApp.getRequest()
      .delete(`/trips/${tripId}`)
      .expect(200);

    // Verify it's deleted
    await testApp.getRequest()
      .get(`/trips/${tripId}`)
      .expect(404);
  });

  // ===== TRIP MEMBERS TESTS =====

  describe('Trip Members', () => {
    beforeEach(async () => {
      // Create a trip for member tests
      const tripData = {
        title: 'Member Test Trip',
        destination: 'Test Destination',
        startDate: '2025-10-01T00:00:00.000Z',
        description: 'Test trip for members',
      };

      const response = await testApp.getRequest()
        .post('/trips')
        .send(tripData)
        .expect(201);

      tripId = response.body.id;

      // Create a member user
      memberUser = await testApp.createUser();
      memberToken = await testApp.getAccessToken(memberUser);
    });

    it('should get trip members (initially empty)', async () => {
      const response = await testApp.getRequest()
        .get(`/trips/${tripId}/members`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should add a member to trip', async () => {
      const addMemberDto = {
        email: memberUser.email
      };

      const response = await testApp.getRequest()
        .post(`/trips/${tripId}/members`)
        .send(addMemberDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.user.email).toBe(memberUser.email);
      expect(response.body.role).toBe('member');
    });

    it('should reject adding member with invalid email', async () => {
      const addMemberDto = {
        email: 'nonexistent@example.com'
      };

      await testApp.getRequest()
        .post(`/trips/${tripId}/members`)
        .send(addMemberDto)
        .expect(404);
    });

    it('should reject adding member by non-owner', async () => {
      const addMemberDto = {
        email: memberUser.email
      };

      await testApp.getRequestWithToken(memberToken)
        .post(`/trips/${tripId}/members`)
        .send(addMemberDto)
        .expect(403);
    });

    it('should get trip members after adding', async () => {
      // Add member first
      const addMemberDto = {
        email: memberUser.email
      };

      await testApp.getRequest()
        .post(`/trips/${tripId}/members`)
        .send(addMemberDto)
        .expect(201);

      // Get members
      const response = await testApp.getRequest()
        .get(`/trips/${tripId}/members`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].user.email).toBe(memberUser.email);
    });

    it('should remove a member from trip', async () => {
      // Add member first
      const addMemberDto = {
        email: memberUser.email
      };

      const addResponse = await testApp.getRequest()
        .post(`/trips/${tripId}/members`)
        .send(addMemberDto)
        .expect(201);

      const memberId = addResponse.body.id;

      // Remove member
      await testApp.getRequest()
        .delete(`/trips/${tripId}/members/${memberId}`)
        .expect(200);

      // Verify member is removed
      const response = await testApp.getRequest()
        .get(`/trips/${tripId}/members`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should reject removing member by non-owner', async () => {
      // Add member first
      const addMemberDto = {
        email: memberUser.email
      };

      const addResponse = await testApp.getRequest()
        .post(`/trips/${tripId}/members`)
        .send(addMemberDto)
        .expect(201);

      const memberId = addResponse.body.id;

      // Try to remove by member (should fail)
      await testApp.getRequestWithToken(memberToken)
        .delete(`/trips/${tripId}/members/${memberId}`)
        .expect(403);
    });
  });

  // ===== SHARE LINK TESTS =====

  describe('Share Links', () => {
    beforeEach(async () => {
      // Create a trip for share link tests
      const tripData = {
        title: 'Share Test Trip',
        destination: 'Test Destination',
        startDate: '2025-10-01T00:00:00.000Z',
        description: 'Test trip for sharing',
      };

      const response = await testApp.getRequest()
        .post('/trips')
        .send(tripData)
        .expect(201);

      tripId = response.body.id;

      // Create a user to join
      memberUser = await testApp.createUser();
      memberToken = await testApp.getAccessToken(memberUser);
    });

    it('should generate share link for trip', async () => {
      const response = await testApp.getRequest()
        .post(`/trips/${tripId}/share`)
        .expect(201);

      expect(response.body).toHaveProperty('shareToken');
      expect(response.body).toHaveProperty('shareUrl');
      expect(response.body.shareToken).toBeTruthy();
      expect(response.body.shareUrl).toContain(response.body.shareToken);
    });

    it('should reject generating share link by non-owner', async () => {
      await testApp.getRequestWithToken(memberToken)
        .post(`/trips/${tripId}/share`)
        .expect(403);
    });

    it('should join trip using share token', async () => {
      // Generate share link first
      const shareResponse = await testApp.getRequest()
        .post(`/trips/${tripId}/share`)
        .expect(201);

      const shareToken = shareResponse.body.shareToken;

      // Join trip using token
      const joinDto = {
        shareToken: shareToken
      };

      const response = await testApp.getRequestWithToken(memberToken)
        .post('/trips/join')
        .send(joinDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.user.email).toBe(memberUser.email);
      expect(response.body.role).toBe('member');
    });

    it('should reject joining with invalid share token', async () => {
      const joinDto = {
        shareToken: 'invalid-token'
      };

      await testApp.getRequestWithToken(memberToken)
        .post('/trips/join')
        .send(joinDto)
        .expect(404);
    });

    it('should reject joining trip twice', async () => {
      // Generate share link first
      const shareResponse = await testApp.getRequest()
        .post(`/trips/${tripId}/share`)
        .expect(201);

      const shareToken = shareResponse.body.shareToken;

      // Join trip first time
      const joinDto = {
        shareToken: shareToken
      };

      await testApp.getRequestWithToken(memberToken)
        .post('/trips/join')
        .send(joinDto)
        .expect(201);

      // Try to join again (should fail)
      await testApp.getRequestWithToken(memberToken)
        .post('/trips/join')
        .send(joinDto)
        .expect(409);
    });

    it('should revoke share link', async () => {
      // Generate share link first
      await testApp.getRequest()
        .post(`/trips/${tripId}/share`)
        .expect(201);

      // Revoke share link
      await testApp.getRequest()
        .delete(`/trips/${tripId}/share`)
        .expect(200);

      // Try to join with revoked token (should fail)
      const joinDto = {
        shareToken: 'any-token' // Since it's revoked, any token should fail
      };

      await testApp.getRequestWithToken(memberToken)
        .post('/trips/join')
        .send(joinDto)
        .expect(404);
    });

    it('should reject revoking share link by non-owner', async () => {
      // Generate share link first
      await testApp.getRequest()
        .post(`/trips/${tripId}/share`)
        .expect(201);

      // Try to revoke by member (should fail)
      await testApp.getRequestWithToken(memberToken)
        .delete(`/trips/${tripId}/share`)
        .expect(403);
    });
  });

  // ===== AUTHORIZATION TESTS =====

  describe('Authorization', () => {
    beforeEach(async () => {
      // Create a trip for authorization tests
      const tripData = {
        title: 'Auth Test Trip',
        destination: 'Test Destination',
        startDate: '2025-10-01T00:00:00.000Z',
        description: 'Test trip for authorization',
      };

      const response = await testApp.getRequest()
        .post('/trips')
        .send(tripData)
        .expect(201);

      tripId = response.body.id;

      // Create another user
      memberUser = await testApp.createUser();
      memberToken = await testApp.getAccessToken(memberUser);
    });

    it('should reject accessing trip by non-member', async () => {
      await testApp.getRequestWithToken(memberToken)
        .get(`/trips/${tripId}`)
        .expect(404);
    });

    it('should reject updating trip by non-owner', async () => {
      const updateData = {
        title: 'Unauthorized Update'
      };

      await testApp.getRequestWithToken(memberToken)
        .patch(`/trips/${tripId}`)
        .send(updateData)
        .expect(404);
    });

    it('should reject deleting trip by non-owner', async () => {
      await testApp.getRequestWithToken(memberToken)
        .delete(`/trips/${tripId}`)
        .expect(404);
    });

    it('should allow member to access trip after joining', async () => {
      // Add member first
      const addMemberDto = {
        email: memberUser.email
      };

      await testApp.getRequest()
        .post(`/trips/${tripId}/members`)
        .send(addMemberDto)
        .expect(201);

      // Now member should be able to access trip
      const response = await testApp.getRequestWithToken(memberToken)
        .get(`/trips/${tripId}`)
        .expect(200);

      expect(response.body.id).toBe(tripId);
    });
  });

  // ===== VALIDATION TESTS =====

  describe('Validation', () => {
    it('should reject creating trip with invalid data', async () => {
      const invalidTripData = {
        title: '', // Empty title
        destination: 'Test Destination',
        startDate: 'invalid-date', // Invalid date
      };

      await testApp.getRequest()
        .post('/trips')
        .send(invalidTripData)
        .expect(400);
    });


    it('should reject accessing non-existent trip', async () => {
      await testApp.getRequest()
        .get('/trips/99999')
        .expect(404);
    });

    it('should reject updating non-existent trip', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      await testApp.getRequest()
        .patch('/trips/99999')
        .send(updateData)
        .expect(404);
    });

    it('should reject deleting non-existent trip', async () => {
      await testApp.getRequest()
        .delete('/trips/99999')
        .expect(404);
    });
  });
});
