import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, UserCheck, Timer, RefreshCw } from 'lucide-react';
import { queueService } from '@/lib/services';
import { Button } from '@/components/ui/button';

export default function QueueDashboard() {
  const [queues, setQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchQueues = async () => {
    try {
      const response = await queueService.getStatus();
      if (response.success) { setQueues(response.data); setLastUpdated(new Date()); }
    } catch (error) { console.error('Failed to fetch queue status:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQueues(); const interval = setInterval(fetchQueues, 10000); return () => clearInterval(interval); }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Today's Live Queue</h1>
            <p className="text-slate-500 mt-1">Real-time status of today's consultations and estimated wait times</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">Last update: {lastUpdated.toLocaleTimeString()}</span>
            <Button variant="outline" size="sm" onClick={fetchQueues} disabled={loading}><RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && queues.length === 0 ? (
            Array(3).fill(0).map((_, i) => <Card key={i} className="animate-pulse h-64 bg-slate-200" />)
          ) : queues.length === 0 ? (
            <div className="col-span-full text-center py-16 text-slate-400 font-bold">No active queues for today. Doctors may not be available today.</div>
          ) : (
            queues.map((queue, index) => (
              <Card key={index} className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="bg-blue-600 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{queue.doctor_name}</CardTitle>
                      <CardDescription className="text-blue-100">{queue.specialization}</CardDescription>
                      {queue.cabin_number && <div className="text-blue-200 text-xs mt-1">{queue.cabin_number} • {queue.timings}</div>}
                    </div>
                    <Badge variant="outline" className="bg-blue-500/20 text-white border-blue-400">Live</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl flex flex-col items-center text-center">
                      <UserCheck className="h-5 w-5 text-blue-600 mb-2" />
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Serving</span>
                      <span className="text-2xl font-bold text-slate-900">#{queue.current_token || '--'}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl flex flex-col items-center text-center">
                      <Users className="h-5 w-5 text-indigo-600 mb-2" />
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Waiting</span>
                      <span className="text-2xl font-bold text-slate-900">{queue.waiting_count}</span>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-slate-600"><Clock className="h-4 w-4 mr-2 text-slate-400" />Total Today</div>
                      <span className="font-semibold text-slate-900">{queue.total_patients}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-slate-600"><Timer className="h-4 w-4 mr-2 text-slate-400" />Est. Wait</div>
                      <span className="font-bold text-blue-600">{queue.estimated_wait_time}</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${Math.min(100, ((queue.completed_count || 0) / (queue.total_patients || 1)) * 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center uppercase tracking-widest font-bold">
                      {queue.completed_count || 0} of {queue.total_patients} Served
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
