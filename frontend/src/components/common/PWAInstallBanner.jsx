import { useState, useEffect } from 'react';
import usePWAInstall from '../../hooks/usePWAInstall';
import { Download, X, Clock } from 'lucide-react';

export default function PWAInstallBanner() {
  const { isInstallable, isInstalled, installPWA } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show the banner if installable and the user has not dismissed it in this session
    const isDismissed = sessionStorage.getItem('pwa_banner_dismissed');
    if (isInstallable && !isDismissed && !isInstalled) {
      setIsVisible(true);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-50 animate-slide-up">
      <div className="bg-[#111111]/85 backdrop-blur-xl border border-[#FF7A00]/20 p-5 rounded-2xl shadow-2xl shadow-[#FF7A00]/5 flex flex-col gap-4 relative overflow-hidden">
        {/* Decorative Top Accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-[#FF7A00]"></div>

        <button 
          onClick={handleDismiss} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition cursor-pointer"
          aria-label="Dismiss Install Prompt"
        >
          <X size={16} />
        </button>

        <div className="flex gap-3.5">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-black border border-[#FF7A00]/20 flex items-center justify-center shadow-md shadow-[#FF7A00]/5">
            <Clock size={20} className="text-[#FF7A00]" />
          </div>
          <div className="flex flex-col gap-1 pr-6">
            <h4 className="text-sm font-extrabold text-white tracking-tight">Install Vergil Tempo</h4>
            <p className="text-xs font-medium text-gray-400 leading-relaxed">
              Access the clock portal offline, track logs reliably, and launch instantly from your home screen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-1 justify-end">
          <button 
            onClick={handleDismiss} 
            className="px-4 py-2 border border-white/10 hover:border-white/20 text-xs font-bold rounded-lg transition text-gray-400 hover:text-white cursor-pointer"
          >
            Maybe Later
          </button>
          <button 
            onClick={handleInstall} 
            className="px-4 py-2 bg-[#FF7A00] hover:bg-[#E06C00] active:bg-[#C55F00] text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg shadow-[#FF7A00]/10 transition text-white cursor-pointer"
          >
            <Download size={13} />
            <span>Install App</span>
          </button>
        </div>
      </div>
    </div>
  );
}
