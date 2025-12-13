// Fichier : front/src/context/PollContext.tsx
'use client';

import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { Poll } from '@/types/survey';

interface PollContextType {
    polls: Poll[];
    isLoading: boolean; 
    error: Error | null; 
    
    // Fonction utilisée dans create/page.tsx
    createPoll: (poll: Partial<Poll>) => void; 
    updatePoll: (poll: Poll) => void;
    deletePoll: (id: string) => void;
}

const mockPolls: Poll[] = [
    { id: '1', title: 'Tendance Coupe du Monde', description: 'Quel pays aura le meilleur effectif ?', status: 'open', participantsCount: 1520, ownerId: 'user-1' },
    { id: '2', title: 'L\'impact de la VAR', description: 'Amélioration ou source de confusion ?', status: 'closed', participantsCount: 890, ownerId: 'admin-1' },
    { id: '3', title: 'Le futur de la ligue', description: 'Un sondage sur les réformes possibles.', status: 'upcoming', participantsCount: 0, ownerId: 'user-1' },
    { id: '4', title: 'real amadrid', description: 'sss', status: 'upcoming', participantsCount: 0, ownerId: 'user-1' }, 
];

const PollContext = createContext<PollContextType | undefined>(undefined);

export const PollProvider = ({ children }: { children: ReactNode }) => {
    const [polls, setPolls] = useState<Poll[]>(mockPolls);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const createPoll = (newPollData: Partial<Poll>) => {
        const newPoll: Poll = { 
            id: Date.now().toString(), 
            title: newPollData.title || '',
            description: newPollData.description || '',
            status: newPollData.status || 'upcoming',
            participantsCount: 0,
            ownerId: newPollData.ownerId || 'unknown',
        };
        setPolls(prev => [newPoll, ...prev]);
    };

    const updatePoll = (updatedPoll: Poll) => {
        setPolls(prev => prev.map(p => (p.id === updatedPoll.id ? updatedPoll : p)));
    };

    const deletePoll = (id: string) => {
        setPolls(prev => prev.filter(p => p.id !== id));
    };

    const contextValue = useMemo(() => ({
        polls,
        isLoading,
        error,
        createPoll,
        updatePoll,
        deletePoll,
    }), [polls, isLoading, error]);

    return (
        <PollContext.Provider value={contextValue}>
            {children}
        </PollContext.Provider>
    );
};

export const usePolls = () => {
    const context = useContext(PollContext);
    if (context === undefined) {
        throw new Error('usePolls doit être utilisé dans un PollProvider');
    }
    return context;
};