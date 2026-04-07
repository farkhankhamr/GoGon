import React, { useState } from 'react';
import { Tag, MapPin, Bookmark, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import useFeedStore from '../store/feedStore';
import useUserStore from '../store/userStore';
import Avatar from './Avatar';

export default function DealCard({ intel }) {
    const { interactIntel, reportContent } = useFeedStore();
    const { anonId } = useUserStore();
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = async (e) => {
        e.stopPropagation();
        setIsSaved(!isSaved);
        await interactIntel(intel.intel_id, isSaved ? 'unsave' : 'save');
    };

    const handleDirection = async (e) => {
        e.stopPropagation();
        await interactIntel(intel.intel_id, 'direction_click');
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(intel.content + ' ' + intel.city)}`, '_blank');
    };

    const validUntil = intel.deal_meta.validity_preset === 'TODAY' ? 'Hari ini'
        : intel.deal_meta.validity_preset === 'TOMORROW' ? 'Besok'
            : intel.deal_meta.validity_preset === 'WEEKEND' ? 'Weekend'
                : '48 Jam';

    return (
        <div className="flex gap-3 px-4 py-3">
            {/* Avatar */}
            <Avatar anonId={intel.anon_id} gender={null} />

            {/* Card content */}
            <div className="flex-1 min-w-0">
                {/* Header / Meta */}
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="bg-[#E040FB]/10 text-[#E040FB] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                        <Tag size={10} /> Deal
                    </span>
                    <span className="text-[10px] text-[#8C8476]" style={{ fontFamily: 'Courier Prime, monospace' }}>
                        {intel.distance_bucket || 'Nearby'} • {formatDistanceToNow(new Date(intel.created_at), { addSuffix: true, locale: id })}
                    </span>
                    <span className="text-[10px] text-[#E040FB] font-bold ml-auto" style={{ fontFamily: 'Courier Prime, monospace' }}>
                        Berlaku: {validUntil}
                    </span>
                </div>

                {/* Dashed border card for content */}
                <div className="card-dashed px-4 py-3 mb-1.5">
                    <p className="text-sm font-bold leading-relaxed" style={{ color: '#2A241D', fontFamily: 'Courier Prime, monospace' }}>
                        {intel.content}
                    </p>
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2 px-1">
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition ${isSaved ? 'bg-[#1E1E1E] text-[#F5EFE8]' : 'bg-[#EDE5DC] text-[#8C8476] hover:bg-[#D4C8BC]'}`}
                        style={{ fontFamily: 'Courier Prime, monospace' }}
                    >
                        <Bookmark size={14} className={isSaved ? 'fill-current' : ''} />
                        {isSaved ? 'Disimpan' : 'Simpan'}
                        {intel.metrics.saves > 0 && <span className="ml-1 opacity-80">{intel.metrics.saves}</span>}
                    </button>

                    <button
                        onClick={handleDirection}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#EDE5DC] text-[#5A4E3D] hover:bg-[#D4C8BC] transition"
                        style={{ fontFamily: 'Courier Prime, monospace' }}
                    >
                        <MapPin size={14} />
                        Arah
                    </button>

                    <div className="flex-1" />

                    {/* Report */}
                    <button
                        className="text-[#D4C8BC] hover:text-red-400 transition"
                        onClick={(e) => {
                            e.stopPropagation();
                            const reason = prompt("Lapor intel ini? (spam/hoax)");
                            if (reason) reportContent(intel.intel_id, 'INTEL', reason, anonId);
                        }}
                    >
                        <Flag size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
