import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Shield, Heart, BookOpen, Phone, User, LogOut, Ambulance, Clock, Activity, Stethoscope, Calendar, Loader2, AlertCircle, Pill, ShieldPlus, FlaskConical, Brain, Baby, ChevronRight, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { userService, authService, doctorService } from '@/lib/services';
import { Badge } from '@/components/ui/badge';
import BulletinBoard from '@/components/BulletinBoard';

const SERVICE_CONFIG = [
  { key: 'General Doctor', icon: Stethoscope, color: 'blue', desc: 'Fever, cold, body pain & general checkups' },
  { key: 'Gynaecologist', icon: Baby, color: 'pink', desc: 'Women\'s health consultations' },
  { key: 'Psychiatrist', icon: Brain, color: 'purple', desc: 'Mental health & counseling support' },
  { key: 'Lab Test', icon: FlaskConical, color: 'emerald', desc: 'Blood tests, urine tests & sample collection' },
];

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; light: string; badge: string }> = {
  blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
  pink: { bg: 'bg-pink-600', text: 'text-pink-600', border: 'border-pink-200', light: 'bg-pink-50', badge: 'bg-pink-100 text-pink-700' },
  purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-200', light: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700' },
  emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' },
};

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [serviceSchedule, setServiceSchedule] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const syncUser = () => {
      const stored = localStorage.getItem('user');
      if (!stored) { setUser(null); return; }
      try { setUser(JSON.parse(stored)); } catch { setUser(null); }
    };
    syncUser();
    window.addEventListener('auth-updated', syncUser);

    if (authService.isAuthenticated()) {
      userService.updateLastActive().catch(() => {});
    }
    const hb = setInterval(() => {
      if (authService.isAuthenticated()) userService.updateLastActive().catch(() => {});
    }, 60000);

    return () => { clearInterval(hb); window.removeEventListener('auth-updated', syncUser); };
  }, []);

  useEffect(() => {
    doctorService.getServices().then(r => {
      if (r.success) setServices(r.data);
    }).catch(() => {}).finally(() => setLoadingServices(false));
  }, []);

  const handleServiceSelect = async (serviceKey: string) => {
    if (serviceKey === 'Lab Test') {
      if (!authService.isAuthenticated()) { toast.info('Please sign in first.'); navigate('/login'); return; }
      navigate('/medical/lab-test');
      return;
    }
    setSelectedService(serviceKey);
    setLoadingSchedule(true);
    try {
      const r = await doctorService.getScheduleByService(serviceKey);
      if (r.success) setServiceSchedule(r.data);
    } catch { toast.error('Failed to load schedule'); }
    finally { setLoadingSchedule(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-updated'));
    setUser(null);
    navigate('/');
  };

  const handleAmbulanceCall = () => {
    if (window.confirm("Are you sure you want to call Ambulance?")) {
      toast.info('Calling Ambulance...', { description: 'Connecting to 102 - Ambulance Service' });
      window.location.href = 'tel:102';
    }
  };

  const isComingSoon = (serviceKey: string) => {
    const svc = services.find(s => s.specialization === serviceKey);
    return svc?.is_coming_soon;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">SafeSpace</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/safety" className="text-gray-700 hover:text-blue-600 transition-colors">Safety Hub</Link>
              <Link to="/wellness" className="text-gray-700 hover:text-blue-600 transition-colors">Wellness Hub</Link>
              <Link to="/resources" className="text-gray-700 hover:text-blue-600 transition-colors">Resources</Link>
              <Link to="/security" className="text-gray-700 hover:text-blue-600 transition-colors">Security</Link>
              <Link to="/feedback" className="text-gray-700 hover:text-blue-600 transition-colors">Feedback & Reports</Link>
              <Link to="/medical/my-appointments" className="text-gray-700 hover:text-blue-600 transition-colors">My Appointments</Link>
              <Link to="/medical/records" className="text-gray-700 hover:text-blue-600 transition-colors">Medical Records</Link>
              <Link to="/profile" className="text-gray-700 hover:text-blue-600 transition-colors">Profile</Link>
              {user ? (
                <div className="flex items-center space-x-4 ml-4">
                  <Link to="/profile" className="flex items-center space-x-2 hover:opacity-80">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profile_picture} alt={user.first_name} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">{user.first_name?.[0]}{user.last_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</span>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3 ml-4">
                  <Link to="/login"><Button variant="outline" size="sm">Login</Button></Link>
                  <Link to="/register"><Button size="sm" className="bg-blue-600 hover:bg-blue-700">Sign Up</Button></Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="px-4 pb-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-r from-white via-blue-50 to-emerald-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-blue-700 shadow-sm"><ShieldPlus className="h-4 w-4" />New in SafeSpace</div>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">Pharmacy & Medical Records</h2>
                <p className="mt-2 text-slate-600">Store allergies, chronic conditions, medicines, refill reminders, prescriptions, and preferred pharmacies in one calming, privacy-focused place.</p>
              </div>
              <Link to="/medical/records"><Button className="bg-blue-600 hover:bg-blue-700"><Pill className="mr-2 h-4 w-4" />Open Records</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          {user && (
            <div className="mb-6 inline-block">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-3">
                <p className="text-lg text-blue-900">👋 Welcome back, <span className="font-bold">{user.first_name}!</span></p>
              </div>
            </div>
          )}
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Your Safety & Wellness<span className="block text-blue-600">Matters</span></h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">SafeSpace is your comprehensive platform for student safety, mental health support, and wellness resources. Get help when you need it, access professional support, and prioritize your well-being.</p>
          <div className="flex justify-center mt-10">
            <button onClick={handleAmbulanceCall} className="group relative flex flex-col items-center justify-center w-64 h-64 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-[0_0_50px_rgba(220,38,38,0.5)] hover:shadow-[0_0_70px_rgba(220,38,38,0.8)] transition-all duration-300 transform hover:-translate-y-1" aria-label="Call Ambulance 102">
              <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20 group-hover:opacity-40"></div>
              <Ambulance className="h-20 w-20 mb-3 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-black tracking-tighter">CALL AMBULANCE</span>
              <span className="text-sm font-bold mt-1 opacity-80 uppercase tracking-widest">Tap to Dial 102</span>
            </button>
          </div>
        </div>

        <BulletinBoard />

        {/* Quick Access Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Link to="/wellness" className="group"><Card className="h-full hover:shadow-lg transition-shadow cursor-pointer"><CardHeader className="text-center"><Heart className="h-12 w-12 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" /><CardTitle>Stress Relief</CardTitle><CardDescription>Guided breathing & mindfulness</CardDescription></CardHeader></Card></Link>
          <Link to="/self_guidance" className="group"><Card className="h-full hover:shadow-lg transition-shadow cursor-pointer"><CardHeader className="text-center"><BookOpen className="h-12 w-12 text-green-600 mx-auto mb-4 group-hover:scale-110 transition-transform" /><CardTitle>Self-Help Guides</CardTitle><CardDescription>Educational resources & tips</CardDescription></CardHeader></Card></Link>
          <Link to="/resources" className="group"><Card className="h-full hover:shadow-lg transition-shadow cursor-pointer"><CardHeader className="text-center"><User className="h-12 w-12 text-purple-600 mx-auto mb-4 group-hover:scale-110 transition-transform" /><CardTitle>Counseling Session</CardTitle><CardDescription>Book professional support</CardDescription></CardHeader></Card></Link>
          <Link to="/security" className="group"><Card className="h-full hover:shadow-lg transition-shadow cursor-pointer"><CardHeader className="text-center"><Phone className="h-12 w-12 text-red-600 mx-auto mb-4 group-hover:scale-110 transition-transform" /><CardTitle>Crisis Helpline</CardTitle><CardDescription>24/7 emergency contacts</CardDescription></CardHeader></Card></Link>
        </div>

        {/* Pharmacy Timings */}
        <div className="mb-16">
          <Card className="border-blue-50 bg-white/80 backdrop-blur-md shadow-xl rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="bg-blue-600/10 p-6 rounded-3xl"><Activity className="h-12 w-12 text-blue-600" /></div>
                <div><h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Campus Pharmacy</h2><p className="text-slate-500 font-medium text-lg">Medicine and essential health services at your fingertips</p></div>
                <div className="flex flex-col md:flex-row items-center gap-6 mt-4">
                  <div className="bg-slate-50 border border-slate-100 px-8 py-4 rounded-2xl">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Operating Hours</div>
                    <div className="text-2xl font-black text-slate-900">8:00 AM – 8:00 PM</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Open Daily for Students</div>
                  </div>
                  {(() => { const h = new Date().getHours(); const isOpen = h >= 8 && h < 20; return (<div className={`px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg inline-flex items-center gap-2 text-white transition-all ${isOpen ? "bg-green-500 hover:bg-green-600 shadow-green-100" : "bg-red-500 hover:bg-red-600 shadow-red-100"}`}><Clock className="h-4 w-4" />{isOpen ? "Open Now" : "Closed"}</div>); })()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medical Centre Services */}
        <Card className="mb-16 border-blue-100 bg-white/50 backdrop-blur-sm shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-white/80 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200"><Stethoscope className="h-8 w-8 text-white" /></div>
                <div>
                  <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">Medical Centre Services</CardTitle>
                  <CardDescription className="font-medium text-lg mt-1">Choose a service to view available doctors & dates</CardDescription>
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20 border rounded-2xl font-bold backdrop-blur-md" onClick={() => navigate('/medical/queue')}><Activity className="h-4 w-4 mr-2" />Today's Live Queue</Button>
                <div className="bg-green-500/20 text-green-300 px-4 py-3 rounded-2xl flex items-center gap-3 border border-green-500/30"><Activity className="h-5 w-5 animate-pulse" /><span className="text-xs font-black uppercase tracking-widest leading-none">Live</span></div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {/* Service Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {SERVICE_CONFIG.map(svc => {
                const c = COLOR_MAP[svc.color];
                const comingSoon = isComingSoon(svc.key);
                const isSelected = selectedService === svc.key;
                return (
                  <button key={svc.key} onClick={() => handleServiceSelect(svc.key)} className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-300 hover:shadow-lg ${isSelected ? `${c.border} ${c.light} shadow-md scale-[1.02]` : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                    {comingSoon && <Badge className="absolute top-3 right-3 bg-amber-100 text-amber-700 border-amber-200 text-[9px] font-black">COMING SOON</Badge>}
                    <div className={`${c.bg} p-3 rounded-xl w-fit text-white mb-3`}><svc.icon className="h-6 w-6" /></div>
                    <h3 className="font-bold text-slate-900 text-lg">{svc.key}</h3>
                    <p className="text-sm text-slate-500 mt-1">{svc.desc}</p>
                    {isSelected && <ChevronRight className={`absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 ${c.text}`} />}
                  </button>
                );
              })}
            </div>

            {/* Schedule for selected service */}
            {selectedService && selectedService !== 'Lab Test' && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-slate-900">Available Dates — {selectedService}</h3>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedService(null); setServiceSchedule([]); }}><X className="h-4 w-4" /></Button>
                </div>
                {loadingSchedule ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                ) : serviceSchedule.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">No available dates for this service.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {serviceSchedule.map((slot, i) => {
                      const cfg = SERVICE_CONFIG.find(s => s.key === selectedService);
                      const c = COLOR_MAP[cfg?.color || 'blue'];
                      const isToday = slot.date === new Date().toISOString().split('T')[0];
                      return (
                        <Card key={i} className={`group relative overflow-hidden transition-all duration-300 border-2 ${isToday ? `${c.border} shadow-lg scale-[1.02]` : slot.bookable ? 'border-gray-100 hover:border-gray-200 hover:shadow-md' : 'border-gray-50 opacity-60'}`}>
                          {isToday && <div className={`absolute top-0 left-0 right-0 h-1.5 ${c.bg}`} />}
                          <div className="p-5">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className={`text-xs font-black uppercase tracking-widest ${isToday ? c.text : 'text-slate-400'}`}>{slot.display_date} {isToday && '• TODAY'}</div>
                              </div>
                              {slot.is_coming_soon ? (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] font-black">COMING SOON</Badge>
                              ) : slot.is_past ? (
                                <Badge className="bg-gray-100 text-gray-400 text-[9px] font-black">PAST</Badge>
                              ) : (
                                <Badge className={`${slot.slots_left > 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'} text-[9px] font-black`}>{slot.slots_left > 0 ? 'AVAILABLE' : 'FULL'}</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-lg ${c.light} ${c.text}`}><User className="h-4 w-4" /></div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm">{slot.doctor_name}</div>
                                <div className="text-[10px] text-slate-400 font-bold">{slot.cabin_number} • {slot.timings}</div>
                              </div>
                            </div>
                            <Button className={`w-full rounded-xl font-bold text-xs py-5 ${slot.bookable ? `${c.bg} text-white hover:opacity-90` : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`} disabled={!slot.bookable} onClick={() => {
                              if (!authService.isAuthenticated()) { toast.info('Please sign in to book.'); navigate('/login'); return; }
                              navigate('/medical/book-appointment', { state: { doctor: slot } });
                            }}>
                              {slot.is_coming_soon ? 'Coming Soon' : slot.is_past ? 'Past Date' : slot.slots_left <= 0 ? 'Slots Full' : 'Book Appointment'}
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card><CardHeader><CardTitle className="flex items-center space-x-2"><Shield className="h-6 w-6 text-blue-600" /><span>Safety Features</span></CardTitle></CardHeader><CardContent><ul className="space-y-2 text-gray-600"><li>• Campus security directory</li></ul></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center space-x-2"><Heart className="h-6 w-6 text-green-600" /><span>Wellness Tools</span></CardTitle></CardHeader><CardContent><ul className="space-y-2 text-gray-600"><li>• Daily mood tracking & journaling</li><li>• Guided breathing exercises</li><li>• Mindfulness & meditation sessions</li><li>• Sleep tips & healthy routines</li><li>• Positive affirmations & coping strategies</li></ul></CardContent></Card>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4"><Shield className="h-6 w-6" /><span className="text-xl font-bold">SafeSpace</span></div>
          <p className="text-gray-400">Your safety and wellness matter. We're here to help, 24/7.</p>
        </div>
      </footer>
    </div>
  );
}
