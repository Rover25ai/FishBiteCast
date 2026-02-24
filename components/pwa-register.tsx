'use client';

import { useEffect } from 'react';

export function PwaRegister(): null {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      });

      if ('caches' in window) {
        void caches.keys().then((keys) => {
          keys
            .filter((key) => key.startsWith('bitecast-static') || key.startsWith('fishbitecast-static'))
            .forEach((key) => {
              void caches.delete(key);
            });
        });
      }

      return;
    }

    const register = (): void => {
      void navigator.serviceWorker.register('/service-worker.js');
    };

    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
