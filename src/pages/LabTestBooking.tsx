import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FlaskConical, CheckCircle2, Loader2, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { authService, labTestService } from '@/lib/services';

const TEST_TYPES = ['Complete Blood Count (CBC)', 'Blood Sugar (Fasting/PP)', 'Urine Routine', 'Thyroid Profile', 'Lipid Profile', 'Liver Function Test', 'Kidney Function Test', 'Dengue NS1/IgM', 'Widal Test', 'Malaria Test', 'COVID RT-PCR', 'Other'];
const TIME_SLOTS = ['9:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '12:00 PM - 1:00 PM'];

export default function LabTestBooking() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ student_name: '', roll_number: '', phone: '', test_type: '', preferred_date: '', preferred_time_slot: '', prescription_name: '' });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!authService.isAuthenticated()) { toast.info('Please sign in.'); navigate('/login'); return; }
    const stored = localStorage.getItem('user');
    if (stored) {
      const p = JSON.parse(stored);
      setUser(p);
      setFormData(prev => ({ ...prev, student_name: `${p.first_name} ${p.last_name}`, phone: p.phone || '' }));
    }
    labTestService.getMyRequests().then(r => { if (r.success) setMyRequests(r.data); }).catch(() => {}).finally(() => setLoading(false));
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.test_type || !formData.preferred_date) { toast.error('Please fill test type and date'); return; }
    if (formData.preferred_date < today) { toast.error('Cannot request for a past date.'); return; }
    setIsSubmitting(true);
    try {
      const res = await labTestService.create(formData);
      if (res.success) { setIsSuccess(true); toast.success('Lab test request submitted!'); setTimeout(() => { setIsSuccess(false); labTestService.getMyRequests().then(r => { if (r.success) setMyRequests(r.data); }); }, 3000); }
      else toast.error(res.message);
    } catch { toast.error('Failed to submit request'); }
    finally { setIsSubmitting(false); }
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = { requested: 'bg-amber-100 text-amber-700', approved: 'bg-blue-100 text-blue-700', sample_collected: 'bg-indigo-100 text-indigo-700', sent_to_lab: 'bg-purple-100 text-purple-700', report_ready: 'bg-green-100 text-green-700', completed: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700' };
    return map[s] || 'bg-slate-100 text-slate-700';
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 rounded-3xl border-none shadow-2xl bg-white">
          <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="h-10 w-10" /></div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Request Submitted!</h2>
          <p className="text-slate-600 mb-6">Your lab test request has been submitted. You'll be notified when it's approved.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-8 hover:bg-white text-slate-600 font-bold" onClick={() => navigate('/')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-emerald-700 text-white p-8">
                <div className="flex items-center gap-4"><div className="bg-emerald-500 p-3 rounded-2xl"><FlaskConical className="h-8 w-8 text-white" /></div>
                <div><CardTitle className="text-2xl font-black">Lab Test Sample Collection</CardTitle><CardDescription className="text-emerald-200 mt-1">Fill in details to request a lab test</CardDescription></div></div>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Name</Label><Input value={formData.student_name} onChange={e => setFormData({...formData, student_name: e.target.value})} className="rounded-xl border-slate-200 py-5" required /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Roll Number</Label><Input value={formData.roll_number} onChange={e => setFormData({...formData, roll_number: e.target.value})} className="rounded-xl border-slate-200 py-5" placeholder="e.g. 22CS101" /></div>
                  </div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="rounded-xl border-slate-200 py-5" placeholder="10-digit mobile" /></div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Test Type</Label>
                    <Select onValueChange={val => setFormData({...formData, test_type: val})} value={formData.test_type}>
                      <SelectTrigger className="rounded-xl border-slate-200 py-5 font-bold"><SelectValue placeholder="Select test..." /></SelectTrigger>
                      <SelectContent>{TEST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Preferred Date</Label><Input type="date" min={today} value={formData.preferred_date} onChange={e => setFormData({...formData, preferred_date: e.target.value})} className="rounded-xl border-slate-200 py-5" required /></div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Time Slot</Label>
                      <Select onValueChange={val => setFormData({...formData, preferred_time_slot: val})} value={formData.preferred_time_slot}>
                        <SelectTrigger className="rounded-xl border-slate-200 py-5 font-bold"><SelectValue placeholder="Select slot..." /></SelectTrigger>
                        <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-7 rounded-2xl font-black uppercase tracking-widest text-xs" disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-5 w-5 animate-spin mr-2" />}Submit Request</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* My Requests */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-black text-slate-900 mb-4">My Lab Test Requests</h3>
            {loading ? <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto" /></div>
            : myRequests.length === 0 ? <div className="text-center py-8 text-slate-400 font-bold text-sm">No requests yet</div>
            : <div className="space-y-3">{myRequests.map(req => (
              <Card key={req.id} className="rounded-2xl border-slate-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-slate-900 text-sm">{req.test_type}</div>
                    <Badge className={`${statusColor(req.status)} border-none font-black uppercase text-[8px] px-2`}>{req.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{req.preferred_date}</span>
                    {req.preferred_time_slot && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{req.preferred_time_slot}</span>}
                  </div>
                  {req.report_link && <a href={req.report_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs font-bold mt-2 block hover:underline">📄 View Report</a>}
                  {req.admin_notes && <div className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg italic">"{req.admin_notes}"</div>}
                </CardContent>
              </Card>
            ))}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
