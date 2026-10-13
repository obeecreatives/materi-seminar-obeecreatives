import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  SlideDefinition,
  WorksheetQuestion,
  LivePollConfig,
  RATIONAL_CONVERSION_DICTIONARY,
  FORBIDDEN_VAGUE_WORDS,
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
  BrandThemeConfig,
} from '../types';
import { printSlideDeckHandout } from '../utils/handoutExport';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Maximize2,
  Minimize2,
  QrCode,
  Star,
  Store,
  X,
  Layers,
  Eye,
  Monitor,
  ExternalLink,
  Clock,
  Play,
  Pause,
  RotateCcw,
  FileText,
  Smartphone,
  ThumbsUp,
  Printer,
  Share2,
} from 'lucide-react';

interface SlideStepInfo {
  stepNumber: number;
  label: string;
  previewText: string;
}

interface SlideDeckViewProps {
  slides: SlideDefinition[];
  questions: WorksheetQuestion[];
  polls: LivePollConfig[];
  pollVotes: PollVoteDoc[];
  seminarTitle: string;
  organizerName: string;
  brandTheme?: BrandThemeConfig;
  joinUrl: string;
  extendUrl: string;
  activeSlideIndex: number;
  activeSlideStep: number;
  stepByStepEnabled: boolean;
  transitionStyle: SlideTransitionStyle;
  activeSlideDrawer: SlideDrawerMode;
  allowParticipantSlideAccess?: boolean;
  activeQuestionIndex: number;
  activePollId: string;
  isAudienceExtendWindow?: boolean;
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
  onLaunchWorksheetQuestion: (questionIndex: number) => void;
  onLaunchPoll: (pollId: string) => void;
  onLaunchQna: () => void;
  onSyncQuestionOnly: (questionIndex: number) => void;
  onSyncPollOnly: (pollId: string) => void;
  onToggleStarAnswer: (ans: AnswerDoc, targetSize?: 'besar' | 'kecil') => Promise<void>;
  onApproveAnswer: (ans: AnswerDoc) => Promise<void>;
  onToggleStarQna: (qna: QnaDoc) => Promise<void>;
  onExitExtendWindow?: () => void;
  approvedAnswers: AnswerDoc[];
  allAnswers: AnswerDoc[];
  approvedQna: QnaDoc[];
  activeMode: InteractiveMode;
}

