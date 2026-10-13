import React, { useState } from 'react';
import { WorksheetQuestion, LivePollConfig } from '../data/seminarData';
import { AnswerDoc, QnaDoc, PollVoteDoc, SessionStateDoc, InteractiveMode } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { PWAInstallModalTrigger } from './PWAInstallButton';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Star,
  EyeOff,
  QrCode,
  ThumbsUp,
  BarChart3,
  MessageSquare,
  BookOpen,
  ExternalLink,
  Maximize2,
  Minimize2,
  Sparkles,
  Store,
} from 'lucide-react';

interface ProjectorViewProps {
  questions: WorksheetQuestion[];
  polls: LivePollConfig[];
  seminarTitle: string;
  organizerName: string;
  sessionState: SessionStateDoc;
  approvedAnswers: AnswerDoc[];
  approvedQna: QnaDoc[];
  pollVotes: PollVoteDoc[];
  joinUrl: string;
  onChangeQuestion: (newQIndex: number) => void;
  onChangeMode: (newMode: InteractiveMode) => void;
  onChangePoll: (pollId: string) => void;
  onToggleStarAnswer: (answer: AnswerDoc, targetSize?: 'besar' | 'kecil') => Promise<void>;
  onHideAnswer: (answer: AnswerDoc) => Promise<void>;
  onToggleStarQna: (qna: QnaDoc) => Promise<void>;
  onHideQna: (qna: QnaDoc) => Promise<void>;
  onDownloadCsv: () => void;
  onSwitchToParticipantPreview: () => void;
}

