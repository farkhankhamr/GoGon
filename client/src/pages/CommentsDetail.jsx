import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import useFeedStore from '../store/feedStore';
import useUserStore from '../store/userStore';
import Avatar from '../components/Avatar';

const GOGON_COLORS = {
    bg: '#F5EFE8',
    card: '#FFFFFF',
    text: '#1E1E1E',
    muted: '#8C8476',
    border: '#E0D5CA',
    accent: '#FFB6C1',
};

export default function CommentsDetail() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { posts, fetchComments, addComment } = useFeedStore();
    const { anonId } = useUserStore();

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const post = posts.find(p => p.post_id === postId);

    useEffect(() => {
        loadComments();
    }, [postId]);

    const loadComments = async () => {
        setLoading(true);
        const data = await fetchComments(postId);
        setComments(data);
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;

        setSubmitting(true);
        try {
            await addComment(postId, newComment, anonId);
            setNewComment('');
            await loadComments();
        } catch (err) {
            console.error('Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-screen" style={{ backgroundColor: GOGON_COLORS.bg }}>
            {/* Header */}
            <div className="flex items-center gap-4 p-4 sticky top-0 z-10"
                style={{ backgroundColor: '#F5EFE8', borderBottom: '1px solid #E0D5CA' }}>
                <button onClick={() => navigate(-1)} className="p-1">
                    <ArrowLeft className="w-6 h-6" style={{ color: '#1E1E1E' }} />
                </button>
                <h1 className="text-lg font-bold" style={{ color: '#1E1E1E', fontFamily: 'DM Sans, sans-serif' }}>Komentar</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Original Post Summary */}
                {post && (
                    <div className="p-4 rounded-2xl mb-8"
                        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E0D5CA' }}>
                        <p className="pb-2 mb-2 font-bold"
                            style={{ fontSize: '10px', textTransform: 'uppercase', color: '#8C8476', fontFamily: 'DM Sans, sans-serif', borderBottom: '1px solid #E0D5CA' }}>
                            POSTINGAN ASLI
                        </p>
                        <p className="whitespace-pre-wrap" style={{ fontSize: '14px', color: '#1E1E1E', fontFamily: 'DM Sans, sans-serif' }}>{post.content}</p>
                    </div>
                )}

                {/* Comments List */}
                <div className="space-y-4 pb-20">
                    {loading ? (
                        <p className="text-center py-10" style={{ color: '#8C8476', fontFamily: 'DM Sans, sans-serif' }}>Memuat komentar...</p>
                    ) : comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <MessageSquare className="w-12 h-12 mb-2" style={{ opacity: 0.4, color: '#8C8476' }} />
                            <p style={{ color: '#8C8476', fontFamily: 'DM Sans, sans-serif' }}>Belum ada komentar. Jadi yang pertama!</p>
                        </div>
                    ) : (
                        comments.map((comment, idx) => (
                            <div key={idx} className="flex gap-3">
                                <Avatar anonId={comment.anon_id} gender={comment.gender || null} />
                                <div className="p-3 rounded-2xl flex-1"
                                    style={{ backgroundColor: '#FFFFFF', border: '1px solid #E0D5CA' }}>
                                    <p style={{ fontSize: '14px', color: '#1E1E1E', fontFamily: 'DM Sans, sans-serif' }}>{comment.content}</p>
                                    <p className="mt-1 uppercase font-bold"
                                        style={{ fontSize: '10px', color: '#8C8476', fontFamily: 'DM Sans, sans-serif' }}>
                                        {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Input Fixed at Bottom */}
            <div className="p-4 sticky bottom-0"
                style={{ backgroundColor: '#F5EFE8', borderTop: '1px solid #E0D5CA' }}>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Tulis komentar..."
                        className="flex-1 px-4 py-3 rounded-2xl outline-none"
                        style={{
                            backgroundColor: '#FFFFFF',
                            border: '1.5px solid #D4C8BC',
                            fontFamily: 'DM Sans, sans-serif',
                            color: '#2A241D',
                            '--placeholder-color': '#8C8476',
                        }}
                        onFocus={e => e.target.style.borderColor = '#C4B8AC'}
                        onBlur={e => e.target.style.borderColor = '#D4C8BC'}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || submitting}
                        className="p-2 w-11 h-11 flex items-center justify-center rounded-xl disabled:opacity-50"
                        style={{ backgroundColor: '#1E1E1E', color: '#F5EFE8' }}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
