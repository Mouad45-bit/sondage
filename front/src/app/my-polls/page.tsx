// Fichier : front/src/app/my-polls/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { Home, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePolls } from '@/context/PollContext'; 
import PollCard from '@/components/PollCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Poll } from '@/types/survey'; 

export default function MyPollsPage() {
    const { user, isLoggedIn } = useAuth();
    const { polls: allPolls, isLoading, error } = usePolls(); 
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); 
    
    if (!isLoggedIn) {
        return <div className="min-h-[80vh] bg-gray-100"></div>; 
    }

    const userPolls = useMemo(() => {
        if (!user || !allPolls) return [];
        
        return allPolls.filter(poll => {
            if (!poll.ownerId) return false; 
            return poll.ownerId === user.id;
        });
    }, [allPolls, user]);


    const filteredPolls = useMemo(() => {
        let results = userPolls as Poll[]; 

        if (filterStatus !== 'all') {
            results = results.filter(poll => poll.status === filterStatus);
        }

        if (searchTerm) {
            const lowercasedSearch = searchTerm.toLowerCase();
            results = results.filter(poll =>
                poll.title.toLowerCase().includes(lowercasedSearch) ||
                poll.description.toLowerCase().includes(lowercasedSearch)
            );
        }

        return results;
    }, [userPolls, filterStatus, searchTerm]);

    const pollCounts = useMemo(() => ({
        all: userPolls.length,
        open: userPolls.filter(p => p.status === 'open').length,
        upcoming: userPolls.filter(p => p.status === 'upcoming').length,
        closed: userPolls.filter(p => p.status === 'closed').length,
    }), [userPolls]);

    if (error) {
        return <div className="container mx-auto p-4 text-center text-red-500">Erreur lors du chargement de vos sondages.</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-extrabold text-gray-800 flex items-center mb-6">
                <Home className="w-6 h-6 mr-2 text-indigo-600" /> Mes Sondages Personnels
            </h1>

            <p className="mb-8 text-gray-600">
                Vous gérez ici les sondages que vous avez créés ({pollCounts.all} sondage{pollCounts.all > 1 ? 's' : ''}).
            </p>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                
                <div className="flex space-x-2 overflow-x-auto pb-1 order-2 md:order-1">
                    {['all', 'open', 'upcoming', 'closed'].map(status => (
                        <Button
                            key={status}
                            variant={filterStatus === status ? 'default' : 'outline'}
                            onClick={() => setFilterStatus(status)}
                            className="capitalize flex-shrink-0"
                        >
                            {status === 'all' ? 'Tous' : status === 'open' ? 'Ouverts' : status === 'upcoming' ? 'À Venir' : 'Fermés'} ({pollCounts[status as keyof typeof pollCounts]})
                        </Button>
                    ))}
                </div>

                <div className="relative flex-grow order-1 md:order-2 max-w-sm ml-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Rechercher par titre ou description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg w-full"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <span className="ml-3 text-lg text-indigo-600">Chargement de vos sondages...</span>
                </div>
            ) : filteredPolls.length === 0 ? (
                <Card className="text-center p-12">
                    <CardHeader>
                        <CardTitle className="text-2xl text-green-500 flex justify-center items-center">
                            <Home className="h-6 w-6 mr-2" />
                            Aucun sondage trouvé
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">
                            Vous n'avez pas encore créé de sondage ou aucun ne correspond à vos filtres.
                        </p>
                        <Button asChild className="mt-6 bg-green-600 hover:bg-green-700">
                            <Link href="/create">Créer un Nouveau Sondage</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPolls.map(poll => (
                        <PollCard key={poll.id} poll={poll} showAdminControls={true} /> 
                    ))}
                </div>
            )}
        </div>
    );
}