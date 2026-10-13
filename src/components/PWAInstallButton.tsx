import React, { useState } from 'react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { MonitorSmartphone, Smartphone, WifiOff, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallModalTrigger: React.FC<{ variant?: 'light' | 'dark' }> = ({
  variant = 'dark',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
          variant === 'dark'
            ? 'bg-[#2A9D8F] hover:bg-[#218276] text-white'
            : 'bg-[#1F3A5F] hover:bg-[#162944] text-white'
        }`}
        title="Instal aplikasi ke Laptop/PC atau Layar Utama HP"
      >
        <MonitorSmartphone className="w-3.5 h-3.5" />
        <span>Instal Aplikasi (PC / HP)</span>
      </button>

      {showGuideModal && (
        <div
          onClick={() => setShowGuideModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFF7EC] border-2 border-[#1F3A5F]/20 rounded-3xl max-w-md w-full p-6 sm:p-8 text-[#1F3A5F] shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#F28C28]">
                  Progressive Web App (PWA)
                </span>
                <h3 className="font-display text-2xl font-extrabold text-[#1F3A5F] mt-0.5">
                  Instal PartnerUp Live
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-[#1F3A5F]/60 hover:bg-[#1F3A5F]/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <div className="bg-white rounded-2xl p-4 border border-[#1F3A5F]/15 space-y-2.5 text-sm">
                <p className="font-bold text-[#2A9D8F] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  Cara Instal di iPhone / iPad (Safari):
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-[#1F3A5F]/85">
                  <li>
                    Ketuk ikon <strong>Bagikan (Share)</strong> di bilah bawah browser Safari.
                  </li>
                  <li>
                    Gulir ke bawah lalu pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.
                  </li>
                  <li>
                    Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="bg-white rounded-2xl p-4 border border-[#1F3A5F]/15 space-y-2">
                  <p className="font-bold text-[#1F3A5F] flex items-center gap-1.5">
                    <MonitorSmartphone className="w-4 h-4 text-[#F28C28]" />
                    Di PC / Laptop (Chrome atau Edge):
                  </p>
                  <p className="text-[#1F3A5F]/80 leading-relaxed">
                    Klik ikon <strong>Instal (komputer dengan tanda panah unduh)</strong> di sebelah kanan bilah alamat URL browser (atau buka di tab baru di luar preview), lalu klik <strong>Instal</strong>.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[#1F3A5F]/15 space-y-2">
                  <p className="font-bold text-[#2A9D8F] flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    Di HP Android (Chrome):
                  </p>
                  <p className="text-[#1F3A5F]/80 leading-relaxed">
                    Ketuk menu titik tiga <strong>(⋮)</strong> di pojok kanan atas Chrome, lalu pilih <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-[#E3F5F2] border border-[#2A9D8F]/30 p-3.5 flex items-center gap-2.5 text-xs font-semibold text-[#1F3A5F]">
              <CheckCircle2 className="w-4 h-4 text-[#2A9D8F] shrink-0" />
              <span>
                Setelah diinstal, aplikasi dapat dibuka langsung dari Desktop / Layar Utama HP dan tetap hemat kuota!
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-3 rounded-xl bg-[#1F3A5F] text-white font-display font-bold text-sm hover:bg-[#162944] cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Mode Offline — Sinyal terputus, menggunakan tampilan tersimpan (Cache).</span>
    </div>
  );
};
