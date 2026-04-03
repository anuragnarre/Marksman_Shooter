// apps/web/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Rajdhani, DM_Sans, JetBrains_Mono } from 'next/font/google';
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
    if (t === 'light' || (!t && matchMedia('(prefers-color-scheme:light)').matches) || (t === 'system' && matchMedia('(prefers-color-scheme:light)').matches))
      document.documentElement.classList.add('light');
  } catch(e){}
})()
`;

// DESIGN NOTE: Three-font system — display (Rajdhani) for drama, DM Sans for
// readability, JetBrains Mono for data precision. Each font carries semantic meaning.

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Marksman — Precision Shooting Analytics',
    template: '%s | Marksman',
  },
  description:
    'Track every shot with millimetre precision. AI coaching after every session. Built for competitive shooters, coaches, and national teams.',
  keywords: [
    'shooting analytics',
    'air rifle training',
    'ISSF',
    'shot analysis',
    'precision shooting',
    'competitive shooting',
    'biometric training',
  ],
  openGraph: {
    title: 'Marksman — Precision Shooting Analytics',
    description: 'Track every shot. Get AI coaching. Train smarter.',
    url: 'https://www.marksmanspro.com',
    siteName: 'Marksman',
    images: [
      {
        url: 'https://www.marksmanspro.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Marksman — Precision Shooting Analytics',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marksman — Precision Shooting Analytics',
    description: 'Track every shot. Get AI coaching. Train smarter.',
    images: ['https://www.marksmanspro.com/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg',      type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico',       sizes: '48x48' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/favicon.svg', color: '#F5A623' },
    ],
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MARKSMAN',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F5A623',
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
      className={`${rajdhani.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning className="bg-void text-text-primary antialiased font-body">
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
