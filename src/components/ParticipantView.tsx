import React, { useState, useEffect } from 'react';
import {
  WorksheetQuestion,
  LivePollConfig,
  SlideDefinition,
  RATIONAL_CONVERSION_DICTIONARY,
  FORBIDDEN_VAGUE_WORDS,
  VP_THREE_TESTS,
  ZERO_CERT_PROOFS,
} from '../data/seminarData';
import {
  AnswerDoc,
  QnaDoc,
  PollVoteDoc,
  SessionStateDoc,
  InteractiveMode,
  BrandThemeConfig,
} from '../types';
import { PWAInstallModalTrigger } from './PWAInstallButton';
import {
  printSlideDeckHandout,
  printParticipantWorkbookHandout,
  downloadParticipantTxtHandout,
  buildWhatsAppShareUrl,
} from '../utils/handoutExport';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  Sparkles,
  BookOpen,
  BarChart3,
  MessageSquare,
  Download,
  UserCheck,
  EyeOff,
  Store,
  Copy,
  Check,
  Instagram,
  MessageCircle,
  Tag,
  HelpCircle,
  Printer,
  Share2,
  Presentation,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';

interface ParticipantViewProps {
  questions: WorksheetQuestion[];
  polls: LivePollConfig[];
  slides: SlideDefinition[];
  seminarTitle: string;
  organizerName: string;
  brandTheme?: BrandThemeConfig;
  qnaTopics: string[];
  sessionState: SessionStateDoc;
  participantId: string;
  myAnswers: AnswerDoc[];
  approvedQna: QnaDoc[];
  pollVotes: PollVoteDoc[];
  onSubmitAnswer: (qIndex: number, text: string, subText: string, businessName: string) => Promise<void>;
  onSubmitQna: (text: string, authorName: string, isAnonymous: boolean, topicTag: string) => Promise<void>;
  onUpvoteQna: (qnaId: string) => Promise<void>;
  onSubmitPollVote: (pollId: string, optionId: string, customWord: string, businessName: string) => Promise<void>;
}

