import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ThumbsUp, ThumbsDown, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const AFFIRMATIONS = {
  anxious: [
    "I am safe right now. This feeling will pass.",
    "I breathe in calm, and breathe out tension.",
    "My anxiety does not control my future.",
    "I have survived 100% of my bad days.",
    "I am capable of handling this moment."
  ],
  overwhelmed: [
    "I will take this one small step at a time.",
    "I am allowed to ask for help and take breaks.",
    "Everything does not need to be done perfectly today.",
    "I release the need to carry the weight of the world.",
    "Focus on the next right thing, nothing else."
  ],
  lowEnergy: [
    "My worth is not tied to my productivity today.",
    "I grant my body the rest it requires.",
    "Even small efforts count as progress.",
    "I am gentle with myself when I feel exhausted.",
    "Tomorrow is a new day with new energy."
  ]
};

type EmotionalState = 'anxious' | 'overwhelmed' | 'lowEnergy' | null;

export default function AdaptiveMentalSupport() {
  const [activeState, setActiveState] = useState<EmotionalState>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStateSelect = (state: EmotionalState) => {
    setIsGenerating(true);
    setActiveState(state);
    
    // Simulate thinking/generation delay
    setTimeout(() => {
      setCurrentIndex(Math.floor(Math.random() * AFFIRMATIONS[state!].length));
      setIsGenerating(false);
    }, 600);
  };

  const nextAffirmation = () => {
    if (!activeState) return;
    setIsGenerating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % AFFIRMATIONS[activeState].length);
      setIsGenerating(false);
    }, 400);
  };

  const handleFeedback = (helped: boolean) => {
    toast.success('Feedback recorded to personalize future suggestions');
    if (!helped) nextAffirmation();
  };

  const resetState = () => setActiveState(null);

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Adaptive Mental Support
        </CardTitle>
        <CardDescription>Tailored affirmations based on your current emotional state</CardDescription>
      </CardHeader>
      
      <CardContent className="min-h-[250px] flex flex-col justify-center">
        {!activeState ? (
          <div className="space-y-4 animate-in fade-in">
            <p className="text-center font-medium text-gray-600 mb-6">How are you feeling right now?</p>
            <div className="grid gap-3">
              <Button 
                variant="outline" 
                className="justify-between h-14 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200" 
                onClick={() => handleStateSelect('anxious')}
              >
                <span className="text-lg">Anxious & Restless</span>
                <span className="text-2xl">😰</span>
              </Button>
              <Button 
                variant="outline" 
                className="justify-between h-14 hover:bg-red-50 hover:text-red-700 hover:border-red-200" 
                onClick={() => handleStateSelect('overwhelmed')}
              >
                <span className="text-lg">Overwhelmed & Stressed</span>
                <span className="text-2xl">🤯</span>
              </Button>
              <Button 
                variant="outline" 
                className="justify-between h-14 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200" 
                onClick={() => handleStateSelect('lowEnergy')}
              >
                <span className="text-lg">Fatigued & Low Energy</span>
                <span className="text-2xl">🔋</span>
              </Button>
            </div>
          </div>
        ) : isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full text-blue-600 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm font-medium">Finding the right words...</p>
          </div>
        ) : (
          <div className="flex flex-col h-full animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
              <Button variant="ghost" size="sm" onClick={resetState} className="text-gray-400 hover:text-gray-800">
                ← Back
              </Button>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                {activeState === 'anxious' ? 'Anxiety Relief' : activeState === 'overwhelmed' ? 'Stress Relief' : 'Energy Recovery'}
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 mb-8 relative group">
              <p className="text-2xl font-black text-blue-900 leading-tight">
                "{AFFIRMATIONS[activeState][currentIndex]}"
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 mt-auto">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl h-10 w-10 p-0" onClick={() => handleFeedback(true)}>
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl h-10 w-10 p-0" onClick={() => handleFeedback(false)}>
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="default" className="bg-blue-600 rounded-xl" onClick={nextAffirmation}>
                <RefreshCw className="h-4 w-4 mr-2" /> Give me another
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
