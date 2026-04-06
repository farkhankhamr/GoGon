import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MoreHorizontal, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import useFeedStore from '../store/feedStore';
import useUserStore from '../store/userStore';
import useConfigStore from '../store/configStore';
import { format } from 'date-fns';
import PostActionsMenu from './PostActionsMenu';
import EditPostModal from './EditPostModal';
import ReportModal from './ReportModal';
import Avatar from './Avatar';

export default function PostCard({ post }) {
    const { likePost, editPost, deletePost, reportPost } = useFeedStore();
    const { anonId, distanceDisplay, toggleDistanceDisplay } = useUserStore();
    const { chat_enabled } = useConfigStore(state => state.settings);
    const navigate = useNavigate();

    const [showEditModal, setShowEditModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isSeed = post.is_seed || post.anon_id === 'SYSTEM_BOT';

    // Format time as HH:mm
    const timeStr = format(new Date(post.created_at), 'HH:mm');
    const cityStr = post.city || '—';
    const distanceStr = post.distance != null ? `${(post.distance / 1000).toFixed(1)} km` : null;
    const locationDisplay = distanceDisplay ? (distanceStr || cityStr) : cityStr;

    const handleEditSave = async (postId, content) => {
        await editPost(postId, content, anonId);
    };

    const handleReportSubmit = async (postId, reason) => {
        await reportPost(postId, reason, anonId);
    };

    return (
        <>
            <div className="flex gap-3 px-4 py-3">
                {/* Avatar */}
                <Avatar anonId={post.anon_id} gender={post.gender} />

                {/* Card content */}
                <div className="flex-1 min-w-0">
                    {/* Dashed border card for content */}
                    <div className="card-dashed px-3 py-2.5 mb-1.5">
                        <p className="text-sm leading-relaxed" style={{ color: '#2A241D', fontFamily: 'Courier Prime, monospace' }}>
                            {post.content}
                        </p>
                    </div>

                    {/* Footer row */}
                    <div className="flex items-center gap-3 px-1">
                        {/* Like */}
                        <button
                            onClick={() => likePost(post.post_id)}
                            className={clsx(
                                'flex items-center gap-1 text-xs transition-colors',
                                post.has_liked ? 'text-red-500' : 'text-[#8C8476] hover:text-red-400'
                            )}
                        >
                            <Heart
                                size={14}
                                className={clsx(post.has_liked && 'fill-red-500')}
                            />
                            <span>{post.likes || 0}</span>
                        </button>

                        {/* Comment or Chat CTA based on Toggle */}
                        {chat_enabled ? (
                            <button
                                onClick={() => navigate(`/chat/${post.post_id}`)}
                                className="flex items-center gap-1 text-xs text-[#8C8476] hover:text-indigo-600 transition-colors"
                            >
                                <MessageSquare size={14} />
                                <span>Chat</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate(`/post/${post.post_id}/comments`)}
                                className="flex items-center gap-1 text-xs text-[#8C8476] hover:text-pink-500 transition-colors"
                            >
                                <MessageCircle size={14} />
                                <span>{post.comments_count || 0}</span>
                            </button>
                        )}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* City • time / Distance • time toggle */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                toggleDistanceDisplay();
                            }}
                            className="text-xs transition-colors hover:text-[#5A4E3D] cursor-pointer"
                            style={{ color: '#8C8476', fontFamily: 'Courier Prime, monospace' }}
                        >
                            {locationDisplay} • {timeStr}
                        </button>

                        {/* Actions menu */}
                        {!isSeed && (
                            <PostActionsMenu
                                post={post}
                                currentUserId={anonId}
                                onEdit={() => setShowEditModal(true)}
                                onDelete={() => setShowDeleteConfirm(true)}
                                onReport={() => setShowReportModal(true)}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showEditModal && (
                <EditPostModal
                    post={post}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleEditSave}
                />
            )}

            {showReportModal && (
                <ReportModal
                    postId={post.post_id}
                    onClose={() => setShowReportModal(false)}
                    onSubmit={handleReportSubmit}
                />
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#E0D5CA]"
                        style={{ fontFamily: 'Courier Prime, monospace' }}>
                        <h3 className="text-base font-bold text-[#2A241D] mb-2">Hapus Postingan?</h3>
                        <p className="text-sm text-[#8C8476] mb-6">
                            Postingan ini akan dihapus permanen.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 rounded-xl text-sm font-bold transition"
                                style={{ backgroundColor: '#F5EFE8', color: '#5A4E3D', border: '1px solid #D4C8BC' }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={async () => {
                                    await deletePost(post.post_id, anonId);
                                    setShowDeleteConfirm(false);
                                }}
                                className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-600 text-white transition hover:bg-red-700"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
