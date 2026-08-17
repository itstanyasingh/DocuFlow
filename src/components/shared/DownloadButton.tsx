import React from 'react';
import { Download, Check } from 'lucide-react';

interface DownloadButtonProps {
  onClick?: () => void;
  href?: string;
  downloadName?: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  onClick,
  href,
  downloadName,
  label = 'Download',
  className = '',
  size = 'md',
  variant = 'primary',
  disabled = false,
}) => {
  const [downloaded, setDownloaded] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
    if (onClick) onClick();
  };

  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs font-semibold gap-1.5',
    md: 'px-5 py-2.5 text-sm font-semibold gap-2',
    lg: 'px-7 py-3.5 text-base font-bold gap-2.5',
  }[size];

  const variantClasses = {
    primary:
      'bg-slate-900 text-white hover:bg-slate-800 shadow-sm active:scale-[0.98]',
    secondary:
      'bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:scale-[0.98]',
    outline:
      'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]',
  }[variant];

  const content = (
    <>
      {downloaded ? (
        <Check className={size === 'sm' ? 'w-3.5 h-3.5 text-emerald-400' : 'w-4 h-4 text-emerald-400'} />
      ) : (
        <Download className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      )}
      <span>{downloaded ? 'Downloaded!' : label}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        download={downloadName || true}
        onClick={handleClick}
        id="download-link-btn"
        className={`inline-flex items-center justify-center rounded-xl transition-all select-none ${sizeClasses} ${variantClasses} ${
          disabled ? 'opacity-50 pointer-events-none' : ''
        } ${className}`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      id="download-action-btn"
      className={`inline-flex items-center justify-center rounded-xl transition-all select-none ${sizeClasses} ${variantClasses} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {content}
    </button>
  );
};
