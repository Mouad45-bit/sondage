// Fichier : front/src/app/poll/[id]/modify/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; 
import { Plus, X, ListPlus, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePolls } from '@/context/PollContext';
import { Poll, Question } from '@/types/survey';

// --- Composant QuestionForm (AVEC TYPAGE CORRECT) ---
const QuestionForm = ({ 
    question, 
    index, 
    updateQuestion, 
    removeQuestion 
}: {
    question: Question;
    index: number;
    updateQuestion: (index: number, updatedQ: Question) => void;
    removeQuestion: (index: number) => void;
}) => {
    
    // Ajout d'une nouvelle option
    const addOption = () => {
        if (question.options.length < 5) { 
            updateQuestion(index, { ...question, options: [...question.options, `Option ${question.options.length + 1}`] });
        }
    };

    // Mise à jour d'une option spécifique
    const updateOption = (optionIndex: number, value: string) => {
        const newOptions = question.options.map((opt, i) => (i === optionIndex ? value : opt));
        updateQuestion(index, { ...question, options: newOptions });
    };

    // Suppression d'une option
    const removeOption = (optionIndex: number) => {
        const newOptions = question.options.filter((_, i) => i !== optionIndex);
        updateQuestion(index, { ...question, options: newOptions });
    };

    return (
        <Card className="shadow-md border-l-4 border-orange-500">
            <CardHeader className="flex flex-row justify-between items-start">
                <CardTitle className="text-xl">Question {index + 1}</CardTitle>
                {/* Désactiver la suppression si c'est la seule question ou si moins de 2 options */}
                <Button variant="ghost" size="icon" onClick={() => removeQuestion(index)} title="Supprimer la question" disabled={index === 0 && question.options.length <= 2}>
                    <X className="h-5 w-5 text-red-500" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Champ Texte de la Question */}
                <div className="space-y-2">
                    <Label htmlFor={`text-${index}`}>Titre de la Question</Label>
                    <Input 
                        id={`text-${index}`}
                        placeholder="Titre de la question"
                        value={question.text}
                        onChange={(e) => updateQuestion(index, { ...question, text: e.target.value })}
                    />
                </div>

                {/* Options de Réponse */}
                <div className="space-y-2 pt-2">
                    <Label className="text-lg flex items-center space-x-2">
                        <ListPlus className="h-5 w-5" /> Options de Réponse
                    </Label>
                    
                    {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex space-x-2 items-center">
                            <Input
                                placeholder={`Option ${optIndex + 1}`}
                                value={option}
                                onChange={(e) => updateOption(optIndex, e.target.value)}
                            />
                            {question.options.length > 2 && (
                                <Button variant="ghost" size="icon" onClick={() => removeOption(optIndex)}>
                                    <X className="h-4 w-4 text-gray-500" />
                                </Button>
                            )}
                        </div>
                    ))}

                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addOption} 
                        disabled={question.options.length >= 5}
                    >
                        <Plus className="h-4 w-4 mr-2" /> Ajouter une option
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
// --- Fin du Composant QuestionForm ---


