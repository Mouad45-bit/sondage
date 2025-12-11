'use client'; 

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Send } from 'lucide-react'; 

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(''); // État pour gérer la saisie de l'utilisateur

  
  const accentColor = 'bg-indigo-600 hover:bg-indigo-700'; 
  const headerColor = 'bg-gray-800'; 
  const chatBgColor = 'bg-gray-900'; 

  const handleSend = () => {
    if (inputValue.trim() !== '') {
      console.log('Message à envoyer à l\'API Back-end :', inputValue);
      setInputValue(''); 
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {}
      {isOpen && (
        <div className={`rounded-xl shadow-2xl w-80 h-96 mb-2 flex flex-col overflow-hidden border border-gray-700 ${chatBgColor}`}>
          
          <header className={`p-3 flex justify-between items-center ${headerColor}`}>
            <h3 className="font-semibold text-white">Assistant SportSondage</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-6 w-6 text-gray-300 hover:bg-gray-700">
              <X className="h-4 w-4" />
            </Button>
          </header>
          
          {}
          <div className="p-3 overflow-y-auto flex-grow text-sm flex flex-col space-y-2">
            <div className={`bg-indigo-600 text-white p-3 rounded-tr-xl rounded-b-xl max-w-[80%] self-start`}>
                Bonjour ! Posez-moi une question sur le sport pour vous aider à répondre au sondage.
            </div>
          </div>

          {}
          <div className={`p-3 border-t border-gray-700 flex items-center ${headerColor}`}>
            <input 
              type="text" 
              placeholder="Écrivez votre question..." 
              className="w-full border border-gray-600 rounded-l-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-800 text-white flex-grow h-10"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
            />
            {}
            <Button 
                size="icon" 
                className={`h-10 w-12 rounded-l-none ${accentColor}`}
                onClick={handleSend}
                disabled={inputValue.trim() === ''} // Désactive le bouton si le champ est vide
            >
                <Send className="h-5 w-5" /> 
            </Button>
          </div>
        </div>
      )}

      {}
      <Button 
        size="icon" 
        className={`h-14 w-14 rounded-full ${accentColor} shadow-xl text-white`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>
    </div>
  );
}