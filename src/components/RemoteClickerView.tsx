import React, { useState, useMemo, useCallback } from 'react';
import {
  SlideDefinition,
  WorksheetQuestion,
  LivePollConfig,
  SPEAKER_TOUGH_QUESTIONS,
  SEMINAR_SLIDES,
} from '../data/seminarData';
import {
  AnswerDoc,
  QnaDoc,
  PollVoteDoc,
  InteractiveMode,
  SlideTransitionStyle,
  SlideDrawerMode,
} from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Layers,
  Eye,
  QrCode,
  MessageSquare,
  BarChart3,
  Star,
  Store,
  Smartphone,
  Sparkles,
  CheckCircle2,
  FileText,
  KeyRound,
  BookOpen,
  Presentation,
  ThumbsUp,
  Share2,
} from 'lucide-react';

interface RemoteStepDetail {
  stepNumber: number;
  label: string;
  previewText: string;
}

interface RemoteClickerViewProps {
  slides: SlideDefinition[];
  questions: WorksheetQuestion[];
  polls: LivePollConfig[];
  pollVotes: PollVoteDoc[];
  seminarTitle: string;
  activeSlideIndex: number;
  activeSlideStep: number;
  stepByStepEnabled: boolean;
  transitionStyle: SlideTransitionStyle;
  activeSlideDrawer: SlideDrawerMode;
  allowParticipantSlideAccess?: boolean;
  activeQuestionIndex: number;
  activePollId: string;
  activeMode: InteractiveMode;
  approvedAnswers: AnswerDoc[];
  allAnswers: AnswerDoc[];
  approvedQna: QnaDoc[];
  onUpdateSlideState: (partial: {
    activeSlide?: number;
    activeSlideStep?: number;
    stepByStepEnabled?: boolean;
    transitionStyle?: SlideTransitionStyle;
    activeSlideDrawer?: SlideDrawerMode;
    allowParticipantSlideAccess?: boolean;
    activeQuestion?: number;
    activePollId?: string;
    activeMode?: InteractiveMode;
  }) => void;
  onSyncQuestionOnly: (questionIndex: number) => void;
  onSyncPollOnly: (pollId: string) => void;
  onToggleStarAnswer: (ans: AnswerDoc, targetSize?: 'besar' | 'kecil') => Promise<void>;
  onApproveAnswer: (ans: AnswerDoc) => Promise<void>;
  onToggleStarQna: (qna: QnaDoc) => Promise<void>;
  onOpenGuide?: () => void;
}

const DEFAULT_PIN = '2026';

