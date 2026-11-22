import { useEffect, useId, useRef } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Art } from './ui';
import './popup-controls.css';

type ActionStyle = 'primary' | 'secondary' | 'danger' | 'dark';

export function PopupButton({
  variant = 'primary',
  icon,
  className = '',
  children,
  ...props
}: ComponentPropsWithRef<'button'> & { variant?: ActionStyle; icon?: ReactNode }) {
  return (
    <button
      type="button"
      className={`popup-button popup-button--${variant} game-button ${className}`}
      {...props}
    >
      {icon && (
        <span className="popup-button-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </button>
  );
}

export function PopupClose({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="popup-close game-button" aria-label={label} onClick={onClick}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path
          d="m4 4 10 10M14 4 4 14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

export function ConfirmPopup({
  title,
  description,
  confirmLabel,
  icon,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  icon: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    cancelButton.current?.focus();
    return () => element?.close();
  }, []);

  const cancel = () => {
    dialog.current?.close();
    onCancel();
  };

  return (
    <dialog
      ref={dialog}
      className="confirm-popup"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
    >
      <header className="popup-heading">
        <span className="popup-badge">
          <Art id={icon} size={32} />
        </span>
        <PopupClose label="ปิดหน้าต่างยืนยัน" onClick={cancel} />
      </header>
      <h2 id={titleId} className="font-display text-2xl leading-snug font-semibold">
        {title}
      </h2>
      <p id={descId} className="mt-2 text-sm leading-relaxed text-ink-soft">
        {description}
      </p>
      <div className="popup-action-row">
        <PopupButton variant="secondary" onClick={cancel} ref={cancelButton}>
          ยกเลิก
        </PopupButton>
        <PopupButton
          variant="danger"
          onClick={() => {
            dialog.current?.close();
            onConfirm();
          }}
        >
          {confirmLabel}
        </PopupButton>
      </div>
    </dialog>
  );
}
