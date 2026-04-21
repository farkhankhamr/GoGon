import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import useUserStore from '../store/userStore';
import TnCSheet from '../components/TnCSheet';

const CITIES = ['Jakarta', 'Bandung', 'Surabaya', 'Jogja', 'Bali', 'Lainnya'];

const TYPING_TEXT = 'GoGon';
const TYPING_SPEED = 120;
const DELETING_SPEED = 80;
const PAUSE_AFTER_TYPE = 1800;
const PAUSE_AFTER_DELETE = 400;

function useTypingAnimation() {
    const [displayed, setDisplayed] = useState('');
    const [phase, setPhase] = useState('typing'); // typing | pausing | deleting | waiting
    const timeoutRef = useRef(null);

    useEffect(() => {
        const tick = () => {
            if (phase === 'typing') {
                setDisplayed(prev => {
                    const next = TYPING_TEXT.slice(0, prev.length + 1);
                    if (next === TYPING_TEXT) {
                        timeoutRef.current = setTimeout(() => setPhase('deleting'), PAUSE_AFTER_TYPE);
                    } else {
                        timeoutRef.current = setTimeout(tick, TYPING_SPEED);
                    }
                    return next;
                });
            } else if (phase === 'deleting') {
                setDisplayed(prev => {
                    const next = prev.slice(0, -1);
                    if (next === '') {
                        timeoutRef.current = setTimeout(() => setPhase('typing'), PAUSE_AFTER_DELETE);
                    } else {
                        timeoutRef.current = setTimeout(tick, DELETING_SPEED);
                    }
                    return next;
                });
            }
        };
        timeoutRef.current = setTimeout(tick, TYPING_SPEED);
        return () => clearTimeout(timeoutRef.current);
    }, [phase]);

    return displayed;
}
const OCCUPATIONS = ['Mahasiswa', 'Karyawan', 'Pimpinan', 'Freelance', 'Lainnya'];
const GENDERS = [{ id: 'M', label: 'Pria' }, { id: 'F', label: 'Wanita' }, { id: 'NB', label: 'Non-biner' }];

