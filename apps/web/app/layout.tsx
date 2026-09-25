// apps/web/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../contexts/auth-context';
import { ThemeProvider } from '../contexts/theme-context';
import { ToastProvider } from '../contexts/toast-context';
import { CursorGlow } from '../components/CursorGlow';
import { ConflictToast } from '../components/ConflictToast';

const THEME_INIT_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || (t === 'system' && matchMedia('(prefers-color-scheme:light)').matches)) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  } catch(e){}
})()
`;

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Marksman — Tactical Range Ops',
  description: 'Track every shot with millimetre precision. AI coaching after every session. Built for competitive shooters, coaches, and national teams.',
  keywords: ['shooting analytics', 'air rifle training', 'ISSF', 'shot analysis', 'precision shooting'],
  openGraph: {
    title: 'Marksman — Tactical Range Ops',
    description: 'Track every shot. Get AI coaching. Train smarter.',
    url: 'https://www.marksmanspro.com',
    siteName: 'Marksman',
    images: [{ url: 'https://www.marksmanspro.com/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marksman — Tactical Range Ops',
    description: 'Track every shot. Get AI coaching. Train smarter.',
    images: ['https://www.marksmanspro.com/og-image.png'],
  },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#131b2e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning className="bg-surface font-body-md text-on-surface antialiased overflow-x-hidden">
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </AuthProvider>
        <CursorGlow />
        <ConflictToast />
      </body>
    </html>
  );
}
