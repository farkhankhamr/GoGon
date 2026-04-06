/**
 * Content Analysis Utility
 * Provides heuristic-based sentiment and topic extraction for Indonesian text.
 * MVP implementation using keyword matching - no external API dependencies.
 */

// ============================================================
// SENTIMENT ANALYSIS
// ============================================================

const HATE_KEYWORDS = [
    'anjing', 'bangsat', 'bajingan', 'brengsek', 'keparat', 'setan',
    'kontol', 'memek', 'ngentot', 'tai', 'babi', 'tolol', 'goblok',
    'idiot', 'bodoh banget', 'mampus', 'bunuh', 'mati aja'
];

const ANGRY_KEYWORDS = [
    'kesel', 'marah', 'emosi', 'gregetan', 'benci', 'muak', 'capek banget',
    'gak tahan', 'sebel', 'jengkel', 'gondok', 'dongkol', 'sialan',
    '!!!', 'KENAPA', 'GIMANA SIH', 'GAK BISA'
];

const SAD_KEYWORDS = [
    'sedih', 'nangis', 'menangis', 'galau', 'patah hati', 'kecewa',
    'hopeless', 'putus asa', 'lelah', 'capek hidup', 'kesepian',
    'sendiri', 'hampa', 'kosong', 'menyesal', 'gagal', 'drop out',
    'depresi', 'anxiety', 'cemas', 'takut', 'insecure', 'minder'
];

const POSITIVE_KEYWORDS = [
    'senang', 'bahagia', 'happy', 'syukur', 'alhamdulillah', 'makasih',
    'terima kasih', 'lega', 'plong', 'excited', 'semangat', 'optimis',
    'beruntung', 'grateful', 'bersyukur', 'mantap', 'keren', 'asik',
    'yes', 'akhirnya', 'berhasil', 'sukses', 'diterima', 'lolos'
];

/**
 * Analyze sentiment of text content
 * @param {string} content - Text to analyze
 * @returns {string} - 'positive', 'neutral', 'sad', 'angry', or 'hate'
 */
function analyzeSentiment(content) {
    if (!content) return 'neutral';

    const lowerContent = content.toLowerCase();
    const hasAllCaps = /[A-Z]{4,}/.test(content); // Detect shouting
    const hasExclamation = (content.match(/!/g) || []).length >= 3;

    // Check hate first (most severe)
    for (const keyword of HATE_KEYWORDS) {
        if (lowerContent.includes(keyword)) {
            return 'hate';
        }
    }

    // Check angry
    for (const keyword of ANGRY_KEYWORDS) {
        if (lowerContent.includes(keyword)) {
            return 'angry';
        }
    }
    if (hasAllCaps && hasExclamation) {
        return 'angry';
    }

    // Check sad
    for (const keyword of SAD_KEYWORDS) {
        if (lowerContent.includes(keyword)) {
            return 'sad';
        }
    }

    // Check positive
    for (const keyword of POSITIVE_KEYWORDS) {
        if (lowerContent.includes(keyword)) {
            return 'positive';
        }
    }

    return 'neutral';
}

// ============================================================
// TOPIC EXTRACTION
// ============================================================

const TOPIC_KEYWORDS = {
    'Work': [
        'kantor', 'kerja', 'kerjaan', 'bos', 'atasan', 'rekan kerja',
        'gaji', 'lembur', 'meeting', 'deadline', 'project', 'resign',
        'interview', 'hiring', 'job', 'wfa', 'wfo', 'remote', 'karyawan',
        'perusahaan', 'startup', 'corporate', 'hrd', 'probation'
    ],
    'Money': [
        'uang', 'duit', 'bokek', 'miskin', 'hutang', 'utang', 'pinjaman',
        'tabungan', 'investasi', 'saham', 'crypto', 'gajian', 'cicilan',
        'kredit', 'tagihan', 'bayar', 'hemat', 'boros', 'modal', 'bisnis'
    ],
    'Relationship': [
        'pacar', 'gebetan', 'crush', 'mantan', 'pdkt', 'jadian', 'putus',
        'selingkuh', 'nikah', 'married', 'suami', 'istri', 'pasangan',
        'hubungan', 'ldr', 'cinta', 'sayang', 'bucin', 'zonk', 'friend zone'
    ],
    'Family': [
        'ortu', 'orang tua', 'mama', 'papa', 'ayah', 'ibu', 'bokap', 'nyokap',
        'adik', 'kakak', 'keluarga', 'rumah', 'anak', 'mertua', 'sodara',
        'saudara', 'keponakan', 'cucu', 'nenek', 'kakek'
    ],
    'School': [
        'kuliah', 'kampus', 'universitas', 'dosen', 'tugas', 'skripsi',
        'thesis', 'sidang', 'ipk', 'nilai', 'ujian', 'uts', 'uas',
        'mahasiswa', 'semester', 'kelas', 'sks', 'sekolah', 'guru',
        'les', 'bimbel', 'beasiswa'
    ],
    'Health': [
        'sakit', 'dokter', 'rumah sakit', 'rs', 'puskesmas', 'obat',
        'mental', 'psikolog', 'psikiater', 'therapy', 'terapi',
        'anxiety', 'depresi', 'stress', 'insomnia', 'diet', 'gym',
        'olahraga', 'demam', 'flu', 'covid', 'vaksin'
    ],
    'Politics': [
        'politik', 'pemerintah', 'presiden', 'menteri', 'dpr', 'korupsi',
        'pilpres', 'pilkada', 'pemilu', 'partai', 'demo', 'protes',
        'pajak', 'subsidi', 'bbm', 'uu', 'undang'
    ]
};

/**
 * Extract topic from text content
 * @param {string} content - Text to analyze
 * @returns {string} - Topic name
 */
function extractTopic(content) {
    if (!content) return 'Other';

    const lowerContent = content.toLowerCase();
    const topicScores = {};

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        topicScores[topic] = 0;
        for (const keyword of keywords) {
            if (lowerContent.includes(keyword)) {
                topicScores[topic]++;
            }
        }
    }

    // Find topic with highest score
    let bestTopic = 'Other';
    let bestScore = 0;

    for (const [topic, score] of Object.entries(topicScores)) {
        if (score > bestScore) {
            bestScore = score;
            bestTopic = topic;
        }
    }

    return bestTopic;
}

/**
 * Analyze content and return both sentiment and topics
 * @param {string} content - Text to analyze
 * @returns {{ sentiment: string, topic_tags: string[] }}
 */
function analyzeContent(content) {
    const sentiment = analyzeSentiment(content);
    const topic = extractTopic(content);

    return {
        sentiment,
        topic_tags: topic !== 'Other' ? [topic] : []
    };
}

module.exports = {
    analyzeSentiment,
    extractTopic,
    analyzeContent,
    TOPIC_KEYWORDS,
    HATE_KEYWORDS,
    ANGRY_KEYWORDS,
    SAD_KEYWORDS,
    POSITIVE_KEYWORDS
};
