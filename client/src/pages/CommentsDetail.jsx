import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import useFeedStore from '../store/feedStore';
import useUserStore from '../store/userStore';

const GOGON_COLORS = {
    bg: '#F5EFE8',
    card: '#FFFFFF',
    text: '#1E1E1E',
    muted: '#8C8476',
    border: '#1E1E1E',
    accent: '#FFB6C1', // Pink like the mockup highlights
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
            <div className="flex items-center gap-4 p-4 border-b-2 border-slate-900 bg-white sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-1">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-bold">Komentar</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Original Post Summary */}
                {post && (
                    <div className="bg-white p-4 rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
                        <p className="text-sm border-b border-dashed border-slate-200 pb-2 mb-2 text-slate-500 font-bold">POSTINGAN ASLI</p>
                        <p className="whitespace-pre-wrap">{post.content}</p>
                    </div>
                )}

                {/* Comments List */}
                <div className="space-y-4 pb-20">
                    {loading ? (
                        <p className="text-center py-10 text-slate-500">Memuat komentar...</p>
                    ) : comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                            <p>Belum ada komentar. Jadi yang pertama!</p>
                        </div>
                    ) : (
                        comments.map((comment, idx) => (
                            <div key={idx} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {(comment.anon_id || '??').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="bg-white p-3 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-1">
                                    <p className="text-sm">{comment.content}</p>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">
                                        {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Input Fixed at Bottom */}
            <div className="p-4 bg-white border-t-2 border-slate-900 sticky bottom-0">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Tulis komentar..."
                        className="flex-1 bg-slate-50 border-2 border-slate-900 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || submitting}
                        className="bg-slate-900 text-white p-2 w-11 h-11 flex items-center justify-center rounded-xl hover:bg-slate-800 disabled:opacity-50"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
