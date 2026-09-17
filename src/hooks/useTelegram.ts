'use client';
import { useEffect, useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export function useTelegram() {
  const [tg, setTg] = useState<any>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isTMA, setIsTMA] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const app = window.Telegram.WebApp;
      app.ready();
      app.expand();
      setTg(app);

      if (app.initDataUnsafe?.user) {
        setUser(app.initDataUnsafe.user);
        setIsTMA(true);
      }
    }
  }, []);

  const closeMiniApp = () => tg?.close();

  return { tg, user, isTMA, closeMiniApp };
}