export const ProjectorView: React.FC<ProjectorViewProps> = ({
  questions,
  polls,
  seminarTitle,
  organizerName,
  sessionState,
  approvedAnswers,
  approvedQna,
  pollVotes,
  joinUrl,
  onChangeQuestion,
  onChangeMode,
  onChangePoll,
  onToggleStarAnswer,
  onHideAnswer,
  onToggleStarQna,
  onHideQna,
  onDownloadCsv,
  onSwitchToParticipantPreview,
}) => {
  const [showQrModal, setShowQrModal] = useState(false);
  const [isFullscreenStage, setIsFullscreenStage] = useState(false);

  const totalQuestions = questions.length;
  const activeQIndex = Math.min(sessionState.activeQuestion, Math.max(0, totalQuestions - 1));
  const currentQuestion = questions[activeQIndex] || questions[0];

  // Filter answers for current active question, putting starred (Sorot) items at the very top
  const currentQuestionAnswers = approvedAnswers
    .filter((a) => a.q === activeQIndex)
    .sort((a, b) => {
      if (a.star !== b.star) return a.star ? -1 : 1;
      return b.ts - a.ts;
    });

  const starredBigAnswers = currentQuestionAnswers.filter(
    (a) => a.star && a.spotlightSize !== 'kecil'
  );
  const starredSmallAnswers = currentQuestionAnswers.filter(
    (a) => a.star && a.spotlightSize === 'kecil'
  );
  const regularAnswers = currentQuestionAnswers.filter((a) => !a.star);

  // Current Poll Calculation
  const currentPoll = polls.find((p) => p.id === sessionState.activePollId) || polls[0];
  const currentPollVotes = currentPoll ? pollVotes.filter((v) => v.pollId === currentPoll.id) : [];
  const totalPollVotes = currentPollVotes.length;

  // Word cloud frequency aggregation
  const wordFrequencies: Record<string, number> = {};
  currentPollVotes.forEach((v) => {
    const key = (v.customWord || v.optionId || '').trim();
    if (key) {
      wordFrequencies[key] = (wordFrequencies[key] || 0) + 1;
    }
  });

  // Sort Q&A by star first, then highest upvotes
  const sortedQna = [...approvedQna].sort((a, b) => {
    if (a.star !== b.star) return a.star ? -1 : 1;
    return b.upvotes - a.upvotes;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Presenter Control Toolbar */}
      {!isFullscreenStage && (
        <div className="bg-[#1F3A5F] text-white rounded-2xl p-4 sm:p-5 mb-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full max-w-full overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 max-w-full">
            <span className="font-display font-bold text-sm sm:text-base text-[#F28C28] whitespace-nowrap">
              Tampilan Presenter
            </span>
            <span aria-hidden="true" className="text-white/25 hidden sm:inline">|</span>

            {/* Mode Switcher */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1.5 rounded-xl w-full sm:w-auto max-w-full">
              <button
                onClick={() => onChangeMode('worksheet')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  sessionState.activeMode === 'worksheet'
                    ? 'bg-[#F28C28] text-white'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>{totalQuestions} Pertanyaan Materi</span>
              </button>
              <button
                onClick={() => onChangeMode('poll')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  sessionState.activeMode === 'poll'
                    ? 'bg-[#2A9D8F] text-white'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                <span>Live Polling ({polls.length})</span>
              </button>
              <button
                onClick={() => onChangeMode('qna')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  sessionState.activeMode === 'qna'
                    ? 'bg-[#F28C28] text-white'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>Q&A Anonim ({approvedQna.length})</span>
              </button>
              {sessionState.externalEmbedUrl && (
                <button
                  onClick={() => onChangeMode('external')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    sessionState.activeMode === 'external'
                      ? 'bg-[#2A9D8F] text-white'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span>Embed {sessionState.externalPlatform.toUpperCase()}</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 max-w-full">
            {sessionState.activeMode === 'worksheet' && (
              <>
                <button
                  onClick={() => onChangeQuestion(Math.max(0, activeQIndex - 1))}
                  disabled={activeQIndex === 0}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>
                <button
                  onClick={() => onChangeQuestion(Math.min(totalQuestions - 1, activeQIndex + 1))}
                  disabled={activeQIndex === totalQuestions - 1}
                  className="px-3.5 py-2 rounded-xl bg-[#F28C28] hover:bg-[#d97719] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={() => setShowQrModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#2A9D8F] hover:bg-[#218276] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Peserta</span>
            </button>

            <PWAInstallModalTrigger variant="dark" />

            <button
              onClick={onDownloadCsv}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Unduh jawaban</span>
            </button>

            <button
              onClick={onSwitchToParticipantPreview}
              className="px-3.5 py-2 rounded-xl bg-white text-[#1F3A5F] hover:bg-[#FFF7EC] text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Eye className="w-4 h-4" />
              <span>Lihat sebagai peserta</span>
            </button>

            <button
              onClick={() => setIsFullscreenStage(true)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              title="Sembunyikan tombol kontrol untuk proyektor"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isFullscreenStage && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setIsFullscreenStage(false)}
            className="px-3 py-1.5 rounded-lg bg-[#1F3A5F]/10 hover:bg-[#1F3A5F]/20 text-[#1F3A5F] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Tampilkan Bilah Kontrol Presenter</span>
          </button>
        </div>
      )}

      {/* STAGE MODE 1: WORKSHEET PERTANYAAN INTI */}
      {sessionState.activeMode === 'worksheet' && currentQuestion && (
        <div className="space-y-6">
          {/* Active Question Banner */}
          <div className="bg-white border-2 border-[#1F3A5F]/15 rounded-2xl p-6 sm:p-10 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-4xl">
              <div className="flex flex-wrap items-center gap-3 text-sm sm:text-base font-bold text-[#F28C28]">
                <span className="font-mono tabular-nums">
                  Pertanyaan {activeQIndex + 1} dari {totalQuestions}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-[#1F3A5F]">{currentQuestion.sectionTitle}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#2A9D8F] font-mono tabular-nums">
                  {currentQuestionAnswers.length} Jawaban Masuk
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-[#1F3A5F] leading-tight">
                {currentQuestion.questionText}
              </h1>

              {currentQuestion.secondaryPrompt && (
                <p className="text-lg sm:text-2xl text-[#1F3A5F]/80 font-medium">
                  {currentQuestion.secondaryPrompt}
                </p>
              )}

              <div className="pt-2">
                <p className="text-base sm:text-xl text-[#1F3A5F]/75 bg-[#FFF7EC] border border-[#F28C28]/40 rounded-xl px-4 py-3 inline-block">
                  <strong className="text-[#F28C28]">Contoh jawaban:</strong> "{currentQuestion.exampleAnswer}"
                </p>
              </div>
            </div>

            {/* Compact Join QR Card on Projector Right Side */}
            <div
              onClick={() => setShowQrModal(true)}
              className="bg-[#FFF7EC] border border-[#1F3A5F]/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center shrink-0 cursor-pointer hover:border-[#F28C28] transition-colors"
              title="Klik untuk memperbesar QR Code"
            >
              <div className="bg-white p-2.5 rounded-xl border border-[#1F3A5F]/10 mb-2">
                <QRCodeSVG value={joinUrl} size={112} fgColor="#1F3A5F" />
              </div>
              <p className="text-xs font-bold text-[#1F3A5F]">Scan HP untuk Menjawab</p>
              <p className="text-[11px] text-[#F28C28] font-semibold mt-0.5">Klik perbesar QR</p>
            </div>
          </div>

          {/* Step Selector Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {questions.map((q, idx) => {
              const count = approvedAnswers.filter((a) => a.q === idx).length;
              const isActive = idx === activeQIndex;
              return (
                <button
                  key={idx}
                  onClick={() => onChangeQuestion(idx)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#1F3A5F] text-white'
                      : 'bg-white text-[#1F3A5F] border border-[#1F3A5F]/15 hover:border-[#F28C28]'
                  }`}
                >
                  <span>Bagian {idx + 1}</span>
                  <span
                    className={`font-mono text-xs px-1.5 py-0.5 rounded tabular-nums ${
                      isActive ? 'bg-[#F28C28] text-white' : 'bg-[#FFF7EC] text-[#1F3A5F]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SPOTLIGHT (SOROT BESAR & KECIL) ANSWERS */}
          {(starredBigAnswers.length > 0 || starredSmallAnswers.length > 0) && (
            <div className="space-y-5">
              {/* 1. JAWABAN DISOROT BESAR (HERO BANNER PANGGUNG) */}
              {starredBigAnswers.map((ans) => (
                <div
                  key={ans.id}
                  className="bg-white border-3 sm:border-4 border-[#F28C28] rounded-2xl sm:rounded-3xl p-6 sm:p-9 shadow-lg ring-4 ring-[#F28C28]/15 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 text-sm sm:text-base font-extrabold text-[#F28C28] bg-[#FFF7EC] px-3.5 py-1.5 rounded-xl border border-[#F28C28]/40">
                        <Star className="w-5 h-5 fill-[#F28C28]" />
                        <span>⭐ JAWABAN DISOROT BESAR (PANGGUNG UTAMA)</span>
                      </span>
                      {ans.businessName && (
                        <>
                          <span aria-hidden="true" className="text-[#1F3A5F]/30 hidden sm:inline">·</span>
                          <span className="text-lg sm:text-2xl font-display font-bold text-[#2A9D8F] flex items-center gap-1.5">
                            <Store className="w-5 h-5" />
                            {ans.businessName}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onToggleStarAnswer(ans, 'kecil')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FFF7EC] hover:bg-[#F28C28]/20 text-[#1F3A5F] border border-[#F28C28]/50 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                        title="Ubah ukuran sorot menjadi lebih kecil / ringkas"
                      >
                        Ubah ke Sorot Kecil
                      </button>
                      <button
                        onClick={() => onToggleStarAnswer(ans, 'besar')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F28C28] text-white text-xs sm:text-sm font-bold hover:bg-[#d97719] transition-colors cursor-pointer shadow-xs"
                      >
                        Lepas Sorot
                      </button>
                      <button
                        onClick={() => onHideAnswer(ans)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-red-100 hover:text-red-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Sembunyikan
                      </button>
                    </div>
                  </div>

                  <p className="font-display text-2xl sm:text-4xl lg:text-5xl font-black text-[#1F3A5F] leading-tight sm:leading-snug">
                    "{ans.text}"
                  </p>

                  {ans.subText && (
                    <p className="text-lg sm:text-2xl text-[#1F3A5F]/85 mt-3 sm:mt-4 font-medium leading-relaxed">
                      {ans.subText}
                    </p>
                  )}

                  {ans.mentorNote && (
                    <div className="mt-5 pt-4 border-t border-[#1F3A5F]/10 flex items-center gap-2 text-base sm:text-xl text-[#2A9D8F] font-bold">
                      <Sparkles className="w-5 h-5 shrink-0" />
                      <span>Catatan Pembahasan: {ans.mentorNote}</span>
                    </div>
                  )}
                </div>
              ))}

              {/* 2. JAWABAN DISOROT KECIL (GRID KARTU KOMPAK / RINGKAS) */}
              {starredSmallAnswers.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F28C28] block pl-1">
                    JAWABAN DISOROT KECIL / RINGKAS ({starredSmallAnswers.length}):
                  </span>
                  <div className={`grid grid-cols-1 gap-4 ${starredSmallAnswers.length > 1 ? 'md:grid-cols-2' : ''}`}>
                    {starredSmallAnswers.map((ans) => (
                      <div
                        key={ans.id}
                        className="bg-[#FFFDF8] border-2 border-[#F28C28] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-3 transition-all"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F28C28] bg-white px-2.5 py-1 rounded-lg border border-[#F28C28]/40">
                              <Star className="w-3.5 h-3.5 fill-[#F28C28]" />
                              <span>Sorot Kecil</span>
                            </span>
                            {ans.businessName && (
                              <span className="text-sm sm:text-base font-bold text-[#2A9D8F] flex items-center gap-1">
                                <Store className="w-4 h-4" />
                                {ans.businessName}
                              </span>
                            )}
                          </div>

                          <p className="font-display text-lg sm:text-2xl font-bold text-[#1F3A5F] leading-snug">
                            "{ans.text}"
                          </p>

                          {ans.subText && (
                            <p className="text-sm sm:text-base text-[#1F3A5F]/80 font-medium">
                              {ans.subText}
                            </p>
                          )}

                          {ans.mentorNote && (
                            <p className="text-xs sm:text-sm text-[#2A9D8F] font-semibold pt-1">
                              Catatan: {ans.mentorNote}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-[#1F3A5F]/10 flex flex-wrap items-center justify-end gap-1.5 mt-auto">
                          <button
                            onClick={() => onToggleStarAnswer(ans, 'besar')}
                            className="px-2.5 py-1 rounded-lg bg-[#F28C28] hover:bg-[#d97719] text-white text-xs font-bold transition-colors cursor-pointer"
                            title="Perbesar ke Sorot Besar di panggung utama"
                          >
                            Perbesar (Sorot Besar)
                          </button>
                          <button
                            onClick={() => onToggleStarAnswer(ans, 'kecil')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#1F3A5F] text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Lepas Sorot
                          </button>
                          <button
                            onClick={() => onHideAnswer(ans)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 text-xs font-medium transition-colors cursor-pointer"
                          >
                            Sembunyikan
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REGULAR ANSWERS KANBAN GRID (Dynamic Sizing: Few Cards = Large, Many Cards = Proportional) */}
          {currentQuestionAnswers.length === 0 ? (
            <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-12 text-center">
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#1F3A5F]/60">
                Menunggu jawaban peserta...
              </p>
              <p className="text-base text-[#1F3A5F]/50 mt-2">
                Silakan scan QR Code di atas dan kirim jawaban dari HP masing-masing.
              </p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 gap-5 items-stretch ${
                regularAnswers.length === 1
                  ? 'max-w-4xl'
                  : regularAnswers.length <= 4
                  ? 'md:grid-cols-2'
                  : 'md:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {regularAnswers.map((ans) => {
                const isFewCards = regularAnswers.length <= 2;
                const isMediumCards = regularAnswers.length >= 3 && regularAnswers.length <= 4;
                return (
                  <div
                    key={ans.id}
                    className={`h-full bg-white border-2 border-[#1F3A5F]/15 rounded-2xl ${
                      isFewCards ? 'p-7 sm:p-8 min-h-[240px]' : 'p-6 min-h-[220px]'
                    } flex flex-col justify-between gap-4 shadow-xs hover:border-[#2A9D8F] transition-colors`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        {ans.businessName ? (
                          <div
                            className={`flex items-center gap-2 font-bold text-[#2A9D8F] truncate ${
                              isFewCards ? 'text-lg sm:text-2xl' : 'text-base sm:text-lg'
                            }`}
                          >
                            <Store className="w-5 h-5 shrink-0" />
                            <span className="truncate">{ans.businessName}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-[#1F3A5F]/50">
                            Peserta UMKM
                          </span>
                        )}
                        <span className="font-mono text-xs text-[#1F3A5F]/50 tabular-nums shrink-0">
                          {new Date(ans.ts).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p
                        className={`font-display font-bold text-[#1F3A5F] leading-snug ${
                          isFewCards
                            ? 'text-2xl sm:text-4xl'
                            : isMediumCards
                            ? 'text-xl sm:text-3xl'
                            : 'text-xl sm:text-2xl line-clamp-4'
                        }`}
                      >
                        {ans.text}
                      </p>

                      {ans.subText && (
                        <p
                          className={`text-[#1F3A5F]/80 leading-relaxed font-medium ${
                            isFewCards
                              ? 'text-lg sm:text-2xl'
                              : isMediumCards
                              ? 'text-base sm:text-xl'
                              : 'text-base sm:text-lg line-clamp-3'
                          }`}
                        >
                          {ans.subText}
                        </p>
                      )}

                      {ans.mentorNote && (
                        <p className="text-sm sm:text-base font-semibold text-[#2A9D8F] pt-2 border-t border-[#1F3A5F]/10">
                          Catatan: {ans.mentorNote}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#1F3A5F]/10 flex flex-wrap items-center justify-between gap-2 shrink-0 mt-auto">
                      <span className="text-xs sm:text-sm font-semibold text-[#1F3A5F]/60">
                        Bagian #{ans.q + 1}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onToggleStarAnswer(ans, 'besar')}
                          className="px-3 py-1.5 rounded-lg bg-[#F28C28] hover:bg-[#d97719] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs hover:shadow transition-all cursor-pointer"
                          title="Sorot jawaban ini dalam ukuran besar di panggung utama"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>Sorot Besar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleStarAnswer(ans, 'kecil')}
                          className="px-3 py-1.5 rounded-lg bg-[#FFF7EC] hover:bg-[#F28C28]/20 text-[#1F3A5F] border border-[#F28C28]/60 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Sorot jawaban ini dalam ukuran kecil / ringkas di panggung"
                        >
                          <Star className="w-3.5 h-3.5 text-[#F28C28]" />
                          <span>Sorot Kecil</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onHideAnswer(ans)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Sembunyikan dari layar proyektor"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Sembunyikan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STAGE MODE 2: LIVE POLLING & WORD CLOUD */}
      {sessionState.activeMode === 'poll' && currentPoll && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#1F3A5F]/15 rounded-2xl p-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2A9D8F]">
                Live Polling & Awan Kata (Gaya Mentimeter)
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#1F3A5F] mt-1">
                {currentPoll.title}
              </h2>
              <p className="text-lg text-[#1F3A5F]/75 mt-1">{currentPoll.subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {polls.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => onChangePoll(p.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                    p.id === currentPoll.id
                      ? 'bg-[#2A9D8F] text-white'
                      : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#1F3A5F]/20'
                  }`}
                >
                  Polling #{idx + 1}: {p.title.slice(0, 26)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display text-lg font-bold text-[#1F3A5F]">
                Hasil Suara Masuk Secara Real-Time
              </span>
              <span className="font-mono text-base font-bold text-[#2A9D8F] tabular-nums">
                Total: {totalPollVotes} Suara Peserta
              </span>
            </div>

            <div className="space-y-5">
              {currentPoll.options.map((opt) => {
                const count = currentPollVotes.filter((v) => v.optionId === opt.id).length;
                const pct = totalPollVotes > 0 ? Math.round((count / totalPollVotes) * 100) : 0;
                return (
                  <div key={opt.id} className="space-y-2">
                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <span className="font-display text-xl sm:text-2xl font-bold text-[#1F3A5F]">
                          {opt.label}
                        </span>
                        <span className="text-sm text-[#1F3A5F]/65 ml-3 hidden sm:inline">
                          {opt.subtitle}
                        </span>
                      </div>
                      <div className="font-mono text-xl sm:text-2xl font-bold text-[#1F3A5F] tabular-nums shrink-0">
                        {count} suara ({pct}%)
                      </div>
                    </div>
                    <div className="w-full h-6 bg-[#FFF7EC] rounded-xl overflow-hidden border border-[#1F3A5F]/10">
                      <div
                        className={`h-full transition-all duration-300 ${
                          opt.category === 'rational' ? 'bg-[#F28C28]' : 'bg-[#2A9D8F]'
                        }`}
                        style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {Object.keys(wordFrequencies).length > 0 && (
              <div className="mt-10 pt-8 border-t border-[#1F3A5F]/10">
                <h3 className="font-display text-lg font-bold text-[#1F3A5F] mb-4">
                  Awan Kata yang Dikirim Peserta:
                </h3>
                <div className="flex flex-wrap items-center justify-center gap-4 p-6 rounded-2xl bg-[#FFF7EC]">
                  {Object.entries(wordFrequencies).map(([word, freq], idx) => {
                    const sizeClass =
                      freq >= 4
                        ? 'text-3xl sm:text-4xl font-extrabold text-[#1F3A5F]'
                        : freq >= 2
                        ? 'text-2xl sm:text-3xl font-bold text-[#2A9D8F]'
                        : 'text-lg sm:text-xl font-semibold text-[#F28C28]';
                    return (
                      <span
                        key={idx}
                        className={`${sizeClass} px-3 py-1 transition-transform`}
                      >
                        {word} <sup className="font-mono text-xs opacity-70 tabular-nums">({freq})</sup>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE MODE 3: LIVE Q&A ANONIM & UPVOTING */}
      {sessionState.activeMode === 'qna' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#F28C28]">
                Sesi Tanya Jawab Interaktif & Voting Pertanyaan (Gaya Slido)
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#1F3A5F] mt-1">
                Pertanyaan Terpopuler dari Peserta UMKM
              </h2>
              <p className="text-lg text-[#1F3A5F]/75 mt-1">
                Peserta dapat bertanya secara anonim melalui HP dan menekan tombol 👍 untuk mengangkat pertanyaan ke urutan teratas.
              </p>
            </div>
            <div className="font-mono text-right shrink-0">
              <p className="text-3xl font-extrabold text-[#F28C28] tabular-nums">{sortedQna.length}</p>
              <p className="text-xs font-bold text-[#1F3A5F]/70 uppercase">Pertanyaan Aktif</p>
            </div>
          </div>

          {sortedQna.length === 0 ? (
            <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-12 text-center">
              <p className="font-display text-2xl font-bold text-[#1F3A5F]/60">
                Belum ada pertanyaan di layar.
              </p>
              <p className="text-base text-[#1F3A5F]/50 mt-1">
                Buka tab "Tanya Anonim & Vote" di HP Anda untuk mengirim pertanyaan pertama.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedQna.map((qna) => (
                <div
                  key={qna.id}
                  className={`rounded-2xl p-6 sm:p-8 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${
                    qna.star
                      ? 'bg-white border-3 border-[#F28C28] shadow-md'
                      : 'bg-white border border-[#1F3A5F]/15 shadow-xs'
                  }`}
                >
                  <div className="space-y-2.5 max-w-4xl">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-[#1F3A5F]/70">
                      <span className="font-bold text-[#2A9D8F]">{qna.authorName}</span>
                      <span aria-hidden="true">·</span>
                      <span>Topik: {qna.topicTag}</span>
                      {qna.star && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-bold text-[#F28C28]">SEDANG DISOROT PEMATERI</span>
                        </>
                      )}
                    </div>
                    <p className="font-display text-2xl sm:text-3xl font-bold text-[#1F3A5F] leading-snug">
                      "{qna.text}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="px-5 py-3 rounded-2xl bg-[#FFF7EC] border border-[#1F3A5F]/15 flex flex-col items-center justify-center min-w-[84px]">
                      <ThumbsUp className="w-5 h-5 text-[#F28C28] mb-1" />
                      <span className="font-mono text-2xl font-extrabold text-[#1F3A5F] tabular-nums">
                        {qna.upvotes}
                      </span>
                      <span className="text-[10px] font-bold text-[#1F3A5F]/60 uppercase">Vote</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => onToggleStarQna(qna)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                          qna.star
                            ? 'bg-[#F28C28] text-white'
                            : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#F28C28]/40 hover:bg-[#F28C28] hover:text-white'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>{qna.star ? 'Lepas Sorot' : 'Sorot'}</span>
                      </button>
                      <button
                        onClick={() => onHideQna(qna)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Sembunyikan</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STAGE MODE 4: EXTERNAL SLIDO / MENTIMETER IFRAME BRIDGE */}
      {sessionState.activeMode === 'external' && (
        <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl overflow-hidden shadow-xs">
          <div className="bg-[#1F3A5F] text-white px-6 py-3.5 flex items-center justify-between">
            <span className="font-display font-bold text-sm">
              Integrasi Langsung {sessionState.externalPlatform.toUpperCase()} Live Embed
            </span>
            <a
              href={sessionState.externalEmbedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#F28C28] hover:underline flex items-center gap-1"
            >
              <span>Buka di Tab Baru</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          {sessionState.externalEmbedUrl ? (
            <iframe
              src={sessionState.externalEmbedUrl}
              title="Slido or Mentimeter Live Interactive Embed"
              className="w-full h-[640px] border-0"
              allow="fullscreen; clipboard-write"
            />
          ) : (
            <div className="p-12 text-center">
              <p className="text-lg font-bold text-[#1F3A5F]">
                Belum ada tautan Embed Slido / Mentimeter yang dimasukkan.
              </p>
              <p className="text-sm text-[#1F3A5F]/70 mt-1">
                Silakan buka Dasbor Moderasi untuk menempelkan link embed Slido atau Mentimeter jika diperlukan.
              </p>
            </div>
          )}
        </div>
      )}

      {/* LOCKED STICKY BOTTOM NAVIGATION FOOTER (Never disappears when scrolling Kanban cards) */}
      <div className="sticky bottom-2 z-30 mt-6 bg-[#1F3A5F]/95 backdrop-blur-xs text-white border border-white/15 rounded-2xl px-4 py-2.5 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => onChangeQuestion(Math.max(0, activeQIndex - 1))}
            disabled={activeQIndex === 0}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          {questions.map((_, idx) => {
            const count = approvedAnswers.filter((a) => a.q === idx).length;
            const isActive = idx === activeQIndex && sessionState.activeMode === 'worksheet';
            return (
              <button
                key={idx}
                onClick={() => onChangeQuestion(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#F28C28] text-white'
                    : 'bg-white/10 text-white/85 hover:bg-white/20'
                }`}
              >
                <span>B{idx + 1}</span>
                <span className="font-mono text-[11px] opacity-85">({count})</span>
              </button>
            );
          })}

          <button
            onClick={() => onChangeQuestion(Math.min(totalQuestions - 1, activeQIndex + 1))}
            disabled={activeQIndex === totalQuestions - 1}
            className="px-3 py-1.5 rounded-xl bg-[#F28C28] hover:bg-[#d97719] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Berikutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onChangeMode('worksheet')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              sessionState.activeMode === 'worksheet'
                ? 'bg-[#F28C28] text-white'
                : 'bg-white/10 text-white/85 hover:bg-white/20'
            }`}
          >
            Pertanyaan
          </button>
          <button
            onClick={() => onChangeMode('poll')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              sessionState.activeMode === 'poll'
                ? 'bg-[#2A9D8F] text-white'
                : 'bg-white/10 text-white/85 hover:bg-white/20'
            }`}
          >
            Polling ({totalPollVotes})
          </button>
          <button
            onClick={() => onChangeMode('qna')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              sessionState.activeMode === 'qna'
                ? 'bg-[#2A9D8F] text-white'
                : 'bg-white/10 text-white/85 hover:bg-white/20'
            }`}
          >
            Q&A ({sortedQna.length})
          </button>
          <button
            onClick={() => setShowQrModal(true)}
            className="px-3 py-1.5 rounded-xl bg-white text-[#1F3A5F] text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR</span>
          </button>
        </div>
      </div>

      {/* LARGE QR CODE MODAL FOR PROJECTOR */}
      {showQrModal && (
        <div
          onClick={() => setShowQrModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFF7EC] border-4 border-[#F28C28] rounded-3xl max-w-lg w-full p-8 text-center shadow-2xl space-y-6"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#F28C28]">
                {organizerName.toUpperCase()}
              </span>
              <h3 className="font-display text-3xl font-extrabold text-[#1F3A5F] mt-1">
                Scan QR di HP Anda
              </h3>
              <p className="text-sm font-semibold text-[#2A9D8F] mt-1">{seminarTitle}</p>
              <p className="text-xs text-[#1F3A5F]/75 mt-1">
                Langsung masuk tanpa perlu instal aplikasi dan tanpa perlu buat akun.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-[#1F3A5F]/15 inline-block mx-auto shadow-sm">
              <QRCodeSVG value={joinUrl} size={260} fgColor="#1F3A5F" />
            </div>

            <div className="bg-white rounded-xl p-3 border border-[#1F3A5F]/15">
              <p className="text-xs text-[#1F3A5F]/60 mb-1">Atau buka tautan ini di browser HP:</p>
              <p className="font-mono text-sm font-bold text-[#1F3A5F] break-all select-all">
                {joinUrl}
              </p>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-3.5 rounded-xl bg-[#1F3A5F] text-white font-display font-bold text-base hover:bg-[#162944] transition-colors cursor-pointer"
            >
              Tutup Layar QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
