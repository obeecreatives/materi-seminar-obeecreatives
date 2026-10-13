import React, { useState } from 'react';
import {
  BookOpen,
  Printer,
  X,
  Search,
  Layers,
  Sparkles,
  Server,
  Smartphone,
  Copy,
  CheckCircle,
  HelpCircle,
  Cpu,
  Monitor,
  ShieldCheck,
  Download,
  Share2,
  ExternalLink,
  ChevronRight,
  Code2,
  Sliders,
  Tv,
} from 'lucide-react';
import { BrandThemeConfig } from '../types';
import { printSystemDocumentationGuide } from '../utils/handoutExport';

interface SystemGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  seminarTitle: string;
  organizerName: string;
  brandTheme?: BrandThemeConfig;
}

export const SystemGuideModal: React.FC<SystemGuideModalProps> = ({
  isOpen,
  onClose,
  seminarTitle,
  organizerName,
  brandTheme,
}) => {
  const [activeChapter, setActiveChapter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handlePrintPdf = () => {
    setIsPrinting(true);
    printSystemDocumentationGuide({
      seminarTitle,
      organizerName,
      brandTheme,
    });
    setTimeout(() => setIsPrinting(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?role=editor`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase().trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#FFF7EC] text-[#1F3A5F] rounded-2xl shadow-2xl border border-[#1F3A5F]/20 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in duration-200">
        
        {/* Top Header Bar */}
        <div className="bg-[#1F3A5F] text-white px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F28C28] flex items-center justify-center text-white shrink-0 shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded text-[#F28C28]">
                  Dokumentasi & Manual Resmi
                </span>
                <span className="text-[10px] text-white/60 font-mono hidden sm:inline">v2.4 Enterprise</span>
              </div>
              <h2 className="text-base sm:text-xl font-bold tracking-tight text-white">
                Buku Panduan Teknis & Penggunaan PartnerUp Live
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handlePrintPdf}
              disabled={isPrinting}
              className="px-3.5 py-2 rounded-xl bg-[#F28C28] hover:bg-[#d97719] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              title="Simpan dokumen panduan lengkap sebagai file PDF resmi"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Membuka PDF...' : 'Cetak / Unduh PDF (A4)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Tutup panduan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border-b border-[#1F3A5F]/10 px-4 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0">
          {/* Chapter Quick Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold">
            <button
              onClick={() => setActiveChapter('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                activeChapter === 'all'
                  ? 'bg-[#1F3A5F] text-white font-bold'
                  : 'bg-slate-100 text-[#1F3A5F]/75 hover:bg-slate-200'
              }`}
            >
              Semua Bab
            </button>
            <button
              onClick={() => setActiveChapter('1')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                activeChapter === '1'
                  ? 'bg-[#1F3A5F] text-white font-bold'
                  : 'bg-slate-100 text-[#1F3A5F]/75 hover:bg-slate-200'
              }`}
            >
              Bab 1: Latar Belakang
            </button>
            <button
              onClick={() => setActiveChapter('2')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                activeChapter === '2'
                  ? 'bg-[#1F3A5F] text-white font-bold'
                  : 'bg-slate-100 text-[#1F3A5F]/75 hover:bg-slate-200'
              }`}
            >
              Bab 2: Struktur & Engine
            </button>
            <button
              onClick={() => setActiveChapter('3')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                activeChapter === '3'
                  ? 'bg-[#1F3A5F] text-white font-bold'
                  : 'bg-slate-100 text-[#1F3A5F]/75 hover:bg-slate-200'
              }`}
            >
              Bab 3: Istilah Teknis
            </button>
            <button
              onClick={() => setActiveChapter('4')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                activeChapter === '4'
                  ? 'bg-[#1F3A5F] text-white font-bold'
                  : 'bg-slate-100 text-[#1F3A5F]/75 hover:bg-slate-200'
              }`}
            >
              Bab 4: Cara Pakai
            </button>
            <button
              onClick={() => setActiveChapter('5')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                activeChapter === '5'
                  ? 'bg-[#F28C28] text-white font-bold shadow-xs'
                  : 'bg-amber-100/70 text-amber-900 hover:bg-amber-100'
              }`}
            >
              Bab 5: Duplikasi App
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px] max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari topik atau istilah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#1F3A5F] focus:outline-none focus:ring-1 focus:ring-[#1F3A5F]"
            />
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-8 text-sm leading-relaxed">

          {/* Quick Notice Banner */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#F28C28] shrink-0" />
              <span>
                Panduan ini dirancang untuk pemateri, fasilitator workshop, panitia proyektor, hingga pengembang perangkat lunak. Seluruh isi dapat Anda cetak atau simpan sebagai dokumen PDF resmi format A4.
              </span>
            </div>
            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-3 py-1.5 bg-[#F28C28] text-white rounded-lg font-bold shrink-0 hover:bg-[#d97719] transition-colors cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF Sekarang</span>
            </button>
          </div>

          {/* BAB 1: Latar Belakang & Alasan Pengembangan */}
          {(activeChapter === 'all' || activeChapter === '1') && matchesSearch('latar belakang alasan pengembangan pasif active recall retensi') && (
            <section className="bg-white rounded-2xl border border-[#1F3A5F]/15 p-5 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#1F3A5F]/15">
                <span className="w-7 h-7 rounded-lg bg-[#1F3A5F] text-white font-extrabold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#1F3A5F]">
                  Latar Belakang & Alasan Pengembangan
                </h3>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-[#1F3A5F]/85">
                <p>
                  Seminar dan pelatihan bisnis UMKM sering kali terjebak dalam masalah <em>Passive Audience Trap</em>: pemateri berbicara satu arah di panggung menggunakan slide PowerPoint statis, sementara peserta di ruangan hanya mendengarkan secara pasif. Akibatnya, retensi pemahaman materi turun drastis di bawah 10% setelah 24 jam.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                  <div className="bg-[#FFF7EC] border border-[#F28C28]/30 rounded-xl p-3.5 space-y-1">
                    <div className="font-bold text-[#1F3A5F] text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#F28C28]"></span>
                      Masalah Kertas Tercecer
                    </div>
                    <p className="text-xs text-[#1F3A5F]/75">
                      Lembar kerja fisik sulit direkap pemateri saat seminar berlangsung, tulisan tangan tidak terbaca, dan hasil latihan peserta sering hilang atau tidak pernah dipraktikkan.
                    </p>
                  </div>

                  <div className="bg-[#FFF7EC] border border-[#F28C28]/30 rounded-xl p-3.5 space-y-1">
                    <div className="font-bold text-[#1F3A5F] text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#F28C28]"></span>
                      Presenter Buta Respon
                    </div>
                    <p className="text-xs text-[#1F3A5F]/75">
                      Pemateri di panggung tidak memiliki indikator waktu-nyata apakah peserta paham atau bingung. Sesi tanya jawab sering didominasi 1 orang sementara yang lain sungkan.
                    </p>
                  </div>

                  <div className="bg-[#FFF7EC] border border-[#F28C28]/30 rounded-xl p-3.5 space-y-1">
                    <div className="font-bold text-[#1F3A5F] text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#F28C28]"></span>
                      Friksi Download Aplikasi
                    </div>
                    <p className="text-xs text-[#1F3A5F]/75">
                      Aplikasi interaktif umum mengharuskan peserta mengunduh puluhan MB di PlayStore, registrasi email/OTP, atau memasukkan PIN ruangan yang menghabiskan 15 menit awal acara.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2 text-xs text-blue-950 mt-2">
                  <span className="font-bold uppercase tracking-wider text-[#1F3A5F] block">
                    Solusi Terpadu: Ekosistem 4-Titik PartnerUp Live
                  </span>
                  <p>
                    Aplikasi ini mengintegrasikan 4 peran secara sinkron dalam satu basis data awan real-time:
                    <strong> Layar Proyektor Panggung</strong>, <strong>Remote HP Pemateri</strong>, <strong>Smartphone Peserta</strong>, dan <strong>Meja Moderasi Co-Host</strong> — tanpa perlu instalasi aplikasi apapun (*Zero-Install Web App*).
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* BAB 2: Struktur Web Apps & Arsitektur Sistem */}
          {(activeChapter === 'all' || activeChapter === '2') && matchesSearch('struktur arsitektur database firestore react tailwind view role') && (
            <section className="bg-white rounded-2xl border border-[#1F3A5F]/15 p-5 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#1F3A5F]/15">
                <span className="w-7 h-7 rounded-lg bg-[#1F3A5F] text-white font-extrabold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#1F3A5F]">
                  Struktur Web Apps & Arsitektur Sistem
                </h3>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-[#1F3A5F]/85">
                <p>
                  PartnerUp Live dibangun di atas fondasi teknologi web modern dengan sinkronisasi reaktif multi-klien berbasis WebSockets Firestore:
                </p>

                {/* Architecture Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#1F3A5F] text-white">
                        <th className="p-2.5 font-bold">Lapisan (Layer)</th>
                        <th className="p-2.5 font-bold">Teknologi</th>
                        <th className="p-2.5 font-bold">Peran & Fungsi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-bold text-[#1F3A5F]">Frontend SPA</td>
                        <td className="p-2.5 font-mono text-slate-600">React 19 + TypeScript + Vite</td>
                        <td className="p-2.5">Rendering antarmuka interaktif responsif, manajemen status hook terisolasi, strict type safety.</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-2.5 font-bold text-[#1F3A5F]">Styling & Tema</td>
                        <td className="p-2.5 font-mono text-slate-600">Tailwind CSS v4</td>
                        <td className="p-2.5">CSS kustom dinamis untuk brand organisasi (Primary, Accent, Secondary, Background) & responsivitas layar.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-[#1F3A5F]">Cloud Database</td>
                        <td className="p-2.5 font-mono text-slate-600">Google Cloud Firestore</td>
                        <td className="p-2.5">Penyimpanan dokumen awan reaktif dengan listener <code>onSnapshot</code> latensi rendah (&lt;100ms).</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-2.5 font-bold text-[#1F3A5F]">Keamanan Rules</td>
                        <td className="p-2.5 font-mono text-slate-600">firestore.rules</td>
                        <td className="p-2.5">Validasi granular tipe dokumen, pencegahan injeksi teks, kontrol akses kiriman peserta vs moderator.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-[#1F3A5F]">Ekspor & Cetak PDF</td>
                        <td className="p-2.5 font-mono text-slate-600">Isolated Iframe Print Engine</td>
                        <td className="p-2.5">Mencetak Slide A4 Landscape, Buku Saku A4 Portrait, & Panduan Sistem tanpa memengaruhi DOM layar.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="font-bold text-[#1F3A5F] text-xs uppercase tracking-wider pt-2">
                  Daftar 6 View Utama & Tanggung Jawabnya:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="font-bold text-xs text-[#1F3A5F]">1. Layar Proyektor (<code>projector</code>)</div>
                    <p className="text-xs text-slate-600 mt-1">Kanban board panggung lebar untuk menampilkan kurasi jawaban peserta, grafik polling live, dan sorotan tanya jawab.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="font-bold text-xs text-[#1F3A5F]">2. Materi Slide (<code>slides</code>)</div>
                    <p className="text-xs text-slate-600 mt-1">Presentasi visual 16:9 berukuran dinamis, footer terkunci, laci overlay panggung (Jawaban, Polling, Q&A, QR), dan tombol cetak PDF.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="font-bold text-xs text-[#1F3A5F]">3. Remote HP (<code>remote</code>)</div>
                    <p className="text-xs text-slate-600 mt-1">Kendali di smartphone pemateri: clicker slide, countdown timer, contekan analogi panggung (cue cards), dan saklar bagi slide.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="font-bold text-xs text-[#1F3A5F]">4. HP Peserta (<code>participant</code>)</div>
                    <p className="text-xs text-slate-600 mt-1">Workspace interaktif peserta via QR code: Lembar kerja 6 tahap, polling live, Q&A, Bio IG, Slide Reader, dan unduh PDF.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="font-bold text-xs text-[#1F3A5F]">5. Ruang Moderasi (<code>moderation</code>)</div>
                    <p className="text-xs text-slate-600 mt-1">Meja kerja co-host untuk menyaring jawaban masuk, menandai bintang (star) agar otomatis tayang di layar proyektor.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="font-bold text-xs text-[#1F3A5F]">6. Editor Materi (<code>editor</code>)</div>
                    <p className="text-xs text-slate-600 mt-1">Studio kustomisasi no-code untuk mengubah judul seminar, soal lembar kerja, susunan slide, polling, dan tema warna organisasi.</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* BAB 3: Glosarium Istilah Teknis UI & Engine */}
          {(activeChapter === 'all' || activeChapter === '3') && matchesSearch('istilah teknis kanban sizing sticky footer cue cards onsnapshot state machine brand theme') && (
            <section className="bg-white rounded-2xl border border-[#1F3A5F]/15 p-5 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#1F3A5F]/15">
                <span className="w-7 h-7 rounded-lg bg-[#1F3A5F] text-white font-extrabold text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#1F3A5F]">
                  Glosarium Istilah Teknis (UI & Engine)
                </h3>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-[#1F3A5F]/85">
                {/* UI Terms */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#F28C28] mb-2 flex items-center gap-1.5">
                    <Monitor className="w-4 h-4" />
                    <span>A. Istilah Teknis Pada Antarmuka (UI / UX)</span>
                  </h4>
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-[#1F3A5F] text-xs">Dynamic Kanban Card Sizing</div>
                      <p className="text-xs text-slate-600 mt-1">
                        Algoritma adaptif yang menghitung jumlah kartu kanban pada slide: 1 kartu dibuat menjadi <em>Hero Banner</em> besar; 2 kartu dibuat 2 kolom besar; 3-4 kartu dibuat proporsional; dan 5-6 kartu dibuat grid kompak. Menjamin teks tetap terbaca jelas baik oleh peserta usia muda maupun lanjut usia tanpa huruf mengecil drastis.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-[#1F3A5F] text-xs">Sticky / Locked Viewport Footer</div>
                      <p className="text-xs text-slate-600 mt-1">
                        Arsitektur CSS <code>h-screen overflow-hidden flex flex-col</code> di mana bilah navigasi bawah dan nomor slide terkunci di dasar layar, tidak pernah terdorong ke bawah atau terpotong keluar layar meski isi slide bertambah panjang.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-[#1F3A5F] text-xs">Presenter Cue Cards (Contekan Panggung)</div>
                      <p className="text-xs text-slate-600 mt-1">
                        Panel khusus di Remote HP pemateri yang memuat poin bicara kunci (*Key Talking Points*), studi kasus analogi dunia nyata, pertanyaan pemicu audiens, dan timer batas waktu aman per slide.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-[#1F3A5F] text-xs">Slide Drawer Overlays</div>
                      <p className="text-xs text-slate-600 mt-1">
                        Laci pop-up semi-transparan yang dapat dibuka pemateri di atas layar slide panggung tanpa keluar dari slide (Drawer: Jawaban Peserta, Polling Live, Tanya Jawab Q&A, QR Code).
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-[#1F3A5F] text-xs">Zero-Certainty Proof Matrix</div>
                      <p className="text-xs text-slate-600 mt-1">
                        Formula kurikulum PartnerUp yang mengajarkan UMKM membuktikan klaim produk dengan 4 pilar bukti rasional tak terbantahkan (Angka Waktu Terukur, Sertifikasi Resmi, Garansi Ganti Rugi, dan Uji Laboratorium).
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-[#1F3A5F] text-xs">IG Bio Hook Synthesizer</div>
                      <p className="text-xs text-slate-600 mt-1">
                        Mesin perakit profil Instagram bisnis 4 baris otomatis di HP peserta berdasarkan penggabungan jawaban lembar kerja (Hook, Solusi, Bukti Rasional, Ajakan Beli WhatsApp).
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-[#1F3A5F] text-xs">Role-Based Stealth Auth & Triple-Tap Trigger</div>
                      <p className="text-xs text-slate-600 mt-1">
                        Arsitektur antarmuka tanpa tombol mencolok. Tombol panel presenter disembunyikan sepenuhnya dari HP peserta agar tidak timbul rasa penasaran. Pemateri mengaktifkan panel via gestur ketuk 3x di header atau ikon gembok samar di footer, dilindungi verifikasi PIN keamanan modal.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-[#1F3A5F] text-xs">Floating Developer & Presenter Switcher Pill</div>
                      <p className="text-xs text-slate-600 mt-1">
                        Tombol navigasi mengambang khusus yang hanya muncul di layar pemateri setelah PIN terbuka. Memungkinkan pemateri beralih instan antara mode simulasi HP peserta dan layar presenter tanpa harus mengetik ulang PIN.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Engine Terms */}
                <div className="pt-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#1F3A5F] mb-2 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" />
                    <span>B. Istilah Teknis Pada Mesin & Backend (Engine)</span>
                  </h4>
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-[#1F3A5F] text-xs">Reactive Cloud Firestore Subscription (<code>onSnapshot</code>)</div>
                      <p className="text-xs text-slate-600 mt-1">
                        Mekanisme listener WebSocket dua arah Google Firebase. Saat pemateri menekan tombol <em>Next</em> di remote HP, slide di layar proyektor panggung bergerak serentak dalam hitungan milidetik (&lt;100ms) tanpa me-refresh halaman.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-[#1F3A5F] text-xs">Distributed Clicker State Machine</div>
                      <p className="text-xs text-slate-600 mt-1">
                        Mesin status terdistribusi dalam dokumen <code>session_state/active</code> yang mengoordinasikan nomor slide aktif, mode interaksi, laci aktif, dan izin baca slide peserta secara sinkron.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-[#1F3A5F] text-xs">PIN Session Guard & Storage Persistence</div>
                      <p className="text-xs text-slate-600 mt-1">
                        Sistem otentikasi lokal terisolasi yang mengamankan status buka-kunci pemateri selama tab browser aktif (<code>sessionStorage</code>), serta menyimpan PIN kustom pengguna secara persisten di <code>localStorage</code> dengan proteksi fallback standar (default: <code>2026</code>).
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-[#1F3A5F] text-xs">Brand Theme Sanitizer & CSS Variable Injection</div>
                      <p className="text-xs text-slate-600 mt-1">
                        Mesin tema cerdas yang memvalidasi format warna heksadesimal sebelum diinjeksikan ke root DOM. Menjaga warna default PartnerUp | Obeecreatives tetap utuh jika terjadi masukan warna tidak valid, sekaligus menyinkronkan tema ke seluruh komponen cetak dokumen PDF.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-[#1F3A5F] text-xs">Content Hydration & Fallback Schema</div>
                      <p className="text-xs text-slate-600 mt-1">
                        Logika ketahanan aplikasi yang membaca konten kustom di Firestore, dan jika ada kolom yang kosong, sistem secara aman menggunakan data cadangan PartnerUp tanpa mengalami error crash.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-[#1F3A5F] text-xs">Isolated Iframe Print Engine</div>
                      <p className="text-xs text-slate-600 mt-1">
                        Mesin cetak dokumen PDF berbasis iframe tersembunyi yang menyusun kode HTML & CSS cetak secara steril tanpa merender tombol navigasi web, menghasilkan berkas PDF yang sangat rapi untuk dicetak atau disimpan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* BAB 4: Panduan Cara Pakai Lengkap */}
          {(activeChapter === 'all' || activeChapter === '4') && matchesSearch('cara pakai pemateri proyektor peserta moderasi remote cetak pdf') && (
            <section className="bg-white rounded-2xl border border-[#1F3A5F]/15 p-5 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#1F3A5F]/15">
                <span className="w-7 h-7 rounded-lg bg-[#1F3A5F] text-white font-extrabold text-xs flex items-center justify-center">
                  4
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#1F3A5F]">
                  Panduan Penggunaan Langkah Demi Langkah (Cara Pakai)
                </h3>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-[#1F3A5F]/85">
                {/* Speaker Workflow */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#F28C28]">
                    A. Panduan Untuk Pemateri di Panggung (Laptop + Smartphone Remote)
                  </h4>
                  <ol className="list-decimal pl-5 space-y-1.5 text-xs">
                    <li>
                      <strong>Hubungkan Laptop ke Proyektor:</strong> Buka tautan web di laptop panggung, pilih menu <strong>Materi Slide</strong>, lalu tekan tombol Fullscreen (F11 atau tombol layar penuh di kanan bawah slide).
                    </li>
                    <li>
                      <strong>Buka Remote di Ponsel Pemateri:</strong> Buka link web di ponsel Anda, pilih menu <strong>Remote HP</strong>. Anda kini memegang remote clicker nirkabel dengan tombol Maju/Mundur besar dan timer countdown.
                    </li>
                    <li>
                      <strong>Gunakan Contekan Panggung (Cue Cards):</strong> Di bawah tombol slide pada ponsel Anda, baca contekan rahasia berupa poin bicara, analogi nyata, dan durasi rekomendasi.
                    </li>
                    <li>
                      <strong>Buka Jawaban / Polling di Layar Proyektor:</strong> Saat masuk ke sesi praktik, tekan tombol <strong>"Buka Jawaban"</strong> atau <strong>"Polling"</strong> pada ponsel Anda. Layar proyektor otomatis menampilkan interaksi tanpa Anda menyentuh laptop.
                    </li>
                    <li>
                      <strong>Buka Akses Slide ke HP Peserta:</strong> Jika peserta meminta materi dibagikan, geser saklar <strong>"Buka Akses Slide di HP: AKTIF"</strong> di Remote HP Anda.
                    </li>
                  </ol>
                </div>

                {/* Participant Workflow */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#1F3A5F]">
                    B. Panduan Untuk Peserta Seminar (via Smartphone)
                  </h4>
                  <ol className="list-decimal pl-5 space-y-1.5 text-xs">
                    <li>
                      <strong>Pindai QR Code:</strong> Arahkan kamera ponsel ke QR code yang tampil di layar proyektor atau buka link seminar yang dibagikan panitia.
                    </li>
                    <li>
                      <strong>Isi Lembar Kerja:</strong> Ketik nama usaha dan jawab pertanyaan 1 hingga 6 secara bertahap sesuai aba-aba pemateri.
                    </li>
                    <li>
                      <strong>Baca Slide Mandiri:</strong> Jika pemateri mengaktifkan akses slide, masuk ke tab <strong>"Baca Slide"</strong> untuk membolak-balik seluruh halaman materi tanpa mengganggu slide di layar depan.
                    </li>
                    <li>
                      <strong>Simpan PDF / Bagikan ke WhatsApp:</strong> Masuk ke tab <strong>"Bio IG & Materi"</strong>. Klik <strong>"Simpan PDF Buku Saku & Jawaban"</strong> untuk mengunduh dokumen A4 resmi, atau klik <strong>"Kirim ke WhatsApp"</strong> untuk mengirim rangkuman ke nomor pribadi atau grup tim.
                    </li>
                  </ol>
                </div>

                {/* Moderation Workflow */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#1F3A5F]">
                    C. Panduan Untuk Tim Panitia & Moderasi (Co-Host)
                  </h4>
                  <p className="text-xs text-slate-600">
                    Buka menu <strong>Moderasi</strong> di laptop operator. Pantau jawaban yang masuk. Gunakan dua jenis sorotan pada box jawaban peserta:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                    <li>
                      <strong>⭐ Sorot Besar:</strong> Mengangkat jawaban ke banner utama panggung dengan tipografi jumbo (sangat terbaca dari baris belakang) untuk dibedah mendalam bersama pemateri.
                    </li>
                    <li>
                      <strong>⭐ Sorot Kecil:</strong> Menyorot jawaban dalam kartu kompak berbingkai emas elegan di jajaran panggung, ideal saat ingin menampilkan 2–4 jawaban inspiratif sekaligus tanpa memenuhi seluruh layar.
                    </li>
                  </ul>
                </div>

                {/* D. Presenter Security & PIN System */}
                <div className="space-y-2 pt-3 border-t border-slate-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>D. Prosedur Keamanan & Akses Rahasia Panel Presenter (PIN Security)</span>
                  </h4>
                  <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80 space-y-2 text-xs">
                    <p className="text-rose-950">
                      <strong>Mengapa Disembunyikan?</strong> Tombol panel pemateri sengaja dihilangkan 100% dari layar ponsel peserta agar peserta tidak penasaran atau sengaja mengklik kendali panggung saat scan QR code.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700 pt-1">
                      <div className="bg-white p-2.5 rounded-lg border border-rose-100">
                        <strong className="text-rose-800 block mb-1">Cara Buka 1: Ketuk 3x di Header</strong>
                        Ketuk 3 kali berturut-turut pada logo PartnerUp atau judul seminar di bilah header atas HP peserta.
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-rose-100">
                        <strong className="text-rose-800 block mb-1">Cara Buka 2: Ikon Gembok di Footer</strong>
                        Klik ikon gembok kecil tersamar di pojok kanan bawah footer aplikasi.
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-rose-100 text-slate-700">
                      <strong className="text-rose-800 block mb-1">Verifikasi PIN & Navigasi Cepat</strong>
                      Masukkan PIN keamanan (PIN default awal: <code>2026</code>). Setelah terbuka, Anda dapat mengganti PIN sendiri kapan saja. Begitu PIN terverifikasi, tombol mengambang <strong>[🛡️ Panel Presenter]</strong> akan muncul otomatis di layar HP Anda untuk beralih instan antar role. Saat selesai, klik tombol <strong>[🔒 Kunci]</strong> di kanan atas.
                    </div>
                  </div>
                </div>

                {/* E. Custom Brand Color Picker */}
                <div className="space-y-2 pt-3 border-t border-slate-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#1F3A5F] flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#F28C28]" />
                    <span>E. Panduan Kustomisasi Tema Warna Brand Organisasi</span>
                  </h4>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
                    <p>
                      Aplikasi mendukung penyesuaian identitas visual (*brand identity*) secara instan tanpa mengganggu arsitektur antarmuka:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Buka menu <strong>Editor Materi</strong>, lalu klik tab <strong>"Tema Warna Organisasi"</strong>.</li>
                      <li>Pilih salah satu dari <strong>5 Preset Siap Pakai</strong> (Default PartnerUp | Obeecreatives, Royal Blue BUMN, Emerald Syariah, Crimson Executive, Tech Indigo) atau gunakan palet pemilih warna hex bebas.</li>
                      <li>Warna Utama (Primary), Aksen (Accent), Sekunder (Secondary), dan Background akan langsung berubah secara <em>live preview</em> di seluruh layar dan template cetak dokumen PDF.</li>
                      <li>Tersedia tombol <strong>"Kembalikan ke Default"</strong> jika Anda ingin mengembalikan warna standar PartnerUp kapan saja.</li>
                    </ol>
                  </div>
                </div>

                {/* F. Material Sharing SOP */}
                <div className="space-y-2 pt-3 border-t border-slate-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#1F3A5F] flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-[#F28C28]" />
                    <span>F. Standar Operasional & 5 Opsi Pembagian Materi ke Peserta</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <strong className="text-[#1F3A5F] block mb-1">1. Slide Reader Mandiri di HP</strong>
                      Diaktifkan oleh pemateri lewat saklar <em>"Akses Slide HP Peserta: AKTIF"</em> di Remote HP. Peserta dapat membolak-balik halaman slide tanpa mengganggu slide di proyektor panggung.
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <strong className="text-[#1F3A5F] block mb-1">2. Unduh PDF Buku Saku & Jawaban (A4)</strong>
                      Peserta masuk ke tab <em>"Bio IG & Materi"</em> dan mengeklik tombol unduh PDF resmi berformat dokumen A4 yang merangkum hasil kerja dan intisari materi.
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <strong className="text-[#1F3A5F] block mb-1">3. Kirim Ringkasan ke WhatsApp</strong>
                      Format teks rapi langsung dikirim ke nomor pribadi peserta atau grup bisnis melalui integrasi tautan WhatsApp otomatis.
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <strong className="text-[#1F3A5F] block mb-1">4. Unduh Berkas Teks (.TXT)</strong>
                      Opsi hemat kuota untuk peserta yang ingin menyimpan catatan dalam berkas teks murni untuk diedit di catatan HP mereka.
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 md:col-span-2">
                      <strong className="text-[#1F3A5F] block mb-1">5. Ekspor Rekapitulasi Data Jawaban Peserta (CSV untuk Panitia)</strong>
                      Di navigasi atas pemateri, klik tombol <strong>"Unduh Rekap CSV"</strong> untuk mengekspor seluruh nama usaha dan respon jawaban ke file spreadsheet Excel/Google Sheets.
                    </div>
                  </div>
                </div>

                {/* G. Visual Media & Slide Image Integration */}
                <div className="space-y-2 pt-3 border-t border-slate-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#2A9D8F] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#2A9D8F]" />
                    <span>G. Panduan Penggunaan Gambar & Media Foto pada Slide Materi (Non-Breaking)</span>
                  </h4>
                  <div className="p-3.5 rounded-xl bg-[#E3F5F2]/40 border border-[#2A9D8F]/30 space-y-2.5 text-xs text-slate-700">
                    <p>
                      Materi slide kini mendukung penambahan foto atau gambar visual untuk membuat materi presentasi terlihat lebih hidup, variatif, dan mudah dipahami audiens:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                      <div className="bg-white p-3 rounded-lg border border-[#2A9D8F]/25 space-y-1">
                        <strong className="text-[#1F3A5F] block">1. Dua Cara Input Gambar</strong>
                        <p className="text-[#1F3A5F]/80">
                          • <strong>Upload dari HP/Laptop:</strong> Pilih file foto dari galeri/memori perangkat. Sistem secara otomatis mengompres foto berukuran besar (5–10MB) menjadi format web-ready yang sangat ringan (&lt;180KB) tanpa mengurangi ketajaman.<br />
                          • <strong>Link URL Gambar:</strong> Tempel tautan gambar dari internet atau cloud storage (misal: Unsplash, CDN).
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-[#2A9D8F]/25 space-y-1">
                        <strong className="text-[#1F3A5F] block">2. Tiga Opsi Posisi Tata Letak</strong>
                        <p className="text-[#1F3A5F]/80">
                          • <strong>Samping Kanan (Split 50:50):</strong> Poin kartu di kiri, foto visual di kanan (standar terbaik).<br />
                          • <strong>Samping Kiri (Split 50:50):</strong> Foto visual di kiri, poin kartu di kanan.<br />
                          • <strong>Banner Atas:</strong> Foto horizontal lebar membentang di atas poin kartu.
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-[#2A9D8F]/25 space-y-1">
                        <strong className="text-[#1F3A5F] block">3. Jaminan Keutuhan Data (Non-Breaking)</strong>
                        <p className="text-[#1F3A5F]/80">
                          Fitur ini bersifat opsional murni. Slide yang tidak ditambahkan foto tetap mempertahankan 100% tata letak teks, kartu, dan rumus aslinya. Foto dapat dihapus kapan saja dengan tombol <em>Hapus Foto</em> dan slide langsung kembali ke tampilan semula.
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-[#2A9D8F]/25 space-y-1">
                        <strong className="text-[#1F3A5F] block">4. Sinkronisasi di Semua Peran</strong>
                        <p className="text-[#1F3A5F]/80">
                          Foto yang terpasang otomatis tampil di <strong>Layar Proyektor</strong>, <strong>Layar Presenter Dual Mode</strong>, indikator thumbnail di <strong>Remote HP Pemateri</strong>, <strong>Mode Baca Mandiri HP Peserta</strong>, dan cetak dokumen <strong>Handout PDF A4</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* BAB 5: Panduan Duplikasi Web Apps Secara Menyeluruh */}
          {(activeChapter === 'all' || activeChapter === '5') && matchesSearch('duplikasi clone copy app github akun google firebase migrate export import') && (
            <section className="bg-white rounded-2xl border border-amber-300 p-5 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-amber-200">
                <span className="w-7 h-7 rounded-lg bg-[#F28C28] text-white font-extrabold text-xs flex items-center justify-center">
                  5
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#1F3A5F]">
                  Panduan Duplikasi & Replikasi Web Apps
                </h3>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-[#1F3A5F]/85">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950">
                  <strong>Apakah aplikasi ini bisa diduplikasi?</strong><br/>
                  <strong>Sangat bisa!</strong> Anda dapat menduplikasi web apps ini untuk dipakai di <strong>akun Google yang sama</strong> maupun <strong>dipindahkan ke akun Google Anda yang lain</strong>, lalu <strong>melanjutkan pengembangan (*development*)</strong> di akun baru tersebut secara terpisah.
                </div>

                {/* Method 1 */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#1F3A5F] flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-[#1F3A5F] text-white text-[10px]">Metode 1</span>
                    <span>Duplikasi Cepat di Akun Google yang Sama (Fitur "Copy App")</span>
                  </h4>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                    <p>
                      <strong>Kapan dipakai:</strong> Anda ingin membuat versi seminar topik baru (misal: "Seminar Copywriting" atau "Seminar Keuangan UMKM") di akun Google yang sama tanpa mengubah aplikasi PartnerUp saat ini.
                    </p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Buka Google AI Studio di dashboard akun Google Anda.</li>
                      <li>Cari kartu aplikasi PartnerUp Live, klik menu titik tiga (Opsi) lalu pilih <strong>"Copy App"</strong> atau <strong>"Duplicate"</strong>.</li>
                      <li>AI Studio otomatis membuat salinan proyek baru lengkap dengan database Firebase terpisah.</li>
                      <li>Buka aplikasi baru tersebut dan sesuaikan materi melalui <strong>Editor Materi</strong> atau melalui instruksi chat AI.</li>
                    </ol>
                  </div>
                </div>

                {/* Method 2 */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#F28C28] flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-[#F28C28] text-white text-[10px]">Metode 2</span>
                    <span>Pindah ke Akun Google Lain & Lanjut Development (via GitHub)</span>
                  </h4>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                    <p>
                      <strong>Kapan dipakai:</strong> Anda ingin memindahkan kepemilikan seluruh kode web apps ke akun Google kedua Anda dan melanjutkan coding/chatting dengan AI di akun tersebut.
                    </p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>
                        <strong>Ekspor ke GitHub:</strong> Di pojok kanan atas jendela Google AI Studio akun pertama, klik menu <strong>Export to GitHub</strong>. Hubungkan akun GitHub Anda dan simpan ke repositori (misal: <code>my-partnerup-live</code>).
                      </li>
                      <li>
                        <strong>Buka Akun Google Kedua:</strong> Buka tab browser baru dengan akun Google kedua Anda, lalu masuk ke Google AI Studio.
                      </li>
                      <li>
                        <strong>Impor dari GitHub:</strong> Klik tombol <strong>Import from GitHub</strong>, pilih repositori yang baru saja Anda ekspor, lalu buat workspace baru.
                      </li>
                      <li>
                        <strong>Setup Firebase Baru:</strong> Setelah workspace terbuka di akun baru, ketik instruksi ke AI: <em>"Tolong aktifkan dan setup Firebase Firestore database untuk aplikasi ini serta deploy firestore.rules"</em>. AI akan otomatis mengaktifkan database independen di akun baru Anda.
                      </li>
                      <li>
                        <strong>Lanjutkan Development:</strong> Anda kini bebas memodifikasi, menambah fitur, atau meminta perubahan desain kapan saja di akun baru tersebut.
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Pro Tip */}
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1">
                  <div className="font-bold text-[#1F3A5F] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#F28C28]" />
                    <span>Tips Hemat: 1 Aplikasi untuk Banyak Seminar Berbeda</span>
                  </div>
                  <p>
                    Jika seminar Anda diadakan di hari atau sesi yang berbeda, Anda <strong>tidak perlu membuat duplikasi aplikasi baru</strong>! Cukup gunakan fitur <strong>Ekspor Cadangan JSON</strong> di menu Editor Materi untuk menyimpan topik A. Saat topik B dimulai, muat berkas JSON topik B. Begitu seminar selesai, unduh hasil jawaban peserta dengan tombol <strong>Unduh Rekap CSV</strong> di navigasi atas.
                  </p>
                </div>
              </div>
            </section>
          )}

        </div>

        {/* Bottom Actions Bar */}
        <div className="bg-white border-t border-[#1F3A5F]/15 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#1F3A5F]/70">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Format Dokumen: Standar A4 Portrait (Cover, Daftar Isi, Glosarium & SOP)</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedLink ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link App'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              disabled={isPrinting}
              className="px-4 py-2 rounded-xl bg-[#F28C28] hover:bg-[#d97719] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Membuka PDF...' : 'Cetak / Simpan PDF Panduan (A4)'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
