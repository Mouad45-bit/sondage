// Fichier : front/src/app/profile/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Shield, Mail, Calendar, Hash } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isLoggedIn, logout, isAdmin } = useAuth(); 

    // Protection de la route : redirige si l'utilisateur n'est pas connecté
    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, router]);

    // Afficher une page de chargement/vide pendant la vérification de l'état
    if (!isLoggedIn || !user) {
        return <div className="min-h-[80vh] bg-gray-100"></div>; 
    }
    
    // Contenu principal de la page de profil
    return (
        <div className="flex justify-center min-h-[80vh] bg-gray-100 p-8">
            <div className="w-full max-w-2xl space-y-8">
                
                <h1 className="text-4xl font-extrabold text-gray-900 text-center">
                    Mon Profil Utilisateur
                </h1>
                
                <Card className="shadow-2xl border-t-8 border-indigo-600">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {isAdmin ? (
                                <Shield className="h-10 w-10 text-red-600" />
                            ) : (
                                <UserIcon className="h-10 w-10 text-indigo-600" />
                            )}
                            <div>
                                <CardTitle className="text-3xl font-bold">{user.username}</CardTitle>
                                <CardDescription className={`font-semibold ${isAdmin ? 'text-red-600' : 'text-indigo-600'}`}>
                                    Rôle: {isAdmin ? 'Administrateur' : 'Utilisateur Standard'}
                                </CardDescription>
                            </div>
                        </div>
                        
                        {/* Bouton de déconnexion dans le profil */}
                        <Button 
                            variant="destructive" 
                            size="lg" 
                            onClick={logout} 
                            className="flex items-center space-x-2"
                        >
                            <LogOut className="h-5 w-5" />
                            <span>Déconnexion</span>
                        </Button>
                    </CardHeader>
                    
                    <CardContent className="pt-4 space-y-4">
                        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">Détails du Compte</h3>
                            
                            <div className="flex items-center space-x-3 text-gray-600">
                                <Hash className="h-5 w-5" />
                                <span>ID Utilisateur: {user.id}</span>
                            </div>
                            
                            <div className="flex items-center space-x-3 text-gray-600">
                                <Mail className="h-5 w-5" />
                                <span>Email: {user.username.toLowerCase().replace(' ', '.')}@sportsondage.com</span>
                            </div>

                            <div className="flex items-center space-x-3 text-gray-600">
                                <Calendar className="h-5 w-5" />
                                <span>Membre depuis: Octobre 2025 (Simulé)</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
            </div>
        </div>
    );
}