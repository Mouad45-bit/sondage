import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header' 
import ChatbotWidget from '@/components/ChatbotWidget' // <--- Ajout de l'import du Chatbot

const inter = Inter({ subsets: ['latin'] })

// Métadonnées (pour l'affichage dans les moteurs de recherche et les onglets)
export const metadata: Metadata = {
  title: 'SportSondage Pro - Le Sondage de Référence',
  description: 'Projet de sondage professionnel sur le sport, intégrant un chatbot d\'information.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        
        {}
        <Header />
        
        {}
        <main className="min-h-[calc(100vh-12rem)]">{children}</main> 
        
        {}
        <ChatbotWidget />
        
        {}
      </body>
    </html>
  )
}