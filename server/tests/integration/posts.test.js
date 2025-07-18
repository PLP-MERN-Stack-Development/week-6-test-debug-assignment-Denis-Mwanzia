const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const Post = require('../../src/models/Post');
const User = require('../../src/models/User');
const { generateToken } = require('../../src/utils/auth');

let mongoServer;
let token;
let userId;
let postId;

beforeAll(async () => {
  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create user and auth token
  const user = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  });
  userId = user._id;
  token = generateToken(user);

  // Create initial post
  const post = await Post.create({
    title: 'Test Post',
    content: 'This is a test post content',
    author: userId,
    category: new mongoose.Types.ObjectId(),
    slug: 'test-post',
  });
  postId = post._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }

  // Re-seed user and post after clearing
  const user = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  });
  userId = user._id;
  token = generateToken(user);

  const post = await Post.create({
    title: 'Test Post',
    content: 'This is a test post content',
    author: userId,
    category: new mongoose.Types.ObjectId(),
    slug: 'test-post',
  });
  postId = post._id;
});

describe('POST /api/posts', () => {
  it('should create a post when authenticated', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'New Post',
        content: 'New content',
        category: new mongoose.Types.ObjectId().toString(),
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('New Post');
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app).post('/api/posts').send({
      title: 'Unauthorized',
      content: 'No auth',
      category: new mongoose.Types.ObjectId().toString(),
    });

    expect(res.status).toBe(401);
  });

  it('should return 400 if validation fails', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Missing title',
        category: new mongoose.Types.ObjectId().toString(),
      });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/posts', () => {
  it('should return all posts', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should filter by category', async () => {
    const catId = new mongoose.Types.ObjectId().toString();
    await Post.create({
      title: 'Filtered',
      content: 'Filtered content',
      category: catId,
      author: userId,
      slug: 'filtered',
    });

    const res = await request(app).get(`/api/posts?category=${catId}`);
    expect(res.status).toBe(200);
    expect(res.body[0].category).toBe(catId);
  });

  it('should paginate results', async () => {
    const extraPosts = Array.from({ length: 10 }, (_, i) => ({
      title: `Paginated ${i}`,
      content: `Content ${i}`,
      category: new mongoose.Types.ObjectId(),
      author: userId,
      slug: `paginated-${i}`,
    }));
    await Post.insertMany(extraPosts);

    const res = await request(app).get('/api/posts?page=2&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeLessThanOrEqual(5);
  });
});

describe('GET /api/posts/:id', () => {
  it('should return a post by ID', async () => {
    const res = await request(app).get(`/api/posts/${postId}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(postId.toString());
  });

  it('should return 404 for non-existent ID', async () => {
    const res = await request(app).get(
      `/api/posts/${new mongoose.Types.ObjectId()}`
    );
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/posts/:id', () => {
  it('should update post if author', async () => {
    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated', content: 'Updated content' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
  });

  it('should return 401 without token', async () => {
    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .send({ title: 'Fail' });
    expect(res.status).toBe(401);
  });

  it('should return 403 if not the author', async () => {
    const otherUser = await User.create({
      username: 'other',
      email: 'other@example.com',
      password: 'pass',
    });
    const otherToken = generateToken(otherUser);

    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Hacked' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/posts/:id', () => {
  it('should delete post if author', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const deleted = await Post.findById(postId);
    expect(deleted).toBeNull();
  });

  it('should return 401 without token', async () => {
    const res = await request(app).delete(`/api/posts/${postId}`);
    expect(res.status).toBe(401);
  });
});