export const SlideDeckView: React.FC<SlideDeckViewProps> = ({
  slides,
  questions,
  polls,
  pollVotes,
  seminarTitle,
  organizerName,
  brandTheme,
  joinUrl,
  extendUrl,
  activeSlideIndex,
  activeSlideStep,
  stepByStepEnabled,
  transitionStyle,
  activeSlideDrawer,
  allowParticipantSlideAccess = false,
  activeQuestionIndex,
  activePollId,
  isAudienceExtendWindow = false,
  onUpdateSlideState,
  onLaunchWorksheetQuestion,
  onLaunchPoll,
  onLaunchQna,
  onSyncQuestionOnly,
  onSyncPollOnly,
  onToggleStarAnswer,
  onApproveAnswer,
  onToggleStarQna,
  onExitExtendWindow,
  approvedAnswers,
  allAnswers,
  approvedQna,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [presenterDualMode, setPresenterDualMode] = useState(false);
  const [showRemoteQrModal, setShowRemoteQrModal] = useState(false);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const prevSlideRef = useRef<number>(activeSlideIndex);

  const remoteUrl = `${window.location.origin}${window.location.pathname}?view=remote`;

  // Presenter Stopwatch Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Custom Speaker Notes per slide (persisted in localStorage)
  const [customNotesMap, setCustomNotesMap] = useState<Record<number, string>>(() => {
    try {
      const saved = window.localStorage.getItem('partnerup_speaker_notes_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSaveCustomNote = (slideIdx: number, val: string) => {
    const next = { ...customNotesMap, [slideIdx]: val };
    setCustomNotesMap(next);
    try {
      window.localStorage.setItem('partnerup_speaker_notes_v1', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  // Detect slide direction when activeSlideIndex changes from remote/presenter
  useEffect(() => {
    if (activeSlideIndex !== prevSlideRef.current) {
      setSlideDirection(activeSlideIndex >= prevSlideRef.current ? 1 : -1);
      prevSlideRef.current = activeSlideIndex;
    }
  }, [activeSlideIndex]);

  const totalSlides = slides.length;
  const safeSlideIndex = Math.min(activeSlideIndex, Math.max(0, totalSlides - 1));
  const slide = slides[safeSlideIndex] || slides[0];
  const nextSlide = safeSlideIndex + 1 < totalSlides ? slides[safeSlideIndex + 1] : null;

  const linkedQuestion =
    slide?.linkedQuestionIndex !== undefined ? questions[slide.linkedQuestionIndex] : null;

  // Fallback question & poll so the overlay drawer ALWAYS works on any slide (1-17)
  const effectiveQuestionIndex =
    slide?.linkedQuestionIndex !== undefined
      ? slide.linkedQuestionIndex
      : Math.min(activeQuestionIndex, Math.max(0, questions.length - 1));
  const drawerQuestion = questions[effectiveQuestionIndex] || questions[0];

  const questionAnswers = approvedAnswers
    .filter((a) => a.q === effectiveQuestionIndex)
    .sort((a, b) => (a.star !== b.star ? (a.star ? -1 : 1) : b.ts - a.ts));

  const pendingQuestionAnswers = allAnswers.filter(
    (a) => a.q === effectiveQuestionIndex && a.status === 'pending'
  );

  const linkedPoll = slide?.linkedPollId
    ? polls.find((p) => p.id === slide.linkedPollId)
    : undefined;

  const drawerPoll =
    linkedPoll || polls.find((p) => p.id === activePollId) || polls[0];

  const currentPollVotes = drawerPoll
    ? pollVotes.filter((v) => v.pollId === drawerPoll.id)
    : [];

  const sortedQna = [...approvedQna].sort((a, b) =>
    a.star !== b.star ? (a.star ? -1 : 1) : b.upvotes - a.upvotes
  );

  // Calculate all sequential animation steps and human-readable descriptions for Presenter View
  const slideStepAssignments = useMemo(() => {
    if (!slide || slide.type === 'cover') {
      return {
        totalSteps: 0,
        cardSteps: [] as number[],
        comparisonLeftStep: 0,
        comparisonRightStep: 0,
        bannerStep: 0,
        dictionaryStep: 0,
        promptStep: 0,
        stepDetails: [] as SlideStepInfo[],
      };
    }

    let counter = 0;
    const stepDetails: SlideStepInfo[] = [];

    const cardSteps = (slide.cards || []).map((c, idx) => {
      const sNum = ++counter;
      stepDetails.push({
        stepNumber: sNum,
        label: `Kartu Poin #${idx + 1}`,
        previewText: `${c.title} — ${c.body}`,
      });
      return sNum;
    });

    let comparisonLeftStep = 0;
    let comparisonRightStep = 0;
    if (slide.comparison) {
      comparisonLeftStep = ++counter;
      stepDetails.push({
        stepNumber: comparisonLeftStep,
        label: `Perbandingan Kiri (${slide.comparison.leftTitle})`,
        previewText: slide.comparison.leftBody,
      });
      comparisonRightStep = ++counter;
      stepDetails.push({
        stepNumber: comparisonRightStep,
        label: `Perbandingan Kanan (${slide.comparison.rightTitle})`,
        previewText: slide.comparison.rightBody,
      });
    }

    let bannerStep = 0;
    if (slide.bottomBanner) {
      bannerStep = ++counter;
      stepDetails.push({
        stepNumber: bannerStep,
        label: 'Pita Kesimpulan Bawah',
        previewText: slide.bottomBanner,
      });
    }

    const hasDictionary = slide.linkedQuestionIndex === 2 || slide.linkedQuestionIndex === 3;
    let dictionaryStep = 0;
    if (hasDictionary) {
      dictionaryStep = ++counter;
      stepDetails.push({
        stepNumber: dictionaryStep,
        label:
          slide.linkedQuestionIndex === 3
            ? 'Tabel Kamus Konversi Kata Sifat -> Angka'
            : 'Daftar 3 Kata Terlarang UMKM',
        previewText:
          slide.linkedQuestionIndex === 3
            ? '5 Kategori UMKM: Kuliner, Fashion, Jasa, Agribisnis, Kerajinan'
            : 'Hindari kata "Berkualitas, Murah, Terpercaya" tanpa bukti nyata',
      });
    }

    const hasPrompt =
      Boolean(slide.promptLines && slide.promptLines.length > 0) ||
      slide.linkedQuestionIndex !== undefined ||
      Boolean(slide.linkedPollId);
    let promptStep = 0;
    if (hasPrompt) {
      promptStep = ++counter;
      stepDetails.push({
        stepNumber: promptStep,
        label: 'Kotak Interaktif "TULIS DI SINI" (HP Peserta)',
        previewText:
          linkedQuestion?.questionText ||
          slide.promptLines?.[0] ||
          'Instruksi latihan interaktif untuk peserta',
      });
    }

    return {
      totalSteps: counter,
      cardSteps,
      comparisonLeftStep,
      comparisonRightStep,
      bannerStep,
      dictionaryStep,
      promptStep,
      stepDetails,
    };
  }, [slide, linkedQuestion]);

  const maxSteps = slideStepAssignments.totalSteps;
  const revealedStep = stepByStepEnabled
    ? Math.min(activeSlideStep ?? 0, maxSteps)
    : maxSteps;

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

  // Step-aware Next & Previous handlers synced in real-time to Firestore
  const handleStepNext = useCallback(() => {
    if (stepByStepEnabled && revealedStep < maxSteps) {
      onUpdateSlideState({
        activeSlideStep: revealedStep + 1,
      });
    } else if (safeSlideIndex < totalSlides - 1) {
      setSlideDirection(1);
      const nextIdx = safeSlideIndex + 1;
      const nextSlideObj = slides[nextIdx];
      onUpdateSlideState({
        activeSlide: nextIdx,
        activeSlideStep: 0,
        activeSlideDrawer: 'none',
        ...buildSlideSyncState(nextSlideObj),
      });
    }
  }, [stepByStepEnabled, revealedStep, maxSteps, safeSlideIndex, totalSlides, slides, onUpdateSlideState, buildSlideSyncState]);

  const handleStepPrev = useCallback(() => {
    if (stepByStepEnabled && revealedStep > 0) {
      onUpdateSlideState({
        activeSlideStep: revealedStep - 1,
      });
    } else if (safeSlideIndex > 0) {
      setSlideDirection(-1);
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

  const handleJumpToSlide = (targetIdx: number) => {
    setSlideDirection(targetIdx >= safeSlideIndex ? 1 : -1);
    const targetSlideObj = slides[targetIdx];
    onUpdateSlideState({
      activeSlide: targetIdx,
      activeSlideStep: 0,
      activeSlideDrawer: 'none',
      ...buildSlideSyncState(targetSlideObj),
    });
  };

  const handleRevealAllCurrentSlide = useCallback(() => {
    onUpdateSlideState({
      activeSlideStep: maxSteps,
    });
  }, [maxSteps, onUpdateSlideState]);

  const handleToggleDrawer = (drawer: SlideDrawerMode) => {
    const nextDrawer = activeSlideDrawer === drawer ? 'none' : drawer;
    if (nextDrawer === 'answers' && slide?.linkedQuestionIndex !== undefined) {
      onSyncQuestionOnly(slide.linkedQuestionIndex);
    } else if (nextDrawer === 'poll' && slide?.linkedPollId) {
      onSyncPollOnly(slide.linkedPollId);
    }
    onUpdateSlideState({ activeSlideDrawer: nextDrawer });
  };

  const isStepVisible = (stepNumber: number) => {
    if (!stepByStepEnabled || stepNumber === 0) return true;
    return revealedStep >= stepNumber;
  };

  // Native Fullscreen API sync + CSS Fixed Fallback
  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (stageRef.current && stageRef.current.requestFullscreen) {
          await stageRef.current.requestFullscreen();
        } else if (document.documentElement.requestFullscreen && isAudienceExtendWindow) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Fallback to CSS fixed fullscreen inside sandboxed iframe
      }
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch {
        // Ignore
      }
    }
  };

  // Keyboard Navigation (Right Arrow, Space, PageDown -> Next Point/Slide | Left Arrow, PageUp -> Prev Point/Slide)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleStepNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handleStepPrev();
      } else if (e.key === 'Escape') {
        if (activeSlideDrawer !== 'none') {
          onUpdateSlideState({ activeSlideDrawer: 'none' });
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleRevealAllCurrentSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleStepNext,
    handleStepPrev,
    handleRevealAllCurrentSlide,
    isFullscreen,
    activeSlideDrawer,
    onUpdateSlideState,
  ]);

  const getSlideVariants = () => {
    if (transitionStyle === 'zoom') {
      return {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.03 },
      };
    }
    if (transitionStyle === 'fade') {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
    }
    return {
      initial: { opacity: 0, x: slideDirection * 48 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: slideDirection * -48 },
    };
  };

  const itemRevealProps = {
    initial: { opacity: 0, y: 18, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  };

  if (!slide) return null;

  // Next step info for Presenter View
  const nextUpcomingStepInfo =
    stepByStepEnabled && revealedStep < maxSteps
      ? slideStepAssignments.stepDetails[revealedStep]
      : null;

  // Dynamic Kanban & Layout Density Calculation based on CURRENTLY VISIBLE elements on screen
  const isComparisonVisible = Boolean(
    slide.comparison &&
      (isStepVisible(slideStepAssignments.comparisonLeftStep) ||
        isStepVisible(slideStepAssignments.comparisonRightStep))
  );
  const isBannerVisible = Boolean(
    slide.bottomBanner && isStepVisible(slideStepAssignments.bannerStep)
  );
  const isDictVisible = Boolean(
    (slide.linkedQuestionIndex === 2 || slide.linkedQuestionIndex === 3) &&
      isStepVisible(slideStepAssignments.dictionaryStep)
  );
  const isPromptVisible = Boolean(
    (slide.promptLines || slide.linkedQuestionIndex !== undefined || slide.linkedPollId) &&
      isStepVisible(slideStepAssignments.promptStep)
  );

  const visibleSecondaryBlocks =
    (isComparisonVisible ? 1 : 0) +
    (isBannerVisible ? 1 : 0) +
    (isDictVisible ? 1 : 0) +
    (isPromptVisible ? 1 : 0);

  const totalCardsCount = slide.cards?.length || 0;

  // 'jumbo' = Only cards (1-3) or only comparison visible -> EXTRA LARGE text for elderly/back-row participants
  // 'medium' = Cards + 1 secondary block or 4 cards -> LARGE readable text
  // 'compact' = Cards + 2+ secondary blocks or 5 cards -> PROPORTIONAL readable text that fits the screen
  const dynamicDensity: 'jumbo' | 'medium' | 'compact' =
    visibleSecondaryBlocks === 0 && totalCardsCount <= 3
      ? 'jumbo'
      : visibleSecondaryBlocks <= 1 && totalCardsCount <= 4 && !isDictVisible
      ? 'medium'
      : 'compact';

  // Reusable Slide Stage Renderer (used in Standard Mode, Fullscreen Mode, Extend Window, and Presenter Live Preview)
  const renderSlideStageCanvas = (isCompactPreview = false) => (
    <div
      ref={isCompactPreview ? undefined : stageRef}
      className={
        isAudienceExtendWindow || isFullscreen
          ? 'fixed inset-0 z-50 h-screen max-h-screen overflow-hidden bg-[#FFF7EC] flex flex-col justify-between select-none'
          : isCompactPreview
          ? 'rounded-2xl overflow-hidden border-2 border-[#1F3A5F]/25 shadow-sm bg-[#FFF7EC] h-[460px] sm:h-[500px] flex flex-col justify-between relative select-none'
          : 'rounded-2xl overflow-hidden border border-[#1F3A5F]/20 shadow-md bg-[#FFF7EC] h-[calc(100vh-195px)] min-h-[540px] max-h-[780px] flex flex-col justify-between relative select-none'
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={safeSlideIndex}
          variants={getSlideVariants()}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (
              target.tagName !== 'BUTTON' &&
              target.tagName !== 'A' &&
              target.tagName !== 'SELECT' &&
              !target.closest('button')
            ) {
              handleStepNext();
            }
          }}
          className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden cursor-pointer"
          title="Klik area kosong atau tekan Panah Kanan (→) untuk memunculkan poin berikutnya"
        >
          {slide.type === 'cover' ? (
            <div className="flex-1 min-h-0 bg-[#1F3A5F] text-white p-8 sm:p-14 lg:p-16 flex flex-col justify-center overflow-y-auto">
              <div className={slide.imageUrl ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl' : ''}>
                <div className={slide.imageUrl ? 'lg:col-span-7' : ''}>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-[#F28C28] font-bold tracking-wider text-sm sm:text-xl mb-3"
                  >
                    {slide.badge}
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.06 }}
                    className={`font-display font-bold tracking-tight leading-tight max-w-5xl mb-4 ${
                      isCompactPreview
                        ? 'text-2xl sm:text-4xl'
                        : 'text-3xl sm:text-5xl lg:text-6xl'
                    }`}
                  >
                    {slide.title}
                  </motion.h1>
                  {slide.subtitle && (
                    <motion.p
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.12 }}
                      className={`text-white/85 max-w-4xl font-normal ${
                        isCompactPreview ? 'text-sm sm:text-lg' : 'text-base sm:text-2xl'
                      }`}
                    >
                      {slide.subtitle}
                    </motion.p>
                  )}
                </div>
                {slide.imageUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="lg:col-span-5 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-white/5"
                  >
                    <img
                      src={slide.imageUrl}
                      alt={slide.imageCaption || slide.title}
                      className="w-full h-64 sm:h-80 lg:h-96 object-cover"
                    />
                    {slide.imageCaption && (
                      <p className="p-3 bg-black/40 text-xs sm:text-sm text-white/90 border-t border-white/10 font-medium">
                        {slide.imageCaption}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          ) : slide.type === 'closing' ? (
            <div className="flex-1 min-h-0 bg-[#1F3A5F] text-white p-6 sm:p-10 flex flex-col justify-between overflow-y-auto">
              <div className="my-auto">
                <p className="text-[#F28C28] font-bold text-xl sm:text-3xl mb-5">{slide.title}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl items-stretch">
                  {slide.cards?.map((card, idx) => {
                    const stepNum = slideStepAssignments.cardSteps[idx];
                    if (!isStepVisible(stepNum)) return null;
                    return (
                      <motion.div
                        key={idx}
                        {...itemRevealProps}
                        className={`flex items-start gap-4 bg-white/10 border border-white/15 rounded-2xl p-4 sm:p-5 h-full ${
                          idx === 4 ? 'md:col-span-2' : ''
                        }`}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F28C28] text-white font-display font-bold text-base sm:text-xl flex items-center justify-center shrink-0 tabular-nums">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-lg sm:text-2xl font-bold text-white leading-snug">
                            {card.title.replace(/^\d+\.\s*/, '')}
                          </h3>
                          <p className="text-white/85 text-sm sm:text-lg mt-1 leading-relaxed">
                            {card.body}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              <div className="pt-4 mt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div>
                  <p className="text-base sm:text-xl font-medium text-white">
                    {slide.subtitle || 'Terima kasih! Tanya jawab dipersilakan.'}
                  </p>
                </div>
                {!isAudienceExtendWindow && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isFullscreen) setIsFullscreen(false);
                      onLaunchQna();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F28C28] text-white font-bold text-xs sm:text-sm hover:bg-[#d97719] transition-colors cursor-pointer"
                  >
                    Tampilkan Papan Q&A Interaktif
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Slide Header Bar (Locked at Top of Slide) */}
              <div className="bg-[#1F3A5F] text-white px-5 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-4 shrink-0">
                <h2
                  className={`font-display font-bold tracking-tight leading-snug ${
                    isCompactPreview
                      ? 'text-lg sm:text-xl'
                      : dynamicDensity === 'jumbo'
                      ? 'text-2xl sm:text-4xl lg:text-5xl'
                      : dynamicDensity === 'medium'
                      ? 'text-xl sm:text-3xl lg:text-4xl'
                      : 'text-xl sm:text-2xl lg:text-3xl'
                  }`}
                >
                  {slide.title}
                </h2>
                <span className="px-4 py-1.5 rounded-full bg-[#F28C28] text-white text-xs sm:text-sm font-bold tracking-wide shrink-0">
                  {slide.badge}
                </span>
              </div>

              {/* Slide Body Content (Dynamic sizing based on visible cards & blocks) */}
              <div
                className={`flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 ${
                  dynamicDensity === 'compact' ? 'py-3 sm:py-4 gap-3' : 'py-4 sm:py-6 gap-5'
                } flex flex-col justify-between`}
              >
                <div className="shrink-0">
                  {slide.subtitle && (
                    <p
                      className={`font-bold text-[#1F3A5F] max-w-5xl leading-snug ${
                        isCompactPreview
                          ? 'text-sm sm:text-base'
                          : dynamicDensity === 'jumbo'
                          ? 'text-lg sm:text-2xl lg:text-3xl'
                          : dynamicDensity === 'medium'
                          ? 'text-base sm:text-xl lg:text-2xl'
                          : 'text-base sm:text-lg lg:text-xl'
                      }`}
                    >
                      {slide.subtitle}
                    </p>
                  )}

                  {/* Subtle hint when waiting for first click on a step-by-step slide (hidden on clean Audience Extend screen) */}
                  {!isAudienceExtendWindow &&
                    stepByStepEnabled &&
                    revealedStep === 0 &&
                    maxSteps > 0 && (
                      <div className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F3A5F]/5 border border-[#1F3A5F]/15 text-xs sm:text-sm font-semibold text-[#1F3A5F]/75">
                        <Layers className="w-4 h-4 text-[#F28C28] shrink-0" />
                        <span>
                          Klik layar atau tekan <strong>Panah Kanan (→) / Spasi</strong> untuk memunculkan poin pertama (1 dari {maxSteps})
                        </span>
                      </div>
                    )}
                </div>

                {/* Visual Image Support for Slide (Top Banner or Split-Side Layout) */}
                {(() => {
                  const hasImage = Boolean(slide.imageUrl);
                  const isTopImage = hasImage && slide.imagePosition === 'top';
                  const isSideImage = hasImage && slide.imagePosition !== 'top';
                  const isLeftImage = isSideImage && slide.imagePosition === 'left';

                  const slideImageBlock = hasImage ? (
                    <motion.div
                      {...itemRevealProps}
                      className={`rounded-2xl bg-white border-2 border-[#1F3A5F]/20 overflow-hidden shadow-md flex flex-col justify-between ${
                        isTopImage
                          ? 'w-full max-h-[220px] sm:max-h-[300px] mb-3 shrink-0'
                          : 'h-full min-h-[240px] max-h-[520px]'
                      }`}
                    >
                      <div
                        className={`relative overflow-hidden bg-slate-900/5 flex items-center justify-center ${
                          isTopImage ? 'h-full min-h-[140px]' : 'flex-1 min-h-[180px]'
                        }`}
                      >
                        <img
                          src={slide.imageUrl}
                          alt={slide.imageCaption || slide.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {slide.imageCaption && (
                        <div className="px-4 py-2.5 bg-white border-t border-[#1F3A5F]/15 flex items-center gap-2 shrink-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#F28C28] shrink-0" />
                          <span className="text-xs sm:text-sm font-bold text-[#1F3A5F] leading-snug line-clamp-2">
                            {slide.imageCaption}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ) : null;

                  const mainContentCards = (
                    <>
                      {/* Agenda Steps Layout (Uniform & Large) */}
                      {slide.type === 'agenda' && slide.cards && (
                        <div className={`grid grid-cols-1 ${isSideImage ? 'sm:grid-cols-1' : 'md:grid-cols-2'} gap-3.5 my-auto items-stretch`}>
                          {slide.cards.map((item, idx) => {
                            const stepNum = slideStepAssignments.cardSteps[idx];
                            if (!isStepVisible(stepNum)) return null;
                            return (
                              <motion.div
                                key={idx}
                                {...itemRevealProps}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (idx < questions.length) {
                                    if (isFullscreen || isAudienceExtendWindow || presenterDualMode) {
                                      onSyncQuestionOnly(idx);
                                      handleToggleDrawer('answers');
                                    } else {
                                      onLaunchWorksheetQuestion(idx);
                                    }
                                  }
                                }}
                                className="h-full min-h-[76px] flex items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-white border-2 border-[#1F3A5F]/15 hover:border-[#F28C28] transition-colors cursor-pointer group"
                              >
                                <div
                                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full text-white font-display font-bold text-base sm:text-xl flex items-center justify-center shrink-0 tabular-nums ${
                                    item.accent === 'orange' ? 'bg-[#F28C28]' : 'bg-[#2A9D8F]'
                                  }`}
                                >
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-base sm:text-xl text-[#1F3A5F] group-hover:text-[#F28C28] transition-colors">
                                    {item.title.replace(/^\d+\.\s*/, '')}
                                  </p>
                                  <p className="text-sm sm:text-base text-[#1F3A5F]/80">
                                    {item.body}
                                  </p>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {/* Concept horizontal rows (Large & Easy to Read) */}
                      {slide.type === 'concept' &&
                        slide.cards &&
                        slide.cards[0]?.title === 'ARTINYA' && (
                          <div className="space-y-4 my-auto">
                            {slide.cards.map((card, i) => {
                              const stepNum = slideStepAssignments.cardSteps[i];
                              if (!isStepVisible(stepNum)) return null;
                              return (
                                <motion.div
                                  key={i}
                                  {...itemRevealProps}
                                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch"
                                >
                                  <div
                                    className={`md:col-span-3 rounded-xl p-4 sm:p-5 flex items-center justify-center text-white font-display font-bold text-base sm:text-2xl text-center ${
                                      card.accent === 'orange' ? 'bg-[#F28C28]' : 'bg-[#2A9D8F]'
                                    }`}
                                  >
                                    {card.title}
                                  </div>
                                  <div
                                    className={`md:col-span-9 rounded-xl bg-white p-4 sm:p-6 flex items-center text-base sm:text-2xl text-[#1F3A5F] font-medium border-2 ${
                                      card.accent === 'orange' ? 'border-[#F28C28]' : 'border-[#2A9D8F]'
                                    }`}
                                  >
                                    {card.body}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}

                      {/* Dynamic Multi-Column Kanban Cards (Large when few items, proportional when many) */}
                      {slide.cards &&
                        slide.type !== 'agenda' &&
                        slide.cards[0]?.title !== 'ARTINYA' && (
                          <div
                            className={`grid grid-cols-1 gap-4 items-stretch ${
                              dynamicDensity === 'jumbo' ? 'my-auto' : ''
                            } ${
                              isSideImage
                                ? slide.cards.length >= 4
                                  ? 'sm:grid-cols-2'
                                  : 'grid-cols-1'
                                : slide.cards.length === 5
                                ? 'sm:grid-cols-2 lg:grid-cols-5'
                                : slide.cards.length === 4
                                ? 'sm:grid-cols-2 lg:grid-cols-4'
                                : 'md:grid-cols-3'
                            }`}
                          >
                            {slide.cards.map((card, i) => {
                              const stepNum = slideStepAssignments.cardSteps[i];
                              if (!isStepVisible(stepNum)) return null;
                              return (
                                <motion.div
                                  key={i}
                                  {...itemRevealProps}
                                  className={`h-full rounded-2xl bg-white ${
                                    dynamicDensity === 'jumbo'
                                      ? 'p-6 sm:p-7 min-h-[220px]'
                                      : dynamicDensity === 'medium'
                                      ? 'p-5 sm:p-6'
                                      : 'p-4 sm:p-5'
                                  } border-2 flex flex-col justify-between shadow-xs ${
                                    card.accent === 'orange' ? 'border-[#F28C28]' : 'border-[#2A9D8F]'
                                  }`}
                                >
                                  <div>
                                    <div
                                      className={`w-10 h-2 rounded-full mb-3 ${
                                        card.accent === 'orange' ? 'bg-[#F28C28]' : 'bg-[#2A9D8F]'
                                      }`}
                                    />
                                    <h3
                                      className={`font-display font-bold text-[#1F3A5F] mb-2 leading-snug ${
                                        isCompactPreview
                                          ? 'text-base sm:text-lg'
                                          : dynamicDensity === 'jumbo'
                                          ? 'text-xl sm:text-2xl lg:text-3xl'
                                          : dynamicDensity === 'medium'
                                          ? 'text-lg sm:text-xl lg:text-2xl'
                                          : 'text-base sm:text-lg lg:text-xl'
                                      }`}
                                    >
                                      {card.title}
                                    </h3>
                                    <p
                                      className={`text-[#1F3A5F]/90 leading-relaxed font-medium ${
                                        isCompactPreview
                                          ? 'text-xs sm:text-sm'
                                          : dynamicDensity === 'jumbo'
                                          ? 'text-base sm:text-xl lg:text-2xl'
                                          : dynamicDensity === 'medium'
                                          ? 'text-sm sm:text-lg lg:text-xl'
                                          : 'text-sm sm:text-base lg:text-lg'
                                      }`}
                                    >
                                      {card.body}
                                    </p>
                                  </div>
                                  {card.extra && (
                                    <p
                                      className={`font-semibold text-[#1F3A5F]/80 mt-3 pt-2.5 border-t border-[#1F3A5F]/15 leading-snug ${
                                        dynamicDensity === 'jumbo'
                                          ? 'text-sm sm:text-lg'
                                          : 'text-xs sm:text-base'
                                      }`}
                                    >
                                      {card.extra}
                                    </p>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        )}

                      {/* Comparison boxes (Dynamic Large / Proportional Height) */}
                      {slide.comparison && (
                        <div
                          className={`grid grid-cols-1 ${isSideImage ? 'gap-3.5' : 'md:grid-cols-2 gap-4'} items-stretch ${
                            !slide.cards || slide.cards.length === 0 ? 'my-auto' : ''
                          }`}
                        >
                          {isStepVisible(slideStepAssignments.comparisonLeftStep) && (
                            <motion.div
                              {...itemRevealProps}
                              className={`h-full rounded-2xl ${
                                !slide.cards || slide.cards.length === 0
                                  ? 'p-6 sm:p-8 min-h-[220px]'
                                  : dynamicDensity === 'medium'
                                  ? 'p-4 sm:p-6'
                                  : 'p-4 sm:p-5'
                              } bg-[#FDE8E8] border-2 border-red-200 flex flex-col justify-between`}
                            >
                              <p className="text-sm sm:text-lg font-bold text-red-800 mb-1.5">
                                {slide.comparison.leftTitle}
                              </p>
                              <p
                                className={`${
                                  !slide.cards || slide.cards.length === 0
                                    ? 'text-lg sm:text-2xl lg:text-3xl'
                                    : dynamicDensity === 'medium'
                                    ? 'text-base sm:text-xl lg:text-2xl'
                                    : 'text-sm sm:text-lg lg:text-xl'
                                } font-semibold text-[#1F3A5F] whitespace-pre-line leading-snug`}
                              >
                                {slide.comparison.leftBody}
                              </p>
                            </motion.div>
                          )}
                          {isStepVisible(slideStepAssignments.comparisonRightStep) && (
                            <motion.div
                              {...itemRevealProps}
                              className={`h-full rounded-2xl ${
                                !slide.cards || slide.cards.length === 0
                                  ? 'p-6 sm:p-8 min-h-[220px]'
                                  : dynamicDensity === 'medium'
                                  ? 'p-4 sm:p-6'
                                  : 'p-4 sm:p-5'
                              } bg-[#E3F5F2] border-2 border-[#2A9D8F]/40 flex flex-col justify-between`}
                            >
                              <p className="text-sm sm:text-lg font-bold text-[#1d6f65] mb-1.5">
                                {slide.comparison.rightTitle}
                              </p>
                              <p
                                className={`${
                                  !slide.cards || slide.cards.length === 0
                                    ? 'text-lg sm:text-2xl lg:text-3xl'
                                    : dynamicDensity === 'medium'
                                    ? 'text-base sm:text-xl lg:text-2xl'
                                    : 'text-sm sm:text-lg lg:text-xl'
                                } font-semibold text-[#1F3A5F] whitespace-pre-line leading-snug`}
                              >
                                {slide.comparison.rightBody}
                              </p>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </>
                  );

                  return (
                    <>
                      {isTopImage && slideImageBlock}
                      {isSideImage ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch my-auto">
                          {isLeftImage && (
                            <div className="lg:col-span-5 flex flex-col justify-center">
                              {slideImageBlock}
                            </div>
                          )}
                          <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
                            {mainContentCards}
                          </div>
                          {!isLeftImage && (
                            <div className="lg:col-span-5 flex flex-col justify-center">
                              {slideImageBlock}
                            </div>
                          )}
                        </div>
                      ) : (
                        mainContentCards
                      )}
                    </>
                  );
                })()}

                {/* Bottom Banner Callout */}
                {slide.bottomBanner && isStepVisible(slideStepAssignments.bannerStep) && (
                  <motion.div
                    {...itemRevealProps}
                    className="rounded-xl bg-[#1F3A5F] text-white px-5 py-3.5 text-center font-display text-sm sm:text-xl lg:text-2xl font-bold shrink-0"
                  >
                    {slide.bottomBanner}
                  </motion.div>
                )}

                {/* Kamus Konversi Kata Sifat Jadi Angka (Slide Bagian 4 - Readable Proportional Cards) */}
                {slide.linkedQuestionIndex === 3 &&
                  isStepVisible(slideStepAssignments.dictionaryStep) && (
                    <motion.div
                      {...itemRevealProps}
                      className="rounded-xl bg-white border-2 border-[#2A9D8F]/40 p-3.5 sm:p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2A9D8F]">
                          KAMUS TERJEMAHAN: UBAH KATA KOSONG JADI BUKTI ANGKA (SEMUA JENIS UMKM)
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-stretch">
                        {RATIONAL_CONVERSION_DICTIONARY.map((item, idx) => (
                          <div
                            key={idx}
                            className="h-full rounded-xl bg-[#FFF7EC] border border-[#1F3A5F]/15 p-3 flex flex-col justify-between"
                          >
                            <div>
                              <span className="text-xs font-bold text-[#1F3A5F]/70 block">
                                {item.category}
                              </span>
                              <p className="text-xs sm:text-sm font-bold text-red-700 line-through mt-0.5">
                                Jangan: {item.vagueWord}
                              </p>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-[#2A9D8F] mt-2 pt-2 border-t border-[#1F3A5F]/10 leading-snug">
                              Pakai: {item.concreteProof}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                {/* Daftar 3 Kata Terlarang (Slide Bagian 3 - Readable Cards) */}
                {slide.linkedQuestionIndex === 2 &&
                  isStepVisible(slideStepAssignments.dictionaryStep) && (
                    <motion.div
                      {...itemRevealProps}
                      className="rounded-xl bg-white border-2 border-[#F28C28]/40 p-3.5 grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch"
                    >
                      {FORBIDDEN_VAGUE_WORDS.map((fw, idx) => (
                        <div
                          key={idx}
                          className="h-full rounded-xl bg-[#FFF7EC] p-3 border border-[#1F3A5F]/15 flex flex-col justify-between"
                        >
                          <div>
                            <p className="text-sm sm:text-base font-bold text-red-700">
                              Hindari Kata: {fw.vague}
                            </p>
                            <p className="text-xs sm:text-sm text-[#1F3A5F]/80 mt-1 leading-snug">
                              {fw.reason}
                            </p>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-[#2A9D8F] mt-2 pt-2 border-t border-[#1F3A5F]/10">
                            Ganti jadi: {fw.better}
                          </p>
                        </div>
                      ))}
                    </motion.div>
                  )}

                {/* "TULIS DI SINI" Interactive Box */}
                {(slide.promptLines ||
                  slide.linkedQuestionIndex !== undefined ||
                  slide.linkedPollId) &&
                  isStepVisible(slideStepAssignments.promptStep) && (
                    <motion.div
                      {...itemRevealProps}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-xl bg-[#FDE6C4]/70 border-2 border-dashed border-[#F28C28] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-default shrink-0"
                    >
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm font-bold tracking-wider text-[#F28C28] uppercase">
                          TULIS DI SINI (TERHUBUNG KE HP PESERTA)
                        </p>
                        {slide.promptLines?.map((line, idx) => (
                          <p key={idx} className="text-sm sm:text-xl font-bold text-[#1F3A5F]">
                            {line}
                          </p>
                        ))}
                        {linkedQuestion && (
                          <p className="text-xs sm:text-sm text-[#1F3A5F]/80">
                            Pertanyaan Aktif: <strong>{linkedQuestion.questionText}</strong> — Contoh:{' '}
                            <span className="italic">{linkedQuestion.exampleAnswer}</span>
                          </p>
                        )}
                      </div>

                      {!isAudienceExtendWindow && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                          {slide.linkedQuestionIndex !== undefined && (
                            <button
                              onClick={() => {
                                if (isFullscreen || presenterDualMode) {
                                  handleToggleDrawer('answers');
                                } else {
                                  onLaunchWorksheetQuestion(slide.linkedQuestionIndex!);
                                }
                              }}
                              className="px-4 py-2.5 rounded-xl bg-[#F28C28] text-white font-bold text-xs sm:text-sm hover:bg-[#d97719] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>
                                {isFullscreen || presenterDualMode
                                  ? `Tampilkan Jawaban (${questionAnswers.length})`
                                  : `Lihat ${questionAnswers.length} Jawaban Peserta`}
                              </span>
                            </button>
                          )}
                          {slide.linkedPollId && (
                            <button
                              onClick={() => {
                                if (isFullscreen || presenterDualMode) {
                                  handleToggleDrawer('poll');
                                } else {
                                  onLaunchPoll(slide.linkedPollId!);
                                }
                              }}
                              className="px-4 py-2.5 rounded-xl bg-[#2A9D8F] text-white font-bold text-xs sm:text-sm hover:bg-[#218276] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <BarChart3 className="w-4 h-4" />
                              <span>Buka Grafik Polling Live</span>
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Brand Strip (LOCKED at Bottom of Slide Frame — Never Pushed Off-Screen) */}
      <div className="bg-[#F28C28] text-white px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-semibold shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span>{organizerName}</span>
          {!isAudienceExtendWindow && stepByStepEnabled && maxSteps > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-black/20 font-mono text-xs tabular-nums">
              Langkah Poin: {revealedStep} / {maxSteps}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAudienceExtendWindow ? (
            <div className="flex items-center gap-2">
              <span className="font-mono tabular-nums">
                Slide {slide.pageNumber} / {totalSlides}
              </span>
              {!isFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="px-3 py-1 rounded-lg bg-[#1F3A5F] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#162944]"
                  title="Tampilkan Layar Penuh di Proyektor (Tekan F)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Fullscreen Proyektor (F)</span>
                </button>
              )}
              {onExitExtendWindow && !isFullscreen && (
                <button
                  onClick={onExitExtendWindow}
                  className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white text-xs font-semibold cursor-pointer"
                >
                  Menu Utama
                </button>
              )}
            </div>
          ) : (
            <>
              {isFullscreen && (
                <>
                  <button
                    onClick={() =>
                      onUpdateSlideState({
                        stepByStepEnabled: !stepByStepEnabled,
                        activeSlideStep: !stepByStepEnabled ? 0 : maxSteps,
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{stepByStepEnabled ? 'Animasi: ON' : 'Animasi: OFF'}</span>
                  </button>

                  {stepByStepEnabled && revealedStep < maxSteps && (
                    <button
                      onClick={handleRevealAllCurrentSlide}
                      className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka Semua</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleDrawer('qr')}
                    className="px-2.5 py-1 rounded-lg bg-[#1F3A5F] text-white text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-[#162944]"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Peserta</span>
                  </button>

                  {slide.linkedQuestionIndex !== undefined && (
                    <button
                      onClick={() => handleToggleDrawer('answers')}
                      className="px-2.5 py-1 rounded-lg bg-[#1F3A5F] text-white text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-[#162944]"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Jawaban ({questionAnswers.length})</span>
                    </button>
                  )}

                  {slide.linkedPollId && (
                    <button
                      onClick={() => handleToggleDrawer('poll')}
                      className="px-2.5 py-1 rounded-lg bg-[#2A9D8F] text-white text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-[#218276]"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Polling ({currentPollVotes.length})</span>
                    </button>
                  )}
                </>
              )}

              {/* Always-locked Prev / Next Stepper inside the Bottom Brand Strip */}
              <div className="flex items-center gap-1 bg-black/20 rounded-lg p-0.5">
                <button
                  onClick={handleStepPrev}
                  disabled={safeSlideIndex === 0 && revealedStep === 0}
                  className="px-2 py-1 rounded hover:bg-black/20 disabled:opacity-40 cursor-pointer flex items-center gap-0.5 text-xs font-bold"
                  title="Poin / Slide Sebelumnya (←)"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Mundur</span>
                </button>
                <span className="font-mono px-2 tabular-nums text-xs font-bold">
                  Slide {slide.pageNumber} / {totalSlides}
                </span>
                <button
                  onClick={handleStepNext}
                  disabled={safeSlideIndex === totalSlides - 1 && revealedStep >= maxSteps}
                  className="px-2 py-1 rounded bg-[#1F3A5F] hover:bg-[#162944] disabled:opacity-40 cursor-pointer flex items-center gap-0.5 text-xs font-bold"
                  title="Poin / Slide Berikutnya (→)"
                >
                  <span className="hidden sm:inline">
                    {stepByStepEnabled && revealedStep < maxSteps ? 'Poin' : 'Maju'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {isFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="px-2.5 py-1 rounded-lg bg-white text-[#1F3A5F] text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-[#FFF7EC]"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Keluar (Esc)</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* SYNCED LIVE OVERLAY DRAWER (Appears on Fullscreen / Extended Projector Screen / Stage) */}
      {activeSlideDrawer !== 'none' && !isCompactPreview && (
        <div
          onClick={() => onUpdateSlideState({ activeSlideDrawer: 'none' })}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFF7EC] border-4 border-[#F28C28] rounded-3xl max-w-5xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-[#1F3A5F]/15 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#F28C28]">
                  LAYAR INTERAKTIF LANGSUNG DI ATAS SLIDE
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1F3A5F]">
                  {activeSlideDrawer === 'answers' &&
                    `Pertanyaan ${effectiveQuestionIndex + 1}: ${drawerQuestion?.questionText || 'Jawaban Peserta UMKM'}`}
                  {activeSlideDrawer === 'poll' && (drawerPoll?.title || 'Hasil Live Polling')}
                  {activeSlideDrawer === 'qna' && 'Papan Tanya Jawab (Q&A Anonim) & Voting Peserta'}
                  {activeSlideDrawer === 'qr' && 'Scan QR Code di HP Anda'}
                </h3>
              </div>
              <button
                onClick={() => onUpdateSlideState({ activeSlideDrawer: 'none' })}
                className="p-2 rounded-xl bg-[#1F3A5F] text-white hover:bg-[#162944] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeSlideDrawer === 'qr' && (
              <div className="text-center py-6 space-y-4">
                <div className="bg-white p-6 rounded-2xl border-2 border-[#1F3A5F]/15 inline-block mx-auto">
                  <QRCodeSVG value={joinUrl} size={260} fgColor="#1F3A5F" />
                </div>
                <p className="font-mono text-base font-bold text-[#1F3A5F]">{joinUrl}</p>
              </div>
            )}

            {activeSlideDrawer === 'answers' && (
              <div className="space-y-4">
                {!isAudienceExtendWindow && pendingQuestionAnswers.length > 0 && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-bold text-amber-900">
                      Ada {pendingQuestionAnswers.length} jawaban peserta yang masih tertahan di Mode Saringan Moderasi:
                    </p>
                    <button
                      onClick={async () => {
                        for (const pAns of pendingQuestionAnswers) {
                          await onApproveAnswer(pAns);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Setujui & Tampilkan Semua ({pendingQuestionAnswers.length})
                    </button>
                  </div>
                )}

                {questionAnswers.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 text-center text-[#1F3A5F]/60 font-display text-xl font-bold">
                    Menunggu jawaban peserta masuk dari HP...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {questionAnswers.map((ans) => {
                      const isBigSpotlight = ans.star && ans.spotlightSize !== 'kecil';
                      const isSmallSpotlight = ans.star && ans.spotlightSize === 'kecil';
                      return (
                        <div
                          key={ans.id}
                          className={`bg-white rounded-2xl p-5 border flex flex-col justify-between gap-3 ${
                            isBigSpotlight
                              ? 'border-3 border-[#F28C28] md:col-span-2 shadow-md ring-2 ring-[#F28C28]/20'
                              : isSmallSpotlight
                              ? 'border-2 border-[#F28C28] bg-[#FFFDF8] shadow-xs'
                              : 'border-[#1F3A5F]/15'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              {ans.businessName ? (
                                <div className="flex items-center gap-1.5 text-sm font-bold text-[#2A9D8F]">
                                  <Store className="w-4 h-4" />
                                  <span>{ans.businessName}</span>
                                </div>
                              ) : (
                                <span className="text-xs font-semibold text-[#1F3A5F]/50">Peserta UMKM</span>
                              )}
                              {ans.star && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#F28C28] bg-[#FFF7EC] px-2 py-0.5 rounded-md border border-[#F28C28]/40">
                                  <Star className="w-3 h-3 fill-[#F28C28]" />
                                  <span>{isBigSpotlight ? 'Sorot Besar' : 'Sorot Kecil'}</span>
                                </span>
                              )}
                            </div>
                            <p
                              className={`font-display font-bold text-[#1F3A5F] ${
                                isBigSpotlight
                                  ? 'text-2xl sm:text-3xl'
                                  : isSmallSpotlight
                                  ? 'text-xl sm:text-2xl'
                                  : 'text-lg sm:text-xl'
                              }`}
                            >
                              "{ans.text}"
                            </p>
                            {ans.subText && (
                              <p className="text-sm text-[#1F3A5F]/75">{ans.subText}</p>
                            )}
                          </div>
                          {!isAudienceExtendWindow && (
                            <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-[#1F3A5F]/10">
                              {ans.star ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => onToggleStarAnswer(ans, isBigSpotlight ? 'kecil' : 'besar')}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-[#1F3A5F] cursor-pointer"
                                  >
                                    Ubah ke Sorot {isBigSpotlight ? 'Kecil' : 'Besar'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onToggleStarAnswer(ans, isBigSpotlight ? 'besar' : 'kecil')}
                                    className="px-3 py-1 rounded-lg text-xs font-bold bg-[#F28C28] text-white hover:bg-[#d97719] cursor-pointer"
                                  >
                                    Lepas Sorot
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => onToggleStarAnswer(ans, 'besar')}
                                    className="px-3 py-1 rounded-lg text-xs font-bold bg-[#F28C28] hover:bg-[#d97719] text-white flex items-center gap-1 cursor-pointer"
                                    title="Sorot dalam ukuran besar"
                                  >
                                    <Star className="w-3 h-3 fill-white" />
                                    <span>Sorot Besar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onToggleStarAnswer(ans, 'kecil')}
                                    className="px-3 py-1 rounded-lg text-xs font-bold bg-[#FFF7EC] hover:bg-[#F28C28]/20 text-[#1F3A5F] border border-[#F28C28]/50 flex items-center gap-1 cursor-pointer"
                                    title="Sorot dalam ukuran kecil"
                                  >
                                    <Star className="w-3 h-3 text-[#F28C28]" />
                                    <span>Sorot Kecil</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeSlideDrawer === 'poll' && drawerPoll && (
              <div className="bg-white rounded-2xl p-6 space-y-4">
                <p className="font-mono text-sm font-bold text-[#2A9D8F] tabular-nums">
                  Total Suara Masuk: {currentPollVotes.length}
                </p>
                {drawerPoll.options.map((opt) => {
                  const count = currentPollVotes.filter((v) => v.optionId === opt.id).length;
                  const pct =
                    currentPollVotes.length > 0
                      ? Math.round((count / currentPollVotes.length) * 100)
                      : 0;
                  return (
                    <div key={opt.id} className="space-y-1.5">
                      <div className="flex justify-between text-base font-bold text-[#1F3A5F]">
                        <span>{opt.label}</span>
                        <span className="font-mono tabular-nums">
                          {count} suara ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-5 bg-[#FFF7EC] rounded-xl overflow-hidden">
                        <div
                          className="h-full bg-[#2A9D8F] transition-all duration-300"
                          style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeSlideDrawer === 'qna' && (
              <div className="space-y-4">
                {sortedQna.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 text-center text-[#1F3A5F]/60 font-display text-xl font-bold">
                    Belum ada pertanyaan Q&A masuk dari peserta...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedQna.map((qna) => (
                      <div
                        key={qna.id}
                        className={`bg-white rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          qna.star ? 'border-3 border-[#F28C28]' : 'border-[#1F3A5F]/15'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#2A9D8F]">
                            <span>{qna.authorName}</span>
                            <span>·</span>
                            <span>{qna.topicTag}</span>
                            {qna.star && (
                              <span className="text-[#F28C28] uppercase">· DISOROT PEMATERI</span>
                            )}
                          </div>
                          <p className="font-display text-xl sm:text-2xl font-bold text-[#1F3A5F]">
                            "{qna.text}"
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="px-4 py-2 rounded-xl bg-[#FFF7EC] border border-[#1F3A5F]/15 flex items-center gap-1.5 font-mono font-bold text-[#1F3A5F]">
                            <ThumbsUp className="w-4 h-4 text-[#F28C28]" />
                            <span>{qna.upvotes}</span>
                          </div>
                          {!isAudienceExtendWindow && (
                            <button
                              onClick={() => onToggleStarQna(qna)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer ${
                                qna.star
                                  ? 'bg-[#F28C28] text-white'
                                  : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#F28C28]/40'
                              }`}
                            >
                              <Star className="w-3.5 h-3.5" />
                              <span>{qna.star ? 'Lepas Sorot' : 'Sorot'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // If this window is the dedicated 2nd-screen Audience Extend Display (?view=extend)
  if (isAudienceExtendWindow) {
    return renderSlideStageCanvas(false);
  }

  return (
    <div className={isFullscreen ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'}>
      {/* Slide Controller Strip (Hidden when in Fullscreen Mode) */}
      {!isFullscreen && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white border border-[#1F3A5F]/15 rounded-xl px-4 sm:px-5 py-3.5 shadow-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs font-semibold text-[#1F3A5F]/70 tabular-nums">
              Slide {slide.pageNumber} / {totalSlides}
            </span>
            <span aria-hidden="true" className="text-[#1F3A5F]/30">·</span>

            {/* Toggle PPT Step-by-Step Animation */}
            <button
              type="button"
              onClick={() =>
                onUpdateSlideState({
                  stepByStepEnabled: !stepByStepEnabled,
                  activeSlideStep: !stepByStepEnabled ? 0 : maxSteps,
                })
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                stepByStepEnabled
                  ? 'bg-[#1F3A5F] text-white'
                  : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#1F3A5F]/20'
              }`}
              title="Munculkan poin materi satu per satu seperti animasi PowerPoint"
            >
              <Layers className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>Animasi Poin PPT: {stepByStepEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {stepByStepEnabled && maxSteps > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#2A9D8F] tabular-nums">
                  Poin {revealedStep} / {maxSteps}
                </span>
                {revealedStep < maxSteps && (
                  <button
                    type="button"
                    onClick={handleRevealAllCurrentSlide}
                    className="text-xs font-semibold text-[#1F3A5F]/70 hover:text-[#1F3A5F] underline cursor-pointer"
                  >
                    Buka Semua
                  </button>
                )}
              </div>
            )}

            <span aria-hidden="true" className="text-[#1F3A5F]/30 hidden sm:inline">·</span>

            {/* Slide Transition Effect Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-[#1F3A5F]/70">Transisi:</span>
              <select
                value={transitionStyle}
                onChange={(e) =>
                  onUpdateSlideState({ transitionStyle: e.target.value as SlideTransitionStyle })
                }
                className="rounded-lg border border-[#1F3A5F]/20 bg-[#FFF7EC] px-2.5 py-1 text-xs font-bold text-[#1F3A5F] cursor-pointer"
              >
                <option value="slide">Geser Halus (Slide)</option>
                <option value="zoom">Dimensi (Zoom Smooth)</option>
                <option value="fade">Pudar Lembut (Fade)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Dual-Screen Presenter Mode (PowerPoint Extend View) */}
            <button
              type="button"
              onClick={() => setPresenterDualMode(!presenterDualMode)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                presenterDualMode
                  ? 'bg-[#2A9D8F] text-white'
                  : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#2A9D8F]/40 hover:bg-[#2A9D8F] hover:text-white'
              }`}
              title="Buka Meja Presenter 2 Layar seperti PowerPoint Extend"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{presenterDualMode ? 'Tutup Mode Presenter' : 'Mode Extend 2 Layar (PPT)'}</span>
            </button>

            {/* Open 2nd Screen Clean Audience Window */}
            <a
              href={extendUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#1F3A5F] text-white hover:bg-[#162944] transition-colors whitespace-nowrap"
              title="Buka jendela khusus Layar Proyektor Bersih untuk digeser (drag) ke monitor/proyektor kedua"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>Layar ke-2 (Proyektor)</span>
            </a>

            {/* Open QR Code for Presenter's Smartphone Remote Clicker */}
            <button
              type="button"
              onClick={() => setShowRemoteQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#FFF7EC] text-[#1F3A5F] border border-[#F28C28]/50 hover:bg-[#F28C28] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              title="Scan QR untuk menjadikan HP Anda sebagai Pointer Panggung"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>QR Remote HP</span>
            </button>

            {/* Cetak / Simpan PDF Seluruh Slide Materi */}
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#FFF7EC] text-[#1F3A5F] border border-[#1F3A5F]/20 hover:bg-[#1F3A5F] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              title="Cetak atau Simpan Seluruh Slide Materi ke PDF (A4 Landscape)"
            >
              <Printer className="w-3.5 h-3.5 text-[#2A9D8F]" />
              <span>PDF Slide</span>
            </button>

            {/* Saklar Bagikan Slide ke HP Peserta */}
            <button
              type="button"
              onClick={() =>
                onUpdateSlideState({
                  allowParticipantSlideAccess: !allowParticipantSlideAccess,
                })
              }
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                allowParticipantSlideAccess
                  ? 'bg-[#2A9D8F] text-white'
                  : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#2A9D8F]/40 hover:bg-[#2A9D8F]/10'
              }`}
              title="Izinkan peserta membaca & mengunduh PDF seluruh slide materi secara mandiri dari HP mereka"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>
                {allowParticipantSlideAccess ? 'Slide di HP Peserta: BUKA' : 'Bagikan Slide ke HP'}
              </span>
            </button>

            {!presenterDualMode && (
              <button
                onClick={toggleFullscreen}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#1F3A5F]/10 text-[#1F3A5F] hover:bg-[#1F3A5F]/20 transition-colors cursor-pointer whitespace-nowrap"
                title="Tampilkan Slide Layar Penuh di Layar Ini (Tekan F)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleStepPrev}
                disabled={safeSlideIndex === 0 && revealedStep === 0}
                className="p-2 rounded-lg border border-[#1F3A5F]/20 text-[#1F3A5F] hover:bg-[#1F3A5F]/5 disabled:opacity-40 cursor-pointer"
                title="Poin / Slide Sebelumnya (←)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleStepNext}
                disabled={safeSlideIndex === totalSlides - 1 && revealedStep >= maxSteps}
                className="px-3 py-2 rounded-lg bg-[#F28C28] text-white font-bold text-xs hover:bg-[#d97719] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                title="Munculkan Poin Berikutnya / Slide Berikutnya (→ atau Spasi)"
              >
                <span>
                  {stepByStepEnabled && revealedStep < maxSteps
                    ? `Munculkan Poin ${revealedStep + 1}`
                    : 'Slide Berikutnya'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DUAL-SCREEN PRESENTER VIEW (GAYA POWERPOINT EXTEND) */}
      {presenterDualMode && !isFullscreen ? (
        <div className="space-y-6">
          {/* Dual-Screen Status & Timer Strip */}
          <div className="bg-[#1F3A5F] text-white rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2A9D8F] text-white text-xs font-bold">
                <Monitor className="w-3.5 h-3.5" />
                <span>MODE PRESENTER 2 LAYAR AKTIF</span>
              </span>
              <p className="text-xs sm:text-sm text-white/85">
                Klik tombol <strong>"Buka Jendela Proyektor Kedua"</strong>, geser (*drag*) tab tersebut ke layar HDMI Extend, lalu tekan <strong>F</strong>.
              </p>
            </div>

            {/* Stopwatch Timer & Quick Extend Link */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl">
                <Clock className="w-4 h-4 text-[#F28C28]" />
                <span className="font-mono text-base font-extrabold tabular-nums">
                  {formatTimer(timerSeconds)}
                </span>
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className="p-1 rounded bg-[#F28C28] text-white hover:bg-[#d97719] cursor-pointer"
                  title={timerRunning ? 'Jeda Timer' : 'Mulai Timer Presentasi'}
                >
                  {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSeconds(0);
                  }}
                  className="p-1 rounded bg-white/15 text-white hover:bg-white/25 cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <a
                href={extendUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-[#F28C28] hover:bg-[#d97719] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka Jendela Proyektor Kedua (Extend HDMI)</span>
              </a>
            </div>
          </div>

          {/* 2-Column Presenter Console Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN (7/12): Live Slide Monitor + Remote Clicker Controls */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F]/70">
                  LAYAR AKTIF DI PROYEKTOR SAAT INI (SLIDE #{slide.pageNumber})
                </span>
                <span className="font-mono text-xs font-bold text-[#2A9D8F] tabular-nums">
                  {stepByStepEnabled && maxSteps > 0
                    ? `Poin Tampil: ${revealedStep} dari ${maxSteps}`
                    : 'Semua Poin Tampil'}
                </span>
              </div>

              {/* Compact Live Stage Preview */}
              {renderSlideStageCanvas(true)}

              {/* Big Tactile Presenter Clicker Bar */}
              <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <button
                  onClick={handleStepPrev}
                  disabled={safeSlideIndex === 0 && revealedStep === 0}
                  className="px-4 py-3 rounded-xl border border-[#1F3A5F]/20 text-[#1F3A5F] hover:bg-[#1F3A5F]/5 disabled:opacity-40 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Mundur 1 Langkah</span>
                </button>

                <button
                  onClick={handleStepNext}
                  disabled={safeSlideIndex === totalSlides - 1 && revealedStep >= maxSteps}
                  className="flex-1 min-w-[200px] py-3.5 px-6 rounded-xl bg-[#F28C28] hover:bg-[#d97719] disabled:opacity-40 text-white font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>
                    {stepByStepEnabled && revealedStep < maxSteps
                      ? `Klik Berikutnya: Munculkan Poin ${revealedStep + 1} / ${maxSteps}`
                      : safeSlideIndex < totalSlides - 1
                      ? `Pindah ke Slide Berikutnya (#${safeSlideIndex + 2})`
                      : 'Selesai di Slide Terakhir'}
                  </span>
                  <ChevronRight className="w-5 h-5" />
                </button>

                {stepByStepEnabled && revealedStep < maxSteps && (
                  <button
                    onClick={handleRevealAllCurrentSlide}
                    className="px-4 py-3 rounded-xl bg-[#1F3A5F] text-white hover:bg-[#162944] font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Buka Semua Poin</span>
                  </button>
                )}
              </div>

              {/* Remote Overlay Controls for the Extended Projector Screen */}
              <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F]/70">
                  KENDALI POP-UP DI LAYAR PROYEKTOR KEDUA (TANPA GESER MOUSE KE PROYEKTOR)
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => handleToggleDrawer('qr')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      activeSlideDrawer === 'qr'
                        ? 'bg-[#F28C28] text-white'
                        : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#1F3A5F]/20 hover:border-[#F28C28]'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>
                      {activeSlideDrawer === 'qr' ? 'Tutup QR di Proyektor' : 'Tampilkan QR di Proyektor'}
                    </span>
                  </button>

                  {slide.linkedQuestionIndex !== undefined && (
                    <button
                      onClick={() => handleToggleDrawer('answers')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        activeSlideDrawer === 'answers'
                          ? 'bg-[#F28C28] text-white'
                          : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#1F3A5F]/20 hover:border-[#F28C28]'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>
                        {activeSlideDrawer === 'answers'
                          ? 'Tutup Jawaban di Proyektor'
                          : `Tampilkan Jawaban Peserta (${questionAnswers.length})`}
                      </span>
                    </button>
                  )}

                  {slide.linkedPollId && (
                    <button
                      onClick={() => handleToggleDrawer('poll')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        activeSlideDrawer === 'poll'
                          ? 'bg-[#2A9D8F] text-white'
                          : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#1F3A5F]/20 hover:border-[#2A9D8F]'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>
                        {activeSlideDrawer === 'poll'
                          ? 'Tutup Grafik Polling'
                          : `Tampilkan Grafik Polling (${currentPollVotes.length})`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (5/12): Next Point/Slide Preview + Speaker Notes + Live Incoming Answers */}
            <div className="lg:col-span-5 space-y-4">
              {/* 1. NEXT POINT & NEXT SLIDE PREVIEW (GAYA POWERPOINT PRESENTER VIEW) */}
              <div className="bg-white border-2 border-[#2A9D8F]/40 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#1F3A5F]/10 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2A9D8F]">
                    BOCORAN KETUKAN BERIKUTNYA (NEXT UP)
                  </span>
                  <span className="text-xs font-mono font-bold text-[#1F3A5F]/60">
                    Hanya terlihat di layar Anda
                  </span>
                </div>

                {nextUpcomingStepInfo ? (
                  <div className="rounded-xl bg-[#E3F5F2] border border-[#2A9D8F]/40 p-4 space-y-1.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#2A9D8F] text-white text-[11px] font-bold">
                      Poin Berikutnya ({nextUpcomingStepInfo.stepNumber} dari {maxSteps}) · {nextUpcomingStepInfo.label}
                    </span>
                    <p className="font-display text-base sm:text-lg font-bold text-[#1F3A5F] pt-1">
                      {nextUpcomingStepInfo.previewText}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#FFF7EC] border border-[#F28C28]/40 p-3.5 text-xs font-bold text-[#1F3A5F]">
                    Semua poin di slide ini sudah tampil di proyektor. Ketukan berikutnya akan berpindah ke Slide selanjutnya.
                  </div>
                )}

                {/* Next Slide Card Preview */}
                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F]/60 mb-2">
                    SLIDE SELANJUTNYA:
                  </p>
                  {nextSlide ? (
                    <div className="rounded-xl bg-[#1F3A5F] text-white p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F28C28] text-white font-bold">
                          Slide #{nextSlide.pageNumber} · {nextSlide.badge}
                        </span>
                      </div>
                      <h4 className="font-display text-lg font-bold">{nextSlide.title}</h4>
                      {nextSlide.subtitle && (
                        <p className="text-xs text-white/80 line-clamp-2">{nextSlide.subtitle}</p>
                      )}
                      {nextSlide.cards && nextSlide.cards.length > 0 && (
                        <div className="pt-2 border-t border-white/15 space-y-1">
                          {nextSlide.cards.slice(0, 3).map((c, i) => (
                            <p key={i} className="text-xs text-white/85 truncate">
                              • {c.title}: {c.body}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-100 p-4 text-xs font-semibold text-slate-600">
                      Ini adalah slide terakhir dalam deck presentasi.
                    </div>
                  )}
                </div>
              </div>

              {/* 2. SPEAKER NOTES (CATATAN PEMATERI & CONTEKAN 5 PERTANYAAN SULIT) */}
              <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F28C28] flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>CONTEKAN PEMATERI (SPEAKER NOTES)</span>
                  </span>
                </div>

                {(slide.speakerNotes || SEMINAR_SLIDES[safeSlideIndex]?.speakerNotes) && (
                  <div className="rounded-xl bg-[#E3F5F2] border border-[#2A9D8F]/40 p-3.5 text-xs sm:text-sm text-[#1F3A5F] leading-relaxed">
                    <span className="font-bold text-[#1d6f65] block mb-1 uppercase tracking-wider text-[11px]">
                      Panduan Bicara Slide #{slide.pageNumber}:
                    </span>
                    {slide.speakerNotes || SEMINAR_SLIDES[safeSlideIndex]?.speakerNotes}
                  </div>
                )}

                {linkedQuestion && (
                  <div className="rounded-xl bg-[#FFF7EC] border border-[#1F3A5F]/10 p-3.5 space-y-1.5 text-xs text-[#1F3A5F]">
                    <p className="font-bold text-[#1F3A5F]">
                      Inti Latihan: {linkedQuestion.coreLearning}
                    </p>
                    {linkedQuestion.helperTips.map((tip, idx) => (
                      <p key={idx} className="text-[#1F3A5F]/80">
                        • {tip}
                      </p>
                    ))}
                  </div>
                )}

                <textarea
                  rows={2}
                  value={customNotesMap[safeSlideIndex] || ''}
                  onChange={(e) => handleSaveCustomNote(safeSlideIndex, e.target.value)}
                  placeholder="Ketik catatan pribadi / kalimat jembatan untuk Slide ini (tersimpan otomatis & tidak tampil di proyektor)..."
                  className="w-full rounded-xl border border-[#1F3A5F]/20 bg-[#FFF7EC]/50 p-3 text-xs sm:text-sm text-[#1F3A5F] focus:outline-none focus:border-[#F28C28]"
                />

                {/* Contekan 5 Pertanyaan Sulit Peserta (Halaman 8 Dokumen) */}
                <details className="rounded-xl bg-[#FFF7EC] border border-[#F28C28]/40 p-3.5 text-xs text-[#1F3A5F]">
                  <summary className="font-bold text-[#1F3A5F] cursor-pointer select-none flex items-center justify-between">
                    <span>💡 Contekan 5 Pertanyaan Sulit Peserta (Panduan Taktis)</span>
                    <span className="text-[#F28C28] text-[11px]">Buka / Tutup</span>
                  </summary>
                  <div className="mt-3 space-y-2.5 pt-2.5 border-t border-[#1F3A5F]/10 max-h-72 overflow-y-auto pr-1">
                    {SPEAKER_TOUGH_QUESTIONS.map((tq) => (
                      <div key={tq.id} className="bg-white rounded-lg p-3 border border-[#1F3A5F]/10 space-y-1">
                        <p className="font-bold text-[#1F3A5F]">{tq.question}</p>
                        <p className="font-semibold text-[#2A9D8F]">Prinsip: {tq.shortPrinciple}</p>
                        <p className="text-[#1F3A5F]/85 leading-relaxed">{tq.tacticalAnswer}</p>
                        <p className="text-[#F28C28] font-semibold italic">{tq.coachingQuestion}</p>
                      </div>
                    ))}
                  </div>
                </details>
              </div>

              {/* 3. INTIP JAWABAN PESERTA MASUK DI LAPTOP PEMATERI */}
              {slide.linkedQuestionIndex !== undefined && (
                <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F]">
                      INTIP JAWABAN PESERTA MASUK ({questionAnswers.length})
                    </span>
                    {pendingQuestionAnswers.length > 0 && (
                      <button
                        onClick={async () => {
                          for (const pAns of pendingQuestionAnswers) {
                            await onApproveAnswer(pAns);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Setujui {pendingQuestionAnswers.length} Pending
                      </button>
                    )}
                  </div>

                  {questionAnswers.length === 0 ? (
                    <p className="text-xs text-[#1F3A5F]/60 py-3">
                      Belum ada jawaban masuk untuk pertanyaan di slide ini.
                    </p>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {questionAnswers.map((ans) => (
                        <div
                          key={ans.id}
                          className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-2 ${
                            ans.star
                              ? 'bg-[#FFF7EC] border-[#F28C28]'
                              : 'bg-white border-[#1F3A5F]/15'
                          }`}
                        >
                          <div className="space-y-0.5">
                            {ans.businessName && (
                              <p className="font-bold text-[#2A9D8F]">{ans.businessName}</p>
                            )}
                            <p className="font-semibold text-[#1F3A5F]">"{ans.text}"</p>
                          </div>
                          {ans.star ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] font-bold text-[#F28C28] bg-white px-1.5 py-0.5 rounded border border-[#F28C28]/40">
                                {ans.spotlightSize === 'kecil' ? 'Kecil' : 'Besar'}
                              </span>
                              <button
                                type="button"
                                onClick={() => onToggleStarAnswer(ans)}
                                className="px-2 py-1 rounded-lg font-bold bg-[#F28C28] text-white cursor-pointer text-[11px]"
                                title="Lepas sorotan"
                              >
                                Lepas
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => onToggleStarAnswer(ans, 'besar')}
                                className="px-2 py-1 rounded-lg font-bold cursor-pointer bg-[#F28C28] hover:bg-[#d97719] text-white text-[11px]"
                                title="Sorot Besar"
                              >
                                S.Besar
                              </button>
                              <button
                                type="button"
                                onClick={() => onToggleStarAnswer(ans, 'kecil')}
                                className="px-2 py-1 rounded-lg font-bold cursor-pointer bg-[#FFF7EC] text-[#1F3A5F] border border-[#F28C28]/40 hover:bg-[#F28C28]/20 text-[11px]"
                                title="Sorot Kecil"
                              >
                                S.Kecil
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD 1-SCREEN OR FULLSCREEN SLIDE STAGE */
        renderSlideStageCanvas(false)
      )}

      {/* Quick Slide Thumbnail Strip (Locked at Bottom of Screen, Uniform Card Sizes) */}
      {!isFullscreen && (
        <div className="sticky bottom-2 z-30 mt-3 bg-[#1F3A5F]/95 backdrop-blur-xs border border-white/15 rounded-2xl p-2 shadow-lg flex items-center gap-2">
          <button
            type="button"
            onClick={handleStepPrev}
            disabled={safeSlideIndex === 0 && revealedStep === 0}
            className="h-[52px] px-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            title="Poin / Slide Sebelumnya (←)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Mundur</span>
          </button>

          <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {slides.map((s, idx) => {
              const isCurrent = idx === safeSlideIndex;
              const hasInteractive =
                s.linkedQuestionIndex !== undefined || s.linkedPollId !== undefined;
              return (
                <button
                  key={idx}
                  onClick={() => handleJumpToSlide(idx)}
                  className={`h-[52px] w-[135px] px-3 py-1.5 rounded-xl border text-left transition-all shrink-0 cursor-pointer flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-[#F28C28] text-white border-[#F28C28] shadow-xs'
                      : 'bg-white text-[#1F3A5F] border-white/20 hover:border-[#F28C28]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono tabular-nums opacity-85">
                    <span>Slide #{s.pageNumber}</span>
                    {hasInteractive && (
                      <Sparkles
                        className={`w-3 h-3 ${isCurrent ? 'text-white' : 'text-[#F28C28]'}`}
                      />
                    )}
                  </div>
                  <p className="text-xs font-bold truncate w-full">{s.title}</p>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleStepNext}
            disabled={safeSlideIndex === totalSlides - 1 && revealedStep >= maxSteps}
            className="h-[52px] px-3.5 rounded-xl bg-[#F28C28] hover:bg-[#d97719] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
            title="Munculkan Poin / Slide Berikutnya (→)"
          >
            <span className="hidden sm:inline">
              {stepByStepEnabled && revealedStep < maxSteps
                ? `Poin ${revealedStep + 1}`
                : 'Maju'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL QR REMOTE HP PEMATERI */}
      {showRemoteQrModal && (
        <div
          onClick={() => setShowRemoteQrModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFF7EC] border-4 border-[#2A9D8F] rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl space-y-5"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2A9D8F]">
                POINTER PANGGUNG TANPA DONGLE USB
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1F3A5F]">
                Scan di HP Pemateri
              </h3>
              <p className="text-xs sm:text-sm text-[#1F3A5F]/75">
                Scan QR ini menggunakan kamera HP Anda untuk membuka <strong>Layar Remote Pointer</strong> (PIN bawaan: <strong>2026</strong>).
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-[#1F3A5F]/15 inline-block mx-auto shadow-xs">
              <QRCodeSVG value={remoteUrl} size={220} fgColor="#1F3A5F" />
            </div>

            <div className="bg-white rounded-xl p-3 border border-[#1F3A5F]/15 text-left space-y-1">
              <p className="text-[11px] font-bold text-[#1F3A5F]/60">Tautan Langsung Remote HP:</p>
              <p className="font-mono text-xs font-bold text-[#1F3A5F] break-all select-all">
                {remoteUrl}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRemoteQrModal(false)}
              className="w-full py-3 rounded-xl bg-[#1F3A5F] text-white font-display font-bold text-sm hover:bg-[#162944] cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
