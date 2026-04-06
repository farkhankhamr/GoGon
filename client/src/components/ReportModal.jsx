import React, { useState } from 'react';
import { X } from 'lucide-react';

const REPORT_REASONS = [
    { id: 'spam', label: 'Spam' },
    { id: 'harmful', label: 'Konten Berbahaya' },
    { id: 'sexuality', label: 'Konten Seksual' },
    { id: 'violence', label: 'Kekerasan' },
    { id: 'hoax', label: 'Informasi Menyesatkan/Hoax' },
    { id: 'sara', label: 'SARA' }
];

export default function ReportModal({ postId, onClose, onSubmit }) {
    const [selectedReason, setSelectedReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleSubmit = async () => {
        if (!selectedReason) return;

        setIsSubmitting(true);
        await onSubmit(postId, selectedReason);
        setIsSubmitting(false);
        setShowConfirmation(true);

        // Auto-close after 2 seconds
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    if (showConfirmation) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full border-2 border-[#1E1E1E]"
                    style={{ fontFamily: 'Courier Prime, monospace', backgroundColor: '#F5EFE8' }}>
                    <div className="w-12 h-12 bg-[#1E1E1E] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-[#F5EFE8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-sm font-bold text-[#1E1E1E]">
                        Terima kasih.<br />
                        Laporan GoGon kami terima.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-[#F5EFE8] rounded-2xl p-6 max-w-md w-full border-2 border-[#1E1E1E]" style={{ fontFamily: 'Courier Prime, monospace' }}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-[#1E1E1E]">Laporkan</h2>
                    <button onClick={onClose} className="text-[#8C8476]">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-xs font-bold text-[#8C8476] mb-4 uppercase tracking-wider">
                    Pilih alasan:
                </p>

                <div className="space-y-2 mb-6">
                    {REPORT_REASONS.map(reason => (
                        <label
                            key={reason.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition cursor-pointer ${selectedReason === reason.id ? 'bg-white border-[#1E1E1E]' : 'bg-transparent border-[#D4C8BC] hover:border-[#8C8476]'}`}
                        >
                            <input
                                type="radio"
                                name="reason"
                                value={reason.id}
                                checked={selectedReason === reason.id}
                                onChange={(e) => setSelectedReason(e.target.value)}
                                className="w-4 h-4 border-[#D4C8BC] text-[#1E1E1E] focus:ring-[#1E1E1E]"
                            />
                            <span className="text-sm font-bold text-[#1E1E1E]">{reason.label}</span>
                        </label>
                    ))}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!selectedReason || isSubmitting}
                    className="w-full py-3 bg-[#1E1E1E] text-[#F5EFE8] rounded-xl font-bold disabled:opacity-50 hover:opacity-90 transition"
                >
                    {isSubmitting ? '...' : 'Kirim Laporan'}
                </button>
            </div>
        </div>
    );
}
