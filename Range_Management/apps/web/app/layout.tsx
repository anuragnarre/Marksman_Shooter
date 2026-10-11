// apps/web/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '../contexts/auth-context';
import { ThemeProvider } from '../contexts/theme-context';
import { ToastProvider } from '../contexts/toast-context';
import { CursorGlow } from '../components/CursorGlow';
import { SwRegister } from './sw-register';
import { ConflictToast } from '../components/ConflictToast';

const THEME_INIT_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    var isDark = t === 'dark' || (!t && true) || (t === 'system' && !matchMedia('(prefers-color-scheme:light)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    var dt = localStorage.getItem('dashboardTheme') || 'compact-tactical';
    document.documentElement.setAttribute('data-dashboard-theme', dt);
  } catch(e){}
})()
`;

export const metadata: Metadata = {
  title: 'Marksman — Range Operations & Tactical Command',
  description: 'Precision Shooting Range Operations Suite. Real-time lane automation, optical sensor scoring, SCADA interlocks, and live shooter telemetry.',
  keywords: ['shooting range management', 'precision shooting', 'SCADA range safety', 'optical target scoring', 'ISSF'],
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f59e0b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning className="bg-surface text-on-surface antialiased font-sans min-h-screen">
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </AuthProvider>
        <CursorGlow />
        <SwRegister />
        <ConflictToast />
      </body>
    </html>
  );
}
