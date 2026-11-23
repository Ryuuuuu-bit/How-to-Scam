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
  fill = false,
}: {
  clientId: string;
  onCredential: (credential: string) => void;
  text?: 'signin_with' | 'continue_with';
  fill?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;

  useEffect(() => {
    let alive = true;
    let observer: ResizeObserver | undefined;
    loadGsi()
      .then(() => {
        if (!alive || !ref.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (r) => cb.current(r.credential),
        });
        const host = ref.current;
        const api = window.google.accounts.id;
        let lastWidth = 0;
        const render = () => {
          const width = fill ? Math.min(400, Math.floor(host.clientWidth)) : 280;
          if (width <= 0 || width === lastWidth) return;
          lastWidth = width;
          host.replaceChildren();
          api.renderButton(host, {
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            text,
            locale: 'th',
            width,
          });
        };
        render();
        if (fill) {
          observer = new ResizeObserver(render);
          observer.observe(host);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      observer?.disconnect();
    };
  }, [clientId, text, fill]);

  return <div ref={ref} className="flex min-h-11 justify-center" />;
}
