import { useEffect, useRef } from 'react';

// ปุ่ม "Sign in with Google" จาก Google Identity Services (ได้ ID token ส่งให้ server ตรวจ)
interface GsiApi {
  accounts: {
    id: {
      initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GsiApi;
  }
}

let loading: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('gsi'));
    document.head.appendChild(s);
  });
  return loading;
}

export function GoogleButton({
  clientId,
  onCredential,
  text = 'signin_with',
}: {
  clientId: string;
  onCredential: (credential: string) => void;
  text?: 'signin_with' | 'continue_with';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;

  useEffect(() => {
    let alive = true;
    loadGsi()
      .then(() => {
        if (!alive || !ref.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (r) => cb.current(r.credential),
        });
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text,
          locale: 'th',
          width: 280,
        });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [clientId, text]);

  return <div ref={ref} className="flex min-h-11 justify-center" />;
}
