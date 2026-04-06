import React from 'react';

export default function AdCard({ ad }) {
    const handleClick = () => {
        // Track ad click (analytics event)
        console.log('Ad clicked:', ad.id);
        if (ad.url) {
            window.open(ad.url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="bg-[#EDE5DC]/30 p-4 border-b border-[#E0D5CA]" style={{ fontFamily: 'Courier Prime, monospace' }}>
            {/* Disponsori Label */}
            <span className="text-[10px] font-bold text-[#8C8476] block mb-2 uppercase tracking-widest">
                Disponsori
            </span>

            {/* Ad Content */}
            <div className="flex gap-4">
                <div className="flex-1 min-w-0">
                    {/* Headline - 1 line max */}
                    <h3 className="text-sm font-bold text-[#1E1E1E] line-clamp-1 mb-1">
                        {ad.title}
                    </h3>

                    {/* Body - 2 lines max */}
                    <p className="text-xs text-[#5A4E3D] line-clamp-2 mb-3 leading-relaxed">
                        {ad.description}
                    </p>

                    {/* Gogon-styled Button */}
                    <button
                        onClick={handleClick}
                        className="px-4 py-1.5 bg-[#1E1E1E] text-[#F5EFE8] text-[10px] font-bold rounded-lg hover:opacity-90 transition-all active:scale-95"
                    >
                        {ad.cta || 'Pelajari'} →
                    </button>
                </div>

                {/* Optional Image Placeholder for Gogon Aesthetic */}
                <div className="w-16 h-16 rounded-xl bg-white border-2 border-[#D4C8BC] flex items-center justify-center flex-shrink-0 text-2xl opacity-50">
                    💡
                </div>
            </div>
        </div>
    );
}
