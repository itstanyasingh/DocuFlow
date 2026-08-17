import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  onRetry,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div
      className={`rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3 text-red-800 ${className}`}
      role="alert"
      id="error-message-banner"
    >
      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm font-medium leading-relaxed">
        {message}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            id="error-retry-btn"
            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-red-100 hover:bg-red-200 text-red-900 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            id="error-dismiss-btn"
            className="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-100 transition-colors"
            title="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
