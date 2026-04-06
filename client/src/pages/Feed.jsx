import React, { useEffect, useState, useMemo, useRef } from 'react';
import useFeedStore from '../store/feedStore';
import useUserStore from '../store/userStore';
import PostCard from '../components/PostCard';
import AdCard from '../components/AdCard';
import DealCard from '../components/DealCard';
import HeadsUpCard from '../components/HeadsUpCard';
import IntelComposer from '../components/IntelComposer';
import { Search, Megaphone, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import WelcomeModal from '../components/WelcomeModal';
import Avatar from '../components/Avatar';

const MAX_CHARS = 150;

const PROMPTS = [
    "Gogon yuk!",
    "Ada apa hari ini?",
    "Mau cerita apa?",
    "Gogon-in aja dulu...",
    "Lagi ngerasa apa?",
];

const MOCK_ADS = [
    { id: 'ad_001', title: 'Capek kerja? Cari ruang aman buat cerita', description: 'Ruang diskusi & tools yang bisa kamu akses kapan saja.', cta: 'Pelajari', url: 'https://example.com' },
    { id: 'ad_002', title: 'Banyak orang lagi mikirin kariernya', description: 'Bukan solusi instan, tapi bisa bantu lebih tenang.', cta: 'Pelajari', url: 'https://example.com' },
    { id: 'ad_003', title: 'Belajar atur keuangan tanpa ribet', description: 'Baca dulu, nggak perlu daftar.', cta: 'Pelajari', url: 'https://example.com' },
    { id: 'ad_004', title: 'Bacaan ringan soal kerja & hidup', description: 'Kalau kamu lagi butuh perspektif lain.', cta: 'Pelajari', url: 'https://example.com' }
];

export default function Feed() {
    const { posts, intel, myPosts, loading, fetchPosts, fetchIntel, addPost } = useFeedStore();
    const { city, anonId, gender, occupation, location } = useUserStore();

    const [showIntelComposer, setShowIntelComposer] = useState(false);
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('WELCOME_SHOWN'));
    const [activeTab, setActiveTab] = useState('all');
    const [filterChip, setFilterChip] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [placeholder] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    const textareaRef = useRef(null);

    const charCount = content.length;
    const isOverLimit = charCount > MAX_CHARS;
    const canSubmit = content.trim().length > 0 && !isOverLimit && !isSubmitting;

    useEffect(() => {
        const params = { radius: null };
        if (activeTab === 'all') {
            fetchPosts(params);
            fetchIntel(params);
        } else if (activeTab === 'popular') {
            fetchPosts({ ...params, sort: 'popular' });
        } else {
            fetchPosts({ myPosts: true });
        }
    }, [city, activeTab]);

    const handleCloseWelcome = () => {
        localStorage.setItem('WELCOME_SHOWN', 'true');
        setShowWelcome(false);
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setIsSubmitting(true);
        await addPost({ content, city, institution: null, gender, occupation, anon_id: anonId, lat: location?.lat, long: location?.long, topic: null });
        setContent('');
        setIsSubmitting(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSubmit();
        }
    };

    // Render content with overflow highlighted in red
    const renderContentPreview = () => {
        if (charCount <= MAX_CHARS) return null;
        const safe = content.substring(0, MAX_CHARS);
        const overflow = content.substring(MAX_CHARS);
        return (
            <div className="absolute inset-0 p-3 text-sm pointer-events-none whitespace-pre-wrap break-words"
                style={{ fontFamily: 'Courier Prime, monospace', color: 'transparent' }}>
                <span>{safe}</span>
                <span style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>{overflow}</span>
            </div>
        );
    };

    const mixedFeed = useMemo(() => {
        let filteredPosts = posts;
        let filteredIntel = intel;

        if (activeTab === 'me') return myPosts;
        if (activeTab === 'popular') return posts;

        if (filterChip === 'CURHAT') filteredIntel = [];
        if (filterChip === 'DEAL') { filteredPosts = []; filteredIntel = intel.filter(i => i.type === 'DEAL'); }
        if (filterChip === 'HEADSUP') { filteredPosts = []; filteredIntel = intel.filter(i => i.type === 'HEADSUP'); }

        const combined = [...filteredPosts, ...filteredIntel];
        const sorted = combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return sorted.filter(item =>
                (item.content || '').toLowerCase().includes(q) ||
                (item.city || '').toLowerCase().includes(q)
            );
        }

        return sorted;
    }, [activeTab, filterChip, posts, intel, myPosts, searchQuery]);

    return (
        <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#F5EFE8' }}>
            {/* Header */}
            <header className="sticky top-0 z-10" style={{ backgroundColor: '#F5EFE8', borderBottom: '1px solid #E0D5CA' }}>
                {/* Title row */}
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                    <div className="w-8" />
                    <button
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            const params = { radius: null };
                            if (activeTab === 'all') {
                                fetchPosts(params);
                                fetchIntel(params);
                            } else if (activeTab === 'popular') {
                                fetchPosts({ ...params, sort: 'popular' });
                            } else {
                                fetchPosts({ myPosts: true });
                            }
                        }}
                        className="text-xl font-bold text-center cursor-pointer transition-opacity hover:opacity-70"
                        style={{ color: '#1E1E1E', fontFamily: 'Courier Prime, monospace' }}
                    >
                        GoGon
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowIntelComposer(true)}
                        className="w-8 h-8 flex items-center justify-center rounded-full transition"
                        style={{ backgroundColor: '#E0D5CA' }}
                        title="Bagikan Info"
                    >
                        <Megaphone size={14} style={{ color: '#5A4E3D' }} />
                    </button>
                </div>

                {/* Search bar */}
                <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-full"
                        style={{ backgroundColor: searchFocused ? '#fff' : '#EDE5DC', border: searchFocused ? '1.5px solid #C4B8AC' : '1.5px solid transparent', transition: 'all 0.2s' }}>
                        <Search size={15} style={{ color: '#8C8476', flexShrink: 0 }} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            placeholder="Cari Gogon"
                            className="flex-1 bg-transparent text-sm outline-none border-none"
                            style={{ fontFamily: 'Courier Prime, monospace', color: '#2A241D' }}
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-4 pb-2 flex gap-1">
                    {['all', 'popular', 'me'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="px-3 py-1 text-xs font-bold rounded-full transition-all"
                            style={{
                                fontFamily: 'Courier Prime, monospace',
                                backgroundColor: activeTab === tab ? '#1E1E1E' : 'transparent',
                                color: activeTab === tab ? '#F5EFE8' : '#8C8476',
                            }}
                        >
                            {tab === 'all' ? 'Sekitar' : tab === 'popular' ? 'Popular' : 'Aku'}
                        </button>
                    ))}
                </div>

                {/* Filter chips (Sekitar only) */}
                {activeTab === 'all' && (
                    <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
                        {['ALL', 'CURHAT', 'DEAL', 'HEADSUP'].map(chip => (
                            <button
                                key={chip}
                                onClick={() => setFilterChip(chip)}
                                className="px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all"
                                style={{
                                    fontFamily: 'Courier Prime, monospace',
                                    backgroundColor: filterChip === chip ? '#1E1E1E' : '#EDE5DC',
                                    color: filterChip === chip ? '#F5EFE8' : '#8C8476',
                                    border: filterChip === chip ? '1px solid #1E1E1E' : '1px solid transparent',
                                }}
                            >
                                {chip === 'ALL' ? 'Semua' : chip === 'CURHAT' ? 'Curhat' : chip === 'DEAL' ? 'Deal' : 'Heads-up'}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-bounce-in"
                    style={{ backgroundColor: '#1E1E1E', color: '#F5EFE8', fontFamily: 'Courier Prime, monospace' }}>
                    ✓ GoGon terkirim!
                </div>
            )}

            {/* Feed List */}
            <div className="flex-1 pb-40">
                {loading && mixedFeed.length === 0 ? (
                    <div className="flex justify-center p-8" style={{ color: '#8C8476' }}>
                        <Loader2 className="animate-spin" />
                    </div>
                ) : (
                    mixedFeed.map((item, idx) => {
                        const isPost = item.post_id;
                        return (
                            <React.Fragment key={item.post_id || item.intel_id}>
                                {isPost && <PostCard post={item} />}
                                {!isPost && item.type === 'DEAL' && <DealCard intel={item} />}
                                {!isPost && item.type === 'HEADSUP' && <HeadsUpCard intel={item} />}
                                {(idx + 1) % 7 === 0 && idx < mixedFeed.length - 1 && (
                                    <AdCard key={`ad-${idx}`} ad={MOCK_ADS[Math.floor(idx / 7) % MOCK_ADS.length]} />
                                )}
                            </React.Fragment>
                        );
                    })
                )}

                {!loading && mixedFeed.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-4 opacity-40">🤫</div>
                        <p className="text-sm leading-relaxed max-w-[200px] mx-auto"
                            style={{ color: '#8C8476', fontFamily: 'Courier Prime, monospace' }}>
                            {activeTab === 'all'
                                ? 'Belum ada yang GoGon di sini. Jadilah yang pertama!'
                                : 'Kamu belum ada aktivitas.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Bottom Composer — Fixed */}
            <div
                className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-20"
                style={{ backgroundColor: '#F5EFE8', borderTop: '1px solid #E0D5CA' }}
            >
                <div className="p-3">
                    {/* Composer card with Avatar */}
                    <div className="flex gap-3">
                        <Avatar anonId={anonId} gender={gender} />
                        <div
                            className="flex-1 relative rounded-2xl overflow-hidden"
                            style={{
                                backgroundColor: '#fff',
                                border: isOverLimit ? '1.5px solid #ef4444' : '1.5px solid #D4C8BC',
                            }}
                        >
                            {/* Overlay highlighting overflow */}
                            {renderContentPreview()}

                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                                rows={content.length > 60 ? 4 : 2}
                                className="w-full p-3 text-sm outline-none border-none resize-none bg-transparent relative z-10"
                                style={{
                                    fontFamily: 'Courier Prime, monospace',
                                    color: isOverLimit ? '#2A241D' : '#2A241D',
                                    minHeight: '52px',
                                    caretColor: '#1E1E1E',
                                }}
                            />

                            {/* Bottom row: counter + Kirim */}
                            <div className="flex items-center justify-between px-3 pb-2.5 pt-0">
                                {isOverLimit ? (
                                    <span className="text-xs font-bold" style={{ color: '#ef4444', fontFamily: 'Courier Prime, monospace' }}>
                                        Maksimum {MAX_CHARS} character ({charCount - MAX_CHARS > 0 ? '-' : ''}{Math.abs(charCount - MAX_CHARS)})
                                    </span>
                                ) : (
                                    <span className="text-xs" style={{ color: '#8C8476', fontFamily: 'Courier Prime, monospace' }}>
                                        {charCount}/{MAX_CHARS}
                                    </span>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                    className="px-4 py-1.5 rounded-xl text-sm font-bold transition-all"
                                    style={{
                                        fontFamily: 'Courier Prime, monospace',
                                        backgroundColor: canSubmit ? '#1E1E1E' : '#C4B8AC',
                                        color: '#F5EFE8',
                                    }}
                                >
                                    {isSubmitting ? '...' : 'Kirim'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showWelcome && <WelcomeModal onConfirm={handleCloseWelcome} />}
            {showIntelComposer && <IntelComposer onClose={() => setShowIntelComposer(false)} />}
        </div>
    );
}
