const fs = require('fs');
const https = require('https');
const path = require('path');

const NUM_AVATARS = 100;
const OUTPUT_DIR = path.join(__dirname, 'public/avatars');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log(`Fetching ${NUM_AVATARS} avatars...`);

let completed = 0;
for (let i = 1; i <= NUM_AVATARS; i++) {
    // Use micah style for humans
    const url = `https://api.dicebear.com/7.x/micah/svg?seed=user_${i}&backgroundColor=transparent`;
    const dest = path.join(OUTPUT_DIR, `avatar_${i}.svg`);

    https.get(url, (res) => {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
            file.close();
            completed++;
            if (completed === NUM_AVATARS) console.log('Successfully fetched all avatars!');
        });
    }).on('error', (err) => {
        console.error(`Error fetching avatar ${i}:`, err.message);
    });
}
