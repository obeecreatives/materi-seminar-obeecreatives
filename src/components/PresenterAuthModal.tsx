import React, { useState } from 'react';
import { ViewRole } from '../types';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Monitor,
  Presentation,
  Smartphone,
  Sliders,
  Edit3,
  BookOpen,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface PresenterAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: ViewRole;
  onSelectRole: (role: ViewRole) => void;
  isUnlocked: boolean;
  onUnlockSuccess: () => void;
  onLock: () => void;
  onOpenGuide: () => void;
}

const DEFAULT_PIN = '2026';

export const PresenterAuthModal: React.FC<PresenterAuthModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
  isUnlocked,
  onUnlockSuccess,
  onLock,
  onOpenGuide,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [changePinSuccess, setChangePinSuccess] = useState(false);

  if (!isOpen) return null;

  const getSavedPin = (): string => {
    try {
      return window.localStorage.getItem('partnerup_remote_pin_v1') || DEFAULT_PIN;
    } catch {
      return DEFAULT_PIN;
    }
  };

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const correctPin = getSavedPin();
    if (pinInput.trim() === correctPin.trim() || pinInput.trim() === DEFAULT_PIN) {
      try {
        window.sessionStorage.setItem('partnerup_presenter_unlocked_v1', 'true');
        window.sessionStorage.setItem('partnerup_remote_unlocked_v1', 'true');
      } catch {
        // ignore
      }
      setErrorMsg('');
      setPinInput('');
      onUnlockSuccess();
    } else {
      setErrorMsg('PIN yang dimasukkan salah. Silakan coba lagi (PIN bawaan: 2026).');
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || newPin.length < 4) {
      setErrorMsg('PIN baru minimal 4 angka/karakter.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('Konfirmasi PIN baru tidak cocok.');
      return;
    }
    try {
      window.localStorage.setItem('partnerup_remote_pin_v1', newPin);
      setChangePinSuccess(true);
      setErrorMsg('');
      setNewPin('');
      setConfirmPin('');
      setTimeout(() => {
        setChangePinSuccess(false);
        setShowChangePin(false);
      }, 1500);
    } catch {
      setErrorMsg('Gagal menyimpan PIN baru ke penyimpanan lokal.');
    }
  };

  const roleOptions: {
    role: ViewRole;
    label: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      role: 'projector',
      label: 'Layar Proyektor Panggung',
      desc: 'Tampilan panggung interaktif untuk layar lebar / infokus',
      icon: <Monitor className="w-5 h-5 text-[#F28C28]" />,
      color: 'border-amber-200 hover:border-[#F28C28]',
    },
    {
      role: 'slides',
      label: 'Materi Slide Presentasi',
      desc: '17 Slide kurikulum lengkap seminar PartnerUp',
      icon: <Presentation className="w-5 h-5 text-blue-500" />,
      color: 'border-blue-200 hover:border-blue-500',
    },
    {
      role: 'remote',
      label: 'Remote HP Pemateri',
      desc: 'Kontrol slide, catatan pemateri, dan live cue dari HP',
      icon: <Smartphone className="w-5 h-5 text-emerald-500" />,
      color: 'border-emerald-200 hover:border-emerald-500',
    },
    {
      role: 'moderation',
      label: 'Panel Moderasi',
      desc: 'Saring dan approve jawaban worksheet serta pertanyaan Q&A',
      icon: <Sliders className="w-5 h-5 text-purple-500" />,
      color: 'border-purple-200 hover:border-purple-500',
    },
    {
      role: 'editor',
      label: 'Editor Materi & Tema Warna',
      desc: 'Edit judul, pertanyaan, dan sesuaikan palet warna brand',
      icon: <Edit3 className="w-5 h-5 text-rose-500" />,
      color: 'border-rose-200 hover:border-rose-500',
    },
    {
      role: 'participant',
      label: 'Simulasi HP Peserta',
      desc: 'Lihat persis apa yang sedang dilihat dan diisi oleh peserta',
      icon: <Smartphone className="w-5 h-5 text-slate-500" />,
      color: 'border-slate-200 hover:border-slate-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#1F3A5F] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              {isUnlocked ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <Lock className="w-5 h-5 text-[#F28C28]" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isUnlocked ? 'Panel Navigasi Pemateri & Developer' : 'Keamanan Akses Pemateri'}
              </h3>
              <p className="text-xs text-white/70">
                {isUnlocked
                  ? 'Pilih peran atau tampilan yang ingin diakses'
                  : 'Area khusus pemateri dan tim pengembang'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!isUnlocked ? (
            /* PIN Unlock Form */
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#F28C28] shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold block text-sm mb-0.5 text-amber-950">Akses Terlindungi PIN</span>
                  Panel ini sengaja disembunyikan dari peserta umum demi kelancaran seminar. Masukkan PIN keamanan Anda untuk membuka kontrol penuh.
                  <span className="block mt-1 text-[11px] text-amber-800">
                    PIN Standar Bawaan: <code className="bg-amber-100 font-mono px-1 py-0.5 rounded font-bold">2026</code>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Masukkan PIN Akses
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="Contoh: 2026"
                    maxLength={10}
                    autoFocus
                    className="w-full pl-10 pr-10 py-2.5 text-sm font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C28] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#1F3A5F] hover:bg-[#162a45] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4 text-[#F28C28]" />
                <span>Buka Kunci Akses Pemateri</span>
              </button>
            </form>
          ) : (
            /* Role Switcher & Developer Tools */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">
                    Status: Akses Pemateri Aktif
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowChangePin(!showChangePin)}
                    className="text-[11px] text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                  >
                    Ganti PIN
                  </button>
                  <span className="text-emerald-300">•</span>
                  <button
                    onClick={() => {
                      onLock();
                      onClose();
                    }}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    Kunci
                  </button>
                </div>
              </div>

              {/* Change PIN Form (Accordion) */}
              {showChangePin && (
                <form
                  onSubmit={handleChangePin}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in"
                >
                  <div className="text-xs font-bold text-slate-800">Ubah PIN Keamanan</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="password"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="PIN Baru"
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F28C28]"
                    />
                    <input
                      type="password"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="Ulangi PIN"
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F28C28]"
                    />
                  </div>
                  {changePinSuccess ? (
                    <div className="text-[11px] text-emerald-600 font-bold">✓ PIN berhasil diperbarui!</div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowChangePin(false)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 text-xs bg-[#F28C28] text-white font-bold rounded hover:bg-[#d97719] cursor-pointer"
                      >
                        Simpan PIN
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* Role Navigation Grid */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Pindah Tampilan & Peran
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {roleOptions.map((opt) => {
                    const isSelected = currentRole === opt.role;
                    return (
                      <button
                        key={opt.role}
                        onClick={() => {
                          onSelectRole(opt.role);
                          onClose();
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                          opt.color
                        } ${
                          isSelected
                            ? 'bg-amber-50/80 border-[#F28C28] ring-2 ring-[#F28C28]/20 shadow-xs'
                            : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                          {opt.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {opt.label}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-extrabold text-[#F28C28] bg-amber-100 px-1.5 py-0.2 rounded shrink-0">
                                Aktif
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Guide Book & Manual Duplication */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    onClose();
                    onOpenGuide();
                  }}
                  className="w-full p-3 bg-gradient-to-r from-[#1F3A5F] to-[#2B4C7E] text-white rounded-xl flex items-center justify-between hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-[#F28C28]" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>Buku Panduan & Manual Duplikasi</span>
                        <span className="text-[9px] bg-[#F28C28] text-white px-1.5 py-0.2 rounded font-extrabold">PDF</span>
                      </div>
                      <p className="text-[10px] text-white/70">
                        Latar belakang, arsitektur engine, glosarium teknis & cara gandakan app
                      </p>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-[#F28C28]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
