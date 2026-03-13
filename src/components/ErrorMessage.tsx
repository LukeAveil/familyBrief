"use client";

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorMessage({
  message = "Something went wrong. Please try again.",
  onRetry,
  className = "",
}: ErrorMessageProps) {
  return (
    <div className={`error-message ${className}`.trim()} role="alert">
      <span className="error-message-icon" aria-hidden>⚠️</span>
      <p className="error-message-text">{message}</p>
      {onRetry && (
        <button type="button" className="btn-save" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
