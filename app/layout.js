import { Geist, DM_Sans } from 'next/font/google';
import './globals.css';

const geist = Geist({ 
  subsets: ['latin'],
  variable: '--font-geist'
});

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  variable: '--font-dm'
});

export const metadata = {
  title: 'Partes Diarios',
  description: 'Registra partes diarios',
  manifest: '/manifest.json',
  themeColor: '#1a1a2e',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Partes',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Partes" />
      </head>
      <body className={`${geist.variable} ${dmSans.variable}`}>
        {children}
      </body>
    </html>
  );
}