export default function ModifyPollPage() {
    const router = useRouter();
    const params = useParams();
    const pollId = params.id as string;
    const { user, isAdmin, isLoggedIn } = useAuth();
    const { polls } = usePolls();

    // Typage de l'état local du sondage (CORRIGÉ)
    const [pollData, setPollData] = useState<Poll | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // 1. Protection de la route et Chargement des données
    useEffect(() => {
        if (!isLoggedIn) {
             router.push('/login');
             return;
        }

        const foundPoll = polls.find(p => p.id === pollId);

        if (!foundPoll) {
            setError("Sondage non trouvé.");
            setLoading(false);
            return;
        }
        
        // Vérification des droits : Admin ET Propriétaire ET statut 'Upcoming'
        const isOwner = user?.id === foundPoll.ownerId; 
        
        if (!isAdmin || !isOwner || foundPoll.status !== 'upcoming') {
            setError("Accès refusé. La modification est seulement permise pour les sondages 'À Venir' que vous possédez.");
            setLoading(false);
            return;
        }

        // Si tout est bon, charger les données du sondage (Simulé)
        setPollData(foundPoll);
        setTitle(foundPoll.title);
        setDescription(foundPoll.description);
        
        // Simulation des questions à éditer
        setQuestions([
            { id: 'q1', questionNumber: 1, text: 'Quelle est la question de ce sondage ?', options: ['Option 1', 'Option 2'], type: 'single-choice' }
        ]);
        setLoading(false);

    }, [pollId, polls, user, isAdmin, isLoggedIn, router]);

    // Fonctions de gestion des questions (identiques à /create/page.tsx)
    const addQuestion = useCallback(() => {
        setQuestions(prev => [
            ...prev,
            { id: `q${prev.length + 1}`, questionNumber: prev.length + 1, text: '', options: ['Option 1', 'Option 2'], type: 'single-choice' }
        ]);
    }, []);

    const updateQuestion = useCallback((index: number, updatedQ: Question) => {
        setQuestions(prev => prev.map((q, i) => (i === index ? updatedQ : q)));
    }, []);

    const removeQuestion = useCallback((index: number) => {
        setQuestions(prev => {
            if (prev.length <= 1) return prev;
            return prev.filter((_, i) => i !== index).map((q, i) => ({
                ...q, id: `q${i + 1}`, questionNumber: i + 1
            }));
        });
    }, []);


    // Fonction de soumission finale de la modification (simulée)
    const handleSubmit = () => {
        setError(null);
        if (!title.trim() || !description.trim() || questions.length === 0) {
            setError("Veuillez remplir tous les champs.");
            return;
        }

        // ⚠️ Intégration Back-end : Appel à l'API Java pour MODIFIER (PUT /api/polls/{id})
        console.log("Modification envoyée à l'API :", { pollId, title, description, questions });

        alert(`Sondage "${title}" modifié avec succès !`);
        router.push(`/poll/${pollId}`); 
    };
    
    if (loading) {
        return <div className="flex justify-center items-center min-h-[80vh] bg-gray-100 text-xl">Vérification de l'accès...</div>;
    }

    if (error) {
         return (
            <div className="flex justify-center items-center min-h-[80vh] bg-gray-100">
                <Card className="p-8 text-center border-l-4 border-red-500">
                    <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                    <CardTitle>Erreur d'Accès ou Donnée Manquante</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </Card>
            </div>
        );
    }


    // Contenu du formulaire de modification
    return (
        <div className="flex justify-center min-h-[80vh] bg-gray-100 p-8">
            <div className="w-full max-w-4xl space-y-8">
                
                <h1 className="text-4xl font-extrabold text-gray-900 text-center">
                    Modifier le Sondage : {pollData?.title}
                </h1>
                
                {/* Formulaire Principal du Sondage */}
                <Card className="shadow-xl p-6 space-y-6">
                    <CardTitle className="text-2xl text-indigo-700 mb-4">Informations Générales</CardTitle>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="poll-title">Titre du Sondage</Label>
                            <Input 
                                id="poll-title" 
                                placeholder="Titre du Sondage"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="poll-description">Description Courte</Label>
                            <Textarea 
                                id="poll-description" 
                                placeholder="Description du sujet"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                </Card>

                {/* Section des Questions */}
                <Card className="shadow-xl p-6 space-y-6">
                    <CardTitle className="text-2xl text-indigo-700 mb-4 flex items-center justify-between">
                        Questions du Sondage ({questions.length})
                        <Button 
                            className="bg-blue-600 hover:bg-blue-700" 
                            onClick={addQuestion}
                        >
                            <Plus className="h-5 w-5 mr-2" /> Ajouter Question
                        </Button>
                    </CardTitle>
                    
                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">
                            {error}
                        </div>
                    )}
                    
                    <div className="space-y-6">
                        {questions.map((q, index) => (
                            <QuestionForm
                                key={q.id}
                                question={q}
                                index={index}
                                updateQuestion={updateQuestion}
                                removeQuestion={removeQuestion}
                            />
                        ))}
                    </div>
                </Card>
                
                {/* Bouton de Soumission Final */}
                <CardFooter className="flex justify-center p-0">
                    <Button 
                        size="lg" 
                        className="w-full max-w-xs bg-orange-600 hover:bg-orange-700 h-12 text-lg font-bold"
                        onClick={handleSubmit}
                    >
                        <Save className="h-5 w-5 mr-2" /> Enregistrer les Modifications
                    </Button>
                </CardFooter>
            </div>
        </div>
    );
}