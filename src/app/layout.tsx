import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The 20 Corridors',
  description: 'A symbolic decision-pattern game with deterministic, evidence-linked analysis.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
