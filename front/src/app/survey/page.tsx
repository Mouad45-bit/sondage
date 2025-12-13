'use client'; 

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import QuestionCard from '@/components/QuestionCard'; 
import { ArrowLeft, Send } from 'lucide-react'; 
import { Question, UserAnswer } from '@/types/survey'; // <-- Utilisation des types

// SIMULATION DES DONNÉES (À remplacer par l'appel API)
const questionsData: Question[] = [
  { 
    id: 'q1', 
    questionNumber: 1,
    text: "Quel est le facteur le plus important pour la performance d'une équipe de football ?", 
    options: ["Entraîneur", "Budget annuel", "Cohésion d'équipe", "Statistiques de possession"],
    type: 'single-choice'
  },
  { 
    id: 'q2', 
    questionNumber: 2,
    text: "La technologie VAR (assistance vidéo) améliore-t-elle l'équité du jeu ?", 
    options: ["Oui, elle est indispensable", "Oui, mais elle ralentit le jeu", "Non, elle crée plus de confusion", "Neutre"],
    type: 'single-choice'
  },
  { 
    id: 'q3', 
    questionNumber: 3,
    text: "Quelle est l'infrastructure qui influence le plus la fidélité des fans (Stade, Site Web, Réseaux Sociaux) ?", 
    options: ["Stade / Installations", "Site Web et Applications mobiles", "Réseaux Sociaux et Contenu Vidéo"],
    type: 'single-choice'
  },
];

export default function SurveyPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string | string[] }>({}); 

  const currentQuestion = questionsData[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questionsData.length - 1;
  const isCurrentQuestionAnswered = !!answers[currentQuestion.id];
  const progress = Math.round(((currentQuestionIndex + 1) / questionsData.length) * 100);

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: answer });
  };

  const handleNext = () => {
    if (isCurrentQuestionAnswered && !isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (isLastQuestion && isCurrentQuestionAnswered) {
      // Préparation du "Payload" final pour l'envoi au Back-end
      const finalPayload: UserAnswer[] = Object.keys(answers).map(id => ({
          questionId: id,
          answer: answers[id],
      }));
      
      console.log("Payload final à envoyer au back-end:", finalPayload);
      alert("Sondage terminé ! Prêt à envoyer les données au serveur.");
      // NOTE: L'appel API sera implémenté ici après la validation de la structure
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
    }
  };


  return (
    <div className="flex justify-center min-h-[80vh] bg-gray-100 p-8">
      <div className="w-full max-w-3xl space-y-6">
        
        {}
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-gray-600 mb-2 font-semibold">
                Question {currentQuestionIndex + 1} de {questionsData.length}
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <p className="text-right text-sm text-indigo-600 mt-1">{progress}%</p>
        </div>

        {}
        <QuestionCard 
          questionNumber={currentQuestionIndex + 1}
          questionText={currentQuestion.text}
          options={currentQuestion.options}
          onAnswer={handleAnswer}
          initialAnswer={answers[currentQuestion.id] as string}
        />
        
        {}
        <div className="flex justify-between pt-4">
            <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2"
            >
                <ArrowLeft className="h-4 w-4" />
                <span>Précédent</span>
            </Button>

            <Button 
                className="text-lg flex items-center space-x-2"
                onClick={handleNext}
                disabled={!isCurrentQuestionAnswered} 
            >
                {isLastQuestion ? (
                    <>
                        <Send className="h-5 w-5 mr-2" />
                        <span>Soumettre le Sondage</span>
                    </>
                ) : (
                    "Suivant"
                )}
            </Button>
        </div>
      </div>
    </div>
  );
}