import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Stethoscope, Loader2 } from 'lucide-react';
import { appointmentService, authService } from '@/lib/services';
import { toast } from 'sonner';

export default function MyAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    fetchAppointments();
  }, [navigate]);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentService.getMyAppointments();
      if (response.success) setAppointments(response.data);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      const res = await appointmentService.updateStatus(id, 'Cancelled');
      if (res.success) { toast.success('Appointment cancelled'); fetchAppointments(); }
      else toast.error(res.message);
    } catch { toast.error('Failed to cancel'); }
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = { Confirmed: 'bg-green-100 text-green-700', Pending: 'bg-amber-100 text-amber-700', Cancelled: 'bg-red-100 text-red-700', Completed: 'bg-blue-100 text-blue-700', waiting: 'bg-orange-100 text-orange-700', in_consultation: 'bg-indigo-100 text-indigo-700', expired: 'bg-gray-100 text-gray-500' };
    return map[s] || 'bg-slate-100 text-slate-700';
  };

  const formatDate = (apt: any) => {
    if (apt.appointment_date) {
      const d = new Date(apt.appointment_date + 'T00:00:00');
      const day = d.toLocaleDateString('en-US', { weekday: 'long' });
      const rest = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${day}, ${rest}`;
    }
    return apt.appointment_day || 'N/A';
  };

  const isActive = (s: string) => ['Confirmed', 'Pending', 'waiting', 'in_consultation'].includes(s);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Button variant="ghost" className="mb-4 -ml-2 hover:bg-white text-slate-600 font-bold" onClick={() => navigate('/')}><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Appointments</h1>
            <p className="text-slate-500 font-medium mt-1">Manage and track your medical visits.</p>
          </div>
          <Link to="/"><Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 font-black uppercase tracking-widest text-[10px]">New Appointment</Button></Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4"><Loader2 className="h-10 w-10 text-blue-600 animate-spin" /><p className="text-slate-500 font-bold">Loading...</p></div>
        ) : appointments.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-2 border-slate-200 p-16 text-center bg-white/50">
            <div className="bg-slate-100 text-slate-400 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Calendar className="h-10 w-10" /></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No appointments yet</h3>
            <p className="text-slate-500 mb-8">Book an appointment from the dashboard.</p>
            <Link to="/"><Button variant="outline" className="rounded-2xl font-black uppercase text-[10px] px-8 py-6">Go to Dashboard</Button></Link>
          </Card>
        ) : (
          <div className="grid gap-6">
            {appointments.map((apt) => {
              const isPast = apt.appointment_date && apt.appointment_date < today;
              const canCancel = isActive(apt.status) && !isPast;
              return (
                <Card key={apt.id} className={`rounded-3xl border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white ${isPast && isActive(apt.status) ? 'opacity-60' : ''}`}>
                  <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center justify-center min-w-[140px]">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Date</span>
                      <span className="text-base font-black text-slate-900 text-center">{formatDate(apt)}</span>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-black text-slate-900">{apt.doctor_name}</h3>
                        <Badge className={`${statusColor(apt.status)} border-none font-black uppercase text-[9px] px-3`}>{apt.status}</Badge>
                      </div>
                      <div className="flex items-center text-slate-500 text-sm font-bold"><Stethoscope className="h-4 w-4 mr-2 text-blue-600" />{apt.specialization}</div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 font-black uppercase text-[8px] px-2">{apt.purpose_category || apt.purpose}</Badge>
                      {apt.token_number && <span className="ml-2 text-sm font-black text-blue-600">Token #{apt.token_number}</span>}
                    </div>
                    <div className="w-full md:w-auto">
                      {canCancel && <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs py-5 w-full" onClick={() => handleCancel(apt.id)}>Cancel</Button>}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
