// Fichier : front/src/app/poll/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, Lock, Users, Calendar, Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePolls } from '@/context/PollContext';
import { Poll, Question } from '@/types/survey';

// Composant pour l'affichage d'une seule question (simulé pour l'instant)
const QuestionBlock = ({ question }: { question: Question }) => {
    return (
        <Card className="shadow-lg border-2 border-indigo-200">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">{question.text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {question.options.map((option, index) => (
                    <div 
                        key={index}
                        className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors"
                    >
                        <span className="font-medium text-indigo-800">{option}</span>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};


export default function PollDetailPage() {
    const router = useRouter();
    const params = useParams();
    const pollId = params.id as string;
    const { polls } = usePolls();
    const { user, isLoggedIn, isAdmin } = useAuth();
    
    const [poll, setPoll] = useState<Poll | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const foundPoll = polls.find(p => p.id === pollId);
        if (foundPoll) {
            setPoll(foundPoll);
        }
        setLoading(false);
    }, [pollId, polls]);
    
    // Logique de participation simple pour la simulation
    const submitVote = () => {
        if (!isLoggedIn) {
            alert("Veuillez vous connecter pour participer.");
            router.push('/login');
            return;
        }
        alert("Votre vote a été soumis !");
        router.push(`/poll/${pollId}/results`); // Redirection vers les résultats après le vote
    };
    
    // Données de questions simulées (elles devraient venir de l'API / du Context plus tard)
    const mockQuestions: Question[] = [
        { id: 'q1', questionNumber: 1, text: `Question 1: Que pensez-vous du titre du sondage "${poll?.title || '...'}" ?`, options: ['Excellent', 'Bon', 'Moyen', 'Mauvais'], type: 'single-choice' },
        { id: 'q2', questionNumber: 2, text: `Question 2: Devrions-nous ajouter plus de questions ?`, options: ['Oui', 'Non'], type: 'single-choice' },
    ];


    if (loading || !poll) {
        return <div className="flex justify-center items-center min-h-[80vh] bg-gray-100 p-8 text-center pt-20">{loading ? 'Chargement...' : 'Sondage Introuvable.'}</div>;
    }

    // Détermination des droits (Admin ET propriétaire du sondage)
    const isOwner = user?.id === poll.ownerId; 
    
    // --- RENDUS CONDITIONNELS ---

    // 1. Sondage Fermé ou Déjà Voté (Participer n'est plus possible)
    if (poll.status === 'closed' || poll.isUserParticipated) {
        return (
            <div className="flex justify-center min-h-[80vh] bg-gray-100 p-8">
                <Card className="w-full max-w-3xl shadow-2xl text-center p-10 space-y-6">
                    <Lock className="h-16 w-16 mx-auto text-red-600" />
                    <CardTitle className="text-3xl font-bold">{poll.title}</CardTitle>
                    <CardContent className="text-xl text-gray-700">
                        {poll.status === 'closed' ? 
                            "Ce sondage est TERMINE." : 
                            "Merci de votre participation ! Vous avez déjà voté."
                        }
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700" asChild>
                            <Link href={`/poll/${pollId}/results`}>Voir les Résultats</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // 2. Sondage À Venir
    if (poll.status === 'upcoming') {
        return (
            <div className="flex justify-center min-h-[80vh] bg-gray-100 p-8">
                <Card className="w-full max-w-3xl shadow-2xl text-center p-10 space-y-6">
                    <Clock className="h-16 w-16 mx-auto text-yellow-600" />
                    <CardTitle className="text-3xl font-bold">{poll.title}</CardTitle>
                    <CardDescription className="text-xl text-gray-700">
                        Ce sondage n'a pas encore été ouvert. Fixez un rappel !
                    </CardDescription>
                    <CardFooter className="flex justify-center flex-col space-y-4">
                        <Button size="lg" variant="outline">
                            <Calendar className="mr-2 h-5 w-5" /> Fixer un Rappel
                        </Button>
                        {/* Action Admin : Modifier (voir notes) */}
                        {(isAdmin && isOwner) && (
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
                                <Link href={`/poll/${pollId}/modify`}>
                                    <Edit className="mr-2 h-5 w-5" /> Modifier ce Sondage
                                </Link>
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        );
    }
    
    // 3. Sondage Ouvert (Participation)
    return (
        <div className="flex justify-center min-h-[80vh] bg-gray-100 p-8">
            <div className="w-full max-w-4xl space-y-8">
                <Button variant="outline" onClick={() => router.push('/')} className="flex items-center mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la liste
                </Button>
                
                <div className="flex justify-between items-center border-b pb-4">
                    <h1 className="text-4xl font-extrabold text-gray-900">
                        Participer : {poll.title}
                    </h1>
                    <span className="flex items-center text-green-600 font-semibold">
                        <CheckCircle className="h-5 w-5 mr-1" /> Ouvert
                    </span>
                </div>
                
                {/* Section des Questions */}
                <h2 className="text-3xl font-bold pt-4 text-gray-800">Vos Réponses</h2>
                <div className="space-y-6">
                    {mockQuestions.map((q) => (
                        <QuestionBlock key={q.id} question={q} />
                    ))}
                </div>

                {/* Bouton de Soumission */}
                <div className="flex justify-center pt-8">
                    <Button 
                        size="lg" 
                        className="bg-green-600 hover:bg-green-700 h-12 text-xl font-bold"
                        onClick={submitVote}
                    >
                        Soumettre mon Vote
                    </Button>
                </div>
            </div>
        </div>
    );
}