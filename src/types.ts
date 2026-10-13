import { WorksheetQuestion, LivePollConfig, SlideDefinition, SlideImagePosition } from './data/seminarData';
export type { SlideImagePosition };

export type InteractiveMode = 'worksheet' | 'poll' | 'qna' | 'external';
export type ViewRole = 'projector' | 'participant' | 'moderation' | 'slides' | 'editor' | 'extend' | 'remote' | 'guide';
export type SlideTransitionStyle = 'slide' | 'zoom' | 'fade';
export type SlideDrawerMode = 'none' | 'answers' | 'poll' | 'qna' | 'qr';

export interface SessionStateDoc {
  activeQuestion: number;
  activeSlide: number;
  activeSlideStep?: number;
  stepByStepEnabled?: boolean;
  transitionStyle?: SlideTransitionStyle;
  activeSlideDrawer?: SlideDrawerMode;
  allowParticipantSlideAccess?: boolean;
  activeMode: InteractiveMode;
  activePollId: string;
  moderationEnabled: boolean;
  externalEmbedUrl: string;
  externalPlatform: 'slido' | 'mentimeter' | 'custom';
  sessionName: string;
  updatedAt: number;
}

export interface BrandThemeConfig {
  presetId: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  secondaryColor: string;
  bgColor: string;
}

export interface CustomContentDoc {
  seminarTitle: string;
  organizerName: string;
  questions: WorksheetQuestion[];
  polls: LivePollConfig[];
  slides: SlideDefinition[];
  qnaTopics: string[];
  brandTheme?: BrandThemeConfig;
  updatedAt: number;
}

export interface AnswerDoc {
  id: string;
  q: number;
  text: string;
  subText: string;
  businessName: string;
  participantId: string;
  status: 'pending' | 'approved' | 'hidden';
  star: boolean;
  spotlightSize?: 'besar' | 'kecil';
  likes: number;
  mentorNote: string;
  ts: number;
}

export interface QnaDoc {
  id: string;
  text: string;
  authorName: string;
  isAnonymous: boolean;
  topicTag: string;
  upvotes: number;
  status: 'pending' | 'approved' | 'hidden' | 'answered';
  star: boolean;
  participantId: string;
  ts: number;
}

export interface PollVoteDoc {
  id: string;
  pollId: string;
  optionId: string;
  customWord: string;
  businessName: string;
  participantId: string;
  ts: number;
}
