const Post = require('../models/Post');
const PostLike = require('../models/PostLike');
const PostAudit = require('../models/PostAudit');
const Report = require('../models/Report');
const UserBan = require('../models/UserBan');

const { SEED_POSTS } = require('../utils/seed_posts');
const { analyzeContent } = require('../utils/contentAnalysis');

// Helper to shuffle array
const shuffle = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const postsRoutes = async (fastify, options) => {
  // GET /posts - Feed with geospatial filtering
  fastify.get('/posts', async (request, reply) => {
    const { city, institution, topic, lat, long, radius, anon_id, sort } = request.query;

    let pipeline = [];
    const meters = radius ? parseInt(radius) : 10000; // Default 10km

    // 1. $geoNear MUST be the first stage if coordinates are provided
    if (lat && long) {
      pipeline.push({
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(long), parseFloat(lat)] },
          distanceField: "distance",
          maxDistance: meters,
          spherical: true,
          query: { status: 'active' }
        }
      });
    } else {
      pipeline.push({ $match: { status: 'active' } });
      if (city) pipeline.push({ $match: { city: city } });
    }

    // 2. Additional Filters
    if (institution) pipeline.push({ $match: { institution: institution } });
    if (topic) pipeline.push({ $match: { topic: topic } });

    // 3. Sorting
    if (sort === 'popular') {
      pipeline.push({ $sort: { likes: -1 } });
    } else if (!lat || !long) {
      // If no geoNear, manual sort by creation time
      pipeline.push({ $sort: { created_at: -1 } });
    }

    // 4. Limit results
    pipeline.push({ $limit: 15 }); // Limit real posts to 15 (allows seed injection)

    const posts = await Post.aggregate(pipeline);

    // 5. Check if current user liked these posts
    const postsWithStatus = await Promise.all(posts.map(async (p) => {
      const liked = anon_id ? await PostLike.exists({ post_id: p.post_id, anon_id }) : false;
      return {
        ...p,
        has_liked: !!liked,
        // distance is already in meters from $geoNear
      };
    }));

    // [NEW] Inject 10 Random Seed Posts (Empty State / Filler)
    // Only inject if standard sort (not popular) or if feed is empty
    if (sort !== 'popular') {
      const randomSeeds = shuffle([...SEED_POSTS]).slice(0, 10).map((seed) => {
        return {
          _id: seed.post_id,
          post_id: seed.post_id,
          content: seed.content,
          topic: seed.topic,
          city: city || 'Jakarta', // Fallback to current city context
          gender: seed.gender,
          occupation: seed.occupation,
          likes: seed.likes,
          created_at: seed.created_at,
          is_seed: true,
          distance: null,
          has_liked: false
        };
      });

      // Combined: Real Posts (Top) + Seed Posts (Bottom)
      return [...postsWithStatus, ...randomSeeds];
    }

    return postsWithStatus;
  });

  // GET /posts/me - My Posts
  fastify.get('/posts/me', async (request, reply) => {
    const { anon_id } = request.query;
    if (!anon_id) return reply.code(400).send({ error: 'Missing anon_id' });

    const posts = await Post.find({ anon_id, status: 'active' }).sort({ created_at: -1 });
    return posts;
  });

  // POST /posts - Create Post
  fastify.post('/posts', async (request, reply) => {
    const { content, city, institution, topic, gender, occupation, lat, long, anon_id } = request.body;

    if (!content || !anon_id) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    // Check if user is banned
    const userBan = await UserBan.findOne({ anon_id });
    if (userBan && userBan.is_banned) {
      return reply.code(403).send({
        error: 'Akun kamu telah diblokir karena melanggar aturan komunitas.'
      });
    }

    const postData = {
      anon_id,
      content,
      city,
      institution,
      topic,
      gender,
      occupation,
      type: 'CURHAT', // Default type for regular posts
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000)
    };

    // Run content analysis
    const analysis = analyzeContent(content);
    postData.sentiment = analysis.sentiment;
    postData.topic_tags = analysis.topic_tags;

    if (lat && long) {
      postData.location = {
        type: 'Point',
        coordinates: [long, lat]
      };
    }

    const post = new Post(postData);
    await post.save();

    // Create immutable audit record for daily summary
    try {
      await PostAudit.create({
        post_id: post.post_id,
        anon_id_hash: PostAudit.hashAnonId(anon_id),
        createdAt: post.created_at,
        createdDateKey: post.createdDateKey,
        gender: post.gender,
        city: post.city || 'Unknown',
        type: post.type,
        sentiment: post.sentiment,
        topic_tags: post.topic_tags,
        metrics_snapshot: {
          likes: 0,
          comments_count: 0,
          saves: 0,
          ack: 0,
          direction_clicks: 0,
          chat_started: 0,
          chat_accepted: 0
        }
      });
    } catch (auditError) {
      console.error('Failed to create PostAudit:', auditError.message);
      // Don't fail the post creation if audit fails
    }

    return post;
  });

  // POST /posts/:id/toggle_like - Toggle Like
  fastify.post('/posts/:id/toggle_like', async (request, reply) => {
    const { id } = request.params;
    const { anon_id } = request.body;

    if (!anon_id) return reply.code(400).send({ error: 'Missing anon_id' });

    const post = await Post.findOne({ post_id: id });
    if (!post) return reply.code(404).send({ error: 'Post not found' });

    // atomic check
    const existingLike = await PostLike.findOne({ post_id: id, anon_id });

    if (existingLike) {
      // Unlike
      await PostLike.deleteOne({ _id: existingLike._id });
      post.likes = Math.max(0, post.likes - 1);
      await post.save();
      return { likes: post.likes, has_liked: false };
    } else {
      // Like
      await PostLike.create({ post_id: id, anon_id });
      post.likes += 1;
      await post.save();
      return { likes: post.likes, has_liked: true };
    }
  });

  // PUT /posts/:id - Edit Post (15min window)
  fastify.put('/posts/:id', async (request, reply) => {
    const { id } = request.params;
    const { anon_id, content } = request.body;

    if (!content || !anon_id) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    const post = await Post.findOne({ post_id: id, anon_id });
    if (!post) {
      return reply.code(404).send({ error: 'Post not found or unauthorized' });
    }

    // Check 15min window
    const elapsed = Date.now() - new Date(post.created_at).getTime();
    if (elapsed > 15 * 60 * 1000) {
      return reply.code(403).send({ error: 'Edit window expired (15 minutes)' });
    }

    post.content = content;
    await post.save();
    return post;
  });

  // DELETE /posts/:id - Delete Own Post
  fastify.delete('/posts/:id', async (request, reply) => {
    const { id } = request.params;
    const { anon_id } = request.query;

    if (!anon_id) {
      return reply.code(400).send({ error: 'Missing anon_id' });
    }

    const post = await Post.findOne({ post_id: id, anon_id });
    if (!post) {
      return reply.code(404).send({ error: 'Post not found or unauthorized' });
    }

    await Post.deleteOne({ _id: post._id });
    return { success: true };
  });


}

module.exports = postsRoutes;

