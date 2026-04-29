import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Square, ThumbsUp, ThumbsDown, Wind } from 'lucide-react';
import { toast } from 'sonner';

export default function InstantCalmToolkit() {
  const [isActive, setIsActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('Ready');
  const [duration, setDuration] = useState([5]); // minutes
  const [timeRemaining, setTimeRemaining] = useState(0); // seconds
  const [mode, setMode] = useState('4-4-4'); // 4-4-4 or box
  const [feedbackShown, setFeedbackShown] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
        
        // 4-4-4 Breathing Logic (12 sec cycle)
        if (mode === '4-4-4') {
          const cycleTime = 12;
          const currentSecond = (duration[0] * 60 - timeRemaining) % cycleTime;
          
          if (currentSecond < 4) setBreathingPhase('Inhale');
          else if (currentSecond < 8) setBreathingPhase('Hold');
          else setBreathingPhase('Exhale');
        } 
        // Box Breathing Logic (16 sec cycle)
        else {
          const cycleTime = 16;
          const currentSecond = (duration[0] * 60 - timeRemaining) % cycleTime;
          
          if (currentSecond < 4) setBreathingPhase('Inhale');
          else if (currentSecond < 8) setBreathingPhase('Hold');
          else if (currentSecond < 12) setBreathingPhase('Exhale');
          else setBreathingPhase('Hold Empty');
        }
      }, 1000);
    } else if (isActive && timeRemaining === 0) {
      setIsActive(false);
      setBreathingPhase('Done');
      setFeedbackShown(true);
    }

    return () => clearInterval(interval);
  }, [isActive, timeRemaining, mode, duration]);

  const startSession = () => {
    setTimeRemaining(duration[0] * 60);
    setIsActive(true);
    setFeedbackShown(false);
  };

  const stopSession = () => {
    setIsActive(false);
    setBreathingPhase('Ready');
    setTimeRemaining(0);
  };

  const handleFeedback = (helped: boolean) => {
    toast.success('Thank you for your feedback');
    setFeedbackShown(false);
    setBreathingPhase('Ready');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={`transition-all duration-500 overflow-hidden ${isActive ? 'ring-2 ring-blue-400 bg-blue-50/50' : 'hover:shadow-lg'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wind className="h-5 w-5 text-blue-500" />
          Instant Calm Toolkit
        </CardTitle>
        <CardDescription>Guided breathing to immediately reduce stress</CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center justify-center min-h-[250px] relative">
        {feedbackShown ? (
          <div className="text-center space-y-4 animate-in fade-in zoom-in w-full py-8">
            <h3 className="text-xl font-bold text-gray-800">Session Complete!</h3>
            <p className="text-sm text-gray-600">Did this help you feel more calm?</p>
            <div className="flex justify-center gap-4 mt-4">
              <Button variant="outline" size="lg" className="h-16 w-16 rounded-2xl hover:bg-green-50 hover:text-green-600 hover:border-green-200" onClick={() => handleFeedback(true)}>
                <ThumbsUp className="h-8 w-8" />
              </Button>
              <Button variant="outline" size="lg" className="h-16 w-16 rounded-2xl hover:bg-red-50 hover:text-red-600 hover:border-red-200" onClick={() => handleFeedback(false)}>
                <ThumbsDown className="h-8 w-8" />
              </Button>
            </div>
          </div>
        ) : isActive ? (
          <div className="flex flex-col items-center w-full animate-in fade-in">
            {/* Breathing Animation Circle */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <div 
                className={`absolute w-full h-full rounded-full bg-blue-100 transition-transform duration-[4s] ease-in-out
                  ${breathingPhase === 'Inhale' ? 'scale-150 opacity-50' : ''}
                  ${breathingPhase === 'Exhale' ? 'scale-75 opacity-100' : ''}
                  ${breathingPhase.includes('Hold') ? 'scale-110 opacity-80' : ''}
                `} 
              />
              <div className="absolute w-32 h-32 rounded-full bg-blue-500 flex flex-col items-center justify-center text-white shadow-lg z-10 transition-transform duration-[4s]">
                <span className="text-xl font-bold uppercase tracking-widest">{breathingPhase}</span>
                <span className="font-mono text-sm opacity-80 mt-1">{formatTime(timeRemaining)}</span>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={stopSession} className="text-gray-400 hover:text-red-500 mt-4">
              <Square className="h-4 w-4 mr-2" /> Stop Session
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-6 animate-in fade-in">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-gray-700">
                <span>Duration</span>
                <span className="text-blue-600">{duration} minutes</span>
              </div>
              <Slider
                value={duration}
                onValueChange={setDuration}
                max={15}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={mode === '4-4-4' ? 'default' : 'outline'} 
                onClick={() => setMode('4-4-4')}
                className={mode === '4-4-4' ? 'bg-blue-600' : ''}
                size="sm"
              >
                4-4-4 (Relax)
              </Button>
              <Button 
                variant={mode === 'box' ? 'default' : 'outline'} 
                onClick={() => setMode('box')}
                className={mode === 'box' ? 'bg-blue-600' : ''}
                size="sm"
              >
                Box Breathing
              </Button>
            </div>

            <Button onClick={startSession} className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-xl" size="lg">
              <Play className="h-5 w-5 mr-2 fill-current" /> Start Deep Breathing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