export const ParticipantView: React.FC<ParticipantViewProps> = ({
  questions,
  polls,
  slides,
  seminarTitle,
  organizerName,
  brandTheme,
  qnaTopics,
  sessionState,
  participantId,
  myAnswers,
  approvedQna,
  pollVotes,
  onSubmitAnswer,
  onSubmitQna,
  onUpvoteQna,
  onSubmitPollVote,
}) => {
  const [localTab, setLocalTab] = useState<InteractiveMode | 'summary' | 'slides_reader'>(
    sessionState.activeMode
  );
  const [readerSlideIdx, setReaderSlideIdx] = useState<number>(0);

  useEffect(() => {
    setLocalTab(sessionState.activeMode);
  }, [sessionState.activeMode, sessionState.activeQuestion, sessionState.activePollId]);

  const [businessName, setBusinessName] = useState<string>(() => {
    try {
      return window.localStorage.getItem('partnerup_umkm_name') || '';
    } catch {
      return '';
    }
  });

  const handleBusinessNameChange = (val: string) => {
    const trimmed = val.slice(0, 40);
    setBusinessName(trimmed);
    try {
      window.localStorage.setItem('partnerup_umkm_name', trimmed);
    } catch {
      // ignore
    }
  };

  const activeQIndex = Math.min(sessionState.activeQuestion, Math.max(0, questions.length - 1));
  const currentQuestion = questions[activeQIndex] || questions[0];

  const [answerText, setAnswerText] = useState('');
  const [subAnswerText, setSubAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [showConversionGuide, setShowConversionGuide] = useState(true);

  // Copy states for Bio IG / WA Chat / Sticker Generator
  const [copiedType, setCopiedType] = useState<'ig' | 'wa' | 'sticker' | 'vp' | null>(null);

  useEffect(() => {
    setAnswerText('');
    setSubAnswerText('');
    setSubmitSuccess(false);
    setSubmitError(false);
  }, [activeQIndex]);

  const getMyPreviousAnswer = (qIdx: number) => {
    const found = myAnswers.find((a) => a.q === qIdx);
    return found ? found.text : '';
  };

  const handleAutoFillPart6Formula = () => {
    const prod = getMyPreviousAnswer(0) || '[Nama Produk Andalan]';
    const buyer = getMyPreviousAnswer(1) || '[Target Pembeli Spesifik]';
    const rational = getMyPreviousAnswer(3) || '[Bukti Angka / Keunggulan]';
    const emotional = getMyPreviousAnswer(4) || '[Perasaan Pembeli]';
    const drafted = `${prod} untuk ${buyer} yang ingin ${emotional}, karena ${rational}.`.slice(0, 200);
    setAnswerText(drafted);
  };

  const handleInsertChip = (chipText: string) => {
    setAnswerText((prev) => {
      if (!prev.trim()) return chipText;
      return `${prev.trim()}, ${chipText}`.slice(0, 200);
    });
  };

  const handleCopyText = async (text: string, type: 'ig' | 'wa' | 'sticker' | 'vp') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      // Fallback copy
    }
  };

  const handleWorksheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || submitting) return;
    setSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(false);
    try {
      await onSubmitAnswer(
        activeQIndex,
        answerText.trim().slice(0, 200),
        subAnswerText.trim().slice(0, 180),
        businessName.trim().slice(0, 40)
      );
      setAnswerText('');
      setSubAnswerText('');
      setSubmitSuccess(true);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Q&A Form State
  const [qnaText, setQnaText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [topicTag, setTopicTag] = useState(qnaTopics[0] || 'Umum');
  const [qnaSubmitting, setQnaSubmitting] = useState(false);
  const [qnaSuccess, setQnaSuccess] = useState(false);
  const [upvotedIds, setUpvotedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (qnaTopics.length > 0 && !qnaTopics.includes(topicTag)) {
      setTopicTag(qnaTopics[0]);
    }
  }, [qnaTopics, topicTag]);

  const handleQnaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qnaText.trim() || qnaSubmitting) return;
    setQnaSubmitting(true);
    setQnaSuccess(false);
    try {
      const displayAuthor = isAnonymous ? 'Peserta Anonim' : businessName.trim() || 'Peserta UMKM';
      await onSubmitQna(qnaText.trim().slice(0, 240), displayAuthor, isAnonymous, topicTag);
      setQnaText('');
      setQnaSuccess(true);
    } finally {
      setQnaSubmitting(false);
    }
  };

  const handleUpvoteTap = async (id: string) => {
    if (upvotedIds[id]) return;
    setUpvotedIds((prev) => ({ ...prev, [id]: true }));
    await onUpvoteQna(id);
  };

  // Poll State
  const currentPoll = polls.find((p) => p.id === sessionState.activePollId) || polls[0];
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customEmotionWord, setCustomEmotionWord] = useState<string>('');
  const [pollSubmitted, setPollSubmitted] = useState(false);

  const myExistingVote = currentPoll
    ? pollVotes.find((v) => v.pollId === currentPoll.id && v.participantId === participantId)
    : undefined;

  const handlePollVoteSubmit = async (optionId: string, customWord = '') => {
    if (!currentPoll) return;
    setSelectedOption(optionId);
    await onSubmitPollVote(currentPoll.id, optionId, customWord.slice(0, 35), businessName);
    setPollSubmitted(true);
  };

  // Auto-Generated Marketing Kit Data from Participant's Answers (Parts 1 to 7)
  const umkmTitle = businessName.trim() || getMyPreviousAnswer(0) || 'Nama Usaha UMKM';
  const productInfo = getMyPreviousAnswer(0) || 'Produk Andalan Pilihan';
  const targetBuyer = getMyPreviousAnswer(1) || 'Pelanggan Setia & Keluarga';
  const rationalProof = getMyPreviousAnswer(3) || getMyPreviousAnswer(2) || 'Bahan Asli · Kualitas Terjamin · Harga Bersahabat';
  const emotionalFeeling = getMyPreviousAnswer(4) || 'Praktis, Tenang & Bikin Keluarga Senang';
  const finalVpSentence =
    getMyPreviousAnswer(5) ||
    `${productInfo} untuk ${targetBuyer} yang ingin ${emotionalFeeling}, karena ${rationalProof}.`;

  const generatedInstagramBio = `✨ ${umkmTitle}\n🎯 Solusi untuk: ${targetBuyer}\n✅ ${rationalProof}\n💛 ${emotionalFeeling}\n👇 Pesan sekarang via WhatsApp di bawah:`;

  const generatedWhatsappGreeting = `Halo Kak! 👋 Terima kasih sudah menghubungi *${umkmTitle}*.\n\nKami menyediakan ${finalVpSentence}\n\nAda varian atau paket yang ingin Kakak pesan untuk hari ini? 😊`;

  const generatedPackagingSticker = `${umkmTitle.toUpperCase()}\n"${emotionalFeeling}"\n• ${rationalProof} •`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Top Mode Selector Bar for Participant */}
      <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-2 mb-6 flex items-center justify-between gap-1 overflow-x-auto shadow-xs">
        <button
          onClick={() => setLocalTab('worksheet')}
          className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            localTab === 'worksheet'
              ? 'bg-[#1F3A5F] text-white'
              : 'text-[#1F3A5F]/75 hover:bg-[#1F3A5F]/5'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Lembar Kerja ({activeQIndex + 1}/{questions.length})</span>
        </button>

        <button
          onClick={() => setLocalTab('poll')}
          className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            localTab === 'poll'
              ? 'bg-[#2A9D8F] text-white'
              : 'text-[#1F3A5F]/75 hover:bg-[#1F3A5F]/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Polling Live</span>
        </button>

        <button
          onClick={() => setLocalTab('qna')}
          className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            localTab === 'qna'
              ? 'bg-[#F28C28] text-white'
              : 'text-[#1F3A5F]/75 hover:bg-[#1F3A5F]/5'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Tanya Anonim & Vote</span>
        </button>

        <button
          onClick={() => setLocalTab('summary')}
          className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            localTab === 'summary'
              ? 'bg-[#1F3A5F] text-white'
              : 'text-[#1F3A5F]/75 hover:bg-[#1F3A5F]/5'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Bio IG & Materi</span>
        </button>

        {sessionState.allowParticipantSlideAccess && (
          <button
            onClick={() => setLocalTab('slides_reader')}
            className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              localTab === 'slides_reader'
                ? 'bg-[#2A9D8F] text-white'
                : 'text-[#2A9D8F] bg-[#E3F5F2]/70 hover:bg-[#E3F5F2]'
            }`}
          >
            <Presentation className="w-4 h-4" />
            <span>Baca Slide ({slides.length})</span>
          </button>
        )}
      </div>

      {/* MODE 1: WORKSHEET */}
      {localTab === 'worksheet' && currentQuestion && (
        <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-[#1F3A5F]/10">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#F28C28]">
              <span>Pertanyaan {activeQIndex + 1} dari {questions.length}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#1F3A5F]">{currentQuestion.sectionTitle}</span>
            </div>
            <span className="text-xs text-[#1F3A5F]/65">{currentQuestion.coreLearning}</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1F3A5F] leading-snug mb-3">
            {currentQuestion.questionText}
          </h1>

          {currentQuestion.secondaryPrompt && (
            <p className="text-base sm:text-lg text-[#1F3A5F]/80 font-medium mb-5">
              {currentQuestion.secondaryPrompt}
            </p>
          )}

          <div className="rounded-xl bg-[#FFF7EC] border border-[#F28C28]/40 p-4 mb-5 space-y-2.5">
            <div>
              <p className="text-xs font-bold text-[#F28C28] uppercase tracking-wider mb-1">
                Contoh Jawaban Sederhana:
              </p>
              <p className="text-base sm:text-lg font-medium text-[#1F3A5F]">
                "{currentQuestion.exampleAnswer}"
              </p>
            </div>
            {currentQuestion.helperTips && currentQuestion.helperTips.length > 0 && (
              <div className="pt-2.5 border-t border-[#F28C28]/25 space-y-1 text-xs sm:text-sm text-[#1F3A5F]/85">
                <p className="font-bold text-[#1F3A5F]">Panduan & Studi Kasus Nyata:</p>
                {currentQuestion.helperTips.map((tip, idx) => (
                  <p key={idx} className="leading-relaxed">
                    • {tip}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* BUKTI TANPA SERTIFIKAT FORMAL (Khusus Bagian 4 - UMKM Pemula) */}
          {activeQIndex === 3 && (
            <div className="rounded-xl bg-[#FFF7EC] border border-[#1F3A5F]/15 p-4 mb-4 space-y-2">
              <p className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider">
                Belum Punya Sertifikat PIRT/Halal? Ketuk Bukti UMKM Pemula Ini:
              </p>
              <div className="flex flex-wrap gap-2">
                {ZERO_CERT_PROOFS.map((zp, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleInsertChip(zp.chipText)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#2A9D8F]/40 hover:border-[#F28C28] text-xs font-bold text-[#1F3A5F] cursor-pointer"
                  >
                    + {zp.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* KATA TERLARANG & KAMUS KONVERSI ANGKA INTERAKTIF (Khusus Bagian 3 & Bagian 4) */}
          {(activeQIndex === 2 || activeQIndex === 3) && (
            <div className="rounded-xl bg-[#E3F5F2] border border-[#2A9D8F]/40 p-4 mb-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs sm:text-sm font-bold text-[#1F3A5F] flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#2A9D8F] shrink-0" />
                  <span>Kamus Konversi: Ubah Kata Sifat Jadi Bukti Angka!</span>
                </p>
                <button
                  type="button"
                  onClick={() => setShowConversionGuide(!showConversionGuide)}
                  className="text-xs font-bold text-[#2A9D8F] hover:underline cursor-pointer"
                >
                  {showConversionGuide ? 'Sembunyikan' : 'Lihat Contekan'}
                </button>
              </div>

              {showConversionGuide && (
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-[#1F3A5F]/80">
                    Hindari kata umum seperti <strong>"Enak, Murah, Berkualitas"</strong>. Ketuk salah satu contoh bukti di bawah untuk langsung memasukkannya ke kolom jawabanmu:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {RATIONAL_CONVERSION_DICTIONARY.map((dict, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleInsertChip(dict.chipText)}
                        className="bg-white rounded-lg p-2.5 border border-[#2A9D8F]/30 hover:border-[#F28C28] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-red-700 line-through font-semibold">
                            Jangan: {dict.vagueWord}
                          </span>
                          <span className="font-bold text-[#F28C28]">+ Pakai Ini</span>
                        </div>
                        <p className="text-xs font-bold text-[#1F3A5F] mt-1">
                          {dict.concreteProof}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Smart Formula Builder & 3 Alat Uji VP on Question 6 (Index 5) */}
          {activeQIndex === 5 && questions.length >= 6 && (
            <div className="space-y-4 mb-6">
              <div className="rounded-xl bg-[#E3F5F2] border border-[#2A9D8F]/40 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[#1F3A5F] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#2A9D8F]" />
                    Bantuan Gabungkan Kalimat dari Jawabanmu Sebelumnya
                  </p>
                  <button
                    type="button"
                    onClick={handleAutoFillPart6Formula}
                    className="px-3 py-1.5 rounded-lg bg-[#2A9D8F] text-white text-xs font-bold hover:bg-[#218276] transition-colors cursor-pointer"
                  >
                    Susun Otomatis ke Kolom
                  </button>
                </div>
                <div className="text-xs text-[#1F3A5F]/80 space-y-1">
                  <p>
                    <strong>Bagian 1 (Produk):</strong> {getMyPreviousAnswer(0) || 'Belum diisi'}
                  </p>
                  <p>
                    <strong>Bagian 2 (Pembeli):</strong> {getMyPreviousAnswer(1) || 'Belum diisi'}
                  </p>
                  <p>
                    <strong>Bagian 4 (Bukti Angka):</strong> {getMyPreviousAnswer(3) || 'Belum diisi'}
                  </p>
                  <p>
                    <strong>Bagian 5 (Perasaan):</strong> {getMyPreviousAnswer(4) || 'Belum diisi'}
                  </p>
                </div>
              </div>

              {/* 3 Alat Uji Kalimat Value Proposition */}
              <div className="rounded-xl bg-[#FFF7EC] border border-[#F28C28]/40 p-4 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#F28C28]">
                  Uji Kalimatmu dengan 3 Pertanyaan Penguji Ini Sebelum Kirim:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {VP_THREE_TESTS.map((test, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg p-3 border border-[#1F3A5F]/10 space-y-1 text-xs"
                    >
                      <p className="font-bold text-[#1F3A5F]">{test.title}</p>
                      <p className="text-[#1F3A5F]/80">{test.question}</p>
                      <p className="font-semibold text-[#2A9D8F]">{test.passCriteria}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleWorksheetSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="answer-textarea" className="block text-base font-bold text-[#1F3A5F]">
                  Jawabanmu
                </label>
                <span className="font-mono text-xs text-[#1F3A5F]/60 tabular-nums">
                  {answerText.length} / 200 karakter
                </span>
              </div>
              <textarea
                id="answer-textarea"
                rows={3}
                maxLength={200}
                required
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Ketik jawaban singkat di sini (1 kalimat sudah cukup)..."
                className="w-full rounded-xl border-2 border-[#1F3A5F]/25 bg-[#FFF7EC]/50 px-4 py-3.5 text-lg text-[#1F3A5F] placeholder:text-[#1F3A5F]/40 focus:border-[#F28C28] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="sub-answer-input" className="block text-sm font-semibold text-[#1F3A5F]/85 mb-1.5">
                Keterangan Tambahan (Opsional)
              </label>
              <input
                id="sub-answer-input"
                type="text"
                maxLength={180}
                value={subAnswerText}
                onChange={(e) => setSubAnswerText(e.target.value)}
                placeholder={currentQuestion.secondaryPrompt || 'Tambahan penjelasan singkat...'}
                className="w-full rounded-xl border border-[#1F3A5F]/20 bg-white px-4 py-3 text-base text-[#1F3A5F] placeholder:text-[#1F3A5F]/40 focus:border-[#F28C28] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="business-name-input" className="block text-base font-bold text-[#1F3A5F] flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-[#F28C28]" />
                  Nama Usaha (Opsional)
                </label>
                <span className="font-mono text-xs text-[#1F3A5F]/60 tabular-nums">
                  {businessName.length} / 40
                </span>
              </div>
              <input
                id="business-name-input"
                type="text"
                maxLength={40}
                value={businessName}
                onChange={(e) => handleBusinessNameChange(e.target.value)}
                placeholder="Contoh: Keripik Apel Bu Sari (Jangan tulis nomor HP)"
                className="w-full rounded-xl border border-[#1F3A5F]/25 bg-white px-4 py-3.5 text-base sm:text-lg text-[#1F3A5F] placeholder:text-[#1F3A5F]/40 focus:border-[#F28C28] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !answerText.trim()}
              className="w-full min-h-[56px] rounded-xl bg-[#F28C28] hover:bg-[#d97719] disabled:opacity-50 text-white font-display font-bold text-lg sm:text-xl flex items-center justify-center gap-2.5 shadow-sm transition-colors cursor-pointer"
            >
              <Send className="w-5 h-5" />
              <span>{submitting ? 'Mengirim...' : 'Kirim jawaban'}</span>
            </button>

            {submitSuccess && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-4 flex items-center gap-3 text-emerald-900">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-base">
                    Terkirim! Jawabanmu akan muncul di layar.
                  </p>
                  {sessionState.moderationEnabled && (
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Jawaban sedang diperiksa panitia sebentar sebelum tampil di proyektor.
                    </p>
                  )}
                </div>
              </div>
            )}

            {submitError && (
              <div className="rounded-xl bg-red-50 border border-red-300 p-4 flex items-center gap-3 text-red-900">
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                <p className="font-bold text-base">
                  Gagal mengirim. Cek sinyal atau coba lagi.
                </p>
              </div>
            )}
          </form>
        </div>
      )}

      {/* MODE 2: LIVE POLLING & WORD CLOUD */}
      {localTab === 'poll' && currentPoll && (
        <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2A9D8F]">
              Polling Interaktif Real-Time
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F3A5F] mt-1">
              {currentPoll.title}
            </h2>
            <p className="text-base text-[#1F3A5F]/80 mt-2">{currentPoll.subtitle}</p>
          </div>

          <div className="space-y-3">
            {currentPoll.options.map((opt) => {
              const isChosen =
                selectedOption === opt.id || myExistingVote?.optionId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handlePollVoteSubmit(opt.id)}
                  className={`w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isChosen
                      ? 'border-[#2A9D8F] bg-[#E3F5F2]'
                      : 'border-[#1F3A5F]/15 bg-[#FFF7EC]/50 hover:border-[#F28C28]'
                  }`}
                >
                  <div>
                    <p className="font-display font-bold text-lg text-[#1F3A5F]">{opt.label}</p>
                    <p className="text-sm text-[#1F3A5F]/75 mt-0.5">{opt.subtitle}</p>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isChosen ? 'bg-[#2A9D8F] text-white' : 'border border-[#1F3A5F]/30'
                    }`}
                  >
                    {isChosen && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </button>
              );
            })}
          </div>

          {currentPoll.type === 'wordcloud' && (
            <div className="pt-4 border-t border-[#1F3A5F]/10 space-y-3">
              <label className="block text-sm font-bold text-[#1F3A5F]">
                Atau tulis 1–2 kata singkat lain yang sesuai usahamu:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={30}
                  value={customEmotionWord}
                  onChange={(e) => setCustomEmotionWord(e.target.value)}
                  placeholder="Ketik 1-2 kata di sini..."
                  className="flex-1 rounded-xl border border-[#1F3A5F]/25 px-4 py-3 text-base"
                />
                <button
                  type="button"
                  disabled={!customEmotionWord.trim()}
                  onClick={() => {
                    handlePollVoteSubmit(customEmotionWord.trim(), customEmotionWord.trim());
                    setCustomEmotionWord('');
                  }}
                  className="px-5 py-3 rounded-xl bg-[#2A9D8F] text-white font-bold text-sm hover:bg-[#218276] disabled:opacity-50 cursor-pointer"
                >
                  Kirim Kata
                </button>
              </div>
            </div>
          )}

          {(pollSubmitted || myExistingVote) && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-4 flex items-center gap-3 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="font-semibold text-sm">
                Pilihanmu sudah tercatat secara live di grafik proyektor depan!
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: Q&A ANONIM & LIVE VOTING */}
      {localTab === 'qna' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-6 sm:p-8 shadow-xs">
            <h2 className="font-display text-2xl font-bold text-[#1F3A5F] mb-1">
              Tanya Pemateri & Voting Pertanyaan
            </h2>
            <p className="text-sm sm:text-base text-[#1F3A5F]/75 mb-5">
              Malu bertanya langsung? Tulis pertanyaanmu secara <strong>Anonim</strong> atau klik tombol <strong>Setuju (👍)</strong> pada pertanyaan teman UMKM lain agar dibahas lebih dulu.
            </p>

            <form onSubmit={handleQnaSubmit} className="space-y-4">
              <div>
                <textarea
                  rows={3}
                  maxLength={240}
                  required
                  value={qnaText}
                  onChange={(e) => setQnaText(e.target.value)}
                  placeholder="Tulis pertanyaanmu di sini..."
                  className="w-full rounded-xl border-2 border-[#1F3A5F]/20 bg-[#FFF7EC]/50 px-4 py-3 text-base sm:text-lg text-[#1F3A5F] focus:border-[#F28C28] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-[#FFF7EC] p-1.5 rounded-xl border border-[#1F3A5F]/15">
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(true)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isAnonymous ? 'bg-[#1F3A5F] text-white' : 'text-[#1F3A5F]/70'
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    Tanya sebagai Anonim
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(false)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      !isAnonymous ? 'bg-[#2A9D8F] text-white' : 'text-[#1F3A5F]/70'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Tampilkan Nama Usaha
                  </button>
                </div>

                <select
                  value={topicTag}
                  onChange={(e) => setTopicTag(e.target.value)}
                  className="rounded-xl border border-[#1F3A5F]/20 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#1F3A5F]"
                >
                  {qnaTopics.map((topic, idx) => (
                    <option key={idx} value={topic}>
                      Topik: {topic}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={qnaSubmitting || !qnaText.trim()}
                className="w-full min-h-[52px] rounded-xl bg-[#F28C28] hover:bg-[#d97719] disabled:opacity-50 text-white font-display font-bold text-base sm:text-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{qnaSubmitting ? 'Mengirim Pertanyaan...' : 'Kirim Pertanyaan'}</span>
              </button>

              {qnaSuccess && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-3.5 text-sm font-semibold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Pertanyaan terkirim! {sessionState.moderationEnabled ? 'Menunggu persetujuan moderator untuk tampil.' : 'Sudah tampil di daftar voting.'}
                  </span>
                </div>
              )}
            </form>
          </div>

          <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#1F3A5F]">
                Daftar Pertanyaan Peserta ({approvedQna.length})
              </h3>
              <span className="text-xs text-[#1F3A5F]/65">Diurutkan dari Vote Tertinggi</span>
            </div>

            {approvedQna.length === 0 ? (
              <p className="text-center py-8 text-[#1F3A5F]/60 text-sm">
                Belum ada pertanyaan yang tampil. Jadilah yang pertama bertanya!
              </p>
            ) : (
              <div className="space-y-3">
                {approvedQna.map((item) => {
                  const hasVoted = Boolean(upvotedIds[item.id]);
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                        item.star
                          ? 'bg-[#FFF7EC] border-[#F28C28] border-2'
                          : 'bg-white border-[#1F3A5F]/15'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-[#1F3A5F]/65">
                          <span className="font-semibold text-[#1F3A5F]">{item.authorName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.topicTag}</span>
                          {item.star && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-bold text-[#F28C28]">Sedang Dibahas di Layar</span>
                            </>
                          )}
                        </div>
                        <p className="text-base sm:text-lg font-medium text-[#1F3A5F] leading-snug">
                          {item.text}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUpvoteTap(item.id)}
                        disabled={hasVoted}
                        className={`min-w-[64px] min-h-[52px] px-3 py-2 rounded-xl border flex flex-col items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          hasVoted
                            ? 'bg-[#2A9D8F] text-white border-[#2A9D8F]'
                            : 'bg-[#FFF7EC] text-[#1F3A5F] border-[#1F3A5F]/20 hover:border-[#F28C28]'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4 mb-0.5" />
                        <span className="font-mono text-sm font-bold tabular-nums">{item.upvotes}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 4: GENERATOR BIO IG, CHAT WA, STIKER KEMASAN & REKAP USAHAKU */}
      {localTab === 'summary' && (
        <div className="space-y-6">
          {/* Opsi Bagikan & Unduh Materi Seminar + Jawaban Pribadi */}
          <div className="bg-[#1F3A5F] text-white rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#F28C28]">
                  Simpan & Bagikan Materi Seminar
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
                  Unduh Buku Saku Materi & Hasil Lembar Kerjamu
                </h2>
                <p className="text-xs sm:text-sm text-white/80 mt-1">
                  Simpan rangkuman seluruh materi seminar beserta jawaban usahamu dalam bentuk PDF siap cetak, kirim ke WhatsApp pribadi, atau unduh file teks.
                </p>
              </div>
              {sessionState.allowParticipantSlideAccess && (
                <button
                  type="button"
                  onClick={() => setLocalTab('slides_reader')}
                  className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Presentation className="w-4 h-4 text-[#F28C28]" />
                  <span>Baca {slides.length} Slide di HP</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* 1. Unduh / Cetak PDF Buku Saku (Materi + Jawaban Pribadi) */}
              <button
                type="button"
                onClick={() =>
                  printParticipantWorkbookHandout({
                    seminarTitle,
                    organizerName,
                    businessName: umkmTitle,
                    questions,
                    slides,
                    myAnswers,
                    finalVpSentence,
                    generatedInstagramBio,
                    generatedWhatsappGreeting,
                    generatedPackagingSticker,
                    brandTheme,
                  })
                }
                className="p-3.5 rounded-xl bg-[#F28C28] hover:bg-[#d97719] text-white text-left flex items-center gap-3 cursor-pointer transition-colors shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Printer className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm sm:text-base leading-tight">
                    Simpan PDF Buku Saku & Jawaban
                  </p>
                  <p className="text-[11px] text-white/90 mt-0.5">
                    Materi inti + Bio IG + 7 Jawaban Usahaku (A4)
                  </p>
                </div>
              </button>

              {/* 2. Kirim Ringkasan Materi & Jawaban ke WhatsApp */}
              <a
                href={buildWhatsAppShareUrl({
                  seminarTitle,
                  businessName: umkmTitle,
                  questions,
                  myAnswers,
                  finalVpSentence,
                  generatedInstagramBio,
                  generatedWhatsappGreeting,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-[#2A9D8F] hover:bg-[#218276] text-white text-left flex items-center gap-3 cursor-pointer transition-colors shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm sm:text-base leading-tight">
                    Kirim Ringkasan ke WhatsApp
                  </p>
                  <p className="text-[11px] text-white/90 mt-0.5">
                    Simpan ke chat WA pribadi atau grup tim UMKM
                  </p>
                </div>
              </a>

              {/* 3. Simpan PDF Seluruh Slide Materi */}
              <button
                type="button"
                onClick={() =>
                  printSlideDeckHandout({
                    slides,
                    seminarTitle,
                    organizerName,
                    brandTheme,
                  })
                }
                className="p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-left flex items-center gap-3 cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Presentation className="w-5 h-5 text-[#F28C28]" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm leading-tight">
                    Simpan PDF Slide Presentasi ({slides.length} Hal)
                  </p>
                  <p className="text-[11px] text-white/75 mt-0.5">
                    Seluruh halaman slide pemateri ukuran Landscape
                  </p>
                </div>
              </button>

              {/* 4. Unduh File Teks (.txt) ke Perangkat */}
              <button
                type="button"
                onClick={() =>
                  downloadParticipantTxtHandout({
                    seminarTitle,
                    organizerName,
                    businessName: umkmTitle,
                    questions,
                    slides,
                    myAnswers,
                    finalVpSentence,
                    generatedInstagramBio,
                    generatedWhatsappGreeting,
                    generatedPackagingSticker,
                  })
                }
                className="p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-left flex items-center gap-3 cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#2A9D8F]" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm leading-tight">
                    Unduh Hasil & Materi (.txt)
                  </p>
                  <p className="text-[11px] text-white/75 mt-0.5">
                    File ringan langsung tersimpan di memori HP
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Instant Marketing Kit Generator */}
          <div className="bg-white border-2 border-[#F28C28] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-[#1F3A5F]/10 pb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#F28C28]">
                  Generator Otomatis dari Jawabanmu
                </span>
                <h2 className="font-display text-2xl font-bold text-[#1F3A5F] mt-0.5">
                  3 Format Promosi Siap Pakai ({umkmTitle})
                </h2>
                <p className="text-sm text-[#1F3A5F]/75 mt-1">
                  Hasil jawabanmu dari Bagian 1–6 otomatis dirangkai menjadi Bio Instagram, Salam Pembuka WhatsApp Business, dan Label Stiker Kemasan.
                </p>
              </div>
              <PWAInstallModalTrigger variant="light" />
            </div>

            {/* 1. Kalimat Value Proposition Utuh */}
            <div className="rounded-xl bg-[#FFF7EC] border border-[#F28C28]/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#F28C28]">
                  Kalimat Value Proposition Utama
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(finalVpSentence, 'vp')}
                  className="px-3 py-1 rounded-lg bg-[#F28C28] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedType === 'vp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'vp' ? 'Tersalin!' : 'Salin Kalimat'}</span>
                </button>
              </div>
              <p className="font-display text-lg font-bold text-[#1F3A5F]">
                "{finalVpSentence}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 2. Generator Bio Instagram / Shopee / TikTok */}
              <div className="rounded-xl border border-[#1F3A5F]/15 p-4 flex flex-col justify-between gap-4 bg-white">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F3A5F] flex items-center gap-1.5">
                      <Instagram className="w-4 h-4 text-[#F28C28]" />
                      1. Format Bio Instagram / Profil Toko
                    </span>
                  </div>
                  <pre className="font-sans text-xs sm:text-sm text-[#1F3A5F] bg-[#FFF7EC]/70 p-3.5 rounded-lg border border-[#1F3A5F]/10 whitespace-pre-wrap leading-relaxed">
                    {generatedInstagramBio}
                  </pre>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(generatedInstagramBio, 'ig')}
                  className="w-full py-2.5 rounded-xl bg-[#1F3A5F] hover:bg-[#162944] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedType === 'ig' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedType === 'ig' ? 'Bio IG Berhasil Disalin!' : 'Salin untuk Bio Instagram'}</span>
                </button>
              </div>

              {/* 3. Generator Salam Pembuka WhatsApp Business */}
              <div className="rounded-xl border border-[#1F3A5F]/15 p-4 flex flex-col justify-between gap-4 bg-white">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2A9D8F] flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-[#2A9D8F]" />
                      2. Salam Otomatis WhatsApp Business
                    </span>
                  </div>
                  <pre className="font-sans text-xs sm:text-sm text-[#1F3A5F] bg-[#E3F5F2]/50 p-3.5 rounded-lg border border-[#2A9D8F]/20 whitespace-pre-wrap leading-relaxed">
                    {generatedWhatsappGreeting}
                  </pre>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(generatedWhatsappGreeting, 'wa')}
                  className="w-full py-2.5 rounded-xl bg-[#2A9D8F] hover:bg-[#218276] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedType === 'wa' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedType === 'wa' ? 'Pesan WA Berhasil Disalin!' : 'Salin Pesan Sambutan WA'}</span>
                </button>
              </div>
            </div>

            {/* 4. Generator Stiker Kemasan / Spanduk */}
            <div className="rounded-xl border border-[#1F3A5F]/15 p-4 bg-[#1F3A5F] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#F28C28] flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  3. Tagline Pendek Stiker Kemasan / Banner Lapak
                </span>
                <p className="font-display text-base sm:text-lg font-bold whitespace-pre-line">
                  {generatedPackagingSticker}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyText(generatedPackagingSticker, 'sticker')}
                className="px-4 py-2.5 rounded-xl bg-white text-[#1F3A5F] text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedType === 'sticker' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedType === 'sticker' ? 'Tersalin!' : 'Salin Teks Stiker'}</span>
              </button>
            </div>
          </div>

          {/* Complete 1-7 Answers List */}
          <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="font-display text-xl font-bold text-[#1F3A5F]">
              Detail Jawaban Lembar Kerja Saya (Bagian 1–{questions.length})
            </h3>
            <div className="space-y-3">
              {questions.map((q, idx) => {
                const myAns = myAnswers.find((a) => a.q === idx);
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border bg-white border-[#1F3A5F]/15"
                  >
                    <p className="text-xs font-bold text-[#1F3A5F]/65">{q.sectionTitle}</p>
                    <p className="text-sm font-semibold text-[#1F3A5F] mt-0.5">{q.questionText}</p>
                    {myAns ? (
                      <div className="mt-2 pt-2 border-t border-[#1F3A5F]/10">
                        <p className="text-base font-bold text-[#2A9D8F]">{myAns.text}</p>
                        {myAns.subText && (
                          <p className="text-xs text-[#1F3A5F]/75 mt-0.5">{myAns.subText}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs italic text-[#1F3A5F]/45 mt-2">
                        Belum diisi pada sesi ini.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODE 5: BACA MANDIRI SLIDE MATERI DI HP PESERTA */}
      {localTab === 'slides_reader' && slides.length > 0 && (
        <div className="space-y-5">
          {(() => {
            const safeIdx = Math.min(readerSlideIdx, Math.max(0, slides.length - 1));
            const s = slides[safeIdx] || slides[0];
            return (
              <>
                <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2A9D8F]">
                      Mode Baca Mandiri Peserta
                    </span>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-[#1F3A5F]">
                      Slide {safeIdx + 1} dari {slides.length} · {s.badge}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      printSlideDeckHandout({
                        slides,
                        seminarTitle,
                        organizerName,
                        brandTheme,
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-[#1F3A5F] hover:bg-[#162944] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#F28C28]" />
                    <span>Simpan PDF Semua Slide</span>
                  </button>
                </div>

                {/* Slide Card Content for Mobile Reading */}
                <div className="bg-white border-2 border-[#1F3A5F]/20 rounded-2xl overflow-hidden shadow-xs">
                  <div className="bg-[#1F3A5F] text-white p-5 sm:p-6">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#F28C28] text-white text-xs font-bold mb-2">
                      {s.badge}
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-bold leading-snug">
                      {s.title}
                    </h3>
                    {s.subtitle && (
                      <p className="text-sm text-white/85 mt-1.5 leading-relaxed">{s.subtitle}</p>
                    )}
                  </div>

                  <div className="p-5 sm:p-6 space-y-4 bg-[#FFF7EC]/60">
                    {/* Visual Slide Image on Mobile Reader */}
                    {s.imageUrl && (
                      <div className="rounded-xl overflow-hidden border-2 border-[#1F3A5F]/20 bg-white shadow-xs">
                        <img
                          src={s.imageUrl}
                          alt={s.imageCaption || s.title}
                          className="w-full max-h-64 object-cover"
                        />
                        {s.imageCaption && (
                          <div className="p-3 bg-white border-t border-[#1F3A5F]/15 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#F28C28] shrink-0" />
                            <span className="text-xs font-bold text-[#1F3A5F]">{s.imageCaption}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {s.cards && s.cards.length > 0 && (
                      <div className="grid grid-cols-1 gap-3">
                        {s.cards.map((c, cIdx) => (
                          <div
                            key={cIdx}
                            className={`rounded-xl p-4 border ${
                              c.accent === 'navy'
                                ? 'bg-[#1F3A5F] text-white border-[#1F3A5F]'
                                : c.accent === 'teal'
                                ? 'bg-[#E3F5F2] text-[#1F3A5F] border-[#2A9D8F]/40'
                                : c.accent === 'orange'
                                ? 'bg-[#FFF7EC] text-[#1F3A5F] border-2 border-[#F28C28]'
                                : 'bg-white text-[#1F3A5F] border-[#1F3A5F]/15'
                            }`}
                          >
                            <p
                              className={`font-display font-bold text-base mb-1 ${
                                c.accent === 'navy' ? 'text-[#F28C28]' : 'text-[#1F3A5F]'
                              }`}
                            >
                              {c.title}
                            </p>
                            <p
                              className={`text-sm leading-relaxed whitespace-pre-line ${
                                c.accent === 'navy' ? 'text-white/90' : 'text-[#1F3A5F]/85'
                              }`}
                            >
                              {c.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {s.comparison && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl p-4 bg-white border border-[#1F3A5F]/20">
                          <p className="text-xs font-bold uppercase text-red-700 mb-1">
                            {s.comparison.leftTitle}
                          </p>
                          <p className="text-sm text-[#1F3A5F] whitespace-pre-line">
                            {s.comparison.leftBody}
                          </p>
                        </div>
                        <div className="rounded-xl p-4 bg-[#E3F5F2] border-2 border-[#2A9D8F]">
                          <p className="text-xs font-bold uppercase text-[#1d6f65] mb-1">
                            {s.comparison.rightTitle}
                          </p>
                          <p className="text-sm font-semibold text-[#1F3A5F] whitespace-pre-line">
                            {s.comparison.rightBody}
                          </p>
                        </div>
                      </div>
                    )}

                    {s.bottomBanner && (
                      <div className="rounded-xl bg-[#1F3A5F] text-white p-4 text-sm font-bold text-center">
                        {s.bottomBanner}
                      </div>
                    )}
                  </div>

                  {/* Mobile Slide Reader Navigation Footer */}
                  <div className="bg-white border-t border-[#1F3A5F]/10 px-4 py-3.5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={safeIdx === 0}
                      onClick={() => setReaderSlideIdx(Math.max(0, safeIdx - 1))}
                      className="px-4 py-2.5 rounded-xl border border-[#1F3A5F]/20 text-[#1F3A5F] disabled:opacity-40 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Sebelumnya</span>
                    </button>

                    <span className="font-mono text-xs font-bold text-[#1F3A5F]">
                      {safeIdx + 1} / {slides.length}
                    </span>

                    <button
                      type="button"
                      disabled={safeIdx === slides.length - 1}
                      onClick={() => setReaderSlideIdx(Math.min(slides.length - 1, safeIdx + 1))}
                      className="px-4 py-2.5 rounded-xl bg-[#F28C28] text-white disabled:opacity-40 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Berikutnya</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Slide Number Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {slides.map((sl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReaderSlideIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold shrink-0 cursor-pointer ${
                        idx === safeIdx
                          ? 'bg-[#1F3A5F] text-white'
                          : 'bg-white text-[#1F3A5F] border border-[#1F3A5F]/15'
                      }`}
                    >
                      #{idx + 1}
                    </button>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
