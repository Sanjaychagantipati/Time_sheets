import { useEffect } from 'react';
import { Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={18} className="text-emerald-400" />;
      case 'error': return <AlertTriangle size={18} className="text-rose-400" />;
      case 'warning': return <AlertCircle size={18} className="text-amber-400" />;
      default: return <Info size={18} className="text-sky-400" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success': return 'border-emerald-500/30 bg-emerald-950/80 text-emerald-200';
      case 'error': return 'border-rose-500/30 bg-rose-950/80 text-rose-200';
      case 'warning': return 'border-amber-500/30 bg-amber-950/80 text-amber-200';
      default: return 'border-sky-500/30 bg-sky-950/80 text-sky-200';
    }
  };

  return (
    <div className={`fixed bottom-24 right-6 z-50 flex items-center gap-3 px-5 py-3.5 border rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 animate-slide-in ${getStyles()}`}>
      {getIcon()}
      <span className="text-sm font-semibold tracking-wide">{message}</span>
    </div>
  );
}