export const RemoteClickerView: React.FC<RemoteClickerViewProps> = ({
  slides,
  questions,
  polls,
  pollVotes,
  seminarTitle,
  activeSlideIndex,
  activeSlideStep,
  stepByStepEnabled,
  activeSlideDrawer,
  allowParticipantSlideAccess = false,
  activeQuestionIndex,
  activePollId,
  activeMode,
  approvedAnswers,
  allAnswers,
  approvedQna,
  onUpdateSlideState,
  onToggleStarAnswer,
  onApproveAnswer,
  onToggleStarQna,
  onOpenGuide,
}) => {
  // Control Target Mode: 'slides' (17 Slides + PPT Points) vs 'interactive' (Direct 7 Questions / Polls / Q&A like Projector < >)
  const [remoteControlTab, setRemoteControlTab] = useState<'slides' | 'interactive'>('slides');

  // PIN Security State
  const [savedPin, setSavedPin] = useState<string>(() => {
    try {
      return window.localStorage.getItem('partnerup_remote_pin_v1') || DEFAULT_PIN;
    } catch {
      return DEFAULT_PIN;
    }
  });

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return window.sessionStorage.getItem('partnerup_remote_unlocked_v1') === 'true';
    } catch {
      return false;
    }
  });

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [pinSavedToast, setPinSavedToast] = useState(false);

  // Speaker Notes synced from localStorage
  const [customNote] = useState<string>(() => {
    try {
      const saved = window.localStorage.getItem('partnerup_speaker_notes_v1');
      const parsed = saved ? JSON.parse(saved) : {};
      return parsed[activeSlideIndex] || '';
    } catch {
      return '';
    }
  });

  const triggerHaptic = (pattern: number | number[] = 35) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore on unsupported devices
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === savedPin) {
      triggerHaptic([30, 50, 30]);
      setIsUnlocked(true);
      setPinError(false);
      setPinInput('');
      try {
        window.sessionStorage.setItem('partnerup_remote_unlocked_v1', 'true');
      } catch {
        // ignore
      }
    } else {
      triggerHaptic([80, 50, 80]);
      setPinError(true);
    }
  };

  const handleDigitTap = (digit: string) => {
    triggerHaptic(20);
    setPinError(false);
    const next = (pinInput + digit).slice(0, 6);
    setPinInput(next);
    if (next === savedPin) {
      triggerHaptic([30, 50, 30]);
      setIsUnlocked(true);
      setPinInput('');
      try {
        window.sessionStorage.setItem('partnerup_remote_unlocked_v1', 'true');
      } catch {
        // ignore
      }
    }
  };

  const handleLockRemote = () => {
    triggerHaptic(30);
    setIsUnlocked(false);
    try {
      window.sessionStorage.removeItem('partnerup_remote_unlocked_v1');
    } catch {
      // ignore
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newPinInput.trim().slice(0, 6);
    if (cleaned.length < 4) return;
    setSavedPin(cleaned);
    try {
      window.localStorage.setItem('partnerup_remote_pin_v1', cleaned);
    } catch {
      // ignore
    }
    setNewPinInput('');
    setShowChangePin(false);
    setPinSavedToast(true);
    setTimeout(() => setPinSavedToast(false), 2500);
  };

  const totalSlides = slides.length;
  const safeSlideIndex = Math.min(activeSlideIndex, Math.max(0, totalSlides - 1));
  const slide = slides[safeSlideIndex] || slides[0];
  const nextSlide = safeSlideIndex + 1 < totalSlides ? slides[safeSlideIndex + 1] : null;

  const totalQuestions = questions.length;
  const safeQuestionIndex = Math.min(activeQuestionIndex, Math.max(0, totalQuestions - 1));

  // If the current slide has a linkedQuestionIndex, prioritize it; otherwise use activeQuestionIndex
  const effectiveQuestionIndex =
    slide?.linkedQuestionIndex !== undefined ? slide.linkedQuestionIndex : safeQuestionIndex;
  const currentQuestionObj = questions[effectiveQuestionIndex] || questions[0];

  const questionAnswers = approvedAnswers
    .filter((a) => a.q === effectiveQuestionIndex)
    .sort((a, b) => (a.star !== b.star ? (a.star ? -1 : 1) : b.ts - a.ts));

  const pendingQuestionAnswers = allAnswers.filter(
    (a) => a.q === effectiveQuestionIndex && a.status === 'pending'
  );

  const effectivePoll =
    (slide?.linkedPollId ? polls.find((p) => p.id === slide.linkedPollId) : undefined) ||
    polls.find((p) => p.id === activePollId) ||
    polls[0];

  const currentPollVotes = effectivePoll
    ? pollVotes.filter((v) => v.pollId === effectivePoll.id)
    : [];

  const sortedQna = [...approvedQna].sort((a, b) =>
    a.star !== b.star ? (a.star ? -1 : 1) : b.upvotes - a.upvotes
  );

  // Helper to automatically sync Worksheet / Poll / Q&A mode when moving to a slide
  const buildSlideSyncState = useCallback((targetSlideObj?: SlideDefinition) => {
    if (!targetSlideObj) return {};
    if (targetSlideObj.linkedQuestionIndex !== undefined) {
      return {
        activeQuestion: targetSlideObj.linkedQuestionIndex,
        activeMode: 'worksheet' as InteractiveMode,
        ...(targetSlideObj.linkedPollId ? { activePollId: targetSlideObj.linkedPollId } : {}),
      };
    }
    if (targetSlideObj.linkedPollId) {
      return {
        activePollId: targetSlideObj.linkedPollId,
        activeMode: 'poll' as InteractiveMode,
      };
    }
    if (targetSlideObj.type === 'closing') {
      return {
        activeMode: 'qna' as InteractiveMode,
      };
    }
    return {};
  }, []);

  // Calculate step details for current slide
  const slideStepAssignments = useMemo(() => {
    if (!slide || slide.type === 'cover') {
      return {
        totalSteps: 0,
        stepDetails: [] as RemoteStepDetail[],
      };
    }

    let counter = 0;
    const stepDetails: RemoteStepDetail[] = [];

    (slide.cards || []).forEach((c, idx) => {
      const sNum = ++counter;
      stepDetails.push({
        stepNumber: sNum,
        label: `Kartu Poin #${idx + 1}`,
        previewText: `${c.title} — ${c.body}`,
      });
    });

    if (slide.comparison) {
      const leftStep = ++counter;
      stepDetails.push({
        stepNumber: leftStep,
        label: `Perbandingan Kiri (${slide.comparison.leftTitle})`,
        previewText: slide.comparison.leftBody,
      });
      const rightStep = ++counter;
      stepDetails.push({
        stepNumber: rightStep,
        label: `Perbandingan Kanan (${slide.comparison.rightTitle})`,
        previewText: slide.comparison.rightBody,
      });
    }

    if (slide.bottomBanner) {
      const bStep = ++counter;
      stepDetails.push({
        stepNumber: bStep,
        label: 'Pita Kesimpulan Bawah',
        previewText: slide.bottomBanner,
      });
    }

    const hasDictionary = slide.linkedQuestionIndex === 2 || slide.linkedQuestionIndex === 3;
    if (hasDictionary) {
      const dStep = ++counter;
      stepDetails.push({
        stepNumber: dStep,
        label:
          slide.linkedQuestionIndex === 3
            ? 'Kamus Konversi Kata -> Angka'
            : 'Daftar 3 Kata Terlarang',
        previewText:
          slide.linkedQuestionIndex === 3
            ? 'Tabel 5 Kategori UMKM (Kuliner, Fashion, Jasa, Agribisnis, Kerajinan)'
            : 'Hindari kata "Berkualitas, Murah, Terpercaya"',
      });
    }

    const hasPrompt =
      Boolean(slide.promptLines && slide.promptLines.length > 0) ||
      slide.linkedQuestionIndex !== undefined ||
      Boolean(slide.linkedPollId);
    if (hasPrompt) {
      const pStep = ++counter;
      stepDetails.push({
        stepNumber: pStep,
        label: 'Kotak Interaktif "TULIS DI SINI"',
        previewText:
          (slide.linkedQuestionIndex !== undefined
            ? questions[slide.linkedQuestionIndex]?.questionText
            : undefined) ||
          slide.promptLines?.[0] ||
          'Instruksi latihan di HP peserta',
      });
    }

    return {
      totalSteps: counter,
      stepDetails,
    };
  }, [slide, questions]);

  const maxSteps = slideStepAssignments.totalSteps;
  const revealedStep = stepByStepEnabled
    ? Math.min(activeSlideStep ?? 0, maxSteps)
    : maxSteps;

  const currentRevealedStepInfo =
    stepByStepEnabled && revealedStep > 0
      ? slideStepAssignments.stepDetails[revealedStep - 1]
      : null;

  const nextUpcomingStepInfo =
    stepByStepEnabled && revealedStep < maxSteps
      ? slideStepAssignments.stepDetails[revealedStep]
      : null;

  // Slide Next & Prev Handlers
  const handleNextTap = useCallback(() => {
    if (stepByStepEnabled && revealedStep < maxSteps) {
      triggerHaptic(35);
      onUpdateSlideState({
        activeSlideStep: revealedStep + 1,
      });
    } else if (safeSlideIndex < totalSlides - 1) {
      triggerHaptic([30, 45, 30]);
      const nextIdx = safeSlideIndex + 1;
      const nextSlideObj = slides[nextIdx];
      onUpdateSlideState({
        activeSlide: nextIdx,
        activeSlideStep: 0,
        activeSlideDrawer: 'none',
        ...buildSlideSyncState(nextSlideObj),
      });
    }
  }, [
    stepByStepEnabled,
    revealedStep,
    maxSteps,
    safeSlideIndex,
    totalSlides,
    slides,
    onUpdateSlideState,
    buildSlideSyncState,
  ]);

  const handlePrevTap = useCallback(() => {
    triggerHaptic(25);
    if (stepByStepEnabled && revealedStep > 0) {
      onUpdateSlideState({
        activeSlideStep: revealedStep - 1,
      });
    } else if (safeSlideIndex > 0) {
      const prevIdx = safeSlideIndex - 1;
      const prevSlideObj = slides[prevIdx];
      onUpdateSlideState({
        activeSlide: prevIdx,
        activeSlideStep: 0,
        activeSlideDrawer: 'none',
        ...buildSlideSyncState(prevSlideObj),
      });
    }
  }, [stepByStepEnabled, revealedStep, safeSlideIndex, slides, onUpdateSlideState, buildSlideSyncState]);

  const handleRevealAll = () => {
    triggerHaptic([25, 40, 25]);
    onUpdateSlideState({
      activeSlideStep: maxSteps,
    });
  };

  // Direct Question < > Handlers (Just like Projector < > buttons on Laptop!)
  const handleSelectDirectQuestion = (qIdx: number) => {
    triggerHaptic(30);
    const targetQ = questions[qIdx];
    const linkedSlideIdx =
      targetQ?.linkedSlideIndex !== undefined ? targetQ.linkedSlideIndex : safeSlideIndex;
    onUpdateSlideState({
      activeQuestion: qIdx,
      activeMode: 'worksheet',
      activeSlide: linkedSlideIdx,
      activeSlideStep: 99, // Reveal all points on that slide so the question box is visible
      activeSlideDrawer: activeSlideDrawer === 'answers' ? 'answers' : 'none',
    });
  };

  const handleToggleDrawer = (drawer: SlideDrawerMode) => {
    triggerHaptic(30);
    const nextDrawer = activeSlideDrawer === drawer ? 'none' : drawer;
    if (nextDrawer === 'answers') {
      onUpdateSlideState({
        activeSlideDrawer: 'answers',
        activeQuestion: effectiveQuestionIndex,
        activeMode: 'worksheet',
      });
    } else if (nextDrawer === 'poll' && effectivePoll) {
      onUpdateSlideState({
        activeSlideDrawer: 'poll',
        activePollId: effectivePoll.id,
        activeMode: 'poll',
      });
    } else if (nextDrawer === 'qna') {
      onUpdateSlideState({
        activeSlideDrawer: 'qna',
        activeMode: 'qna',
      });
    } else {
      onUpdateSlideState({ activeSlideDrawer: nextDrawer });
    }
  };

  // PIN LOCK SCREEN
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-[#1F3A5F] text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-center border-2 border-[#F28C28]">
          <div className="w-16 h-16 rounded-2xl bg-[#F28C28] text-white flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F28C28]">
              POINTER PANGGUNG PEMATERI
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
              Masukkan PIN Remote HP
            </h1>
            <p className="text-xs sm:text-sm text-white/75">
              Mencegah peserta seminar menggeser slide secara tidak sengaja. (PIN bawaan: <strong>2026</strong>)
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => {
                setPinError(false);
                setPinInput(e.target.value.slice(0, 6));
              }}
              placeholder="••••"
              className="w-full text-center font-mono text-3xl tracking-[0.5em] py-3 rounded-2xl bg-white/10 border border-white/25 text-white focus:outline-none focus:border-[#F28C28]"
            />

            {pinError && (
              <p className="text-xs font-bold text-red-300">
                PIN belum sesuai. Coba masukkan {savedPin === DEFAULT_PIN ? '2026' : 'PIN Pemateri Anda'}.
              </p>
            )}

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigitTap(num)}
                  className="py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-[#F28C28] font-display text-2xl font-bold text-white transition-colors cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput('')}
                className="py-3.5 rounded-2xl bg-white/5 hover:bg-white/15 text-xs font-bold text-white/70 cursor-pointer"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => handleDigitTap('0')}
                className="py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-[#F28C28] font-display text-2xl font-bold text-white transition-colors cursor-pointer"
              >
                0
              </button>
              <button
                type="submit"
                className="py-3.5 rounded-2xl bg-[#F28C28] hover:bg-[#d97719] text-xs font-extrabold text-white cursor-pointer"
              >
                Buka
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-3.5 sm:px-5 py-4 pb-24 space-y-4 select-none">
      {/* 1. Top Status & Security Strip */}
      <div className="bg-[#1F3A5F] text-white rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#2A9D8F] flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#F28C28]">
                REMOTE POINTER AKTIF
              </span>
            </div>
            <p className="text-xs font-semibold text-white/85 truncate">{seminarTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowChangePin(!showChangePin)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
            title="Ubah PIN Pengaman"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            onClick={handleLockRemote}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Kunci Remote HP"
          >
            <Unlock className="w-3.5 h-3.5 text-[#F28C28]" />
            <span>Kunci</span>
          </button>
        </div>
      </div>

      {pinSavedToast && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-300 px-4 py-2.5 text-xs font-bold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>PIN Pengaman Remote berhasil diperbarui!</span>
        </div>
      )}

      {showChangePin && (
        <form
          onSubmit={handleSaveNewPin}
          className="bg-white border border-[#1F3A5F]/20 rounded-2xl p-4 flex items-center gap-2"
        >
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={newPinInput}
            onChange={(e) => setNewPinInput(e.target.value)}
            placeholder="PIN baru (min 4 angka)"
            className="flex-1 rounded-xl border border-[#1F3A5F]/25 px-3 py-2 text-xs font-mono font-bold text-[#1F3A5F]"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-[#1F3A5F] text-white text-xs font-bold cursor-pointer"
          >
            Simpan PIN
          </button>
        </form>
      )}

      {/* 2. Mode Switcher: Slide Mode (1-17) vs Direct Question/Poll/Q&A Mode (1-7) */}
      <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-1.5 grid grid-cols-2 gap-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => {
            triggerHaptic(20);
            setRemoteControlTab('slides');
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
            remoteControlTab === 'slides'
              ? 'bg-[#1F3A5F] text-white'
              : 'text-[#1F3A5F]/75 hover:bg-[#1F3A5F]/5'
          }`}
        >
          <Presentation className="w-4 h-4 text-[#F28C28] shrink-0" />
          <span>Slide & Poin (1–{totalSlides})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic(20);
            setRemoteControlTab('interactive');
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
            remoteControlTab === 'interactive'
              ? 'bg-[#F28C28] text-white'
              : 'text-[#1F3A5F]/75 hover:bg-[#1F3A5F]/5'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>Pertanyaan (1–{totalQuestions}), Poll & Q&A</span>
        </button>
      </div>

      {/* TAB A: SLIDE & PPT POINT CLICKER (1-17) */}
      {remoteControlTab === 'slides' ? (
        <>
          {/* Current Slide & Point Status Card */}
          <div className="bg-white border-2 border-[#1F3A5F]/15 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full bg-[#1F3A5F] text-white font-mono text-xs font-bold tabular-nums">
                Slide {slide.pageNumber} / {totalSlides} · {slide.badge}
              </span>
              <span className="font-mono text-xs font-extrabold text-[#2A9D8F] tabular-nums">
                {stepByStepEnabled && maxSteps > 0
                  ? `Poin: ${revealedStep} / ${maxSteps}`
                  : 'Semua Poin Tampil'}
              </span>
            </div>

            <div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#1F3A5F] leading-snug">
                {slide.title}
              </h2>
              {slide.subtitle && (
                <p className="text-xs sm:text-sm text-[#1F3A5F]/75 mt-1">{slide.subtitle}</p>
              )}
            </div>

            {slide.imageUrl && (
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#2A9D8F]/10 border border-[#2A9D8F]/25 text-[#1F3A5F]">
                <img
                  src={slide.imageUrl}
                  alt="Thumbnail"
                  className="w-10 h-10 rounded-lg object-cover border border-[#2A9D8F]/30 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-[#2A9D8F] block">📷 Slide dengan Media Foto</span>
                  {slide.imageCaption ? (
                    <span className="text-[10px] text-[#1F3A5F]/80 line-clamp-1">{slide.imageCaption}</span>
                  ) : (
                    <span className="text-[10px] text-[#1F3A5F]/60">Tata letak: {slide.imagePosition === 'top' ? 'Banner Atas' : 'Split Samping'}</span>
                  )}
                </div>
              </div>
            )}

            {currentRevealedStepInfo && (
              <div className="rounded-xl bg-[#FFF7EC] border border-[#F28C28]/40 p-3 space-y-0.5">
                <span className="text-[11px] font-bold text-[#F28C28] uppercase">
                  Sedang Tampil di Proyektor ({currentRevealedStepInfo.label}):
                </span>
                <p className="text-xs sm:text-sm font-bold text-[#1F3A5F]">
                  {currentRevealedStepInfo.previewText}
                </p>
              </div>
            )}

            <div className="rounded-xl bg-[#E3F5F2] border border-[#2A9D8F]/40 p-3.5 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2A9D8F] block">
                BOCORAN KETUKAN JEMPOL BERIKUTNYA:
              </span>
              {nextUpcomingStepInfo ? (
                <>
                  <p className="text-xs font-bold text-[#1F3A5F]">
                    Muncul Poin {nextUpcomingStepInfo.stepNumber}/{maxSteps}: {nextUpcomingStepInfo.label}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-[#1F3A5F]/85">
                    "{nextUpcomingStepInfo.previewText}"
                  </p>
                </>
              ) : nextSlide ? (
                <p className="text-xs sm:text-sm font-bold text-[#1F3A5F]">
                  Pindah ke Slide #{nextSlide.pageNumber}: {nextSlide.title}
                </p>
              ) : (
                <p className="text-xs font-bold text-[#1F3A5F]/70">
                  Sudah berada di poin terakhir pada slide penutup.
                </p>
              )}
            </div>
          </div>

          {/* GIANT ONE-HANDED THUMB CLICKER ZONE */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleNextTap}
              disabled={safeSlideIndex === totalSlides - 1 && revealedStep >= maxSteps}
              className="w-full min-h-[124px] rounded-3xl bg-[#F28C28] hover:bg-[#d97719] active:scale-[0.98] disabled:opacity-40 text-white p-5 shadow-lg flex flex-col items-center justify-center gap-2 transition-all cursor-pointer border-b-4 border-[#c56810]"
            >
              <div className="flex items-center gap-2 font-display text-xl sm:text-2xl font-extrabold tracking-tight">
                <span>
                  {stepByStepEnabled && revealedStep < maxSteps
                    ? `MUNCULKAN POIN ${revealedStep + 1} / ${maxSteps}`
                    : safeSlideIndex < totalSlides - 1
                    ? `LANJUT KE SLIDE #${safeSlideIndex + 2}`
                    : 'SELESAI DI SLIDE TERAKHIR'}
                </span>
                <ChevronRight className="w-7 h-7 stroke-[3]" />
              </div>
              <span className="text-xs font-semibold text-white/90">
                {nextUpcomingStepInfo
                  ? `Berikutnya: ${nextUpcomingStepInfo.label}`
                  : nextSlide
                  ? `Slide Selanjutnya: ${nextSlide.title}`
                  : 'Semua poin telah ditampilkan'}
              </span>
            </button>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={handlePrevTap}
                disabled={safeSlideIndex === 0 && revealedStep === 0}
                className="min-h-[56px] rounded-2xl bg-white border-2 border-[#1F3A5F]/20 active:bg-[#1F3A5F]/10 disabled:opacity-40 text-[#1F3A5F] font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Mundur 1x</span>
              </button>

              <button
                type="button"
                onClick={handleRevealAll}
                disabled={!stepByStepEnabled || revealedStep >= maxSteps}
                className="min-h-[56px] rounded-2xl bg-[#1F3A5F] active:bg-[#162944] disabled:opacity-40 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#F28C28]" />
                <span>Buka Semua Poin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(25);
                  onUpdateSlideState({
                    stepByStepEnabled: !stepByStepEnabled,
                    activeSlideStep: !stepByStepEnabled ? 0 : maxSteps,
                  });
                }}
                className={`min-h-[56px] rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer border-2 ${
                  stepByStepEnabled
                    ? 'bg-[#FFF7EC] border-[#2A9D8F] text-[#1F3A5F]'
                    : 'bg-white border-[#1F3A5F]/20 text-[#1F3A5F]/70'
                }`}
              >
                <Layers className="w-4 h-4 text-[#2A9D8F]" />
                <span>PPT: {stepByStepEnabled ? 'ON (1-per-1)' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* TAB B: DIRECT QUESTION (1-7) / POLLING / Q&A CLICKER (Identical to Laptop < > in Layar Proyektor!) */
        <div className="space-y-4">
          {/* Active Mode Selector on Projector & Participant Phones */}
          <div className="bg-white border-2 border-[#1F3A5F]/15 rounded-2xl p-4 space-y-3 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F]/70 block">
              PILIH SESI AKTIF DI LAYAR PROYEKTOR & HP PESERTA:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(30);
                  onUpdateSlideState({
                    activeMode: 'worksheet',
                    activeSlideDrawer: activeSlideDrawer !== 'none' ? 'answers' : 'none',
                  });
                }}
                className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 cursor-pointer border ${
                  activeMode === 'worksheet'
                    ? 'bg-[#F28C28] text-white border-[#F28C28]'
                    : 'bg-[#FFF7EC] text-[#1F3A5F] border-[#1F3A5F]/20'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Pertanyaan (1–{totalQuestions})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(30);
                  onUpdateSlideState({
                    activeMode: 'poll',
                    activePollId: effectivePoll?.id || polls[0]?.id,
                    activeSlideDrawer: activeSlideDrawer !== 'none' ? 'poll' : 'none',
                  });
                }}
                className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 cursor-pointer border ${
                  activeMode === 'poll'
                    ? 'bg-[#2A9D8F] text-white border-[#2A9D8F]'
                    : 'bg-[#FFF7EC] text-[#1F3A5F] border-[#1F3A5F]/20'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Live Polling ({polls.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(30);
                  onUpdateSlideState({
                    activeMode: 'qna',
                    activeSlideDrawer: activeSlideDrawer !== 'none' ? 'qna' : 'none',
                  });
                }}
                className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 cursor-pointer border ${
                  activeMode === 'qna'
                    ? 'bg-[#1F3A5F] text-white border-[#1F3A5F]'
                    : 'bg-[#FFF7EC] text-[#1F3A5F] border-[#1F3A5F]/20'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Q&A Anonim ({approvedQna.length})</span>
              </button>
            </div>
          </div>

          {/* Direct Question Stepper (< Pertanyaan Sebelumnya | Pertanyaan Berikutnya >) */}
          <div className="bg-white border-2 border-[#F28C28] rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#F28C28] text-white font-mono text-xs font-bold">
                Pertanyaan Aktif: #{safeQuestionIndex + 1} dari {totalQuestions}
              </span>
              <span className="font-mono text-xs font-bold text-[#2A9D8F]">
                {approvedAnswers.filter((a) => a.q === safeQuestionIndex).length} Jawaban
              </span>
            </div>

            <h3 className="font-display text-xl font-extrabold text-[#1F3A5F]">
              {questions[safeQuestionIndex]?.questionText}
            </h3>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={safeQuestionIndex === 0}
                onClick={() => handleSelectDirectQuestion(Math.max(0, safeQuestionIndex - 1))}
                className="min-h-[64px] rounded-2xl bg-[#FFF7EC] border-2 border-[#1F3A5F]/20 disabled:opacity-40 text-[#1F3A5F] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Pertanyaan Sebelumnya</span>
              </button>

              <button
                type="button"
                disabled={safeQuestionIndex === totalQuestions - 1}
                onClick={() =>
                  handleSelectDirectQuestion(Math.min(totalQuestions - 1, safeQuestionIndex + 1))
                }
                className="min-h-[64px] rounded-2xl bg-[#F28C28] disabled:opacity-40 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Pertanyaan Berikutnya</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Numbered Question Pills (P1 - P7) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#1F3A5F]/10">
              {questions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDirectQuestion(idx)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold cursor-pointer ${
                    idx === safeQuestionIndex
                      ? 'bg-[#1F3A5F] text-white'
                      : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#1F3A5F]/15'
                  }`}
                >
                  P{idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Poll Switcher (Poll #1 vs Poll #2) */}
          <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-4 space-y-2.5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2A9D8F] block">
              PILIH TOPIK LIVE POLLING:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {polls.map((p, idx) => {
                const isCurrPoll = effectivePoll?.id === p.id && activeMode === 'poll';
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic(30);
                      onUpdateSlideState({
                        activePollId: p.id,
                        activeMode: 'poll',
                        ...(p.linkedSlideIndex !== undefined
                          ? { activeSlide: p.linkedSlideIndex, activeSlideStep: 99 }
                          : {}),
                      });
                    }}
                    className={`p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between gap-2 cursor-pointer border ${
                      isCurrPoll
                        ? 'bg-[#2A9D8F] text-white border-[#2A9D8F]'
                        : 'bg-[#FFF7EC] text-[#1F3A5F] border-[#1F3A5F]/15'
                    }`}
                  >
                    <span>
                      Polling #{idx + 1}: {p.title}
                    </span>
                    <span className="font-mono px-2 py-0.5 rounded bg-black/15 shrink-0">
                      {pollVotes.filter((v) => v.pollId === p.id).length} suara
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. ALWAYS-AVAILABLE REMOTE POP-UP OVERLAY SWITCHES (Works on ANY Slide 1-17!) */}
      <div className="bg-white border-2 border-[#1F3A5F]/15 rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F]">
            TAMPILKAN POP-UP DI ATAS SLIDE PROYEKTOR (BISA DI SEMUA SLIDE):
          </p>
          {activeSlideDrawer !== 'none' && (
            <button
              type="button"
              onClick={() => handleToggleDrawer('none')}
              className="text-xs font-bold text-red-600 underline cursor-pointer"
            >
              Tutup Pop-up
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleToggleDrawer('answers')}
            className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeSlideDrawer === 'answers'
                ? 'bg-[#F28C28] text-white shadow-sm'
                : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#1F3A5F]/20'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>
              {activeSlideDrawer === 'answers'
                ? 'Tutup Jawaban'
                : `Pop-up Jawaban P${effectiveQuestionIndex + 1} (${questionAnswers.length})`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleDrawer('poll')}
            className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeSlideDrawer === 'poll'
                ? 'bg-[#2A9D8F] text-white shadow-sm'
                : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#1F3A5F]/20'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>
              {activeSlideDrawer === 'poll'
                ? 'Tutup Grafik Poll'
                : `Pop-up Polling (${currentPollVotes.length})`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleDrawer('qna')}
            className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeSlideDrawer === 'qna'
                ? 'bg-[#1F3A5F] text-white shadow-sm'
                : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#1F3A5F]/20'
            }`}
          >
            <ThumbsUp className="w-4 h-4 shrink-0 text-[#F28C28]" />
            <span>
              {activeSlideDrawer === 'qna'
                ? 'Tutup Papan Q&A'
                : `Pop-up Q&A Anonim (${approvedQna.length})`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleDrawer('qr')}
            className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeSlideDrawer === 'qr'
                ? 'bg-[#F28C28] text-white shadow-sm'
                : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#1F3A5F]/20'
            }`}
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span>{activeSlideDrawer === 'qr' ? 'Tutup QR Proyektor' : 'Pop-up QR Peserta'}</span>
          </button>
        </div>

        {/* Saklar Bagikan Slide Materi ke HP Peserta */}
        <div className="pt-2 border-t border-[#1F3A5F]/10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#1F3A5F]">
              Bagikan Slide Materi ke HP Peserta
            </p>
            <p className="text-[11px] text-[#1F3A5F]/70">
              {allowParticipantSlideAccess
                ? 'AKTIF: Peserta bisa baca & unduh PDF 10 slide di HP'
                : 'NONAKTIF: Peserta fokus ke latihan aktif'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic([25, 40]);
              onUpdateSlideState({
                allowParticipantSlideAccess: !allowParticipantSlideAccess,
              });
            }}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
              allowParticipantSlideAccess
                ? 'bg-[#2A9D8F] text-white shadow-xs'
                : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#1F3A5F]/20'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{allowParticipantSlideAccess ? 'Akses Slide: BUKA' : 'Buka Akses Slide'}</span>
          </button>
        </div>
      </div>

      {/* 5. LIVE PARTICIPANT ANSWERS MONITOR IN PRESENTER'S HAND (Always Available!) */}
      <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F]">
            JAWABAN PERTANYAAN #{effectiveQuestionIndex + 1} ({questionAnswers.length})
          </span>
          {pendingQuestionAnswers.length > 0 && (
            <button
              type="button"
              onClick={async () => {
                triggerHaptic(30);
                for (const pAns of pendingQuestionAnswers) {
                  await onApproveAnswer(pAns);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
            >
              Setujui {pendingQuestionAnswers.length} Pending
            </button>
          )}
        </div>

        {/* Question quick filter inside answers monitor */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {questions.map((_, idx) => {
            const count = approvedAnswers.filter((a) => a.q === idx).length;
            const isSelected = idx === effectiveQuestionIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  onUpdateSlideState({
                    activeQuestion: idx,
                    activeMode: 'worksheet',
                  });
                }}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1F3A5F] text-white'
                    : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#1F3A5F]/15'
                }`}
              >
                P{idx + 1} ({count})
              </button>
            );
          })}
        </div>

        {questionAnswers.length === 0 ? (
          <p className="text-xs text-[#1F3A5F]/60 py-2">
            Belum ada jawaban peserta untuk Pertanyaan #{effectiveQuestionIndex + 1} ({currentQuestionObj?.sectionTitle}).
          </p>
        ) : (
          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {questionAnswers.map((ans) => (
              <div
                key={ans.id}
                className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-2.5 ${
                  ans.star
                    ? 'bg-[#FFF7EC] border-2 border-[#F28C28]'
                    : 'bg-white border-[#1F3A5F]/15'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  {ans.businessName && (
                    <p className="font-bold text-[#2A9D8F] flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{ans.businessName}</span>
                    </p>
                  )}
                  <p className="font-bold text-[#1F3A5F] text-sm">"{ans.text}"</p>
                  {ans.subText && <p className="text-[#1F3A5F]/75">{ans.subText}</p>}
                </div>
                {ans.star ? (
                  <div className="flex flex-col gap-1 shrink-0">
                    <span className="text-[10px] font-bold text-[#F28C28] bg-[#FFF7EC] px-2 py-0.5 rounded text-center border border-[#F28C28]/40">
                      {ans.spotlightSize === 'kecil' ? 'Sorot Kecil' : 'Sorot Besar'}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        triggerHaptic(35);
                        await onToggleStarAnswer(ans);
                      }}
                      className="px-2.5 py-1.5 rounded-xl font-bold bg-[#F28C28] text-white text-xs cursor-pointer"
                    >
                      Lepas
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        triggerHaptic(35);
                        await onToggleStarAnswer(ans, 'besar');
                        if (activeSlideDrawer !== 'answers') {
                          onUpdateSlideState({
                            activeSlideDrawer: 'answers',
                            activeQuestion: effectiveQuestionIndex,
                            activeMode: 'worksheet',
                          });
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl font-bold bg-[#F28C28] text-white text-xs flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      title="Sorot Besar di panggung proyektor"
                    >
                      <Star className="w-3 h-3 fill-white" />
                      <span>S.Besar</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        triggerHaptic(35);
                        await onToggleStarAnswer(ans, 'kecil');
                        if (activeSlideDrawer !== 'answers') {
                          onUpdateSlideState({
                            activeSlideDrawer: 'answers',
                            activeQuestion: effectiveQuestionIndex,
                            activeMode: 'worksheet',
                          });
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl font-bold bg-[#FFF7EC] text-[#1F3A5F] border border-[#F28C28]/40 text-xs flex items-center justify-center gap-1 cursor-pointer"
                      title="Sorot Kecil di panggung proyektor"
                    >
                      <Star className="w-3 h-3 text-[#F28C28]" />
                      <span>S.Kecil</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. LIVE Q&A MONITOR IN PRESENTER'S HAND */}
      {sortedQna.length > 0 && (
        <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-4 space-y-3 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F28C28] block">
            PERTANYAAN Q&A ANONIM MASUK ({sortedQna.length})
          </span>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {sortedQna.map((qna) => (
              <div
                key={qna.id}
                className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-2.5 ${
                  qna.star
                    ? 'bg-[#FFF7EC] border-2 border-[#F28C28]'
                    : 'bg-white border-[#1F3A5F]/15'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="font-bold text-[#2A9D8F]">
                    {qna.authorName} · {qna.topicTag} (👍 {qna.upvotes})
                  </p>
                  <p className="font-bold text-[#1F3A5F] text-sm">"{qna.text}"</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    triggerHaptic(35);
                    await onToggleStarQna(qna);
                    if (activeSlideDrawer !== 'qna') {
                      onUpdateSlideState({
                        activeSlideDrawer: 'qna',
                        activeMode: 'qna',
                      });
                    }
                  }}
                  className={`px-3 py-2 rounded-xl font-bold shrink-0 flex items-center gap-1 cursor-pointer ${
                    qna.star
                      ? 'bg-[#F28C28] text-white'
                      : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#F28C28]/40'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>{qna.star ? 'Disorot' : 'Sorot'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SPEAKER NOTES & 5 TOUGH QUESTIONS CHEAT SHEET IN HAND */}
      <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#F28C28]">
          <FileText className="w-3.5 h-3.5" />
          <span>CONTEKAN PEMATERI (SLIDE #{slide.pageNumber})</span>
        </div>

        {(slide.speakerNotes || SEMINAR_SLIDES[safeSlideIndex]?.speakerNotes) && (
          <div className="rounded-xl bg-[#E3F5F2] border border-[#2A9D8F]/40 p-3 text-xs text-[#1F3A5F] leading-relaxed">
            <span className="font-bold text-[#1d6f65] block mb-0.5">Panduan Bicara Slide Ini:</span>
            {slide.speakerNotes || SEMINAR_SLIDES[safeSlideIndex]?.speakerNotes}
          </div>
        )}

        {currentQuestionObj && (
          <div className="rounded-xl bg-[#FFF7EC] border border-[#1F3A5F]/10 p-3 text-xs text-[#1F3A5F] space-y-1">
            <p className="font-bold">Inti Latihan: {currentQuestionObj.coreLearning}</p>
            {currentQuestionObj.helperTips.map((t, i) => (
              <p key={i} className="text-[#1F3A5F]/80">
                • {t}
              </p>
            ))}
          </div>
        )}

        {customNote && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-[#1F3A5F]">
            <span className="font-bold block mb-0.5">Catatan Pribadi:</span>
            {customNote}
          </div>
        )}

        {/* Contekan 5 Pertanyaan Sulit Peserta di HP Pemateri */}
        <details className="rounded-xl bg-[#FFF7EC] border border-[#F28C28]/40 p-3 text-xs text-[#1F3A5F]">
          <summary className="font-bold text-[#1F3A5F] cursor-pointer select-none flex items-center justify-between">
            <span>💡 Contekan 5 Pertanyaan Sulit Peserta</span>
            <span className="text-[#F28C28] font-bold">Ketuk</span>
          </summary>
          <div className="mt-3 space-y-2.5 pt-2.5 border-t border-[#1F3A5F]/10">
            {SPEAKER_TOUGH_QUESTIONS.map((tq) => (
              <div key={tq.id} className="bg-white rounded-xl p-3 border border-[#1F3A5F]/10 space-y-1">
                <p className="font-bold text-[#1F3A5F]">{tq.question}</p>
                <p className="font-semibold text-[#2A9D8F]">Prinsip: {tq.shortPrinciple}</p>
                <p className="text-[#1F3A5F]/85 leading-relaxed">{tq.tacticalAnswer}</p>
                <p className="text-[#F28C28] font-semibold italic">{tq.coachingQuestion}</p>
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* 8. QUICK SLIDE JUMPER */}
      <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-4 space-y-2.5 shadow-xs">
        <p className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F]/70">
          LOMPAT CEPAT KE SLIDE TERTENTU:
        </p>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {slides.map((s, idx) => {
            const isCurrent = idx === safeSlideIndex;
            const hasInteractive =
              s.linkedQuestionIndex !== undefined || s.linkedPollId !== undefined;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  triggerHaptic(25);
                  onUpdateSlideState({
                    activeSlide: idx,
                    activeSlideStep: 0,
                    activeSlideDrawer: 'none',
                    ...buildSlideSyncState(s),
                  });
                }}
                className={`px-3 py-2 rounded-xl border text-left shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#1F3A5F] text-white border-[#1F3A5F]'
                    : 'bg-[#FFF7EC] text-[#1F3A5F] border-[#1F3A5F]/15'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] font-mono tabular-nums opacity-80">
                  <span>#{s.pageNumber}</span>
                  {hasInteractive && <Sparkles className="w-3 h-3 text-[#F28C28]" />}
                </div>
                <p className="text-xs font-bold truncate max-w-[110px]">{s.title}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 9. PANDUAN TEKNIS & MANUAL SISTEM */}
      {onOpenGuide && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(20);
              onOpenGuide();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-[#1F3A5F]/20 text-[#1F3A5F] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <BookOpen className="w-4 h-4 text-[#F28C28]" />
            <span>Buku Panduan Teknis & SOP Panggung (PDF)</span>
          </button>
        </div>
      )}
    </div>
  );
};
