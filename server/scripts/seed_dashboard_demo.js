const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const Post = require('../src/models/Post');
const PostAudit = require('../src/models/PostAudit');
const DailySummary = require('../src/models/DailySummary');
const { generateDailySummary } = require('../src/utils/dailySummary');

// Data Arrays for Random Generation
const TOPICS = ['Work', 'Relationship', 'Money', 'Family', 'School', 'Health', 'Politics', 'Other'];
const CITIES = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Bali', 'Yogyakarta'];
const SENTIMENTS = ['positive', 'neutral', 'sad', 'angry'];
const CONTENTS = [
    "Gaji udah abis padahal baru tanggal muda... :( #Money",
    "Kantor hari ini toxic banget, bos marah-marah ga jelas. #Work",
    "Finally got promoted! Hard work pays off. #Work #Positive",
    "Kangen banget sama masakan ibu di kampung. #Family",
    "Pacaran 5 tahun ditinggal nikah, sakitnya ga ada obat. #Relationship",
    "Ada info loker Jakarta Pusat ga ya? admin/finance. #Work",
    "Jalanan macet total, tua di jalan ini mah. #Jakarta",
    "Info dong tempat date murah tapi fancy di Jaksel? #Relationship",
    "Tagihan listrik naik terus, pusing pala berbie. #Money",
    "Mental health break dulu, cabut ke Bali. #Health"
];

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/gogon', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    console.log('Starting seed process...');

    // Get today's date key
    const dateKey = new Date().toISOString().split('T')[0];

    console.log(`Cleaning data for ${dateKey}...`);
    await Post.deleteMany({ createdDateKey: dateKey });
    await PostAudit.deleteMany({ createdDateKey: dateKey });
    await DailySummary.deleteOne({ dateKey });
    console.log('Cleaned old data.');

    const postsToCreate = 10;
    const createdPosts = [];

    for (let i = 0; i < postsToCreate; i++) {
        const content = CONTENTS[i % CONTENTS.length];
        const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];
        const sentiment = SENTIMENTS[Math.floor(Math.random() * SENTIMENTS.length)];
        const anon_id = uuidv4();

        // Random interactions
        const likes = Math.floor(Math.random() * 50);
        const comments = Math.floor(Math.random() * 10);
        const reports = i === 8 ? 5 : Math.floor(Math.random() * 2); // Post 8 gets 5 reports (hidden)

        const post = new Post({
            content,
            anon_id,
            city,
            color: 'bg-cream-50',
            topic_tags: [topic],
            sentiment: sentiment,
            createdDateKey: dateKey,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiration
            metrics: {
                likes,
                comments_count: comments,
                saves: Math.floor(Math.random() * 5),
                ack: Math.floor(Math.random() * 5)
            },
            reportCount: reports,
            status: reports >= 3 ? 'hidden' : 'active'
        });

        await post.save();
        createdPosts.push(post);

        // Create associated PostAudit
        const audit = new PostAudit({
            post_id: post._id,
            anon_id_hash: PostAudit.hashAnonId(anon_id),
            createdDateKey: dateKey,
            gender: Math.random() > 0.5 ? 'Pria' : 'Wanita',
            city,
            type: 'CURHAT',
            sentiment,
            topic_tags: [topic],
            metrics_snapshot: post.metrics // Snapshot at creation (simulated)
        });

        await audit.save();
        process.stdout.write('.');
    }

    console.log('\nSeed complete. Created 10 posts.');

    console.log('Generating Daily Summary...');
    await generateDailySummary(dateKey);
    console.log('Summary Generated.');

    process.exit(0);
};

seedData();
