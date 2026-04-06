import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';

export default function EditPostModal({ post, onClose, onSave }) {
    const [content, setContent] = useState(post.content);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate remaining time
    const elapsed = Date.now() - new Date(post.created_at).getTime();
    const remainingMs = (15 * 60 * 1000) - elapsed;
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    const handleSave = async () => {
        if (!content.trim() || content === post.content) return;

        setIsSubmitting(true);
        await onSave(post.post_id, content);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-[#F5EFE8] rounded-2xl p-6 max-w-md w-full border-2 border-[#1E1E1E]" style={{ fontFamily: 'Courier Prime, monospace' }}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-[#1E1E1E]">Edit GoGon</h2>
                    <button onClick={onClose} className="text-[#8C8476]">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-[#E040FB] bg-[#E040FB]/10 px-3 py-2 rounded-lg mb-4">
                    <Clock size={14} />
                    <span>Batas edit: {remainingMinutes} menit lagi</span>
                </div>

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={500}
                    className="w-full bg-white border-2 border-[#D4C8BC] rounded-xl p-3 text-sm focus:border-[#1E1E1E] outline-none resize-none min-h-[120px] mb-2"
                    style={{ color: '#2A241D' }}
                    placeholder="Edit kontenmu..."
                />

                <div className="text-[10px] font-bold text-[#8C8476] text-right mb-4">
                    {content.length}/500
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-[#EDE5DC] text-[#5A4E3D] rounded-xl font-bold hover:bg-[#D4C8BC] transition"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!content.trim() || content === post.content || isSubmitting}
                        className="flex-1 py-3 bg-[#1E1E1E] text-[#F5EFE8] rounded-xl font-bold disabled:opacity-50 hover:opacity-90 transition"
                    >
                        {isSubmitting ? '...' : 'Simpan'}
                    </button>
                </div>
            </div>
        </div>
    );
}
