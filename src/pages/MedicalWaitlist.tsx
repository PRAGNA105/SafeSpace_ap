import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Calendar, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Timer } from 'lucide-react';
import { waitingListService } from '@/lib/services';
import { toast } from 'sonner';

export default function MedicalWaitlist() {
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWaitlistStatus();
  }, []);

  const fetchWaitlistStatus = async () => {
    try {
      const response = await waitingListService.getStatus();
      if (response.success) {
        setWaitlist(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch waitlist status');
      }
    } catch (error) {
      console.error('Waitlist fetch error:', error);
      toast.error('Connect to backend to see live status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Waiting in Queue</Badge>;
      case 'notified':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Slot Available</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Confirmed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getChanceMessage = (position: number) => {
    if (position <= 3) return "High chance of notification soon.";
    if (position <= 10) return "Moderate wait time expected.";
    return "You will be notified when a slot becomes available.";
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-8 hover:bg-white text-slate-600 font-bold"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">My Waiting List</h1>
            <p className="text-slate-600 font-medium">Track your medical appointment queue status in real-time.</p>
          </div>
          <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-200 flex items-center gap-3">
            <Timer className="h-6 w-6 animate-pulse" />
            <span className="font-bold uppercase tracking-widest text-xs">Live Tracking</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching your status...</p>
          </div>
        ) : waitlist.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center rounded-3xl shadow-none">
            <CardContent className="flex flex-col items-center">
              <div className="bg-slate-100 p-6 rounded-full mb-6">
                <Calendar className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">No Active Waitlists</h3>
              <p className="text-slate-500 font-medium mb-8 max-w-sm">
                You haven't joined any doctor waiting lists yet. Book an appointment from the dashboard to get started.
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 rounded-2xl text-lg shadow-xl shadow-blue-100"
              >
                Go to Appointment Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {waitlist.map((entry) => (
              <Card key={entry.id} className="overflow-hidden border-2 border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group rounded-3xl bg-white">
                <div className={`h-2 w-full ${entry.status === 'notified' ? 'bg-green-500' : 'bg-blue-600'}`}></div>
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-6">
                      <div className="p-5 rounded-2xl bg-slate-50 text-blue-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <User className="h-8 w-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{entry.doctor_name}</h3>
                          {getStatusBadge(entry.status)}
                        </div>
                        <p className="text-blue-600 font-bold uppercase tracking-widest text-[10px] mb-4">
                          {entry.specialization} • {entry.day_name}
                        </p>
                        <div className="flex flex-col gap-2 mt-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 font-black uppercase tracking-widest text-[8px] px-2 h-5">
                               {entry.purpose_category || entry.appointment_purpose}
                            </Badge>
                            {entry.purpose_detail && (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                • {entry.purpose_detail}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end justify-center min-w-[200px] border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 text-center md:text-right">Current Queue Position</div>
                      <div className="text-6xl font-black text-blue-600 tracking-tighter mb-2">#{entry.position}</div>
                      <div className="flex items-center text-xs font-bold text-slate-400">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                        {getChanceMessage(entry.position)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <div className="mt-12 p-8 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 mb-1">How it works?</h4>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              When a patient cancels or a new slot opens up, the users in the waiting list are notified sequentially. 
              Once it's your turn, you'll receive an alert to confirm your booking within 15 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
