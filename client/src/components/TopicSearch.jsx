import React from 'react';
import { X } from 'lucide-react';

const TOPICS = [
    'Promo', 'Kehidupan', 'Cinta',
    'Agama', 'Sepak Bola', 'Basket',
    'Bulu Tangkis', 'Dance', 'Pijat',
    'Lalu Lintas', 'Makanan', 'Jalan Jalan',
    'Suami', 'Istri', 'Anak',
    'Anjing', 'Kucing', 'Kura Kura',
    'Metal', 'Hip Hop', 'Dangdut'
];

export default function TopicSearch({ isOpen, onClose, onSelectTopic }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#FFF6ED', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {/* Header */}
            <div className="pt-12 pb-6 px-4 text-center">
                <h2 className="text-[20px] font-bold" style={{ color: '#262626' }}>
                    Topik apa yang kamu cari?
                </h2>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-32">
                <div className="grid grid-cols-3 gap-3">
                    {TOPICS.map((topic) => (
                        <button
                            key={topic}
                            onClick={() => {
                                onSelectTopic(topic);
                                onClose();
                            }}
                            className="flex flex-col items-center justify-center p-3 rounded-2xl transition-opacity active:opacity-70"
                            style={{
                                border: '1px dashed #D8D7D7',
                                backgroundColor: 'transparent'
                            }}
                        >
                            <div
                                className="w-[42px] h-[42px] rounded-lg mb-2"
                                style={{ backgroundColor: '#D8D7D7', opacity: 0.5 }}
                            />
                            <span className="text-[13px] font-medium" style={{ color: '#37332E' }}>
                                {topic}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Close Button Bottom Centered */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
                <button
                    onClick={onClose}
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg pointer-events-auto"
                    style={{ backgroundColor: '#262626', color: '#FFF6ED' }}
                >
                    <X size={24} />
                </button>
            </div>
        </div>
    );
}
