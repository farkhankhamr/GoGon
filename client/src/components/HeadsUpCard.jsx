import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, RefreshCcw, Flag } from 'lucide-react';
import { formatDistanceToNow, formatDistance } from 'date-fns';
import { id } from 'date-fns/locale';
import useFeedStore from '../store/feedStore';
import useUserStore from '../store/userStore';
import Avatar from './Avatar';

export default function HeadsUpCard({ intel }) {
    const { interactIntel, reportContent } = useFeedStore();
    const { anonId } = useUserStore();
    const [isAcked, setIsAcked] = useState(false);

    const handleAck = async (e) => {
        e.stopPropagation();
        if (isAcked) return;
        setIsAcked(true);
        await interactIntel(intel.intel_id, 'ack');
    };

    const handleUpdate = async (e) => {
        e.stopPropagation();
        alert("Terima kasih updatenya!");
        await interactIntel(intel.intel_id, 'update_click');
    };

    // Calculate time left (expires_at is relative to creation + preset duration)
    const timeLeft = formatDistance(new Date(intel.expires_at), new Date(), { locale: id });

    return (
        <div className="flex gap-3 px-4 py-3">
            {/* Avatar */}
            <Avatar anonId={intel.anon_id} gender={null} />

            {/* Card content */}
            <div className="flex-1 min-w-0">
                {/* Header / Meta */}
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="bg-[#FFC107]/10 text-[#FFC107] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                        <AlertTriangle size={10} /> Heads-up
                    </span>
                    <span className="text-[10px] text-[#8C8476]" style={{ fontFamily: 'Courier Prime, monospace' }}>
                        {intel.distance_bucket || 'Nearby'} • {formatDistanceToNow(new Date(intel.created_at), { addSuffix: true, locale: id })}
                    </span>
                    <span className="text-[10px] text-[#FFC107] font-bold ml-auto" style={{ fontFamily: 'Courier Prime, monospace' }}>
                        Hilang {timeLeft} lagi
                    </span>
                </div>

                {/* Dashed border card for content */}
                <div className="card-dashed px-4 py-3 mb-1.5 border-amber-400">
                    <p className="text-sm font-bold leading-relaxed" style={{ color: '#2A241D', fontFamily: 'Courier Prime, monospace' }}>
                        {intel.content}
                    </p>
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2 px-1">
                    <button
                        onClick={handleAck}
                        disabled={isAcked}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition ${isAcked ? 'bg-[#FFC107]/20 text-[#FFC107]' : 'bg-[#EDE5DC] text-[#8C8476] hover:bg-[#D4C8BC]'}`}
                        style={{ fontFamily: 'Courier Prime, monospace' }}
                    >
                        <CheckCircle size={14} />
                        {isAcked ? 'Oke!' : 'Oke'}
                        {intel.metrics.ack > 0 && <span className="ml-1 opacity-80">{intel.metrics.ack}</span>}
                    </button>

                    <button
                        onClick={handleUpdate}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#EDE5DC] text-[#5A4E3D] hover:bg-[#D4C8BC] transition"
                        style={{ fontFamily: 'Courier Prime, monospace' }}
                    >
                        <RefreshCcw size={14} />
                        Masih Ada?
                        {intel.metrics.updates > 0 && <span className="ml-1 opacity-80">{intel.metrics.updates}</span>}
                    </button>

                    <div className="flex-1" />

                    {/* Report */}
                    <button
                        className="text-[#D4C8BC] hover:text-red-400 transition"
                        onClick={(e) => {
                            e.stopPropagation();
                            const reason = prompt("Lapor info ini? (spam/hoax)");
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
