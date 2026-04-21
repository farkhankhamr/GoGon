import React, { useState, useCallback } from 'react';
import { X, Tag, AlertTriangle, Clock } from 'lucide-react';
import useFeedStore from '../store/feedStore';
import useUserStore from '../store/userStore';
import Avatar from './Avatar';

export default function IntelComposer({ onClose }) {
    const { addIntel } = useFeedStore();
    const { anonId, city, location, gender } = useUserStore();
    const [step, setStep] = useState('select'); // select, deal, headsup, headsup-form
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Deal State
    const [dealContent, setDealContent] = useState('');
    const [validity, setValidity] = useState('TODAY');
    const [placeHint, setPlaceHint] = useState(null);
    const [seenDirectly, setSeenDirectly] = useState(true);

    // Heads-up State
    const [headsUpType, setHeadsUpType] = useState(null);
    const [headsUpContent, setHeadsUpContent] = useState('');

    const handleBack = useCallback(() => {
        if (step === 'headsup-form') setStep('headsup');
        else if (step !== 'select') setStep('select');
        else onClose();
    }, [step, onClose]);

    const handleSubmitDeal = async () => {
        if (!dealContent.trim()) return;
        setIsSubmitting(true);
        setSubmitError('');
        try {
            await addIntel({
                type: 'DEAL',
                content: dealContent,
                city,
                anon_id: anonId,
                lat: location?.lat,
                long: location?.long,
                deal_meta: {
                    validity_preset: validity,
                    place_hint: placeHint,
                    seen_directly: seenDirectly
                }
            });
            onClose();
        } catch (err) {
            console.error(err);
            setSubmitError(err.message || 'Gagal mengirim. Coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectHeadsUpType = useCallback((type) => {
        setHeadsUpType(type);
        setStep('headsup-form');
        const templates = {
            'RAME': 'Di sekitar sini lagi rame.',
            'ANTRI': 'Di sekitar sini lagi antri panjang.',
            'TUTUP': 'Tempat di sekitar sini lagi tutup / tidak beroperasi.',
            'PARKIR_SUSAH': 'Parkir di sekitar sini lagi susah.',
            'BISING': 'Di sekitar sini lagi berisik (event/keramaian).'
        };
        setHeadsUpContent(templates[type] || '');
    }, []);

    const handleSubmitHeadsUp = async () => {
        if (!headsUpType) return;
        setIsSubmitting(true);
        setSubmitError('');
        try {
            await addIntel({
                type: 'HEADSUP',
                content: headsUpContent,
                city,
                anon_id: anonId,
                lat: location?.lat,
                long: location?.long,
                headsup_meta: {
                    heads_up_type: headsUpType
                }
            });
            onClose();
        } catch (err) {
            console.error(err);
            setSubmitError(err.message || 'Gagal mengirim. Coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
            {/* Backdrop click also calls onClose */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative bg-[#F5EFE8] rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-slide-up"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center mb-6">
                    <button onClick={handleBack} className="text-xs font-bold text-[#8C8476] w-20 text-left shrink-0">
                        {step !== 'select' ? '← Kembali' : ''}
                    </button>
                    <div className="flex-1 text-center">
                        {step === 'select' && (
                            <span className="font-bold text-base text-[#1E1E1E]">Bagikan Info Sekitar</span>
                        )}
                        {step === 'deal' && (
                            <span className="flex items-center justify-center gap-2 font-bold text-base text-[#E040FB]">
                                <Tag size={16} /> Bagikan Deal
                            </span>
                        )}
                        {step === 'headsup' && (
                            <span className="flex items-center justify-center gap-2 font-bold text-base text-[#FFC107]">
                                <AlertTriangle size={16} /> Pilih Situasi
                            </span>
                        )}
                        {step === 'headsup-form' && (
                            <span className="flex items-center justify-center gap-2 font-bold text-base text-[#FFC107]">
                                <AlertTriangle size={16} /> Detail Situasi
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="text-[#8C8476] w-20 flex justify-end shrink-0">
                        <X size={24} />
                    </button>
                </div>

                {/* Selection Step */}
                {step === 'select' && (
                    <div className="space-y-4">
                        <button
                            onClick={() => setStep('deal')}
                            className="w-full p-4 bg-white border border-[#D4C8BC] rounded-xl flex items-center gap-4 hover:bg-[#EDE5DC] transition"
                        >
                            <div className="bg-[#E040FB]/10 p-3 rounded-full text-[#E040FB]">
                                <Tag size={24} />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-[#1E1E1E]">Bagikan Deal</div>
                                <div className="text-xs text-[#8C8476]">Promo, diskon, atau harga miring.</div>
                            </div>
                        </button>
                        <button
                            onClick={() => setStep('headsup')}
                            className="w-full p-4 bg-white border border-[#D4C8BC] rounded-xl flex items-center gap-4 hover:bg-[#EDE5DC] transition"
                        >
                            <div className="bg-[#FFC107]/10 p-3 rounded-full text-[#FFC107]">
                                <AlertTriangle size={24} />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-[#1E1E1E]">Bagikan Heads-up</div>
                                <div className="text-xs text-[#8C8476]">Rame, macet, tutup, atau situasi sikon.</div>
                            </div>
                        </button>
                    </div>
                )}

                {/* Deal Form */}
                {step === 'deal' && (
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <Avatar anonId={anonId} gender={gender} />
                            <div className="flex-1">
                                <textarea
                                    value={dealContent}
                                    onChange={(e) => setDealContent(e.target.value)}
                                    maxLength={160}
                                    placeholder="Contoh: Diskon 30% kopi jam 2–5 sore di sekitar sini."
                                    className="w-full bg-white border-2 border-[#D4C8BC] rounded-xl p-3 text-sm focus:border-[#1E1E1E] outline-none resize-none min-h-[100px]"
                                />
                                <div className="text-[10px] font-bold text-[#8C8476] text-right mt-1">{dealContent.length}/160</div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-[#8C8476] mb-2 block uppercase tracking-wider">Berlaku Sampai</label>
                            <div className="flex flex-wrap gap-2">
                                {['TODAY', 'TOMORROW', 'WEEKEND', '48H'].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setValidity(v)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition ${validity === v ? 'bg-[#1E1E1E] text-[#F5EFE8] border-[#1E1E1E]' : 'bg-white text-[#8C8476] border-[#D4C8BC]'}`}
                                    >
                                        {v === 'TODAY' ? 'Hari ini' : v === 'TOMORROW' ? 'Besok' : v === 'WEEKEND' ? 'Weekend' : '48 Jam'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-[#8C8476] mb-2 block uppercase tracking-wider">Tipe Tempat</label>
                            <div className="flex flex-wrap gap-2">
                                {['MALL', 'CAFE', 'RESTO', 'MINIMARKET', 'CAMPUS'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPlaceHint(p === placeHint ? null : p)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-bold border-2 transition ${placeHint === p ? 'bg-[#E040FB]/10 text-[#E040FB] border-[#E040FB]/40' : 'bg-white text-[#8C8476] border-[#D4C8BC]'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="seen"
                                checked={seenDirectly}
                                onChange={(e) => setSeenDirectly(e.target.checked)}
                                className="w-4 h-4 rounded border-[#D4C8BC] text-[#1E1E1E] focus:ring-[#1E1E1E]"
                            />
                            <label htmlFor="seen" className="text-xs font-bold text-[#5A4E3D]">Aku lihat langsung</label>
                        </div>

                        {submitError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg px-3 py-2">
                                {submitError}
                            </div>
                        )}
                        <button
                            onClick={handleSubmitDeal}
                            disabled={!dealContent.trim() || isSubmitting}
                            className="w-full py-3 bg-[#1E1E1E] text-[#F5EFE8] rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition"
                        >
                            {isSubmitting ? '...' : 'Kirim Deal'}
                        </button>
                    </div>
                )}

                {/* Heads-up Selection */}
                {step === 'headsup' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'RAME', label: 'Rame Banget', icon: '👥' },
                                { id: 'ANTRI', label: 'Antri Panjang', icon: '🚶' },
                                { id: 'TUTUP', label: 'Tutup / Off', icon: '⛔' },
                                { id: 'PARKIR_SUSAH', label: 'Parkir Susah', icon: '🚗' },
                                { id: 'BISING', label: 'Berisik / Event', icon: '🔊' },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelectHeadsUpType(item.id)}
                                    className="p-4 bg-white border-2 border-[#D4C8BC] rounded-xl text-left hover:border-[#1E1E1E] transition group"
                                >
                                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{item.icon}</div>
                                    <div className="font-bold text-[#1E1E1E] text-sm">{item.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Heads-up Form */}
                {step === 'headsup-form' && (
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <Avatar anonId={anonId} gender={gender} />
                            <div className="flex-1">
                                <textarea
                                    value={headsUpContent}
                                    onChange={(e) => setHeadsUpContent(e.target.value)}
                                    maxLength={120}
                                    className="w-full bg-white border-2 border-[#D4C8BC] rounded-xl p-3 text-sm focus:border-[#1E1E1E] outline-none resize-none min-h-[100px]"
                                    style={{ color: '#2A241D' }}
                                />
                                <div className="text-[10px] font-bold text-[#8C8476] text-right mt-1">{headsUpContent.length}/120</div>
                            </div>
                        </div>

                        <div className="bg-[#FFC107]/10 p-3 rounded-lg flex items-center gap-2 text-[10px] font-bold text-[#FFC107]">
                            <Clock size={14} />
                            <span>Info ini hilang otomatis dalam 8 jam.</span>
                        </div>
                        {submitError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg px-3 py-2">
                                {submitError}
                            </div>
                        )}
                        <button
                            onClick={handleSubmitHeadsUp}
                            disabled={!headsUpContent.trim() || isSubmitting}
                            className="w-full py-3 bg-[#1E1E1E] text-[#F5EFE8] rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition"
                        >
                            {isSubmitting ? '...' : 'Kirim Info'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
