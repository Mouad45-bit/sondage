'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Save, Send, Loader2 } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { usePolls } from '@/context/PollContext'; 

interface Question { id: number; text: string; type: 'single' | 'multiple'; }

export default function CreatePollPage() {
    const router = useRouter();
    const { user, isLoggedIn } = useAuth(); 
    const { createPoll } = usePolls(); 

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isLoggedIn) {
        router.push('/login');
        return null;
    }

    const addQuestion = () => {
        setQuestions(prev => [
            ...prev,
            { id: Date.now(), text: '', type: 'single' }
        ]);
    };

    const updateQuestionText = (id: number, text: string) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, text } : q));
    };

    const removeQuestion = (id: number) => {
        setQuestions(prev => prev.filter(q => q.id !== id));
    };

    const isFormValid = useMemo(() => {
        return title.trim() !== '' && 
               description.trim() !== '' && 
               questions.length > 0 && 
               questions.every(q => q.text.trim() !== '');
    }, [title, description, questions]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isFormValid || !user) return;

        setIsSubmitting(true);

        try {
            // CORRECTION CRITIQUE : Utilisation de createPoll
            createPoll({ 
                title, 
                description, 
                ownerId: user.id, 
                status: 'upcoming', 
            });

            alert(`Sondage "${title}" créé avec succès et ajouté à la liste 'À Venir' !`);
            
            router.push('/my-polls'); 

        } catch (error) {
            console.error("Erreur lors de la création du sondage:", error);
            alert("Échec de la création du sondage. Veuillez réessayer.");
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Card className="shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-indigo-700">
                        Créer un Nouveau Sondage Sportif
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        Définissez le titre, la description et les questions de votre sondage.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <label htmlFor="title" className="text-sm font-medium leading-none">Titre du Sondage *</label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Quel club remportera la Ligue des Champions ?"
                                required
                            />

                            <label htmlFor="description" className="text-sm font-medium leading-none">Description *</label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Détaillez le contexte et les règles du vote."
                                required
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-xl font-semibold flex justify-between items-center">
                                Questions du Sondage ({questions.length})
                            </h3>
                            
                            {questions.map((q, index) => (
                                <div key={q.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border">
                                    <span className="font-bold text-indigo-600">{index + 1}.</span>
                                    <Input
                                        value={q.text}
                                        onChange={(e) => updateQuestionText(q.id, e.target.value)}
                                        placeholder="Entrez le texte de la question (Ex: Qui est le meilleur joueur ?)"
                                        required
                                        className="flex-grow"
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(q.id)} className="text-red-500 hover:bg-red-50">
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            ))}

                            <Button type="button" onClick={addQuestion} variant="outline" className="w-full mt-2 flex items-center space-x-2 text-indigo-600 border-indigo-600 hover:bg-indigo-50">
                                <PlusCircle className="h-4 w-4" />
                                <span>Ajouter une Question</span>
                            </Button>
                        </div>

                        <div className="pt-6">
                            <Button 
                                type="submit" 
                                className="w-full bg-green-600 hover:bg-green-700 transition duration-150"
                                disabled={isSubmitting || !isFormValid}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                {isSubmitting ? 'Envoi en cours...' : 'Créer et Publier le Sondage'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}