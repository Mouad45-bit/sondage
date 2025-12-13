'use client'; 

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuestionCardProps {
  questionNumber: number;
  questionText: string;
  options: string[];
  onAnswer: (answer: string) => void; 
  initialAnswer: string | undefined; 
}

export default function QuestionCard({ 
  questionNumber, 
  questionText, 
  options, 
  onAnswer,
  initialAnswer
}: QuestionCardProps) {
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(initialAnswer || null);

  const handleSelect = (answer: string) => {
    setSelectedAnswer(answer);
    onAnswer(answer);
  };

  return (
    <Card className="shadow-lg border-t-4 border-indigo-500 transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-xl">
          {questionNumber}. {questionText}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.map((option) => (
          <Button
            key={option}
            variant={selectedAnswer === option ? "default" : "outline"}
            className={`w-full justify-start py-6 text-base ${
                selectedAnswer === option 
                ? 'bg-indigo-600 text-white hover:bg-700 shadow-md' 
                : 'hover:bg-gray-100'
            }`}
            onClick={() => handleSelect(option)}
          >
            {option}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}