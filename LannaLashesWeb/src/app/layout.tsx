import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';
import { CartProvider } from '@/components/CartProvider';

export const metadata: Metadata = {
  title: 'Lanna Lashes — Shop, Learn & Connect',
  description: 'Premium lash supplies, professional courses, and a thriving community of lash artists.',
  openGraph: {
    title: 'Lanna Lashes',
    description: 'Premium lash supplies, professional courses, and a thriving community.',
    images: ['/og.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Nav />
          <main style={{ paddingTop: 'var(--nav-h)', minHeight: '100vh' }}>
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
