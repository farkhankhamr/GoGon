const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/gogon').then(async () => {
    try {
        await mongoose.connection.collection('intelposts').dropIndex('location_2dsphere');
        console.log('Successfully dropped old location_2dsphere index');
    } catch (err) {
        console.log('Index might not exist or err:', err.message);
    }
    process.exit(0);
});
