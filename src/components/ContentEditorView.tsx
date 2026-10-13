import React, { useState, useEffect } from 'react';
import {
  PARTNERUP_QUESTIONS,
  LIVE_POLLS,
  SEMINAR_SLIDES,
  WorksheetQuestion,
  LivePollConfig,
  SlideDefinition,
  SlideCardItem,
  PollOption,
} from '../data/seminarData';
import { CustomContentDoc, BrandThemeConfig } from '../types';
import {
  DEFAULT_BRAND_THEME,
  BRAND_THEME_PRESETS,
  sanitizeBrandTheme,
  useApplyBrandTheme,
} from '../brandTheme';
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  BookOpen,
  Presentation,
  BarChart3,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  Palette,
  Printer,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  UploadCloud,
  XCircle,
  Info,
} from 'lucide-react';
import { printSystemDocumentationGuide } from '../utils/handoutExport';

/**
 * Kompresi gambar client-side otomatis via HTML5 Canvas
 * Mengurangi ukuran foto kamera HP (5-10MB) menjadi web-ready (<180KB JPEG)
 */
async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // JPEG quality 0.82 menghasilkan rasio kompresi optimal & jernih
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Gagal memuat file gambar'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file dari perangkat'));
    reader.readAsDataURL(file);
  });
}

export const SAMPLE_SLIDE_IMAGES = [
  {
    label: 'Kemasan Produk UMKM',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80',
    caption: 'Studi Kasus: Display & Kemasan Produk Makanan UMKM',
  },
  {
    label: 'Etalase Toko Rapi',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80',
    caption: 'Studi Kasus: Kebersihan & Standar Pelayanan Toko Fisik',
  },
  {
    label: 'Diskusi & Tim Bisnis',
    url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1000&q=80',
    caption: 'Ilustrasi: Merumuskan Value Proposition Bersama Tim',
  },
];

interface ContentEditorViewProps {
  customContent: CustomContentDoc;
  onSaveCustomContent: (updated: CustomContentDoc) => Promise<void>;
  onResetToPartnerUpDefault: () => Promise<void>;
  onOpenGuide?: () => void;
}

export const DEFAULT_QNA_TOPICS = [
  'Value Proposition',
  'Rational Value (Bukti)',
  'Emotional Value (Rasa)',
  'Strategi Harga',
  'Bio & Kemasan',
];

