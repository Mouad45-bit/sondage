// Fichier : front/src/app/results/page.tsx
'use client';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart2, TrendingUp } from 'lucide-react';

export default function GlobalResultsPage() {
    // ⚠️ NOTE : Ce code résout le problème du lien "Résultats" dans le Header.
    // L'erreur de fetch (image_8194c0.png) se produit dans le code que vous aviez précédemment sur /app/results.
    // Cette page n'essaie pas de fetcher, elle corrige l'erreur de routage 404.
    return (
        <div className="flex justify-center items-center min-h-[80vh] bg-gray-100 p-8">
            <div className="w-full max-w-4xl space-y-8">
                
                <h1 className="text-4xl font-extrabold text-gray-900 text-center flex items-center justify-center space-x-3">
                    <TrendingUp className="h-8 w-8 text-indigo-600" />
                    <span>Analyse des Tendances Globales</span>
                </h1>

                <Card className="shadow-2xl border-t-8 border-indigo-600 p-10 text-center">
                    <BarChart2 className="h-16 w-16 mx-auto text-indigo-600 mb-4" />
                    <CardTitle className="text-3xl font-bold">Résultats et Analyses Cross-Sondages</CardTitle>
                    <CardContent className="text-xl text-gray-700 pt-4">
                        Cette page affichera les tendances agrégées sur tous les sondages complétés
                        (Ex: "Taux de participation moyen", "Opinions majoritaires par catégorie").
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}