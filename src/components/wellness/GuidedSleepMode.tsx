import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Moon, Volume2, VolumeX, CheckSquare, Square, StopCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function GuidedSleepMode() {
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sleepTime, setSleepTime] = useState('22:30');
  const [activeStep, setActiveStep] = useState(0);

  const routineSteps = [
    { title: "Put Away Screens", desc: "Turn off all electronics and put your phone away." },
    { title: "Dim the Lights", desc: "Use soft, warm lighting in your room." },
    { title: "Read or Journal", desc: "Spend 10 minutes reading a physical book or journaling." },
    { title: "Relaxing Breaths", desc: "Take 5 deep breaths in through your nose, out through your mouth." }
  ];

  const toggleSound = () => setSoundEnabled(!soundEnabled);
  
  const startRoutine = () => {
    setIsActive(true);
    setActiveStep(0);
    toast('Sleep Routine Activated', {
      description: soundEnabled ? 'Calming sound playing. Follow the steps.' : 'Follow the steps to wind down.',
      icon: <Moon className="h-4 w-4 text-indigo-500" />
    });
  };

  const stopRoutine = () => {
    setIsActive(false);
    toast('Routine Stopped', { description: 'Sleep routine cancelled.' });
  };

  const nextStep = () => {
    if (activeStep < routineSteps.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      setIsActive(false);
      toast.success('Routine Complete!', {
        description: 'You are ready for bed. Goodnight! 🌙'
      });
    }
  };

  return (
    <Card className={`transition-all duration-700 ${isActive ? 'bg-slate-900 border-indigo-900 shadow-[0_0_30px_rgba(49,46,129,0.3)]' : 'hover:shadow-lg'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isActive ? 'text-indigo-200' : ''}`}>
          <Moon className={`h-5 w-5 ${isActive ? 'text-indigo-400' : 'text-indigo-600'}`} />
          Guided Sleep Mode
        </CardTitle>
        <CardDescription className={isActive ? 'text-slate-400' : ''}>
          Night routine execution to help you wind down
        </CardDescription>
      </CardHeader>

      <CardContent className="min-h-[250px] flex flex-col justify-center">
        {isActive ? (
          <div className="animate-in fade-in space-y-6">
            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
              <span className="text-sm font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                Active Routine
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSound}
                className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-full"
              >
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
            </div>

            <div className="text-center py-4 bg-gradient-to-br from-indigo-900/50 to-slate-800 rounded-2xl border border-indigo-800/50 relative overflow-hidden">
               <div className="absolute top-0 left-0 h-1 bg-indigo-500 w-full transition-all duration-500" style={{ transform: `scaleX(${(activeStep + 1) / routineSteps.length})`, transformOrigin: 'left' }}></div>
               <h3 className="text-3xl font-black text-white mb-2">{routineSteps[activeStep].title}</h3>
               <p className="text-indigo-200 text-sm max-w-[80%] mx-auto">{routineSteps[activeStep].desc}</p>
            </div>

            <div className="flex gap-3 justify-between">
              <Button 
                variant="ghost" 
                className="text-slate-400 hover:text-red-400 hover:bg-slate-800 px-6"
                onClick={stopRoutine}
              >
                Cancel
              </Button>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 font-bold text-lg"
                onClick={nextStep}
              >
                {activeStep < routineSteps.length - 1 ? 'Mark Done → Next' : 'Finish Routine'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div>
                 <Label htmlFor="sleep-time" className="text-sm font-bold text-indigo-900">Target Sleep Time</Label>
                 <p className="text-xs text-indigo-600/70 mt-1">Set reminder for wind-down</p>
              </div>
              <Input 
                id="sleep-time" 
                type="time" 
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-32 bg-white font-bold text-center border-indigo-200 focus:ring-indigo-500 text-lg" 
              />
            </div>

            <div className="space-y-2">
               <p className="text-sm font-bold text-slate-700 px-1">Tonight's Routine Flow:</p>
               <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-wrap gap-2">
                 {routineSteps.map((s, i) => (
                   <span key={i} className="flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm">
                     <span className="font-bold text-indigo-400">{i+1}.</span> {s.title}
                   </span>
                 ))}
               </div>
            </div>

            <Button 
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-lg shadow-indigo-200/50 rounded-xl"
              onClick={startRoutine}
            >
              <Moon className="h-5 w-5 mr-2 fill-current" /> Initialize Sleep Mode
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
