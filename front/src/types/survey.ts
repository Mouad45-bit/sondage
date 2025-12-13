// Fichier : front/src/lib/types/survey.ts

export interface Poll {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'upcoming' | 'closed';
    participantsCount: number;
    // CRITIQUE : Ajout pour la logique de Mes Sondages
    ownerId: string; 
}