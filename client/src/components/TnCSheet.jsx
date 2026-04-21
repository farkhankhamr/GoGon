import React from 'react';
import { X } from 'lucide-react';

export default function TnCSheet({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
            <div className="absolute inset-0" onClick={onClose} />
            <div
                className="relative bg-white rounded-t-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-slide-up"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0D5CA] shrink-0">
                    <h2 className="font-bold text-base text-[#1E1E1E]">Syarat & Ketentuan</h2>
                    <button onClick={onClose} className="text-[#8C8476]">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto px-5 py-4 space-y-4 text-sm text-[#2A241D] leading-relaxed">
                    <p className="text-xs text-[#8C8476]">Terakhir diperbarui: April 2026</p>

                    <section>
                        <h3 className="font-bold text-[#1E1E1E] mb-1">1. Tentang GoGon</h3>
                        <p>GoGon adalah platform komunitas anonim hyperlokal untuk berbagi pikiran, informasi, dan situasi sekitarmu. Kamu tidak perlu mendaftar — identitasmu dijaga lewat ID anonim sementara.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-[#1E1E1E] mb-1">2. Anonimitas & Privasi</h3>
                        <p>GoGon tidak meminta nama, email, atau nomor telepon. ID anonimmu di-generate secara lokal di perangkatmu dan otomatis diperbarui secara berkala. Kami tidak menyimpan informasi yang dapat mengidentifikasimu secara langsung.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-[#1E1E1E] mb-1">3. Konten yang Diperbolehkan</h3>
                        <p>Kamu boleh berbagi curhat, info lokal, deals, atau situasi sekitar. Konten harus jujur, relevan, dan tidak merugikan orang lain.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-[#1E1E1E] mb-1">4. Konten yang Dilarang</h3>
                        <ul className="list-disc list-inside space-y-1 text-[#5A4E3D]">
                            <li>Ujaran kebencian, diskriminasi, atau ancaman</li>
                            <li>Konten seksual eksplisit atau pornografi</li>
                            <li>Informasi palsu atau hoax yang merugikan</li>
                            <li>Spam, iklan tidak sah, atau promosi berlebihan</li>
                            <li>Nomor telepon, link, atau data pribadi orang lain</li>
                            <li>Konten yang melanggar hukum Indonesia</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-[#1E1E1E] mb-1">5. Moderasi Konten</h3>
                        <p>Kami berhak menghapus konten yang melanggar ketentuan ini tanpa pemberitahuan. Pengguna yang melanggar berulang dapat diblokir berdasarkan ID anonim.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-[#1E1E1E] mb-1">6. Tanggung Jawab Pengguna</h3>
                        <p>Kamu bertanggung jawab atas konten yang kamu posting. GoGon tidak bertanggung jawab atas keputusan yang diambil berdasarkan informasi di platform ini.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-[#1E1E1E] mb-1">7. Perubahan Ketentuan</h3>
                        <p>Kami dapat memperbarui syarat & ketentuan ini sewaktu-waktu. Penggunaan terus-menerus berarti kamu menyetujui perubahan tersebut.</p>
                    </section>

                    <p className="text-xs text-[#8C8476] pt-2">Dengan menggunakan GoGon, kamu menyetujui semua ketentuan di atas. Kalau ada pertanyaan, hubungi kami di gogon.space.</p>
                </div>
            </div>
        </div>
    );
}
