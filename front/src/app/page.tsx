// Fichier : front/src/app/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Filter, Clock, CheckCircle, Lock, Heart, Users, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Poll } from '@/types/survey';
import { usePolls } from '@/context/PollContext'; // <-- NOUVEL IMPORT

// ❌ NOTE : La variable 'mockPolls' statique DOIT ÊTRE SUPPRIMÉE de ce fichier.

//
// Composant pour dessiner une seule carte de sondage dans la liste
const PollCard = ({ poll }: { poll: Poll }) => {
  
  let StatusIcon = Clock;
  let statusColor = 'text-yellow-500 bg-yellow-50';
  let statusText = 'À Venir';
  
  if (poll.status === 'open') {
    StatusIcon = CheckCircle;
    statusColor = 'text-green-600 bg-green-50';
    statusText = 'Ouvert';
  } else if (poll.status === 'closed') {
    StatusIcon = Lock;
    statusColor = 'text-red-600 bg-red-50';
    statusText = 'Fermé';
  }

  const renderActions = () => {
    switch (poll.status) {
      case 'open':
        if (poll.isUserParticipated) {
            return (
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/poll/${poll.id}/results`}>Voir Résultats</Link>
                    </Button>
                    <Button variant="ghost" size="sm">Rappeler Résultat</Button>
                </div>
            );
        }
        return (
            <Button className="bg-indigo-600 hover:bg-indigo-700" size="sm" asChild>
                <Link href={`/poll/${poll.id}`}>Participer</Link>
            </Button>
        );
      case 'closed':
        return (
            <Button variant="outline" size="sm" asChild>
                <Link href={`/poll/${poll.id}/results`}>Voir Résultats</Link>
            </Button>
        );
      case 'upcoming':
        return (
            <Button variant="outline" size="sm">
                Fixer Rappel <Calendar className="ml-2 h-4 w-4" />
            </Button>
        );
      default:
        return null;
    }
  };


  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-bold text-indigo-700">{poll.title}</CardTitle>
            <StatusIcon className={`h-6 w-6 p-1 rounded-full ${statusColor}`} />
        </div>
        <CardDescription>{poll.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex items-center space-x-4 text-sm text-gray-500">
        <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{poll.participantsCount.toLocaleString()} Participants</span>
        </div>
        {poll.isUserFavorite && (
            <div className="flex items-center space-x-1 text-red-500">
                <Heart className="h-4 w-4 fill-red-500" />
                <span>Favoris</span>
            </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between items-center">
        {renderActions()}
        <div className={`text-sm font-medium p-1 rounded-md ${statusColor}`}>{statusText}</div>
      </CardFooter>
    </Card>
  );
};


export default function PollListPage() {
  const { polls } = usePolls(); // <-- Récupération des données dynamiques
  
  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'upcoming' | 'favorite'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Logique de filtrage et de recherche
  const filteredPolls = polls
    .filter(poll => {
      if (filter === 'all') return true;
      if (filter === 'favorite') return poll.isUserFavorite;
      return poll.status === filter;
    })
    .filter(poll => 
      poll.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      poll.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="flex flex-col items-center min-h-[80vh] bg-gray-100 p-8">
      <div className="w-full max-w-6xl space-y-8">
        
        <h1 className="text-4xl font-extrabold text-gray-900 text-center">
            Liste des Sondages Actuels
        </h1>

        {/* BARRE DE RECHERCHE ET FILTRES */}
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
            <div className="flex items-center space-x-4">
                <Search className="h-6 w-6 text-gray-500" />
                <Input 
                    placeholder="Rechercher par titre ou description..."
                    className="flex-grow p-3 text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline" className="p-3"><Filter className="h-5 w-5 mr-2" /> Filtrer</Button>
            </div>

            {/* Boutons de Filtre */}
            <div className="flex flex-wrap gap-3">
                <Button 
                    variant={filter === 'all' ? 'default' : 'outline'} 
                    onClick={() => setFilter('all')}
                >
                    Tous les Sondages
                </Button>
                <Button 
                    variant={filter === 'open' ? 'default' : 'outline'} 
                    onClick={() => setFilter('open')}
                >
                    Ouverts
                </Button>
                <Button 
                    variant={filter === 'closed' ? 'default' : 'outline'} 
                    onClick={() => setFilter('closed')}
                >
                    Fermés
                </Button>
                <Button 
                    variant={filter === 'upcoming' ? 'default' : 'outline'} 
                    onClick={() => setFilter('upcoming')}
                >
                    À Venir
                </Button>
                <Button 
                    variant={filter === 'favorite' ? 'default' : 'outline'} 
                    onClick={() => setFilter('favorite')}
                >
                    <Heart className="h-4 w-4 mr-2 fill-current" /> Favoris
                </Button>
            </div>
        </div>
        
        {/* LISTE DES SONDAGES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolls.length > 0 ? (
            filteredPolls.map(poll => (
              <PollCard key={poll.id} poll={poll} />
            ))
          ) : (
            <div className="col-span-full text-center text-xl text-gray-500 p-10">
                Aucun sondage ne correspond aux critères.
            </div>
          )}
        </div>

        {/* Bouton Créer un Sondage (visible selon la logique dans le code) */}
        <div className="flex justify-center pt-8">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 font-bold" asChild>
                <Link href="/create">Créer un Nouveau Sondage <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
        </div>

      </div>
    </div>
  );
}