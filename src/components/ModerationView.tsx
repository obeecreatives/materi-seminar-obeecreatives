import React, { useState } from 'react';
import { WorksheetQuestion } from '../data/seminarData';
import { AnswerDoc, QnaDoc, SessionStateDoc } from '../types';
import {
  Shield,
  Check,
  EyeOff,
  Star,
  Trash2,
  Edit3,
  Download,
  ExternalLink,
  RefreshCw,
  MessageSquare,
  BookOpen,
  Sparkles,
  Store,
  Settings,
} from 'lucide-react';

interface ModerationViewProps {
  questions: WorksheetQuestion[];
  sessionState: SessionStateDoc;
  allAnswers: AnswerDoc[];
  allQna: QnaDoc[];
  onToggleModerationGate: (enabled: boolean) => Promise<void>;
  onUpdateExternalEmbed: (platform: 'slido' | 'mentimeter' | 'custom', url: string) => Promise<void>;
  onApproveAnswer: (ans: AnswerDoc) => Promise<void>;
  onHideAnswer: (ans: AnswerDoc) => Promise<void>;
  onToggleStarAnswer: (ans: AnswerDoc, targetSize?: 'besar' | 'kecil') => Promise<void>;
  onUpdateAnswerDetails: (ans: AnswerDoc, newText: string, newMentorNote: string) => Promise<void>;
  onDeleteAnswer: (id: string) => Promise<void>;
  onApproveQna: (qna: QnaDoc) => Promise<void>;
  onHideQna: (qna: QnaDoc) => Promise<void>;
  onToggleStarQna: (qna: QnaDoc) => Promise<void>;
  onDeleteQna: (id: string) => Promise<void>;
  onClearAllDemoData: () => Promise<void>;
  onSeedSampleData: () => Promise<void>;
  onDownloadCsv: () => void;
  onOpenContentEditor: () => void;
}

