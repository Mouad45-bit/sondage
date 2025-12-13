// Fichier : front/src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, User, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; 

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggedIn } = useAuth(); 

  const [username, setUsername] = useState('utilisateur'); 
  const [password, setPassword] = useState('password');
  const [error, setError] = useState<string | null>(null);
  
  // Redirection immédiate si l'utilisateur est déjà connecté
  useEffect(() => {
    if (isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);


  // Fonction de connexion SIMULÉE pour le Front-end
  const handleLogin = (role: 'user' | 'admin') => {
    setError(null);
    if (!username || !password) {
        setError("Veuillez remplir tous les champs.");
        return;
    }
    
    // Appel à la fonction de login simulée du Context
    try {
        login(role); 
        router.push('/'); // Redirection après la connexion réussie
    } catch (e: any) {
        setError(e.message || "Erreur de connexion inconnue.");
    }
  };


  if (isLoggedIn) {
      return (
        <div className="flex justify-center items-center min-h-[80vh] bg-gray-100">
            <p className="text-xl text-gray-700">Redirection vers l'accueil...</p>
        </div>
      );
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-gray-100 p-8">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <LogIn className="h-10 w-10 text-indigo-600 mx-auto mb-2" />
          <CardTitle className="text-3xl font-bold">Connexion</CardTitle>
          <CardDescription>Accédez à votre compte pour participer aux sondages ou les gérer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            
            {error && (
                <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur</Label>
                    <Input 
                        id="username" 
                        placeholder="Entrez votre nom d'utilisateur" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="space-y-3 pt-2">
                <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg"
                    onClick={() => handleLogin('user')}
                >
                    <User className="mr-2 h-5 w-5" /> Se Connecter (Utilisateur)
                </Button>
                
                <Button 
                    className="w-full bg-gray-800 hover:bg-gray-700 h-12 text-lg"
                    onClick={() => handleLogin('admin')}
                >
                    <Shield className="mr-2 h-5 w-5" /> Se Connecter (Admin)
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}