// Fichier : front/src/components/Header.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, LogIn, PlusCircle, Home } from 'lucide-react'; 
import { useAuth } from '@/context/AuthContext'; 
import { useState, useEffect } from 'react'; 

export default function Header() {
    const { user, isLoggedIn, logout } = useAuth(); 
    const [mounted, setMounted] = useState(false); 

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <header className="bg-white border-b shadow-sm sticky top-0 z-40 h-16"></header>; 
    }

    return (
        <header className="bg-white border-b shadow-sm sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                
                <Link href="/" className="text-2xl font-bold text-indigo-700 hover:text-indigo-800 transition duration-150">
                    SportSondage
                </Link>

                <nav className="flex items-center space-x-6">
                    <Link href="/" className="text-gray-600 hover:text-indigo-600 font-medium transition duration-150">Accueil</Link>
                    <Link href="/results" className="text-gray-600 hover:text-indigo-600 font-medium transition duration-150">Résultats</Link>
                    
                    {isLoggedIn && (
                        <Link href="/create" className="text-green-600 hover:text-green-700 font-bold transition duration-150 flex items-center">
                            <PlusCircle className="h-4 w-4 mr-1" /> Créer
                        </Link>
                    )}
                    
                    {isLoggedIn && (
                        <Link href="/my-polls" className="text-gray-600 hover:text-indigo-600 font-medium transition duration-150 flex items-center">
                            <Home className="h-4 w-4 mr-1" /> Mes Sondages
                        </Link>
                    )}

                    <Link href="/notifications" className="text-gray-600 hover:text-indigo-600 font-medium transition duration-150">Notifications</Link>
                    
                    {isLoggedIn && (
                        <Link href="/profile" className="text-gray-600 hover:text-indigo-600 font-medium transition duration-150">Profil</Link>
                    )}
                </nav>

                <div className="flex items-center space-x-3">
                    {isLoggedIn ? (
                        <>
                            <div className="flex items-center space-x-2 p-2 rounded-full border border-gray-200">
                                <UserIcon className="h-5 w-5 text-indigo-600" aria-label="Utilisateur connecté" /> 
                                <span className="text-sm font-semibold text-gray-700 hidden sm:inline">
                                    {user?.username || 'Utilisateur'}
                                </span>
                            </div>
                            
                            <Button variant="outline" size="sm" onClick={logout} className="flex items-center space-x-1">
                                <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Déconnexion</span>
                            </Button>
                        </>
                    ) : (
                        <Button asChild className="bg-indigo-600 hover:bg-indigo-700" size="sm">
                            <Link href="/login">
                                <LogIn className="h-4 w-4 mr-2" /> Connexion
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}