import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import useUserStore from '../store/userStore';

const CITIES = ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Bali', 'Medan'];
const OCCUPATIONS = ['Mahasiswa', 'Karyawan', 'Pimpinan', 'Freelance', 'Lainnya'];
const GENDERS = [{ id: 'M', label: 'Pria' }, { id: 'F', label: 'Wanita' }, { id: 'NB', label: 'Non-biner' }];

export default function Onboarding() {
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedOccupation, setSelectedOccupation] = useState('');
    const [selectedGender, setSelectedGender] = useState('');

    const { initUser, setLocation } = useUserStore();
    const navigate = useNavigate();

    const handleLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation(pos.coords.latitude, pos.coords.longitude),
                (err) => console.error(err)
            );
        }
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
                    <h1 className="text-5xl font-bold mb-2" style={{ color: '#1E1E1E', fontFamily: 'Courier Prime, monospace' }}>
                        GoGon
                    </h1>
                    <p className="text-sm" style={{ color: '#8C8476', fontFamily: 'Courier Prime, monospace' }}>
                        Tempat ngomong jujur, tanpa nama.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white p-6 rounded-2xl space-y-5"
                    style={{ border: '1px solid #E0D5CA', boxShadow: '0 2px 12px rgba(42,36,29,0.06)' }}>

                    {/* Location */}
                    <button
                        onClick={handleLocation}
                        className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition"
                        style={{ border: '1.5px dashed #C4B8AC', color: '#7c5a41', fontFamily: 'Courier Prime, monospace' }}
                    >
                        <MapPin size={16} />
                        <span className="text-sm">Aktifkan Lokasi (Untuk filter jarak)</span>
                    </button>

                    {/* City */}
                    <div>
                        <label className="block text-xs font-bold mb-2 uppercase tracking-widest"
                            style={{ color: '#8C8476', fontFamily: 'Courier Prime, monospace' }}>
                            Pilih Kota Kamu
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {CITIES.map(city => (
                                <button
                                    key={city}
                                    onClick={() => setSelectedCity(city)}
                                    className="p-2.5 rounded-lg text-sm font-medium transition-all"
                                    style={{
                                        fontFamily: 'Courier Prime, monospace',
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
                                style={{ color: '#8C8476', fontFamily: 'Courier Prime, monospace' }}>
                                Gender
                            </label>
                            <select
                                className="w-full p-2.5 rounded-lg text-sm border"
                                style={{
                                    fontFamily: 'Courier Prime, monospace',
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
                                style={{ color: '#8C8476', fontFamily: 'Courier Prime, monospace' }}>
                                Pekerjaan
                            </label>
                            <select
                                className="w-full p-2.5 rounded-lg text-sm border"
                                style={{
                                    fontFamily: 'Courier Prime, monospace',
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
                            fontFamily: 'Courier Prime, monospace',
                            backgroundColor: '#1E1E1E',
                            color: '#F5EFE8',
                        }}
                    >
                        Mulai GoGon
                    </button>
                </div>
            </div>
        </div>
    );
}
