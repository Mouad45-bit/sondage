// Fichier : front/src/app/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, MailOpen, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Interface pour les notifications simulées
interface Notification {
    id: number;
    message: string;
    type: 'rappel' | 'resultat' | 'systeme';
    isRead: boolean;
    timestamp: string;
}

// Données de simulation
const mockNotifications: Notification[] = [
    { id: 1, message: "Le sondage 'Tendances de la Coupe du Monde' est maintenant OUVERT ! Participez.", type: 'rappel', isRead: false, timestamp: "Il y a 5 minutes" },
    { id: 2, message: "Les résultats du sondage 'L'impact de la VAR' sont disponibles à la consultation.", type: 'resultat', isRead: false, timestamp: "Il y a 3 heures" },
    { id: 3, message: "Bienvenue sur SportSondage! Consultez notre guide de démarrage rapide.", type: 'systeme', isRead: true, timestamp: "Hier" },
];

export default function NotificationsPage() {
    const router = useRouter();
    const { isLoggedIn } = useAuth(); 
    
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

    // Protection de la route : redirige si l'utilisateur n'est pas connecté
    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, router]);

    // ... (Reste de la logique de markAsRead, markAllAsRead, clearAll inchangée)

    const markAsRead = (id: number) => {
        setNotifications(notifications.map(notif => notif.id === id ? { ...notif, isRead: true } : notif));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
    };

    const clearAll = () => {
        if (window.confirm("Êtes-vous sûr de vouloir effacer toutes les notifications ?")) {
            setNotifications([]);
        }
    };
    
    const unreadCount = notifications.filter(n => !n.isRead).length;


    if (!isLoggedIn) {
        return <div className="min-h-[80vh] bg-gray-100"></div>; 
    }

    return (
        <div className="flex justify-center min-h-[80vh] bg-gray-100 p-8">
            <div className="w-full max-w-4xl space-y-8">
                
                <h1 className="text-4xl font-extrabold text-gray-900 text-center flex items-center justify-center space-x-3">
                    <Bell className="h-8 w-8 text-indigo-600" /> 
                    <span>Centre de Notifications</span>
                </h1>
                
                <Card className="shadow-xl">
                    <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle className="text-2xl">
                            Boîte de réception 
                            {unreadCount > 0 && (
                                <span className="ml-2 px-3 py-1 bg-red-500 text-white text-sm rounded-full">{unreadCount} non lu(s)</span>
                            )}
                        </CardTitle>
                        <div className="flex space-x-2">
                            <Button 
                                variant="outline" 
                                onClick={markAllAsRead} 
                                disabled={unreadCount === 0}
                            >
                                <MailOpen className="h-4 w-4 mr-2" /> Tout marquer comme lu
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={clearAll}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Effacer tout
                            </Button>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                        {notifications.length === 0 ? (
                            <div className="text-center text-gray-500 p-10">
                                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
                                <p>Votre boîte de réception est vide. Bravo !</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    className={`p-4 rounded-lg flex justify-between items-center ${notif.isRead ? 'bg-gray-50 text-gray-600' : 'bg-white border border-indigo-200 shadow-sm'}`}
                                >
                                    <div className="flex flex-col">
                                        <p className={`font-semibold ${notif.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                                            {notif.type === 'rappel' ? '🔔 RAPPEL ' : notif.type === 'resultat' ? '🏆 RÉSULTAT ' : '💡 SYSTÈME '} 
                                            {notif.message}
                                        </p>
                                        <span className="text-xs text-gray-400 mt-1">{notif.timestamp}</span>
                                    </div>
                                    {!notif.isRead && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => markAsRead(notif.id)}
                                            className="text-indigo-600 hover:text-indigo-700"
                                        >
                                            Marquer comme lu
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}