export const ModerationView: React.FC<ModerationViewProps> = ({
  questions,
  sessionState,
  allAnswers,
  allQna,
  onToggleModerationGate,
  onUpdateExternalEmbed,
  onApproveAnswer,
  onHideAnswer,
  onToggleStarAnswer,
  onUpdateAnswerDetails,
  onDeleteAnswer,
  onApproveQna,
  onHideQna,
  onToggleStarQna,
  onDeleteQna,
  onClearAllDemoData,
  onSeedSampleData,
  onDownloadCsv,
  onOpenContentEditor,
}) => {
  const [activeCategory, setActiveCategory] = useState<'answers' | 'qna' | 'embed'>('answers');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'hidden'>('all');
  const [questionFilter, setQuestionFilter] = useState<number | 'all'>('all');

  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editMentorNote, setEditMentorNote] = useState('');

  const [embedPlatform, setEmbedPlatform] = useState<'slido' | 'mentimeter' | 'custom'>(
    sessionState.externalPlatform || 'slido'
  );
  const [embedUrlInput, setEmbedUrlInput] = useState(sessionState.externalEmbedUrl || '');
  const [embedSaved, setEmbedSaved] = useState(false);

  const [confirmClear, setConfirmClear] = useState(false);

  const pendingAnswersCount = allAnswers.filter((a) => a.status === 'pending').length;
  const pendingQnaCount = allQna.filter((q) => q.status === 'pending').length;

  const filteredAnswers = allAnswers.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (questionFilter !== 'all' && a.q !== questionFilter) return false;
    return true;
  });

  const filteredQna = allQna.filter((q) => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    return true;
  });

  const startEditingAnswer = (ans: AnswerDoc) => {
    setEditingAnswerId(ans.id);
    setEditText(ans.text);
    setEditMentorNote(ans.mentorNote || '');
  };

  const saveEditedAnswer = async (ans: AnswerDoc) => {
    await onUpdateAnswerDetails(ans, editText.trim().slice(0, 250), editMentorNote.trim().slice(0, 200));
    setEditingAnswerId(null);
  };

  const handleSaveEmbed = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateExternalEmbed(embedPlatform, embedUrlInput.trim());
    setEmbedSaved(true);
    setTimeout(() => setEmbedSaved(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Moderation Control Header */}
      <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F28C28]">
            <Shield className="w-4 h-4" />
            <span>Meja Kendali Panitia & Moderator Seminar</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1F3A5F]">
            Dasbor Moderasi & Saringan Jawaban Real-Time
          </h1>
          <p className="text-sm text-[#1F3A5F]/75">
            Saring jawaban atau pertanyaan yang masuk sebelum ditampilkan di proyektor, beri catatan apresiasi hangat, atau buka Editor Materi.
          </p>
        </div>

        {/* Strict Moderation Gate Switch & Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="bg-[#FFF7EC] border border-[#1F3A5F]/20 rounded-xl p-3 flex items-center gap-3">
            <div>
              <p className="text-xs font-bold text-[#1F3A5F]">
                Mode Saringan Ketat (Wajib Setujui Dulu)
              </p>
              <p className="text-[11px] text-[#1F3A5F]/70">
                {sessionState.moderationEnabled
                  ? 'AKTIF: Jawaban masuk ke tab Menunggu Persetujuan'
                  : 'NONAKTIF: Jawaban peserta langsung tampil di proyektor'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleModerationGate(!sessionState.moderationEnabled)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                sessionState.moderationEnabled
                  ? 'bg-[#F28C28] text-white'
                  : 'bg-[#1F3A5F] text-white'
              }`}
            >
              {sessionState.moderationEnabled ? 'Saringan: ON' : 'Langsung Tampil'}
            </button>
          </div>

          <button
            onClick={onOpenContentEditor}
            className="px-4 py-3 rounded-xl bg-[#1F3A5F] hover:bg-[#162944] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Ubah Materi / Pertanyaan</span>
          </button>

          <button
            onClick={onDownloadCsv}
            className="px-4 py-3 rounded-xl bg-[#2A9D8F] hover:bg-[#218276] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh CSV Rekap</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Session Maintenance */}
      <div className="flex flex-wrap items-center justify-between gap-4 max-w-full">
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl border border-[#1F3A5F]/15 max-w-full">
          <button
            onClick={() => setActiveCategory('answers')}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeCategory === 'answers'
                ? 'bg-[#1F3A5F] text-white'
                : 'text-[#1F3A5F]/75 hover:bg-[#1F3A5F]/5'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Jawaban Lembar Kerja ({allAnswers.length})</span>
            {pendingAnswersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#F28C28] text-white font-mono text-xs tabular-nums">
                {pendingAnswersCount} perlu cek
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveCategory('qna')}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeCategory === 'qna'
                ? 'bg-[#1F3A5F] text-white'
                : 'text-[#1F3A5F]/75 hover:bg-[#1F3A5F]/5'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Pertanyaan Q&A Anonim ({allQna.length})</span>
            {pendingQnaCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#F28C28] text-white font-mono text-xs tabular-nums">
                {pendingQnaCount} perlu cek
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveCategory('embed')}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeCategory === 'embed'
                ? 'bg-[#1F3A5F] text-white'
                : 'text-[#1F3A5F]/75 hover:bg-[#1F3A5F]/5'
            }`}
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>Integrasi Slido / Mentimeter</span>
          </button>
        </div>

        {/* Utility Buttons */}
        <div className="flex flex-wrap items-center gap-2 max-w-full">
          <button
            onClick={onSeedSampleData}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#1F3A5F]/20 hover:border-[#2A9D8F] text-[#1F3A5F] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Isi Contoh Jawaban UMKM</span>
          </button>

          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Jawaban Uji (Hari H)</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-red-100 px-3 py-1.5 rounded-xl border border-red-300">
              <span className="text-xs font-bold text-red-900">Yakin hapus semua?</span>
              <button
                onClick={async () => {
                  await onClearAllDemoData();
                  setConfirmClear(false);
                }}
                className="px-2.5 py-1 rounded bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2.5 py-1 rounded bg-white text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: MODERASI JAWABAN LEMBAR KERJA */}
      {activeCategory === 'answers' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#1F3A5F]/15 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 bg-[#FFF7EC] p-1 rounded-lg border border-[#1F3A5F]/10">
              {(['all', 'pending', 'approved', 'hidden'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                    statusFilter === st
                      ? 'bg-[#1F3A5F] text-white'
                      : 'text-[#1F3A5F]/70 hover:text-[#1F3A5F]'
                  }`}
                >
                  {st === 'all' && `Semua (${allAnswers.length})`}
                  {st === 'pending' && `Menunggu (${allAnswers.filter((a) => a.status === 'pending').length})`}
                  {st === 'approved' && `Tampil di Layar (${allAnswers.filter((a) => a.status === 'approved').length})`}
                  {st === 'hidden' && `Disembunyikan (${allAnswers.filter((a) => a.status === 'hidden').length})`}
                </button>
              ))}
            </div>

            <select
              value={questionFilter}
              onChange={(e) =>
                setQuestionFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="rounded-lg border border-[#1F3A5F]/20 bg-white px-3 py-2 text-xs font-bold text-[#1F3A5F]"
            >
              <option value="all">Semua Bagian Materi (1–{questions.length})</option>
              {questions.map((q, idx) => (
                <option key={idx} value={idx}>
                  {q.sectionTitle}
                </option>
              ))}
            </select>
          </div>

          {filteredAnswers.length === 0 ? (
            <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-10 text-center text-[#1F3A5F]/60">
              Tidak ada jawaban pada filter ini.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAnswers.map((ans) => {
                const qInfo = questions[ans.q] || questions[0];
                const isEditing = editingAnswerId === ans.id;

                return (
                  <div
                    key={ans.id}
                    className={`bg-white rounded-xl p-5 border transition-all ${
                      ans.status === 'pending'
                        ? 'border-[#F28C28] bg-[#FFF7EC]/40'
                        : ans.status === 'hidden'
                        ? 'border-slate-200 opacity-60'
                        : 'border-[#1F3A5F]/15'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#1F3A5F]/70">
                          <span className="font-bold text-[#1F3A5F]">
                            {qInfo ? qInfo.sectionTitle : `Pertanyaan #${ans.q + 1}`}
                          </span>
                          <span aria-hidden="true">·</span>
                          {ans.businessName ? (
                            <span className="font-bold text-[#2A9D8F] flex items-center gap-1">
                              <Store className="w-3.5 h-3.5" />
                              {ans.businessName}
                            </span>
                          ) : (
                            <span>Tanpa Nama Usaha</span>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {new Date(ans.ts).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`font-bold uppercase ${
                              ans.status === 'approved'
                                ? 'text-emerald-700'
                                : ans.status === 'pending'
                                ? 'text-[#F28C28]'
                                : 'text-red-700'
                            }`}
                          >
                            {ans.status === 'approved'
                              ? 'Tampil di Proyektor'
                              : ans.status === 'pending'
                              ? 'Menunggu Moderasi'
                              : 'Disembunyikan'}
                          </span>
                        </div>

                        {isEditing ? (
                          <div className="space-y-3 pt-2">
                            <div>
                              <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                                Sunting Teks Jawaban (Misal: Hapus Nomor HP / Rapikan Ejaan):
                              </label>
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full rounded-lg border border-[#1F3A5F]/30 px-3 py-2 text-sm font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#2A9D8F] mb-1">
                                Tambah Catatan Apresiasi / Masukan Pemateri (Tampil saat disorot):
                              </label>
                              <input
                                type="text"
                                value={editMentorNote}
                                onChange={(e) => setEditMentorNote(e.target.value)}
                                placeholder="Contoh: Bagus sekali! Sudah ada bukti angka 3 bulan dan target jelas."
                                className="w-full rounded-lg border border-[#2A9D8F]/40 px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => saveEditedAnswer(ans)}
                                className="px-3.5 py-1.5 rounded-lg bg-[#2A9D8F] text-white text-xs font-bold cursor-pointer"
                              >
                                Simpan Perubahan
                              </button>
                              <button
                                onClick={() => setEditingAnswerId(null)}
                                className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-lg font-bold text-[#1F3A5F]">{ans.text}</p>
                            {ans.subText && (
                              <p className="text-sm text-[#1F3A5F]/75">{ans.subText}</p>
                            )}
                            {ans.mentorNote && (
                              <p className="text-xs font-semibold text-[#2A9D8F] flex items-center gap-1 pt-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Catatan Pemateri: {ans.mentorNote}</span>
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {ans.status !== 'approved' && (
                          <button
                            onClick={() => onApproveAnswer(ans)}
                            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Setujui Tampil</span>
                          </button>
                        )}

                        {ans.star ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-1.5 rounded-lg bg-[#FFF7EC] border border-[#F28C28] text-xs font-bold text-[#F28C28] flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-[#F28C28]" />
                              <span>Disorot: {ans.spotlightSize === 'kecil' ? 'Kecil' : 'Besar'}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => onToggleStarAnswer(ans, ans.spotlightSize === 'kecil' ? 'besar' : 'kecil')}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#1F3A5F] text-xs font-semibold cursor-pointer"
                              title="Ganti ukuran sorot di proyektor"
                            >
                              Ganti ke {ans.spotlightSize === 'kecil' ? 'Besar' : 'Kecil'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleStarAnswer(ans)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#F28C28] text-white hover:bg-[#d97719] text-xs font-bold cursor-pointer"
                            >
                              Lepas Sorot
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onToggleStarAnswer(ans, 'besar')}
                              className="px-3 py-1.5 rounded-lg bg-[#F28C28] hover:bg-[#d97719] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title="Sorot dalam ukuran besar di panggung proyektor"
                            >
                              <Star className="w-3.5 h-3.5 fill-white" />
                              <span>Sorot Besar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleStarAnswer(ans, 'kecil')}
                              className="px-3 py-1.5 rounded-lg bg-[#FFF7EC] hover:bg-[#F28C28]/20 text-[#1F3A5F] border border-[#F28C28]/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                              title="Sorot dalam ukuran kecil / ringkas"
                            >
                              <Star className="w-3.5 h-3.5 text-[#F28C28]" />
                              <span>Sorot Kecil</span>
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => startEditingAnswer(ans)}
                          className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#1F3A5F] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          title="Sunting atau Beri Catatan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Catatan / Edit</span>
                        </button>

                        {ans.status !== 'hidden' && (
                          <button
                            onClick={() => onHideAnswer(ans)}
                            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Sembunyikan</span>
                          </button>
                        )}

                        <button
                          onClick={() => onDeleteAnswer(ans.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Hapus Permanen"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* TAB 2: MODERASI PERTANYAAN Q&A ANONIM */}
      {activeCategory === 'qna' && (
        <div className="space-y-3">
          {filteredQna.length === 0 ? (
            <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-10 text-center text-[#1F3A5F]/60">
              Belum ada antrean pertanyaan Q&A.
            </div>
          ) : (
            filteredQna.map((qna) => (
              <div
                key={qna.id}
                className={`bg-white rounded-xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  qna.status === 'pending'
                    ? 'border-[#F28C28] bg-[#FFF7EC]/40'
                    : 'border-[#1F3A5F]/15'
                }`}
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2 text-xs text-[#1F3A5F]/70">
                    <span className="font-bold text-[#2A9D8F]">{qna.authorName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{qna.topicTag}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono font-bold text-[#F28C28] tabular-nums">
                      {qna.upvotes} Vote
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-bold uppercase">{qna.status}</span>
                  </div>
                  <p className="text-lg font-bold text-[#1F3A5F]">{qna.text}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {qna.status !== 'approved' && (
                    <button
                      onClick={() => onApproveQna(qna)}
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Setujui Tampil</span>
                    </button>
                  )}
                  <button
                    onClick={() => onToggleStarQna(qna)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      qna.star
                        ? 'bg-[#F28C28] text-white'
                        : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#F28C28]/40'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>{qna.star ? 'Disorot' : 'Sorot'}</span>
                  </button>
                  {qna.status !== 'hidden' && (
                    <button
                      onClick={() => onHideQna(qna)}
                      className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Sembunyikan
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteQna(qna.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: INTEGRASI SLIDO / MENTIMETER EMBED */}
      {activeCategory === 'embed' && (
        <div className="bg-white border border-[#1F3A5F]/15 rounded-2xl p-6 sm:p-8 max-w-3xl space-y-5">
          <div>
            <h2 className="font-display text-xl font-bold text-[#1F3A5F]">
              Jembatan Embed Slido / Mentimeter Eksternal
            </h2>
            <p className="text-sm text-[#1F3A5F]/75 mt-1">
              Selain mesin Polling & Q&A bawaan di aplikasi ini, Anda juga bisa menempelkan tautan sesi Slido (`https://app.sli.do/event/...`) atau Mentimeter (`https://www.mentimeter.com/app/...`) agar tampil menyatu di layar Proyektor.
            </p>
          </div>

          <form onSubmit={handleSaveEmbed} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#1F3A5F] mb-2">
                Pilih Platform
              </label>
              <div className="flex gap-2">
                {(['slido', 'mentimeter', 'custom'] as const).map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setEmbedPlatform(plat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer ${
                      embedPlatform === plat
                        ? 'bg-[#1F3A5F] text-white'
                        : 'bg-[#FFF7EC] text-[#1F3A5F] border border-[#1F3A5F]/20'
                    }`}
                  >
                    {plat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F3A5F] mb-1.5">
                URL Embed Sesi (Kosongkan jika hanya memakai fitur bawaan)
              </label>
              <input
                type="url"
                value={embedUrlInput}
                onChange={(e) => setEmbedUrlInput(e.target.value)}
                placeholder="https://app.sli.do/event/..."
                className="w-full rounded-xl border border-[#1F3A5F]/25 px-4 py-3 text-sm"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-[#F28C28] hover:bg-[#d97719] text-white font-bold text-sm cursor-pointer"
            >
              Simpan Konfigurasi Embed
            </button>

            {embedSaved && (
              <p className="text-xs font-bold text-emerald-700">
                Konfigurasi berhasil disimpan! Tombol Embed akan muncul di bilah atas Tampilan Presenter.
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
