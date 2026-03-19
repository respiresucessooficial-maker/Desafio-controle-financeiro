import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppDataProvider } from '@/contexts/AppDataContext';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'Desafio de Controle Financeiro',
  description: 'Gerencie suas finanças de forma inteligente',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <ThemeProvider>
          <AuthProvider>
            <AppDataProvider>
              {children}
            </AppDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
