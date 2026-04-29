import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Calendar, CheckCircle2, Clock, Users, ListOrdered, FlaskConical, History, AlertCircle } from 'lucide-react';
import { appointmentService, waitingListService, labTestService } from '@/lib/services';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminAppointments() {
  const navigate = useNavigate();
  const [todayQueue, setTodayQueue] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const pollInterval = useRef<any>(null);

  const fetchData = async () => {
    try {
      const [todayRes, upRes, pastRes, waitRes, labRes] = await Promise.all([
        appointmentService.getAllAdmin('today'),
        appointmentService.getAllAdmin('upcoming'),
        appointmentService.getAllAdmin('past'),
        waitingListService.getAllAdmin(),
        labTestService.getAllAdmin(),
      ]);
      if (todayRes.success) setTodayQueue(todayRes.data);
      if (upRes.success) setUpcoming(upRes.data);
      if (pastRes.success) setPast(pastRes.data);
      if (waitRes.success) setWaitingList(waitRes.data);
      if (labRes.success) setLabTests(labRes.data);
      setLastUpdated(new Date());
    } catch (error) { console.error('Fetch error:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); pollInterval.current = setInterval(fetchData, 15000); return () => clearInterval(pollInterval.current); }, []);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      const response = await appointmentService.updateStatus(id, newStatus);
      if (response.success) { toast.success(`Status → ${newStatus}`); fetchData(); }
      else toast.error(response.message || 'Update failed');
    } catch { toast.error('Connection error'); }
  };

  const handleLabStatusUpdate = async (id: number, data: any) => {
    try {
      const response = await labTestService.updateStatus(id, data);
      if (response.success) { toast.success('Lab test updated'); fetchData(); }
      else toast.error(response.message || 'Update failed');
    } catch { toast.error('Connection error'); }
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = { Confirmed: 'bg-green-100 text-green-700', Pending: 'bg-amber-100 text-amber-700', Cancelled: 'bg-red-100 text-red-700', Completed: 'bg-blue-100 text-blue-700', waiting: 'bg-orange-100 text-orange-700', in_consultation: 'bg-indigo-100 text-indigo-700', expired: 'bg-gray-100 text-gray-500' };
    return map[s] || 'bg-slate-100 text-slate-700';
  };

  const priBadge = (l: number) => {
    if (l === 1) return <Badge className="bg-red-100 text-red-600 border-red-200 font-black text-[7px] px-1.5 h-4">P1</Badge>;
    if (l === 2) return <Badge className="bg-orange-100 text-orange-600 border-orange-200 font-black text-[7px] px-1.5 h-4">P2</Badge>;
    return <Badge className="bg-blue-100 text-blue-600 border-blue-200 font-black text-[7px] px-1.5 h-4">P{l}</Badge>;
  };

  const AptTable = ({ data, showWaited = false }: { data: any[]; showWaited?: boolean }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="text-xs font-black uppercase text-slate-400 tracking-widest px-6 py-4">Student</TableHead>
            <TableHead className="text-xs font-black uppercase text-slate-400 tracking-widest py-4">Pri</TableHead>
            <TableHead className="text-xs font-black uppercase text-slate-400 tracking-widest py-4">Token</TableHead>
            <TableHead className="text-xs font-black uppercase text-slate-400 tracking-widest py-4">Doctor / Date</TableHead>
            {showWaited && <TableHead className="text-xs font-black uppercase text-slate-400 tracking-widest py-4">Waited</TableHead>}
            <TableHead className="text-xs font-black uppercase text-slate-400 tracking-widest py-4 text-center">Status</TableHead>
            <TableHead className="text-xs font-black uppercase text-slate-400 tracking-widest py-4 text-right px-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((apt) => (
            <TableRow key={apt.id} className="hover:bg-slate-50/30 border-slate-50">
              <TableCell className="px-6 py-4">
                <div className="font-bold text-slate-900">{apt.student_name}</div>
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{apt.purpose_category || apt.purpose}</div>
              </TableCell>
              <TableCell>{priBadge(apt.priority_level)}</TableCell>
              <TableCell><div className="bg-blue-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-md">#{apt.token_number || '--'}</div></TableCell>
              <TableCell>
                <div className="font-bold text-slate-700">{apt.doctor_name}</div>
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{apt.appointment_date || apt.appointment_day} • {apt.specialization}</div>
              </TableCell>
              {showWaited && <TableCell><span className="text-sm font-bold text-orange-600">{apt.waited_minutes != null && apt.waited_minutes <= 480 ? `${apt.waited_minutes}m` : '--'}</span></TableCell>}
              <TableCell className="text-center"><Badge className={`${statusColor(apt.status)} border-none font-black uppercase text-[8px] px-3 py-1`}>{apt.status}</Badge></TableCell>
              <TableCell className="text-right px-6">
                <Select onValueChange={(val) => handleStatusUpdate(apt.id, val)} defaultValue={apt.status}>
                  <SelectTrigger className="w-36 border-slate-200 rounded-xl font-bold text-[10px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_consultation">In Consultation</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && <TableRow><TableCell colSpan={showWaited ? 7 : 6} className="py-16 text-center text-slate-300 font-bold">No appointments</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <Button variant="ghost" className="mb-4 -ml-2 hover:bg-white text-slate-600 font-bold" onClick={() => navigate('/admin')}><ArrowLeft className="h-4 w-4 mr-2" />Admin Portal</Button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">Medical Dashboard<Badge variant="outline" className="animate-pulse bg-blue-50 text-blue-600 border-blue-100 font-black text-[10px]">LIVE</Badge></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border flex items-center gap-5">
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-600" /><div><div className="text-[9px] font-black uppercase text-slate-400">Today</div><div className="text-lg font-black">{todayQueue.length}</div></div></div>
              <div className="w-px h-8 bg-slate-100" />
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600" /><div><div className="text-[9px] font-black uppercase text-slate-400">Upcoming</div><div className="text-lg font-black">{upcoming.length}</div></div></div>
              <div className="w-px h-8 bg-slate-100" />
              <div className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-emerald-600" /><div><div className="text-[9px] font-black uppercase text-slate-400">Lab</div><div className="text-lg font-black">{labTests.length}</div></div></div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-white px-3 py-1 rounded-full border">Synced: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>

        <Tabs defaultValue="today" className="w-full space-y-6">
          <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl border h-auto flex-wrap">
            <TabsTrigger value="today" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs"><CheckCircle2 className="h-4 w-4 mr-2" />Today's Live Queue</TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs"><Calendar className="h-4 w-4 mr-2" />Upcoming</TabsTrigger>
            <TabsTrigger value="past" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs"><History className="h-4 w-4 mr-2" />Past / Expired</TabsTrigger>
            <TabsTrigger value="waiting" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs"><ListOrdered className="h-4 w-4 mr-2" />Waiting List</TabsTrigger>
            <TabsTrigger value="lab" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs"><FlaskConical className="h-4 w-4 mr-2" />Lab Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="today"><Card className="rounded-3xl border-none shadow-xl bg-white"><CardContent className="p-0">{loading ? <div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 text-blue-600 animate-spin" /></div> : <AptTable data={todayQueue} showWaited />}</CardContent></Card></TabsContent>
          <TabsContent value="upcoming"><Card className="rounded-3xl border-none shadow-xl bg-white"><CardContent className="p-0"><AptTable data={upcoming} /></CardContent></Card></TabsContent>
          <TabsContent value="past"><Card className="rounded-3xl border-none shadow-xl bg-white"><CardContent className="p-0"><AptTable data={past} /></CardContent></Card></TabsContent>

          <TabsContent value="waiting">
            <Card className="rounded-3xl border-none shadow-xl bg-white"><CardContent className="p-0">
              <div className="overflow-x-auto"><Table>
                <TableHeader className="bg-orange-50/30"><TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-xs font-black uppercase text-orange-400 tracking-widest px-6 py-4">Pos</TableHead>
                  <TableHead className="text-xs font-black uppercase text-orange-400 tracking-widest py-4">Student</TableHead>
                  <TableHead className="text-xs font-black uppercase text-orange-400 tracking-widest py-4">Doctor</TableHead>
                  <TableHead className="text-xs font-black uppercase text-orange-400 tracking-widest py-4">Requested</TableHead>
                  <TableHead className="text-xs font-black uppercase text-orange-400 tracking-widest py-4 text-right px-6">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {waitingList.map((e) => (
                    <TableRow key={e.id} className="hover:bg-orange-50/10 border-slate-50">
                      <TableCell className="px-6 py-4"><div className="bg-slate-100 text-slate-600 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs">#{e.position}</div></TableCell>
                      <TableCell><div className="font-bold text-slate-900">{e.first_name} {e.last_name}</div><div className="text-[10px] font-black text-blue-600 uppercase mt-1">{e.purpose_category || e.appointment_purpose}</div></TableCell>
                      <TableCell><div className="font-bold text-slate-700">{e.doctor_name}</div><div className="text-[10px] font-black text-orange-600 uppercase mt-1">{e.day_name} • {e.specialization}</div></TableCell>
                      <TableCell className="text-slate-500 text-sm">{new Date(e.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right px-6"><Badge className="bg-orange-50 text-orange-600 border-none font-black uppercase text-[8px] px-3 py-1">WAITING</Badge></TableCell>
                    </TableRow>
                  ))}
                  {waitingList.length === 0 && <TableRow><TableCell colSpan={5} className="py-16 text-center text-slate-300 font-bold">No students waiting</TableCell></TableRow>}
                </TableBody>
              </Table></div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="lab">
            <Card className="rounded-3xl border-none shadow-xl bg-white"><CardContent className="p-0">
              <div className="overflow-x-auto"><Table>
                <TableHeader className="bg-emerald-50/30"><TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-xs font-black uppercase text-emerald-500 tracking-widest px-6 py-4">Student</TableHead>
                  <TableHead className="text-xs font-black uppercase text-emerald-500 tracking-widest py-4">Test</TableHead>
                  <TableHead className="text-xs font-black uppercase text-emerald-500 tracking-widest py-4">Pref. Date</TableHead>
                  <TableHead className="text-xs font-black uppercase text-emerald-500 tracking-widest py-4 text-center">Status</TableHead>
                  <TableHead className="text-xs font-black uppercase text-emerald-500 tracking-widest py-4 text-right px-6">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {labTests.map((lt) => (
                    <TableRow key={lt.id} className="hover:bg-emerald-50/10 border-slate-50">
                      <TableCell className="px-6 py-4"><div className="font-bold text-slate-900">{lt.student_name}</div><div className="text-[10px] text-slate-400">{lt.roll_number} • {lt.phone}</div></TableCell>
                      <TableCell><div className="font-bold text-slate-700">{lt.test_type}</div></TableCell>
                      <TableCell><div className="font-bold text-slate-700">{lt.preferred_date}</div><div className="text-[10px] text-slate-400">{lt.preferred_time_slot}</div></TableCell>
                      <TableCell className="text-center"><Badge className={`${statusColor(lt.status === 'requested' ? 'Pending' : lt.status === 'completed' ? 'Completed' : lt.status === 'cancelled' ? 'Cancelled' : 'Confirmed')} border-none font-black uppercase text-[8px] px-3 py-1`}>{lt.status}</Badge></TableCell>
                      <TableCell className="text-right px-6">
                        <Select onValueChange={(val) => handleLabStatusUpdate(lt.id, { status: val })}>
                          <SelectTrigger className="w-40 border-slate-200 rounded-xl font-bold text-[10px] h-9"><SelectValue placeholder="Update..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="sample_collected">Sample Collected</SelectItem>
                            <SelectItem value="sent_to_lab">Sent to Lab</SelectItem>
                            <SelectItem value="report_ready">Report Ready</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {labTests.length === 0 && <TableRow><TableCell colSpan={5} className="py-16 text-center text-slate-300 font-bold">No lab test requests</TableCell></TableRow>}
                </TableBody>
              </Table></div>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
