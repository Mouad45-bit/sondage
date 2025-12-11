// Fichier : front/src/types/survey.ts

/**
 * Définit la structure d'une question de sondage (telle que fournie par l'API Back-end).
 */
export interface Question {
    id: string; // ID unique (clé pour le Back-end)
    questionNumber: number; 
    text: string; 
    options: string[]; // Options de réponse
    type: 'single-choice' | 'multi-choice' | 'text'; // Type de question
}

/**
 * Définit la structure d'une réponse de l'utilisateur (le "Payload" envoyé au Back-end).
 */
export interface UserAnswer {
    questionId: string;
    answer: string | string[]; // Réponse sélectionnée
}