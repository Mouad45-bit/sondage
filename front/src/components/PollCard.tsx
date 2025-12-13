// Fichier : front/src/components/PollCard.tsx
'use client';

import { Poll } from '@/types/survey';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Clock, Lock, Heart, Edit, BarChart3, Users } from 'lucide-react'; 
import Link from 'next/link';

interface PollCardProps {
    poll: Poll;
    showAdminControls: boolean;
}

const getStatusDisplay = (status: Poll['status']) => {
    switch (status) {
        case 'open':
            return { icon: Zap, color: 'text-green-500', label: 'Ouvert', badge: 'bg-green-500' };
        case 'upcoming':
            return { icon: Clock, color: 'text-yellow-500', label: 'À Venir', badge: 'bg-yellow-500' };
        case 'closed':
            return { icon: Lock, color: 'text-red-500', label: 'Fermé', badge: 'bg-red-500' };
        default:
            return { icon: Lock, color: 'text-gray-500', label: 'Inconnu', badge: 'bg-gray-500' };
    }
};

export default function PollCard({ poll, showAdminControls }: PollCardProps) {
    const { icon: StatusIcon, color: StatusColor, label: StatusLabel, badge: StatusBadge } = getStatusDisplay(poll.status);

    return (
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold text-indigo-700">{poll.title}</CardTitle>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${StatusBadge}`}>{StatusLabel}</div>
                </div>
                <CardDescription className={`mt-2 ${StatusColor} flex items-center space-x-1`}>
                    <StatusIcon className="h-4 w-4" /><span>{StatusLabel}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-gray-600 line-clamp-2">{poll.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" /> 
                        {poll.participantsCount} Participants
                    </span>
                    <span className="flex items-center text-red-500 hover:text-red-600 cursor-pointer">
                        <Heart className="h-4 w-4 mr-1" />Favoris
                    </span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                {poll.status === 'open' && (
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                        <Link href={`/poll/${poll.id}`}>Participer</Link>
                    </Button>
                )}
                
                {poll.status === 'closed' && (
                    <Button asChild variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                        <Link href={`/poll/${poll.id}/results`}>Voir Résultats</Link>
                    </Button>
                )}
                
                {poll.status === 'upcoming' && (
                    <Button variant="outline" disabled>Fixer Rappel</Button>
                )}
                
                {showAdminControls && (
                    <div className="flex space-x-2 ml-auto">
                        {poll.status === 'upcoming' && (
                            <Button asChild variant="secondary" size="sm">
                                <Link href={`/poll/${poll.id}/modify`}><Edit className="h-4 w-4 mr-1" /> Modifier</Link>
                            </Button>
                        )}
                        {poll.status !== 'upcoming' && (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/poll/${poll.id}/results`}><BarChart3 className="h-4 w-4 mr-1" /> Gérer/Résultats</Link>
                            </Button>
                        )}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}