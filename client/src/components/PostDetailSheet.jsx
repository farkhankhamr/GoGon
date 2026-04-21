import React, { useState, useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import clsx from 'clsx';
import useFeedStore from '../store/feedStore';
import Avatar from './Avatar';

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'baru saja';
    if (mins < 60) return mins + 'm lalu';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'j lalu';
    const days = Math.floor(hrs / 24);
    return days + 'h lalu';
}

// Dummy likes data to match Figma since backend doesn't return full list of likers yet
const DUMMY_LIKES = Array(20).fill(0).map((_, i) => ({
    id: i,
    anon_id: `ID${i}`,
    gender: i % 3 === 0 ? 'M' : i % 3 === 1 ? 'F' : 'NB',
    heartType: i % 5 === 0 ? 'green' : i % 7 === 0 ? 'gray' : 'red'
}));

export default function PostDetailSheet({ post, isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('comments'); // 'likes' | 'comments'
    const { fetchComments, addComment } = useFeedStore();

    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && post) {
            loadComments();
        }
    }, [isOpen, post]);

    const loadComments = async () => {
        setLoading(true);
        const data = await fetchComments(post.post_id);
        setComments(data);
        setLoading(false);
    };

    if (!isOpen || !post) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-end bg-black/30" onClick={onClose} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {/* Sheet Container */}
            <div
                className="w-full h-[90vh] bg-[#FFF6ED] rounded-t-3xl shadow-xl flex flex-col relative"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24">
                    {/* Original Post */}
                    <div className="flex gap-3 mb-6">
                        <Avatar anonId={post.anon_id} gender={post.gender} />
                        <div className="flex-1 px-4 py-3 rounded-2xl" style={{ border: '1px dashed #37332E' }}>
                            <p className="text-[14px] leading-relaxed text-[#37332E]">
                                {post.content}
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[#D8D7D7] mb-6">
                        <button
                            className={clsx(
                                "flex-1 py-3 text-[15px] font-semibold text-center transition-colors relative",
                                activeTab === 'likes' ? "text-[#262626]" : "text-[#8C8B87]"
                            )}
                            onClick={() => setActiveTab('likes')}
                        >
                            {post.likes || 120} Likes
                            {activeTab === 'likes' && (
                                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#262626]" />
                            )}
                        </button>
                        <button
                            className={clsx(
                                "flex-1 py-3 text-[15px] font-semibold text-center transition-colors relative",
                                activeTab === 'comments' ? "text-[#262626]" : "text-[#8C8B87]"
                            )}
                            onClick={() => setActiveTab('comments')}
                        >
                            {post.comments_count || 120} Comment
                            {activeTab === 'comments' && (
                                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#262626]" />
                            )}
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'likes' ? (
                        <div className="grid grid-cols-4 gap-4 pb-20">
                            {DUMMY_LIKES.map(like => (
                                <div key={like.id} className="relative aspect-square rounded-full overflow-hidden" style={{ backgroundColor: '#D8D7D7' }}>
                                    <Avatar anonId={like.anon_id} gender={like.gender} size="full" />
                                    <div className="absolute bottom-0 right-0 p-1" style={{ width: '40%', height: '40%' }}>
                                        <Heart
                                            className="w-full h-full"
                                            fill={like.heartType === 'green' ? '#11B333' : like.heartType === 'gray' ? '#D8D7D7' : '#FF1A43'}
                                            color={like.heartType === 'green' ? '#11B333' : like.heartType === 'gray' ? '#D8D7D7' : '#FF1A43'}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4 pb-20">
                            {loading ? (
                                <p className="text-center py-10 text-[#8C8B87] text-sm">Memuat komentar...</p>
                            ) : comments.length === 0 ? (
                                <p className="text-center py-10 text-[#8C8B87] text-sm">Belum ada komentar.</p>
                            ) : (
                                comments.map((comment, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <Avatar anonId={comment.anon_id} gender={comment.gender || 'NB'} />
                                        <div className="flex-1 px-4 py-3 rounded-2xl" style={{ border: '1px dashed #37332E' }}>
                                            <p className="text-[14px] leading-relaxed text-[#37332E]">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Close Button Floating Inside Sheet */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
                    <button
                        onClick={onClose}
                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg pointer-events-auto"
                        style={{ backgroundColor: '#262626', color: '#FFF6ED' }}
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}
