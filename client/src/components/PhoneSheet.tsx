import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PopupClose } from './PopupControls';

/** หน้าแอปบนมือถือของตัวละคร: เปิดทับเกมแบบแผ่นเลื่อนขึ้น */
export function PhoneSheet({
  title,
  app,
  onClose,
  children,
}: {
  title: string;
  app: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [onClose]);
  // แสดงนอก HUD เพราะ HUD ใช้ backdrop-filter ซึ่งทำให้ position: fixed ติดอยู่ในกรอบ HUD
  return createPortal(
    <div className="phone-overlay" onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`phone-app phone-app--${app} anim-rise-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="phone-app-notch" aria-hidden="true" />
        <header className="phone-app-bar">
          <h2>{title}</h2>
          <PopupClose label={`ปิด${title}`} onClick={onClose} />
        </header>
        <div className="phone-app-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
