import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft, AlertTriangle, Activity, Flame } from 'lucide-react';
import InstantCalmToolkit from '@/components/wellness/InstantCalmToolkit';
import AdaptiveMentalSupport from '@/components/wellness/AdaptiveMentalSupport';
import GuidedSleepMode from '@/components/wellness/GuidedSleepMode';
import SituationSolver from '@/components/wellness/SituationSolver';

export default function WellnessHub() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">SafeSpace</span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Wellness Hub</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Wellness Matters</h2>
          <p className="text-lg text-gray-600">
            Take care of your mental health with our wellness tools and exercises
          </p>
        </div>

        {/* Emergency Awareness Hub */}
        <Card className="mb-8 border-red-200 shadow-md">
          <CardHeader className="bg-red-50 border-b border-red-100 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="h-6 w-6" />
              <span>Emergency Awareness Hub</span>
            </CardTitle>
            <CardDescription className="text-red-600">
              Quick guides & tutorials for critical situations. Be prepared to act.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Activity className="h-5 w-5 text-red-500" /> Cardiac Arrest (CPR)</h3>
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-sm bg-gray-100">
                  <iframe className="w-full h-full" src="https://www.youtube.com/embed/_F4Of33ifbw?si=-1_ctETD_Cikbap2" title="CPR Guide" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Flame className="h-5 w-5 text-orange-500" /> Fire Emergency</h3>
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-sm bg-gray-100">
                  <iframe className="w-full h-full" src="https://www.youtube.com/embed/GVBamXXVD30?si=ikUOyQJ8dxnU-PDY" title="Fire Extinguisher Guide" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Shield className="h-5 w-5 text-blue-500" /> First Aid Basics</h3>
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-sm bg-gray-100">
                  <iframe className="w-full h-full" src="https://www.youtube.com/embed/8MOPr4moad4?si=aRse8s2VlRm888J3" title="First Aid" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wellness Tools Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <InstantCalmToolkit />
          <AdaptiveMentalSupport />
          <GuidedSleepMode />
          <SituationSolver />
        </div>

        {/* Quick Resources */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Need More Support?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Link to="/resources">
                <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-100">
                  📚 Browse Resources
                </Button>
              </Link>
              <Button
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => window.open('tel:988')}
              >
                📞 Crisis Helpline
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}