export default function Onboarding() {
    const typedTitle = useTypingAnimation();
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedOccupation, setSelectedOccupation] = useState('');
    const [selectedGender, setSelectedGender] = useState('');
    const [locationStatus, setLocationStatus] = useState('idle');
    const [showTnC, setShowTnC] = useState(false);

    const { initUser, setLocation } = useUserStore();
    const navigate = useNavigate();

    const handleLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('denied');
            return;
        }
        setLocationStatus('requesting');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation(pos.coords.latitude, pos.coords.longitude);
                setLocationStatus('granted');
            },
            (err) => {
                console.error(err);
                setLocationStatus('denied');
            }
        );
    };

    const handleStart = () => {
        if (!selectedCity) return;
        initUser({
            city: selectedCity,
            institution: null,
            gender: selectedGender || null,
            occupation: selectedOccupation || null
        });
        navigate('/feed');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6"
            style={{ backgroundColor: '#F5EFE8' }}>
            <div className="max-w-md w-full space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold mb-2" style={{ color: '#1E1E1E', fontFamily: 'DM Sans, sans-serif' }}>
                        {typedTitle}<span className="animate-pulse">|</span>
                    </h1>
                    <p className="text-sm" style={{ color: '#8C8476', fontFamily: 'DM Sans, sans-serif' }}>
                        Tempat ngomong jujur, tanpa nama.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white p-6 rounded-2xl space-y-5"
                    style={{ border: '1px solid #E0D5CA', boxShadow: '0 2px 12px rgba(42,36,29,0.06)' }}>

                    {/* Location */}
                    <button
                        type="button"
                        onClick={handleLocation}
                        className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition"
                        style={{
                            border: locationStatus === 'granted' ? '1.5px solid #4CAF50' : '1.5px dashed #C4B8AC',
                            color: locationStatus === 'granted' ? '#4CAF50' : locationStatus === 'denied' ? '#ef4444' : '#7c5a41',
                            fontFamily: 'DM Sans, sans-serif',
                            backgroundColor: locationStatus === 'granted' ? '#f0fdf4' : 'transparent',
                        }}
                    >
                        <MapPin size={16} />
                        <span className="text-sm">
                            {locationStatus === 'granted'
                                ? '✓ Lokasi Aktif'
                                : locationStatus === 'denied'
                                ? 'Izin Lokasi Ditolak'
                                : locationStatus === 'requesting'
                                ? 'Meminta izin...'
                                : 'Aktifkan Lokasi (Untuk filter jarak)'}
                        </span>
                    </button>

                    {/* City */}
                    <div>
                        <label className="block text-xs font-bold mb-2 uppercase tracking-widest"
                            style={{ color: '#8C8476', fontFamily: 'DM Sans, sans-serif' }}>
                            Pilih Kota Kamu
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {CITIES.map(city => (
                                <button
                                    key={city}
                                    onClick={() => setSelectedCity(city)}
                                    className="p-2.5 rounded-lg text-sm font-medium transition-all"
                                    style={{
                                        fontFamily: 'DM Sans, sans-serif',
                                        backgroundColor: selectedCity === city ? '#1E1E1E' : '#F5EFE8',
                                        color: selectedCity === city ? '#F5EFE8' : '#5A4E3D',
                                        border: selectedCity === city ? '1px solid #1E1E1E' : '1px solid #D4C8BC',
                                    }}
                                >
                                    {city}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Gender & Occupation */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold mb-2 uppercase tracking-widest"
                                style={{ color: '#8C8476', fontFamily: 'DM Sans, sans-serif' }}>
                                Gender
                            </label>
                            <select
                                className="w-full p-2.5 rounded-lg text-sm border"
                                style={{
                                    fontFamily: 'DM Sans, sans-serif',
                                    backgroundColor: '#F5EFE8',
                                    borderColor: '#D4C8BC',
                                    color: '#2A241D'
                                }}
                                value={selectedGender}
                                onChange={(e) => setSelectedGender(e.target.value)}
                            >
                                <option value="">Rahasia</option>
                                {GENDERS.map(g => (
                                    <option key={g.id} value={g.id}>{g.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-2 uppercase tracking-widest"
                                style={{ color: '#8C8476', fontFamily: 'DM Sans, sans-serif' }}>
                                Pekerjaan
                            </label>
                            <select
                                className="w-full p-2.5 rounded-lg text-sm border"
                                style={{
                                    fontFamily: 'DM Sans, sans-serif',
                                    backgroundColor: '#F5EFE8',
                                    borderColor: '#D4C8BC',
                                    color: '#2A241D'
                                }}
                                value={selectedOccupation}
                                onChange={(e) => setSelectedOccupation(e.target.value)}
                            >
                                <option value="">Pilih...</option>
                                {OCCUPATIONS.map(i => (
                                    <option key={i} value={i}>{i}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={handleStart}
                        disabled={!selectedCity}
                        className="w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-40"
                        style={{
                            fontFamily: 'DM Sans, sans-serif',
                            backgroundColor: '#1E1E1E',
                            color: '#F5EFE8',
                        }}
                    >
                        Mulai GoGon
                    </button>

                    <p className="text-center text-xs" style={{ color: '#8C8476', fontFamily: 'DM Sans, sans-serif' }}>
                        Dengan melanjutkan, kamu setuju dengan{' '}
                        <button
                            type="button"
                            onClick={() => setShowTnC(true)}
                            className="underline font-bold"
                            style={{ color: '#5A4E3D' }}
                        >
                            Syarat & Ketentuan
                        </button>
                    </p>
                </div>
            </div>

            <TnCSheet isOpen={showTnC} onClose={() => setShowTnC(false)} />
        </div>
    );
}
