const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const CommentSchema = new mongoose.Schema({
    comment_id: { type: String, default: uuidv4, unique: true },
    post_id: { type: String, required: true, index: true },
    anon_id: { type: String, required: true },
    gender: { type: String, enum: ['M', 'F', 'NB', null], default: null },
    content: { type: String, required: true, maxLength: 300 },
    created_at: { type: Date, default: Date.now },
    expires_at: { type: Date, required: true, index: { expires: 0 } }
});

module.exports = mongoose.model('Comment', CommentSchema);
