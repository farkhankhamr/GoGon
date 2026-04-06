import React from 'react';

export default function WelcomeModal({ onConfirm }) {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-center"
            style={{ backgroundColor: '#F5EFE8' }}>
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">

                <p className="text-sm tracking-wide mb-4 opacity-70"
                    style={{ color: '#5A4E3D', fontFamily: 'Courier Prime, monospace' }}>
                    ada apa ya?
                </p>

                <h1 className="mb-16 tracking-tight leading-none"
                    style={{ fontFamily: 'Courier Prime, monospace', color: '#1E1E1E' }}>
                    <span style={{ fontSize: '3.5rem', fontWeight: 700 }}>GoGon</span>
                    <span style={{ fontSize: '2.5rem', fontWeight: 400 }}>-in aja</span>
                </h1>

                <button
                    onClick={onConfirm}
                    className="w-full max-w-[280px] py-4 rounded-2xl font-bold text-lg tracking-wide transition-all duration-200 active:scale-95 shadow-lg"
                    style={{
                        backgroundColor: '#1E1E1E',
                        color: '#F5EFE8',
                        fontFamily: 'Courier Prime, monospace',
                    }}
                >
                    Mulai GoGon
                </button>

                <p className="mt-8 text-[10px] max-w-[240px] leading-tight"
                    style={{ color: '#8C8476', fontFamily: 'Courier Prime, monospace' }}>
                    Dengan tap tombol diatas, kamu menerima{' '}
                    <span className="underline cursor-pointer">syarat &amp; ketentuan</span>{' '}
                    berlaku
                </p>
            </div>
        </div>
    );
}
