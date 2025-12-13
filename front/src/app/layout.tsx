// Fichier : front/src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header' 
import ChatbotWidget from '@/components/ChatbotWidget' 
import { AuthProvider } from '@/context/AuthContext'; // Import de l'AuthContext
import { PollProvider } from '@/context/PollContext'; // <-- NOUVEL IMPORT de PollContext

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SportSondage Pro',
  description: 'Projet de sondage professionnel sur le sport.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider> 
          {/* Le PollProvider doit être à l'intérieur de l'AuthProvider */}
          <PollProvider> 
            <Header />
            {/* La classe min-h-[calc(100vh-12rem)] assure que le contenu prend presque toute la hauteur, laissant de la place pour le header et le chatbot */}
            <main className="min-h-[calc(100vh-12rem)]">{children}</main> 
            <ChatbotWidget /> 
          </PollProvider>
        </AuthProvider>
      </body>
    </html>
  )
}