export const ContentEditorView: React.FC<ContentEditorViewProps> = ({
  customContent,
  onSaveCustomContent,
  onResetToPartnerUpDefault,
  onOpenGuide,
}) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'slides' | 'polls' | 'qna' | 'theme' | 'guide'>('theme');
  const [seminarTitle, setSeminarTitle] = useState(customContent.seminarTitle);
  const [organizerName, setOrganizerName] = useState(customContent.organizerName);
  const [questions, setQuestions] = useState<WorksheetQuestion[]>(customContent.questions);
  const [slides, setSlides] = useState<SlideDefinition[]>(customContent.slides);
  const [polls, setPolls] = useState<LivePollConfig[]>(customContent.polls);
  const [qnaTopics, setQnaTopics] = useState<string[]>(customContent.qnaTopics);
  const [brandTheme, setBrandTheme] = useState<BrandThemeConfig>(() =>
    sanitizeBrandTheme(customContent.brandTheme)
  );

  // Live preview the edited brand theme immediately while inside Editor
  useApplyBrandTheme(brandTheme);

  const [newTopicInput, setNewTopicInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Sync local state when customContent prop updates from Firestore
  useEffect(() => {
    setSeminarTitle(customContent.seminarTitle);
    setOrganizerName(customContent.organizerName);
    setQuestions(customContent.questions);
    setSlides(customContent.slides);
    setPolls(customContent.polls);
    setQnaTopics(customContent.qnaTopics);
    setBrandTheme(sanitizeBrandTheme(customContent.brandTheme));
  }, [customContent]);

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      // Re-index questions and slides cleanly before saving
      const normalizedQuestions = questions.map((q, idx) => ({
        ...q,
        index: idx,
        sectionNumber: idx + 1,
      }));
      const normalizedSlides = slides.map((s, idx) => ({
        ...s,
        index: idx,
        pageNumber: idx + 1,
      }));

      await onSaveCustomContent({
        seminarTitle: seminarTitle.trim() || 'Seminar UMKM Interaktif',
        organizerName: organizerName.trim() || 'Program PartnerUp | Obeecreatives',
        questions: normalizedQuestions,
        polls,
        slides: normalizedSlides,
        qnaTopics: qnaTopics.length > 0 ? qnaTopics : DEFAULT_QNA_TOPICS,
        brandTheme: sanitizeBrandTheme(brandTheme),
        updatedAt: Date.now(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } finally {
      setSaving(false);
    }
  };

  // Preset Template Loader for Quick Demo of Another Seminar Topic
  const handleLoadCopywritingPreset = () => {
    setSeminarTitle('Seminar Copywriting & Foto Produk Laris di Sosmed');
    setOrganizerName('Program PartnerUp | Obeecreatives');
    setQuestions([
      {
        index: 0,
        sectionNumber: 1,
        sectionTitle: '1. Audit Profil Toko Saat Ini',
        coreLearning: 'Memastikan pembeli langsung paham produkmu dalam 3 detik',
        questionText: 'Apa kalimat yang saat ini tertulis di Bio Instagram atau profil WhatsApp usahamu?',
        secondaryPrompt: 'Apakah sudah menyebutkan lokasi dan cara pesan?',
        exampleAnswer: 'Sedia aneka kue basah & tumpeng mini Sidoarjo. Pesan H-1 via WA.',
        helperTips: ['Bio yang jelas membantu pembeli baru percaya tanpa harus tanya berulang-ulang.'],
        linkedSlideIndex: 1,
      },
      {
        index: 1,
        sectionNumber: 2,
        sectionTitle: '2. Headline Pancingan (Hook)',
        coreLearning: 'Kalimat baris pertama yang menghentikan jempol pembeli saat scroll',
        questionText: 'Tulis 1 kalimat pembuka caption yang menyentuh masalah pembelimu!',
        secondaryPrompt: 'Gunakan pertanyaan atau masalah sehari-hari pembeli',
        exampleAnswer: 'Bingung cari hantaran arisan yang kelihatan mewah tapi budget di bawah Rp50 ribu?',
        helperTips: ['Jangan mulai caption dengan "Kami menjual...", mulailah dengan kondisi yang dialami pembeli.'],
        linkedSlideIndex: 2,
      },
      {
        index: 2,
        sectionNumber: 3,
        sectionTitle: '3. Ajakan Bertindak (Call to Action)',
        coreLearning: 'Mengarahkan pembeli agar langsung klik atau chat sekarang',
        questionText: 'Tulis kalimat penutup promosi (Call to Action) yang bikin pembeli segera pesan!',
        secondaryPrompt: 'Tambahkan batas kuota atau bonus agar tidak ditunda',
        exampleAnswer: 'Amankan kuota pengiriman Jumat pagi sekarang (sisa 5 slot) — klik link WA di bio!',
        helperTips: ['Berikan alasan kenapa mereka harus chat hari ini, bukan minggu depan.'],
        linkedSlideIndex: 3,
      },
    ]);
    setPolls([
      {
        id: 'poll_kendala_konten',
        title: 'Kendala Terbesar Saat Buat Konten Promosi',
        subtitle: 'Apa hal yang paling sering membuatmu batal posting di Instagram/WhatsApp?',
        linkedSlideIndex: 1,
        type: 'bar',
        options: [
          {
            id: 'bingung_caption',
            label: '1. Bingung mau nulis kalimat caption apa',
            subtitle: 'Sudah ada foto tapi mentok merangkai kata',
            category: 'rational',
          },
          {
            id: 'foto_kurang_bagus',
            label: '2. Merasa foto produk kurang terang / kurang menarik',
            subtitle: 'Belum percaya diri dengan hasil kamera HP',
            category: 'rational',
          },
          {
            id: 'tidak_sempat',
            label: '3. Sibuk produksi & melayani pembeli sampai lupa posting',
            subtitle: 'Kurang waktu luang untuk mengedit',
            category: 'emotional',
          },
        ],
      },
    ]);
    setSlides([
      {
        index: 0,
        pageNumber: 1,
        badge: 'SEMINAR COPYWRITING UMKM',
        title: 'Cara Menulis Caption & Foto Produk yang Bikin Pembeli Langsung Chat',
        subtitle: 'Praktik Langsung Merombak Bio & Promosi Harian — Obeecreatives',
        type: 'cover',
      },
      {
        index: 1,
        pageNumber: 2,
        badge: 'BAGIAN 1',
        title: 'Audit Bio & Profil Toko',
        subtitle: 'Dalam 3 detik pertama, pembeli baru memutuskan lanjut lihat atau keluar.',
        type: 'worksheet',
        linkedQuestionIndex: 0,
        linkedPollId: 'poll_kendala_konten',
        promptLines: ['Tulis isi Bio Instagram / WA usahamu saat ini: ______________'],
      },
      {
        index: 2,
        pageNumber: 3,
        badge: 'BAGIAN 2',
        title: 'Membuat Kalimat Pancingan (Hook)',
        subtitle: 'Sentuh masalah pembeli di baris pertama sebelum menawarkan produk.',
        type: 'worksheet',
        linkedQuestionIndex: 1,
        comparison: {
          leftTitle: 'Biasa (Kurang Menarik)',
          leftBody: '"Ready stok sambal cumi botol 150gr harga Rp25.000. Silakan diorder kak."',
          rightTitle: 'Kuat (Menggugah Pembeli)',
          rightBody: '"Pulang kerja capek dan malas masak? Cukup nasi hangat + 1 sendok Sambal Cumi potongan penuh ini, makan malam langsung lahap!"',
        },
        promptLines: ['Kalimat pancingan (Hook) untuk produkku: ______________'],
      },
      {
        index: 3,
        pageNumber: 4,
        badge: 'BAGIAN 3',
        title: 'Call to Action (Ajakan Membeli)',
        subtitle: 'Akhiri promosi dengan petunjuk pesan yang jelas dan mudah.',
        type: 'worksheet',
        linkedQuestionIndex: 2,
        promptLines: ['Kalimat ajakan pesan (CTA) yang akan kupakai: ______________'],
      },
      {
        index: 4,
        pageNumber: 5,
        badge: 'PENUTUP & Q&A',
        title: 'Saatnya Praktik & Tanya Jawab!',
        subtitle: 'Silakan kirim pertanyaan seputar Copywriting & Konten Sosmed.',
        type: 'closing',
        cards: [
          { title: '1. Rapikan Bio Toko', body: 'Pastikan produk utama dan lokasi langsung terlihat.', accent: 'orange' },
          { title: '2. Pakai Hook Masalah', body: 'Panggil kebutuhan pembeli di kalimat pertama.', accent: 'teal' },
          { title: '3. Beri Ajakan Jelas', body: 'Arahkan langsung ke nomor WhatsApp atau keranjang.', accent: 'orange' },
        ],
      },
    ]);
    setQnaTopics(['Copywriting Caption', 'Bio Instagram', 'Foto Produk HP', 'Strategi WhatsApp']);
  };

  // Export & Import JSON Backup (includes brandTheme)
  const handleExportJson = () => {
    const dataStr = JSON.stringify(
      {
        seminarTitle,
        organizerName,
        questions,
        polls,
        slides,
        qnaTopics,
        brandTheme: sanitizeBrandTheme(brandTheme),
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Template_Materi_${seminarTitle.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result));
        if (parsed.questions && Array.isArray(parsed.questions)) {
          setSeminarTitle(parsed.seminarTitle || seminarTitle);
          setOrganizerName(parsed.organizerName || organizerName);
          setQuestions(parsed.questions);
          if (Array.isArray(parsed.polls)) setPolls(parsed.polls);
          if (Array.isArray(parsed.slides)) setSlides(parsed.slides);
          if (Array.isArray(parsed.qnaTopics)) setQnaTopics(parsed.qnaTopics);
          if (parsed.brandTheme) setBrandTheme(sanitizeBrandTheme(parsed.brandTheme));
        }
      } catch (err) {
        console.error('File JSON tidak valid:', err);
      }
    };
    reader.readAsText(file);
  };

  // Question Helpers
  const updateQuestionField = (idx: number, field: keyof WorksheetQuestion, value: any) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const addQuestion = () => {
    const nextIdx = questions.length;
    setQuestions([
      ...questions,
      {
        index: nextIdx,
        sectionNumber: nextIdx + 1,
        sectionTitle: `${nextIdx + 1}. Bagian Materi Baru`,
        coreLearning: 'Inti pembelajaran pada bagian ini',
        questionText: 'Tuliskan pertanyaan baru untuk peserta di sini?',
        secondaryPrompt: 'Petunjuk tambahan singkat (opsional)',
        exampleAnswer: 'Contoh jawaban singkat agar peserta tidak bingung.',
        helperTips: ['Tips singkat untuk membantu peserta menjawab.'],
        linkedSlideIndex: 0,
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveQuestion = (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= questions.length) return;
    const copy = [...questions];
    const temp = copy[idx];
    copy[idx] = copy[target];
    copy[target] = temp;
    setQuestions(copy);
  };

  // Slide Helpers
  const updateSlideField = (idx: number, field: keyof SlideDefinition, value: any) => {
    setSlides((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const addSlide = () => {
    const nextIdx = slides.length;
    setSlides([
      ...slides,
      {
        index: nextIdx,
        pageNumber: nextIdx + 1,
        badge: `BAGIAN ${nextIdx + 1}`,
        title: 'Judul Slide Materi Baru',
        subtitle: 'Sub-judul atau penjelasan inti yang tampil di layar proyektor.',
        type: 'worksheet',
        linkedQuestionIndex: 0,
        cards: [
          { title: 'Poin Utama 1', body: 'Penjelasan singkat poin pertama.', accent: 'orange' },
          { title: 'Poin Utama 2', body: 'Penjelasan singkat poin kedua.', accent: 'teal' },
        ],
        promptLines: ['Pertanyaan latihan di slide: ______________'],
      },
    ]);
  };

  const removeSlide = (idx: number) => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveSlide = (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= slides.length) return;
    const copy = [...slides];
    const temp = copy[idx];
    copy[idx] = copy[target];
    copy[target] = temp;
    setSlides(copy);
  };

  // Slide Kanban Cards Helpers
  const addSlideCard = (slideIdx: number) => {
    setSlides((prev) =>
      prev.map((s, i) => {
        if (i !== slideIdx) return s;
        const currentCards = s.cards || [];
        if (currentCards.length >= 5) return s;
        const nextNum = currentCards.length + 1;
        return {
          ...s,
          cards: [
            ...currentCards,
            {
              title: `${nextNum}. Judul Kartu Poin Baru`,
              body: 'Penjelasan singkat atau contoh nyata pada kartu ini.',
              accent: nextNum % 2 === 1 ? 'orange' : 'teal',
            },
          ],
        };
      })
    );
  };

  const updateSlideCard = (
    slideIdx: number,
    cardIdx: number,
    field: keyof SlideCardItem,
    value: string
  ) => {
    setSlides((prev) =>
      prev.map((s, i) => {
        if (i !== slideIdx) return s;
        const nextCards = (s.cards || []).map((c, ci) =>
          ci === cardIdx ? { ...c, [field]: value } : c
        );
        return { ...s, cards: nextCards };
      })
    );
  };

  const removeSlideCard = (slideIdx: number, cardIdx: number) => {
    setSlides((prev) =>
      prev.map((s, i) => {
        if (i !== slideIdx) return s;
        return {
          ...s,
          cards: (s.cards || []).filter((_, ci) => ci !== cardIdx),
        };
      })
    );
  };

  // Poll Helpers
  const updatePollField = (idx: number, field: keyof LivePollConfig, value: any) => {
    setPolls((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const addPoll = () => {
    const newId = `poll_custom_${Date.now().toString(36)}`;
    setPolls([
      ...polls,
      {
        id: newId,
        title: 'Judul Polling Interaktif Baru',
        subtitle: 'Pilih salah satu opsi yang paling sesuai dengan kondisi usahamu:',
        linkedSlideIndex: 0,
        type: 'bar',
        options: [
          {
            id: 'opsi_1',
            label: '1. Pilihan Pertama',
            subtitle: 'Keterangan singkat pilihan pertama',
            category: 'rational',
          },
          {
            id: 'opsi_2',
            label: '2. Pilihan Kedua',
            subtitle: 'Keterangan singkat pilihan kedua',
            category: 'emotional',
          },
        ],
      },
    ]);
  };

  const removePoll = (idx: number) => {
    if (polls.length <= 1) return;
    setPolls((prev) => prev.filter((_, i) => i !== idx));
  };

  const updatePollOption = (
    pollIdx: number,
    optIdx: number,
    field: keyof PollOption,
    value: string
  ) => {
    setPolls((prev) =>
      prev.map((poll, pI) => {
        if (pI !== pollIdx) return poll;
        const nextOpts = poll.options.map((opt, oI) =>
          oI === optIdx ? { ...opt, [field]: value } : opt
        );
        return { ...poll, options: nextOpts };
      })
    );
  };

  const addPollOption = (pollIdx: number) => {
    setPolls((prev) =>
      prev.map((poll, pI) => {
        if (pI !== pollIdx) return poll;
        const nextNum = poll.options.length + 1;
        return {
          ...poll,
          options: [
            ...poll.options,
            {
              id: `opsi_${nextNum}_${Date.now().toString(36).slice(-3)}`,
              label: `${nextNum}. Opsi Pilihan Baru`,
              subtitle: 'Contoh atau penjelasan singkat opsi ini',
              category: nextNum % 2 === 0 ? 'emotional' : 'rational',
            },
          ],
        };
      })
    );
  };

  const removePollOption = (pollIdx: number, optIdx: number) => {
    setPolls((prev) =>
      prev.map((poll, pI) => {
        if (pI !== pollIdx || poll.options.length <= 1) return poll;
        return {
          ...poll,
          options: poll.options.filter((_, oI) => oI !== optIdx),
        };
      })
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* Header Studio Editor */}
      <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F28C28]">
            <Sparkles className="w-4 h-4" />
            <span>Custom Content Studio — Tanpa Ubah Kode</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1F3A5F]">
            Editor Materi Slide, Pertanyaan, Polling & Topik Q&A
          </h1>
          <p className="text-sm text-[#1F3A5F]/75">
            Ubah seluruh materi untuk topik seminar berikutnya. Begitu Anda klik <strong>Simpan & Terapkan ke Seminar</strong>, layar Proyektor dan HP Peserta langsung berubah secara *real-time*.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleLoadCopywritingPreset}
            className="px-3.5 py-2.5 rounded-xl bg-[#FFF7EC] border border-[#F28C28]/40 hover:bg-[#F28C28] text-[#1F3A5F] hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Coba Contoh Tema Lain (Seminar Copywriting)
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1F3A5F] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Materi Asli PartnerUp</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-amber-900">Kembalikan ke 7 Pertanyaan & 17 Slide Asli?</span>
              <button
                type="button"
                onClick={async () => {
                  await onResetToPartnerUpDefault();
                  setConfirmReset(false);
                }}
                className="px-2.5 py-1 rounded bg-[#1F3A5F] text-white text-xs font-bold cursor-pointer"
              >
                Ya, Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2.5 py-1 rounded bg-white text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-3 rounded-xl bg-[#2A9D8F] hover:bg-[#218276] text-white font-display font-bold text-sm flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan & Terapkan ke Seminar'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-4 flex items-center justify-between text-emerald-900">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-bold text-sm">
              Berhasil disimpan! Seluruh perubahan materi, pertanyaan, polling, dan slide sudah aktif di layar Proyektor dan HP Peserta.
            </p>
          </div>
        </div>
      )}

      {/* Global Seminar Identity & Backup JSON Bar */}
      <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-5">
          <label className="block text-xs font-bold uppercase text-[#1F3A5F]/70 mb-1">
            Nama / Tema Seminar Aktif
          </label>
          <input
            type="text"
            maxLength={120}
            value={seminarTitle}
            onChange={(e) => setSeminarTitle(e.target.value)}
            className="w-full rounded-xl border border-[#1F3A5F]/25 px-3.5 py-2.5 text-sm font-bold text-[#1F3A5F]"
          />
        </div>
        <div className="md:col-span-4">
          <label className="block text-xs font-bold uppercase text-[#1F3A5F]/70 mb-1">
            Nama Program / Penyelenggara (Footer Slide)
          </label>
          <input
            type="text"
            maxLength={100}
            value={organizerName}
            onChange={(e) => setOrganizerName(e.target.value)}
            className="w-full rounded-xl border border-[#1F3A5F]/25 px-3.5 py-2.5 text-sm font-semibold text-[#1F3A5F]"
          />
        </div>
        <div className="md:col-span-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-2.5 rounded-xl border border-[#1F3A5F]/20 hover:bg-[#FFF7EC] text-xs font-bold text-[#1F3A5F] flex items-center gap-1.5 cursor-pointer"
            title="Simpan file cadangan materi ke laptop"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor JSON</span>
          </button>
          <label className="px-3 py-2.5 rounded-xl border border-[#1F3A5F]/20 hover:bg-[#FFF7EC] text-xs font-bold text-[#1F3A5F] flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Impor JSON</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>
        </div>
      </div>

      {/* 5 Sub-Editors Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl border border-[#1F3A5F]/15">
        <button
          type="button"
          onClick={() => setActiveTab('theme')}
          className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'theme'
              ? 'bg-[#F28C28] text-white shadow-xs'
              : 'text-[#1F3A5F] bg-[#FFF7EC] hover:bg-[#F28C28]/15 border border-[#F28C28]/30'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Tema Warna Organisasi ({brandTheme.name.split(' ')[0]})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'questions'
              ? 'bg-[#1F3A5F] text-white'
              : 'text-[#1F3A5F]/75 hover:bg-[#1F3A5F]/5'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>1. Pertanyaan Materi ({questions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('slides')}
          className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'slides'
              ? 'bg-[#1F3A5F] text-white'
              : 'text-[#1F3A5F]/75 hover:bg-[#1F3A5F]/5'
          }`}
        >
          <Presentation className="w-4 h-4" />
          <span>2. Materi Slide ({slides.length} Halaman)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('polls')}
          className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'polls'
              ? 'bg-[#1F3A5F] text-white'
              : 'text-[#1F3A5F]/75 hover:bg-[#1F3A5F]/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>3. Live Polling & Awan Kata ({polls.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('qna')}
          className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'qna'
              ? 'bg-[#1F3A5F] text-white'
              : 'text-[#1F3A5F]/75 hover:bg-[#1F3A5F]/5'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>4. Topik Kategori Q&A ({qnaTopics.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (onOpenGuide) {
              onOpenGuide();
            } else {
              setActiveTab('guide');
            }
          }}
          className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'guide'
              ? 'bg-[#1F3A5F] text-white shadow-xs'
              : 'text-[#1F3A5F] bg-amber-50 hover:bg-amber-100 border border-amber-300'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#F28C28]" />
          <span>Buku Panduan & Duplikasi (PDF)</span>
        </button>
      </div>

      {/* SUB-EDITOR TEMA WARNA ORGANISASI (CUSTOM BRAND COLOR PICKER) */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          {/* Top Banner & Reset to Default PartnerUp */}
          <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#F28C28]/15 text-[#F28C28] font-bold text-xs uppercase tracking-wider">
                  Identitas Visual & Branding
                </span>
                <span className="text-xs font-bold text-[#1F3A5F]/60">
                  Tema Aktif: {brandTheme.name}
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1F3A5F]">
                Pengaturan Tema Warna Organisasi (Custom Brand Color Picker)
              </h2>
              <p className="text-sm text-[#1F3A5F]/75 max-w-3xl">
                Sesuaikan identitas warna untuk organisasi penyelenggara (BUMN, Dinas, Koperasi, Kampus, atau Komunitas). Warna default tetap menggunakan <strong>PartnerUp | Obeecreatives</strong>. Klik <strong>Simpan & Terapkan ke Seminar</strong> di kanan atas untuk menyinkronkan warna ke seluruh layar Proyektor & HP Peserta.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setBrandTheme(DEFAULT_BRAND_THEME)}
              className="px-4 py-2.5 rounded-xl bg-[#FFF7EC] border-2 border-[#1F3A5F]/20 hover:border-[#F28C28] text-[#1F3A5F] text-xs font-bold flex items-center gap-2 cursor-pointer shrink-0 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-[#F28C28]" />
              <span>Kembalikan Warna Default (PartnerUp | Obeecreatives)</span>
            </button>
          </div>

          {/* 1. Preset Palet Organisasi Siap Pakai */}
          <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-6 space-y-4 shadow-xs">
            <div>
              <h3 className="font-display text-lg font-bold text-[#1F3A5F]">
                1. Pilih Paket Tema Warna Organisasi Siap Pakai (1-Klik)
              </h3>
              <p className="text-xs sm:text-sm text-[#1F3A5F]/70">
                Pilih salah satu paket warna di bawah ini sebagai titik awal, atau langsung racik warna kustom di bagian bawah.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {BRAND_THEME_PRESETS.map((preset) => {
                const isSelected =
                  brandTheme.primaryColor.toUpperCase() === preset.primaryColor.toUpperCase() &&
                  brandTheme.accentColor.toUpperCase() === preset.accentColor.toUpperCase() &&
                  brandTheme.secondaryColor.toUpperCase() === preset.secondaryColor.toUpperCase() &&
                  brandTheme.bgColor.toUpperCase() === preset.bgColor.toUpperCase();

                return (
                  <button
                    key={preset.presetId}
                    type="button"
                    onClick={() =>
                      setBrandTheme({
                        presetId: preset.presetId,
                        name: preset.name,
                        primaryColor: preset.primaryColor,
                        accentColor: preset.accentColor,
                        secondaryColor: preset.secondaryColor,
                        bgColor: preset.bgColor,
                      })
                    }
                    className={`text-left rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-[#F28C28] bg-[#FFF7EC]/70 shadow-sm'
                        : 'border-slate-200 hover:border-[#1F3A5F]/40 bg-white'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {preset.organizationType}
                        </span>
                        {preset.presetId === 'partnerup_default' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                            DEFAULT UTAMA
                          </span>
                        )}
                      </div>

                      <p className="font-display font-bold text-base text-slate-900">
                        {preset.name}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    {/* SVG Color Swatch Bar (True Colors of each preset) */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <svg
                        viewBox="0 0 180 28"
                        className="w-40 h-7 rounded-lg overflow-hidden border border-slate-200 shrink-0"
                        aria-label={`Palet warna ${preset.name}`}
                      >
                        <rect x="0" y="0" width="45" height="28" fill={preset.primaryColor} />
                        <rect x="45" y="0" width="45" height="28" fill={preset.accentColor} />
                        <rect x="90" y="0" width="45" height="28" fill={preset.secondaryColor} />
                        <rect x="135" y="0" width="45" height="28" fill={preset.bgColor} />
                      </svg>
                      <span
                        className={`text-xs font-bold ${
                          isSelected ? 'text-[#F28C28]' : 'text-slate-500'
                        }`}
                      >
                        {isSelected ? '✓ Aktif' : 'Gunakan'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Custom Color Picker per Elemen & Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: 4 Custom Color Pickers */}
            <div className="lg:col-span-7 bg-white border border-[#1F3A5F]/15 rounded-2xl p-6 space-y-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F3A5F]/10 pb-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1F3A5F]">
                    2. Kustomisasi Warna Bebas (Color Picker & Kode Hex)
                  </h3>
                  <p className="text-xs text-[#1F3A5F]/70">
                    Klik kotak warna atau masukkan kode Hex (misal <code>#1F3A5F</code>) sesuai panduan logo organisasi Anda.
                  </p>
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-xs font-bold uppercase text-[#1F3A5F]/70 mb-1">
                  Nama Label Tema Organisasi
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={brandTheme.name}
                  onChange={(e) =>
                    setBrandTheme({
                      ...brandTheme,
                      presetId: 'custom',
                      name: e.target.value,
                    })
                  }
                  placeholder="Contoh: Tema Bank Indonesia / Dinas Koperasi"
                  className="w-full rounded-xl border border-[#1F3A5F]/25 px-3.5 py-2 text-sm font-bold text-[#1F3A5F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Primary Color */}
                <div className="rounded-xl border border-[#1F3A5F]/15 p-4 bg-[#FFF7EC]/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F]">
                      1. Warna Utama (Primary)
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Default: #1F3A5F
                    </span>
                  </div>
                  <p className="text-xs text-[#1F3A5F]/75">
                    Mengatur warna <strong>Header Atas, Slide Sampul, Judul Utama, & Teks</strong>.
                  </p>
                  <div className="flex items-center gap-2.5 pt-1">
                    <input
                      type="color"
                      value={
                        /^#[0-9A-Fa-f]{6}$/.test(brandTheme.primaryColor)
                          ? brandTheme.primaryColor
                          : '#1F3A5F'
                      }
                      onChange={(e) =>
                        setBrandTheme({
                          ...brandTheme,
                          presetId: 'custom',
                          primaryColor: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer bg-white p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={brandTheme.primaryColor}
                      onChange={(e) =>
                        setBrandTheme({
                          ...brandTheme,
                          presetId: 'custom',
                          primaryColor: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full rounded-lg border border-[#1F3A5F]/25 bg-white px-3 py-2 font-mono text-sm font-bold text-[#1F3A5F]"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div className="rounded-xl border border-[#1F3A5F]/15 p-4 bg-[#FFF7EC]/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F28C28]">
                      2. Warna Aksen (Footer & CTA)
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Default: #F28C28
                    </span>
                  </div>
                  <p className="text-xs text-[#1F3A5F]/75">
                    Mengatur warna <strong>Bilah Footer Slide, Tombol Utama, & Kartu Kanban 1</strong>.
                  </p>
                  <div className="flex items-center gap-2.5 pt-1">
                    <input
                      type="color"
                      value={
                        /^#[0-9A-Fa-f]{6}$/.test(brandTheme.accentColor)
                          ? brandTheme.accentColor
                          : '#F28C28'
                      }
                      onChange={(e) =>
                        setBrandTheme({
                          ...brandTheme,
                          presetId: 'custom',
                          accentColor: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer bg-white p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={brandTheme.accentColor}
                      onChange={(e) =>
                        setBrandTheme({
                          ...brandTheme,
                          presetId: 'custom',
                          accentColor: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full rounded-lg border border-[#1F3A5F]/25 bg-white px-3 py-2 font-mono text-sm font-bold text-[#1F3A5F]"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="rounded-xl border border-[#1F3A5F]/15 p-4 bg-[#FFF7EC]/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2A9D8F]">
                      3. Warna Sekunder (Pendukung)
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Default: #2A9D8F
                    </span>
                  </div>
                  <p className="text-xs text-[#1F3A5F]/75">
                    Mengatur warna <strong>Kartu Kanban 2, Grafik Polling, & Tombol Simpan</strong>.
                  </p>
                  <div className="flex items-center gap-2.5 pt-1">
                    <input
                      type="color"
                      value={
                        /^#[0-9A-Fa-f]{6}$/.test(brandTheme.secondaryColor)
                          ? brandTheme.secondaryColor
                          : '#2A9D8F'
                      }
                      onChange={(e) =>
                        setBrandTheme({
                          ...brandTheme,
                          presetId: 'custom',
                          secondaryColor: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer bg-white p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={brandTheme.secondaryColor}
                      onChange={(e) =>
                        setBrandTheme({
                          ...brandTheme,
                          presetId: 'custom',
                          secondaryColor: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full rounded-lg border border-[#1F3A5F]/25 bg-white px-3 py-2 font-mono text-sm font-bold text-[#1F3A5F]"
                    />
                  </div>
                </div>

                {/* Background Canvas Color */}
                <div className="rounded-xl border border-[#1F3A5F]/15 p-4 bg-[#FFF7EC]/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F]">
                      4. Warna Latar Kanvas
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Default: #FFF7EC
                    </span>
                  </div>
                  <p className="text-xs text-[#1F3A5F]/75">
                    Mengatur warna <strong>Latar Belakang Kanvas Slide, Proyektor & HP Peserta</strong>.
                  </p>
                  <div className="flex items-center gap-2.5 pt-1">
                    <input
                      type="color"
                      value={
                        /^#[0-9A-Fa-f]{6}$/.test(brandTheme.bgColor)
                          ? brandTheme.bgColor
                          : '#FFF7EC'
                      }
                      onChange={(e) =>
                        setBrandTheme({
                          ...brandTheme,
                          presetId: 'custom',
                          bgColor: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer bg-white p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={brandTheme.bgColor}
                      onChange={(e) =>
                        setBrandTheme({
                          ...brandTheme,
                          presetId: 'custom',
                          bgColor: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full rounded-lg border border-[#1F3A5F]/25 bg-white px-3 py-2 font-mono text-sm font-bold text-[#1F3A5F]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Real-Time Mini Slide & Participant Phone Preview */}
            <div className="lg:col-span-5 bg-white border border-[#1F3A5F]/15 rounded-2xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-[#1F3A5F]">
                    Pratinjau Langsung (Live Preview)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#2A9D8F]/15 text-[#2A9D8F] text-xs font-bold">
                    Real-Time
                  </span>
                </div>

                {/* Mini Slide Stage Preview */}
                <div className="rounded-xl overflow-hidden border-2 border-[#1F3A5F]/25 bg-[#FFF7EC] shadow-xs">
                  {/* Slide Header Bar */}
                  <div className="bg-[#1F3A5F] text-white px-4 py-3 flex items-center justify-between">
                    <span className="font-display font-bold text-sm truncate">
                      {seminarTitle || 'Judul Materi Slide'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#F28C28] text-white text-[10px] font-bold shrink-0">
                      BAGIAN 1
                    </span>
                  </div>

                  {/* Slide Body with 2 Dynamic Kanban Cards */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-white rounded-lg p-3 border border-[#1F3A5F]/10 border-t-4 border-t-[#F28C28] shadow-2xs">
                        <p className="font-display font-bold text-xs text-[#F28C28] mb-1">
                          1. Kartu Aksen Utama
                        </p>
                        <p className="text-[11px] text-[#1F3A5F]/85 leading-snug">
                          Tampilan kartu Kanban dengan warna aksen pertama.
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-[#1F3A5F]/10 border-t-4 border-t-[#2A9D8F] shadow-2xs">
                        <p className="font-display font-bold text-xs text-[#2A9D8F] mb-1">
                          2. Kartu Bukti Sekunder
                        </p>
                        <p className="text-[11px] text-[#1F3A5F]/85 leading-snug">
                          Tampilan kartu Kanban dengan warna sekunder.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-[#1F3A5F] text-white px-3 py-2 text-[11px] font-semibold flex items-center justify-between">
                      <span>Pita Pesan Kunci & Tombol HP Peserta</span>
                      <span className="px-2 py-0.5 rounded bg-[#F28C28] text-white font-bold text-[10px]">
                        Kirim Jawaban
                      </span>
                    </div>
                  </div>

                  {/* Slide Footer Brand Strip */}
                  <div className="bg-[#F28C28] text-white px-4 py-2 flex items-center justify-between text-[11px] font-bold">
                    <span className="truncate">{organizerName}</span>
                    <span className="font-mono">Hal 1 / {slides.length}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[#FFF7EC] border border-[#1F3A5F]/15 p-3.5 text-xs text-[#1F3A5F]/80 space-y-1">
                <p className="font-bold text-[#1F3A5F]">
                  💡 Tips Duplikasi Materi Antar Organisasi:
                </p>
                <p>
                  Saat Anda klik <strong>Ekspor JSON</strong> di atas, pengaturan warna tema ini ikut tersimpan di dalam file <code>.json</code> organisasi tersebut.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-EDITOR 1: PERTANYAAN LEMBAR KERJA */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#1F3A5F]/80">
              Daftar pertanyaan ini akan tampil berurutan di HP Peserta dan Layar Proyektor. Anda bebas menambah, mengurangi, atau mengubah isinya.
            </p>
            <button
              type="button"
              onClick={addQuestion}
              className="px-4 py-2.5 rounded-xl bg-[#F28C28] hover:bg-[#d97719] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pertanyaan Baru</span>
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-5 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-[#1F3A5F]/10 pb-3">
                  <span className="font-display font-bold text-base text-[#F28C28]">
                    Pertanyaan #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveQuestion(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg border border-[#1F3A5F]/15 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      title="Geser ke Atas"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(idx, 1)}
                      disabled={idx === questions.length - 1}
                      className="p-1.5 rounded-lg border border-[#1F3A5F]/15 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      title="Geser ke Bawah"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      disabled={questions.length <= 1}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30 cursor-pointer ml-2"
                      title="Hapus Pertanyaan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                      Judul Bagian Materi (Contoh: 1. Kenalan dengan Usahamu)
                    </label>
                    <input
                      type="text"
                      value={q.sectionTitle}
                      onChange={(e) => updateQuestionField(idx, 'sectionTitle', e.target.value)}
                      className="w-full rounded-lg border border-[#1F3A5F]/25 px-3 py-2 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                      Inti Pembelajaran Singkat
                    </label>
                    <input
                      type="text"
                      value={q.coreLearning}
                      onChange={(e) => updateQuestionField(idx, 'coreLearning', e.target.value)}
                      className="w-full rounded-lg border border-[#1F3A5F]/25 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                    Kalimat Pertanyaan Utama (Tampil Besar di Proyektor & HP Peserta)
                  </label>
                  <input
                    type="text"
                    value={q.questionText}
                    onChange={(e) => updateQuestionField(idx, 'questionText', e.target.value)}
                    className="w-full rounded-lg border-2 border-[#1F3A5F]/30 px-3.5 py-2.5 text-base font-bold text-[#1F3A5F]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                      Pertanyaan Tambahan / Sub-Petunjuk (Opsional)
                    </label>
                    <input
                      type="text"
                      value={q.secondaryPrompt || ''}
                      onChange={(e) => updateQuestionField(idx, 'secondaryPrompt', e.target.value)}
                      className="w-full rounded-lg border border-[#1F3A5F]/25 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2A9D8F] mb-1">
                      Contoh Jawaban (Agar Peserta Pemula Paham)
                    </label>
                    <input
                      type="text"
                      value={q.exampleAnswer}
                      onChange={(e) => updateQuestionField(idx, 'exampleAnswer', e.target.value)}
                      className="w-full rounded-lg border border-[#2A9D8F]/40 bg-[#FFF7EC]/50 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-EDITOR 2: MATERI SLIDE PRESENTASI */}
      {activeTab === 'slides' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#1F3A5F]/80">
              Atur halaman slide presentasi Anda. Setiap slide dapat dihubungkan ke Pertanyaan Lembar Kerja atau Live Polling tertentu.
            </p>
            <button
              type="button"
              onClick={addSlide}
              className="px-4 py-2.5 rounded-xl bg-[#F28C28] hover:bg-[#d97719] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Slide Baru</span>
            </button>
          </div>

          <div className="space-y-4">
            {slides.map((s, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-5 space-y-4 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F3A5F]/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-[#1F3A5F] text-white font-mono text-xs font-bold tabular-nums">
                      Slide #{idx + 1}
                    </span>
                    <span className="font-display font-bold text-base text-[#1F3A5F]">
                      {s.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveSlide(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg border border-[#1F3A5F]/15 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSlide(idx, 1)}
                      disabled={idx === slides.length - 1}
                      className="p-1.5 rounded-lg border border-[#1F3A5F]/15 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSlide(idx)}
                      disabled={slides.length <= 1}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30 cursor-pointer ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                      Label Pojok Kanan (Badge)
                    </label>
                    <input
                      type="text"
                      value={s.badge}
                      onChange={(e) => updateSlideField(idx, 'badge', e.target.value)}
                      placeholder="Contoh: BAGIAN 1 / PEMBUKA"
                      className="w-full rounded-lg border border-[#1F3A5F]/25 px-3 py-2 text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                      Tipe Tata Letak Slide
                    </label>
                    <select
                      value={s.type}
                      onChange={(e) => updateSlideField(idx, 'type', e.target.value)}
                      className="w-full rounded-lg border border-[#1F3A5F]/25 px-3 py-2 text-sm font-semibold bg-white"
                    >
                      <option value="cover">Sampul Depan (Navy Penuh)</option>
                      <option value="agenda">Agenda Daftar Bagian</option>
                      <option value="concept">Materi & Konsep</option>
                      <option value="worksheet">Slide Latihan ("TULIS DI SINI")</option>
                      <option value="comparison">Perbandingan 2 Kolom (Lemah vs Kuat)</option>
                      <option value="formula">Rumus & Contoh Sebelum/Sesudah</option>
                      <option value="closing">Slide Penutup & Sesi Q&A</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#F28C28] mb-1">
                      Hubungkan ke Pertanyaan HP Peserta
                    </label>
                    <select
                      value={s.linkedQuestionIndex !== undefined ? s.linkedQuestionIndex : 'none'}
                      onChange={(e) =>
                        updateSlideField(
                          idx,
                          'linkedQuestionIndex',
                          e.target.value === 'none' ? undefined : Number(e.target.value)
                        )
                      }
                      className="w-full rounded-lg border border-[#F28C28]/50 bg-[#FFF7EC]/50 px-3 py-2 text-sm font-semibold"
                    >
                      <option value="none">-- Tidak Terhubung Pertanyaan --</option>
                      {questions.map((q, qIdx) => (
                        <option key={qIdx} value={qIdx}>
                          Pertanyaan #{qIdx + 1}: {q.sectionTitle}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                      Judul Utama Slide
                    </label>
                    <input
                      type="text"
                      value={s.title}
                      onChange={(e) => updateSlideField(idx, 'title', e.target.value)}
                      className="w-full rounded-lg border border-[#1F3A5F]/25 px-3 py-2 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                      Sub-Judul / Kalimat Penjelasan Atas (Opsional)
                    </label>
                    <input
                      type="text"
                      value={s.subtitle || ''}
                      onChange={(e) => updateSlideField(idx, 'subtitle', e.target.value)}
                      className="w-full rounded-lg border border-[#1F3A5F]/25 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                      Pita Pesan Kunci Bawah / Rumus (Opsional)
                    </label>
                    <input
                      type="text"
                      value={s.bottomBanner || ''}
                      onChange={(e) => updateSlideField(idx, 'bottomBanner', e.target.value)}
                      placeholder="Contoh: Pilih 1-2 manfaat utama saja."
                      className="w-full rounded-lg border border-[#1F3A5F]/25 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2A9D8F] mb-1">
                      Hubungkan ke Live Polling (Opsional)
                    </label>
                    <select
                      value={s.linkedPollId || 'none'}
                      onChange={(e) =>
                        updateSlideField(
                          idx,
                          'linkedPollId',
                          e.target.value === 'none' ? undefined : e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-[#2A9D8F]/40 bg-white px-3 py-2 text-sm font-semibold"
                    >
                      <option value="none">-- Tidak Terhubung Polling --</option>
                      {polls.map((p) => (
                        <option key={p.id} value={p.id}>
                          Polling: {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Kanban Cards Editor inside Slide */}
                <div className="border-t border-[#1F3A5F]/10 pt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F]/75">
                        Kartu Kanban pada Slide Ini ({(s.cards || []).length} / Maks 5 Kartu)
                      </span>
                      <p className="text-[11px] text-[#1F3A5F]/60">
                        Ukuran kartu & huruf di layar otomatis menyesuaikan jumlah kartu (1–3 kartu = Jumbo, 4–5 kartu = Proporsional).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addSlideCard(idx)}
                      disabled={(s.cards || []).length >= 5}
                      className="px-3 py-1.5 rounded-lg bg-[#FFF7EC] border border-[#F28C28]/40 hover:bg-[#F28C28] text-[#1F3A5F] hover:text-white text-xs font-bold flex items-center gap-1 disabled:opacity-40 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Kartu Kanban</span>
                    </button>
                  </div>

                  {(s.cards || []).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(s.cards || []).map((card, cIdx) => (
                        <div
                          key={cIdx}
                          className="rounded-xl bg-[#FFF7EC]/60 border border-[#1F3A5F]/15 p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#1F3A5F]">
                              Kartu #{cIdx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <select
                                value={card.accent || 'orange'}
                                onChange={(e) =>
                                  updateSlideCard(idx, cIdx, 'accent', e.target.value)
                                }
                                className="rounded border border-[#1F3A5F]/20 bg-white px-2 py-1 text-xs font-semibold"
                              >
                                <option value="orange">Aksen Utama (Oranye/CTA)</option>
                                <option value="teal">Aksen Sekunder (Teal)</option>
                                <option value="navy">Aksen Utama Gelap (Navy)</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => removeSlideCard(idx, cIdx)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                title="Hapus Kartu"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={card.title}
                            onChange={(e) =>
                              updateSlideCard(idx, cIdx, 'title', e.target.value)
                            }
                            placeholder="Judul Kartu Kanban"
                            className="w-full rounded-lg border border-[#1F3A5F]/20 bg-white px-2.5 py-1.5 text-xs font-bold"
                          />
                          <textarea
                            rows={2}
                            value={card.body}
                            onChange={(e) =>
                              updateSlideCard(idx, cIdx, 'body', e.target.value)
                            }
                            placeholder="Isi penjelasan kartu (pisahkan baris dengan Enter)"
                            className="w-full rounded-lg border border-[#1F3A5F]/20 bg-white px-2.5 py-1.5 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Foto / Gambar Visual Slide (Opsional) */}
                <div className="border-t border-[#1F3A5F]/10 pt-4 space-y-3 bg-[#FFF7EC]/40 p-3.5 sm:p-4 rounded-xl border border-[#1F3A5F]/15">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#2A9D8F]/15 text-[#2A9D8F] flex items-center justify-center shrink-0">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F]">
                          Foto / Gambar Visual Slide (Opsional)
                        </span>
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#2A9D8F]/15 text-[#2A9D8F]">
                          {s.imageUrl ? '✓ Foto Terpasang' : 'Opsional (Bisa Dikosongkan)'}
                        </span>
                      </div>
                    </div>

                    {s.imageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          updateSlideField(idx, 'imageUrl', undefined);
                          updateSlideField(idx, 'imageCaption', undefined);
                          updateSlideField(idx, 'imagePosition', undefined);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Hapus foto dan kembalikan ke layout teks asli"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Foto (Kembalikan Asli)</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-[#1F3A5F]/75">
                    Tambahkan foto produk, etalase toko, bagan, atau dokumentasi nyata untuk membuat slide lebih hidup. Slide tanpa foto tetap tampil normal 100% seperti semula.
                  </p>

                  {s.imageUrl ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white p-3.5 rounded-xl border border-[#1F3A5F]/20">
                      <div className="md:col-span-4 relative group">
                        <img
                          src={s.imageUrl}
                          alt={s.imageCaption || s.title}
                          className="w-full h-36 object-cover rounded-lg border border-[#1F3A5F]/15 shadow-xs"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-xs font-bold pointer-events-none">
                          Foto Aktif
                        </div>
                      </div>

                      <div className="md:col-span-8 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                              Tata Letak / Posisi Foto
                            </label>
                            <select
                              value={s.imagePosition || 'right'}
                              onChange={(e) => updateSlideField(idx, 'imagePosition', e.target.value)}
                              className="w-full rounded-lg border border-[#1F3A5F]/25 px-2.5 py-1.5 text-xs font-semibold bg-white"
                            >
                              <option value="right">Samping Kanan (Split 50:50)</option>
                              <option value="left">Samping Kiri (Split 50:50)</option>
                              <option value="top">Banner Atas (Foto Lebar di Atas Poin)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                              Ganti File / Unggah Ulang
                            </label>
                            <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#1F3A5F] text-xs font-bold border border-[#1F3A5F]/20 cursor-pointer">
                              <UploadCloud className="w-3.5 h-3.5 text-[#2A9D8F]" />
                              <span>Pilih Foto Baru</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const compressed = await compressImageFile(file);
                                      updateSlideField(idx, 'imageUrl', compressed);
                                    } catch (err) {
                                      console.error('Failed to compress image:', err);
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                            Keterangan Foto / Sumber (Opsional Caption)
                          </label>
                          <input
                            type="text"
                            value={s.imageCaption || ''}
                            onChange={(e) => updateSlideField(idx, 'imageCaption', e.target.value)}
                            placeholder="Contoh: Studi Kasus: Kemasan Vakum UMKM Keripik Tempe dengan Label Kedaluwarsa Jelas"
                            className="w-full rounded-lg border border-[#1F3A5F]/25 px-3 py-1.5 text-xs font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#2A9D8F]/50 hover:border-[#2A9D8F] bg-white rounded-xl cursor-pointer transition-all hover:bg-[#E3F5F2]/30 text-center">
                          <UploadCloud className="w-6 h-6 text-[#2A9D8F] mb-1.5" />
                          <span className="text-xs font-bold text-[#1F3A5F]">
                            Unggah Foto dari Galeri HP / Laptop
                          </span>
                          <span className="text-[11px] text-[#1F3A5F]/60 mt-0.5">
                            Otomatis dikompres aman & cepat untuk web (JPG, PNG, WebP)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const compressed = await compressImageFile(file);
                                  updateSlideField(idx, 'imageUrl', compressed);
                                  if (!s.imagePosition) updateSlideField(idx, 'imagePosition', 'right');
                                } catch (err) {
                                  console.error('Failed to compress image:', err);
                                }
                              }
                            }}
                          />
                        </label>

                        <div className="p-3.5 bg-white rounded-xl border border-[#1F3A5F]/15 flex flex-col justify-between space-y-2">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F3A5F]">
                              <LinkIcon className="w-3.5 h-3.5 text-[#F28C28]" />
                              <span>Atau Tempel Tautan Gambar (Link URL)</span>
                            </div>
                            <p className="text-[11px] text-[#1F3A5F]/65 mt-0.5">
                              Masukkan link gambar dari internet atau cloud storage.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              placeholder="https://images.unsplash.com/... atau URL foto"
                              className="flex-1 rounded-lg border border-[#1F3A5F]/25 px-2.5 py-1.5 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = (e.currentTarget.value || '').trim();
                                  if (val) {
                                    updateSlideField(idx, 'imageUrl', val);
                                    if (!s.imagePosition) updateSlideField(idx, 'imagePosition', 'right');
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const val = (e.target.value || '').trim();
                                if (val) {
                                  updateSlideField(idx, 'imageUrl', val);
                                  if (!s.imagePosition) updateSlideField(idx, 'imagePosition', 'right');
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[11px] font-bold text-[#1F3A5F]/65 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#F28C28]" />
                          Coba Foto Contoh:
                        </span>
                        {SAMPLE_SLIDE_IMAGES.map((sample, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => {
                              updateSlideField(idx, 'imageUrl', sample.url);
                              updateSlideField(idx, 'imageCaption', sample.caption);
                              updateSlideField(idx, 'imagePosition', 'right');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#1F3A5F]/20 hover:border-[#2A9D8F] hover:bg-[#E3F5F2]/40 text-[#1F3A5F] text-[11px] font-semibold cursor-pointer transition-colors"
                          >
                            + {sample.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Speaker Notes (Contekan Pemateri) Editor */}
                <div className="border-t border-[#1F3A5F]/10 pt-3">
                  <label className="block text-xs font-bold text-[#1F3A5F]/80 mb-1">
                    Contekan Narasi Pemateri (Tampil di Mode Presenter Laptop & Remote HP)
                  </label>
                  <textarea
                    rows={2}
                    value={s.speakerNotes || ''}
                    onChange={(e) => updateSlideField(idx, 'speakerNotes', e.target.value)}
                    placeholder="Tuliskan poin panduan bicara atau studi kasus untuk slide ini..."
                    className="w-full rounded-lg border border-[#1F3A5F]/25 bg-[#FFF7EC]/30 px-3 py-2 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-EDITOR 3: LIVE POLLING & AWAN KATA */}
      {activeTab === 'polls' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#1F3A5F]/80">
              Buat sesi *polling* pilihan ganda (Grafik Batang) atau *Awan Kata* (*Word Cloud*) seperti Mentimeter.
            </p>
            <button
              type="button"
              onClick={addPoll}
              className="px-4 py-2.5 rounded-xl bg-[#2A9D8F] hover:bg-[#218276] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Polling Baru</span>
            </button>
          </div>

          <div className="space-y-5">
            {polls.map((poll, pIdx) => (
              <div
                key={poll.id}
                className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-6 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-[#1F3A5F]/10 pb-3">
                  <span className="font-display font-bold text-base text-[#2A9D8F]">
                    Polling #{pIdx + 1} (ID: {poll.id})
                  </span>
                  <button
                    type="button"
                    onClick={() => removePoll(pIdx)}
                    disabled={polls.length <= 1}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                      Judul Pertanyaan Polling
                    </label>
                    <input
                      type="text"
                      value={poll.title}
                      onChange={(e) => updatePollField(pIdx, 'title', e.target.value)}
                      className="w-full rounded-lg border border-[#1F3A5F]/25 px-3 py-2 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                      Tipe Visualisasi Proyektor
                    </label>
                    <select
                      value={poll.type}
                      onChange={(e) =>
                        updatePollField(pIdx, 'type', e.target.value as 'bar' | 'wordcloud')
                      }
                      className="w-full rounded-lg border border-[#1F3A5F]/25 px-3 py-2 text-sm font-semibold bg-white"
                    >
                      <option value="bar">Grafik Batang (Bar Chart)</option>
                      <option value="wordcloud">Grafik + Awan Kata (Bisa Input Kata Bebas)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                    Sub-Judul / Instruksi untuk Peserta
                  </label>
                  <input
                    type="text"
                    value={poll.subtitle}
                    onChange={(e) => updatePollField(pIdx, 'subtitle', e.target.value)}
                    className="w-full rounded-lg border border-[#1F3A5F]/25 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-[#1F3A5F]/70">
                      Daftar Opsi Pilihan ({poll.options.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => addPollOption(pIdx)}
                      className="text-xs font-bold text-[#2A9D8F] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Opsi Pilihan</span>
                    </button>
                  </div>

                  {poll.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-[#FFF7EC]/60 p-3 rounded-xl border border-[#1F3A5F]/10"
                    >
                      <div className="md:col-span-5">
                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) =>
                            updatePollOption(pIdx, oIdx, 'label', e.target.value)
                          }
                          placeholder="Label Pilihan Utama"
                          className="w-full rounded-lg border border-[#1F3A5F]/20 bg-white px-3 py-1.5 text-sm font-bold"
                        />
                      </div>
                      <div className="md:col-span-6">
                        <input
                          type="text"
                          value={opt.subtitle}
                          onChange={(e) =>
                            updatePollOption(pIdx, oIdx, 'subtitle', e.target.value)
                          }
                          placeholder="Penjelasan / contoh singkat"
                          className="w-full rounded-lg border border-[#1F3A5F]/20 bg-white px-3 py-1.5 text-xs"
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removePollOption(pIdx, oIdx)}
                          disabled={poll.options.length <= 1}
                          className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-EDITOR 4: TOPIK KATEGORI Q&A */}
      {activeTab === 'qna' && (
        <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-6 max-w-3xl space-y-5">
          <div>
            <h2 className="font-display text-xl font-bold text-[#1F3A5F]">
              Daftar Kategori Topik Tanya-Jawab (Q&A)
            </h2>
            <p className="text-sm text-[#1F3A5F]/75 mt-1">
              Kategori ini muncul pada pilihan *dropdown* saat peserta mengirim pertanyaan anonim di HP mereka.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              maxLength={35}
              value={newTopicInput}
              onChange={(e) => setNewTopicInput(e.target.value)}
              placeholder="Ketik topik baru (misal: Izin Edar & Halal, Foto Produk...)"
              className="flex-1 rounded-xl border border-[#1F3A5F]/25 px-4 py-2.5 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                if (!newTopicInput.trim()) return;
                setQnaTopics([...qnaTopics, newTopicInput.trim()]);
                setNewTopicInput('');
              }}
              className="px-4 py-2.5 rounded-xl bg-[#F28C28] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Topik</span>
            </button>
          </div>

          <div className="space-y-2">
            {qnaTopics.map((topic, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#FFF7EC] border border-[#1F3A5F]/15"
              >
                <span className="font-bold text-sm text-[#1F3A5F]">{topic}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (qnaTopics.length <= 1) return;
                    setQnaTopics(qnaTopics.filter((_, i) => i !== idx));
                  }}
                  disabled={qnaTopics.length <= 1}
                  className="text-xs font-bold text-red-600 hover:underline disabled:opacity-30 cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-EDITOR 5: PANDUAN MENYELURUH & PROSEDUR DUPLIKASI */}
      {activeTab === 'guide' && (
        <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F3A5F]/15">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#F28C28] uppercase tracking-wider block">
                Buku Manual Resmi & SOP Duplikasi
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1F3A5F]">
                Panduan Menyeluruh Web Apps & Duplikasi Sistem
              </h2>
              <p className="text-xs sm:text-sm text-[#1F3A5F]/75">
                Pelajari latar belakang, arsitektur engine, istilah teknis UI, cara pakai 4-titik, dan cara duplikasi ke akun Google lain.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  printSystemDocumentationGuide({
                    seminarTitle,
                    organizerName,
                    brandTheme,
                  })
                }
                className="px-4 py-2.5 rounded-xl bg-[#F28C28] hover:bg-[#d97719] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF Panduan (A4)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#FFF7EC] border border-[#F28C28]/30 space-y-2">
              <h3 className="font-bold text-sm text-[#1F3A5F]">Metode 1: Duplikasi di Akun Google yang Sama</h3>
              <p className="text-xs text-[#1F3A5F]/80">
                Gunakan menu <strong>Copy App / Duplicate</strong> di dasbor Google AI Studio. Anda akan mendapatkan aplikasi baru dengan database Firestore terpisah yang siap diubah materinya tanpa mengganggu seminar saat ini.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FFF7EC] border border-[#F28C28]/30 space-y-2">
              <h3 className="font-bold text-sm text-[#1F3A5F]">Metode 2: Pindah ke Akun Lain via GitHub</h3>
              <p className="text-xs text-[#1F3A5F]/80">
                Klik <strong>Export to GitHub</strong> di pojok kanan atas AI Studio. Di akun Google kedua, pilih <strong>Import from GitHub</strong> lalu minta AI di akun kedua untuk setup Firebase Firestore baru.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-700">
              Dokumen PDF lengkap memuat 5 Bab resmi, cover standar institusi, daftar isi, diagram arsitektur, dan SOP panggung.
            </div>
            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="px-3.5 py-2 rounded-lg bg-[#1F3A5F] text-white text-xs font-bold hover:bg-[#152740] cursor-pointer whitespace-nowrap"
              >
                Buka Modal Pembaca Lengkap
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
