// Fichier : front/src/app/poll/[id]/results/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, BarChart3, Users, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { usePolls } from '@/context/PollContext';
import { Poll } from '@/types/survey'; // IMPORTANT
import Link from 'next/link';

// --- Composant de Simulation pour les Résultats d'une Question ---
const ResultBlock = ({ question, totalParticipants }: { question: string, totalParticipants: number }) => {
    // Simulation de données de résultats
    const mockResults = [
        { option: "Option A (Entraîneur)", count: 450, percentage: 50.6 },
        { option: "Option B (Cohésion)", count: 250, percentage: 28.1 },
        { option: "Option C (Budget)", count: 190, percentage: 21.3 },
    ];
    
    return (
        <Card className="shadow-md border-l-4 border-blue-500">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                    {question}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {mockResults.map((result, index) => (
                    <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm font-medium text-gray-700">
                            <span>{result.option}</span>
                            <span>{result.percentage.toFixed(1)}% ({result.count} votes)</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                            <div 
                                className="h-2 bg-blue-600 rounded-full transition-all duration-700 ease-out" 
                                style={{ width: `${result.percentage}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};


export default function PollResultsPage() {
    const router = useRouter();
    const params = useParams();
    const pollId = params.id as string;
    const { polls } = usePolls();
    
    // CORRECTION APPLIQUÉE : Typage de l'état 'poll' à Poll | null
    const [poll, setPoll] = useState<Poll | null>(null);

    // Simule la récupération des données du sondage
    useEffect(() => {
        const foundPoll = polls.find(p => p.id === pollId);
        if (foundPoll) {
            setPoll(foundPoll);
        } else if (polls.length > 0) {
            router.push('/');
        }
    }, [pollId, polls, router]);

    if (!poll) {
        return <div className="min-h-[80vh] bg-gray-100 p-8 text-center pt-20">Chargement ou Sondage Introuvable...</div>;
    }
    
    const totalParticipants = poll.participantsCount > 0 ? poll.participantsCount : 890; 
    const isClosed = poll.status === 'closed';

    return (
        <div className="flex justify-center min-h-[80vh] bg-gray-100 p-8">
            <div className="w-full max-w-4xl space-y-8">
                
                <Button variant="outline" onClick={() => router.push('/')} className="flex items-center mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la liste
                </Button>
                
                <div className="flex justify-between items-center border-b pb-4">
                    <h1 className="text-4xl font-extrabold text-gray-900">
                        Résultats du Sondage : {poll.title}
                    </h1>
                    <span className={`flex items-center font-semibold ${isClosed ? 'text-red-600' : 'text-green-600'}`}>
                        {isClosed ? <Lock className="h-5 w-5 mr-1" /> : <CheckCircle className="h-5 w-5 mr-1" />}
                        Statut : {isClosed ? 'Fermé (Définitif)' : 'Ouvert (En temps réel)'}
                    </span>
                </div>

                {/* Carte Résumé */}
                <Card className="shadow-lg border-l-4 border-indigo-500">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center">
                            <Users className="h-6 w-6 mr-2" /> Participation Totale
                        </CardTitle>
                        <CardDescription>Analyse des {totalParticipants.toLocaleString()} votes enregistrés.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-indigo-700">{totalParticipants.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 mt-1">Total des Participants</p>
                    </CardContent>
                </Card>

                {/* Graphiques de Résultats */}
                <h2 className="text-3xl font-bold pt-4 text-gray-800 flex items-center">
                    <PieChart className="h-6 w-6 mr-2" /> Ventilation des Votes
                </h2>
                <div className="space-y-6">
                    <ResultBlock question="Quelle est votre opinion sur ce sujet ?" totalParticipants={totalParticipants} />
                    <ResultBlock question="Quel facteur est le plus important pour la performance d'une équipe ?" totalParticipants={totalParticipants} />
                </div>
            </div>
        </div>
    );
}