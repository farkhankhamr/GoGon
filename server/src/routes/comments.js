const Comment = require('../models/Comment');
const Post = require('../models/Post');

async function commentsRoutes(fastify, options) {
    // GET /posts/:id/comments - Get comments for a post
    fastify.get('/posts/:id/comments', async (request, reply) => {
        const { id } = request.params;
        const comments = await Comment.find({ post_id: id }).sort({ created_at: 1 });
        return comments;
    });

    // POST /posts/:id/comments - Create Comment
    fastify.post('/posts/:id/comments', async (request, reply) => {
        const { id } = request.params;
        const { content, anon_id } = request.body;

        if (!content || !anon_id) {
            return reply.code(400).send({ error: 'Missing content or anon_id' });
        }

        const comment = new Comment({
            post_id: id,
            anon_id,
            content,
            expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000) // Sync with post expiry ideally, ensuring not longer than post
        });

        await comment.save();

        // Increment comments_count on Post
        await Post.updateOne(
            { post_id: id },
            { $inc: { comments_count: 1, 'metrics.comments_count': 1 } }
        );

        return comment;
    });
}

module.exports = commentsRoutes;
