import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Book, Users, Briefcase, Zap, MoveRight, ArrowRightCircle, ShieldAlert } from 'lucide-react';

const SCENARIO_PLANS = {
  exam: {
    title: "Exam Preparation Stress",
    icon: <Book className="h-6 w-6 text-indigo-500" />,
    color: "indigo",
    steps: [
      { text: "Stop. Close your eyes and take 3 deep 4-second breaths.", action: "Breathe" },
      { text: "Break your studying down. Focus ONLY on the very next 25-minute chunk.", action: "Set Timer" },
      { text: "Write down the 3 most important topics you need to review. Ignore the rest for now.", action: "Prioritize" }
    ]
  },
  social: {
    title: "Social Anxiety Spikes",
    icon: <Users className="h-6 w-6 text-emerald-500" />,
    color: "emerald",
    steps: [
      { text: "Acknowledge the feeling without judgment. It's okay to feel anxious.", action: "Accept" },
      { text: "Find a quiet space if needed, or focus your attention fully outward on one object.", action: "Grounding" },
      { text: "Remember: People are usually focused on themselves, not analyzing you.", action: "Reframe" }
    ]
  },
  overwhelm: {
    title: "General Overwhelm",
    icon: <Zap className="h-6 w-6 text-rose-500" />,
    color: "rose",
    steps: [
      { text: "Do a 'Brain Dump'. Write absolutely everything on your mind onto a piece of paper.", action: "Clear Head" },
      { text: "Pick ONE small, easy task you can complete in <5 minutes.", action: "Quick Win" },
      { text: "Drink a glass of water and stretch your body for 60 seconds.", action: "Physical Reset" }
    ]
  }
};

type ScenarioKey = keyof typeof SCENARIO_PLANS | null;

export default function SituationSolver() {
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>(null);
  
  const resetSolver = () => setActiveScenario(null);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-500" />
          Situation Solver
        </CardTitle>
        <CardDescription>Quick, actionable intervention plans for stressful moments</CardDescription>
      </CardHeader>

      <CardContent className="min-h-[250px] flex flex-col justify-center">
        {!activeScenario ? (
          <div className="space-y-4 animate-in fade-in">
            <p className="text-sm font-bold text-slate-700 tracking-wide uppercase mb-4 text-center">What are you struggling with?</p>
            <div className="grid gap-3">
              <Button 
                variant="outline" 
                className="justify-start h-14 bg-indigo-50/30 hover:bg-indigo-50 border-indigo-100 hover:border-indigo-200 group relative overflow-hidden" 
                onClick={() => setActiveScenario('exam')}
              >
                <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">
                  <MoveRight className="h-5 w-5" />
                </div>
                <Book className="h-5 w-5 mr-3 text-indigo-500" /> 
                <span className="font-bold text-indigo-900">Exam / Academic Stress</span>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-14 bg-emerald-50/30 hover:bg-emerald-50 border-emerald-100 hover:border-emerald-200 group relative overflow-hidden" 
                onClick={() => setActiveScenario('social')}
              >
                <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400">
                  <MoveRight className="h-5 w-5" />
                </div>
                <Users className="h-5 w-5 mr-3 text-emerald-500" /> 
                <span className="font-bold text-emerald-900">Social Anxiety</span>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-14 bg-rose-50/30 hover:bg-rose-50 border-rose-100 hover:border-rose-200 group relative overflow-hidden" 
                onClick={() => setActiveScenario('overwhelm')}
              >
                 <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-rose-400">
                  <MoveRight className="h-5 w-5" />
                </div>
                <Zap className="h-5 w-5 mr-3 text-rose-500" /> 
                <span className="font-bold text-rose-900">General Overwhelmed Feeling</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <Button variant="ghost" size="sm" onClick={resetSolver} className="text-slate-500 hover:text-slate-900 px-0 hover:bg-transparent">
                <ArrowRightCircle className="h-4 w-4 mr-2 rotate-180" /> Back
              </Button>
              <div className="flex items-center gap-2 font-bold text-sm bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                {SCENARIO_PLANS[activeScenario].icon} 
                <span className={`text-${SCENARIO_PLANS[activeScenario].color}-900`}>Action Plan</span>
              </div>
            </div>

            <h3 className={`text-2xl font-black mb-6 tracking-tight text-${SCENARIO_PLANS[activeScenario].color}-900`}>
              {SCENARIO_PLANS[activeScenario].title}
            </h3>

            <div className="space-y-4 flex-1">
              {SCENARIO_PLANS[activeScenario].steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-slate-300 transition-colors">
                  <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full font-black text-white bg-${SCENARIO_PLANS[activeScenario].color}-500 shadow-md shadow-${SCENARIO_PLANS[activeScenario].color}-200`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className={`text-xs font-black uppercase tracking-widest text-${SCENARIO_PLANS[activeScenario].color}-600 mb-1`}>{step.action}</h4>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 text-center">
              <Button size="lg" className="w-full font-bold h-14 text-white bg-slate-900 hover:bg-black rounded-xl" onClick={resetSolver}>
                I'm ready to proceed
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
