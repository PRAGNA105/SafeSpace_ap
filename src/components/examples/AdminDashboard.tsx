import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { adminService, appointmentService } from '@/lib/services';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  hostel?: string;
  oauth_provider?: string;
  oauth_profile_image?: string;
  introduction?: string;
  preferences?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  total_interactions: number;
  sos_alerts_count: number;
  created_at: string;
  updated_at: string;
}

interface UserDetail {
  user: User;
  sos_alerts: any[];
  sos_alerts_count: number;
  trusted_contacts: any[];
  medical_profile?: any;
  medicine_records?: any[];
  appointments?: any[];
}

export default function AdminDashboard() {
  const [adminToken, setAdminToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('users');
  const [queue, setQueue] = useState<any[]>([]);

  // Auto-refresh effect - refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    loadDashboard();
    
    const refreshInterval = setInterval(() => {
      loadDashboard();
      setLastUpdate(new Date());
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(refreshInterval);
  }, [autoRefresh]);

  // Load dashboard data
  const loadDashboard = async () => {
    setIsLoading(true);
    console.log('🔵 Loading admin dashboard...');
    try {
      const [summaryRes, usersRes, queueRes] = await Promise.all([
        adminService.getDashboardSummary(),
        adminService.getAllUsers(),
        appointmentService.getAllAdmin(),
      ]);

      if (summaryRes.success) {
        setSummary(summaryRes.summary);
      }
      
      if (usersRes.success) {
        setUsers(usersRes.data);
      }

      if (queueRes.success) {
        // Filter out completed and cancelled naturally for the main queue view
        const activeQueue = queueRes.data.filter((q: any) => q.status === 'Confirmed' || q.status === 'Pending');
        
        // Sort by priority (1 is highest) and then by creation time
        activeQueue.sort((a: any, b: any) => {
           if (a.priority_level !== b.priority_level) {
               return a.priority_level - b.priority_level;
           }
           return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        setQueue(activeQueue);
      }
    } catch (err: any) {
      console.error('❌ Dashboard load error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load user details
  const loadUserDetails = async (userId: number) => {
    setIsLoading(true);
    try {
      const res = await adminService.getUserDetails(userId);
      if (res.success) {
        setSelectedUser(res);
        setActiveTab('user-detail');
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAppointment = async (id: number, status: string) => {
    try {
      const res = await appointmentService.updateStatus(id, status);
      if (res.success) {
        loadDashboard(); // Refresh queue immediately
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Main dashboard
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">SafeSpace Admin Dashboard</h1>
            <p className="text-gray-600">Monitor users and their interactions</p>
            {autoRefresh && (
              <p className="text-xs text-green-600 mt-1">
                🟢 Auto-refreshing • Last update: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              size="sm"
            >
              {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                loadDashboard();
                setLastUpdate(new Date());
              }}
              size="sm"
            >
              🔄 Refresh Now
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAuthenticated(false);
                setAdminToken('');
              }}
            >
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_users}</div>
                <p className="text-xs text-gray-500">Active today: {summary.active_users_today}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Trusted Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.users_with_contacts || 0}</div>
                <p className="text-xs text-gray-500">{summary.total_contacts || 0} contacts total</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="user-detail">User Details</TabsTrigger>
            <TabsTrigger value="activity">Activity Feed</TabsTrigger>
            <TabsTrigger value="queue">Queue Management</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>View all registered users and their activities</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No users found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Auth Method</TableHead>
                          <TableHead>Interactions</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {user.oauth_profile_image && (
                                  <img 
                                    src={user.oauth_profile_image} 
                                    alt={user.first_name}
                                    className="w-6 h-6 rounded-full"
                                  />
                                )}
                                {user.first_name} {user.last_name}
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.oauth_provider ? (
                                <Badge variant="secondary">
                                  <img 
                                    src="https://www.google.com/favicon.ico" 
                                    alt="Google" 
                                    className="w-3 h-3 mr-1"
                                  />
                                  {user.oauth_provider}
                                </Badge>
                              ) : (
                                <Badge variant="outline">Email</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">{user.total_interactions || 0}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadUserDetails(user.id)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Detail Tab */}
          <TabsContent value="user-detail">
            <Card>
              <CardHeader>
                <CardTitle>User Details & Interactions</CardTitle>
                <CardDescription>
                  {selectedUser
                    ? `${selectedUser.user.email} - ${selectedUser.sos_alerts_count} SOS alerts`
                    : 'Select a user from the Users tab to view details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedUser ? (
                  <Tabs defaultValue="info" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="info">User Info</TabsTrigger>
                      <TabsTrigger value="contacts">Trusted Contacts</TabsTrigger>
                      <TabsTrigger value="medical">Medical Profile & History</TabsTrigger>
                      <TabsTrigger value="appointments">Appointments</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="space-y-4">
                      {selectedUser.user.oauth_profile_image && (
                        <div className="flex items-center gap-4 pb-4 border-b">
                          <img 
                            src={selectedUser.user.oauth_profile_image} 
                            alt={`${selectedUser.user.first_name} ${selectedUser.user.last_name}`}
                            className="w-20 h-20 rounded-full border-2 border-blue-500"
                          />
                          <div>
                            <h3 className="text-xl font-bold">
                              {selectedUser.user.first_name} {selectedUser.user.last_name}
                            </h3>
                            <p className="text-gray-600">{selectedUser.user.email}</p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{selectedUser.user.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium">
                            {selectedUser.user.first_name} {selectedUser.user.last_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{selectedUser.user.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Member Since</p>
                          <p className="font-medium">
                            {new Date(selectedUser.user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">Activity Statistics</h3>
                        <div className="p-3 bg-blue-50 rounded">
                          <p className="text-sm text-gray-600">Total Interactions</p>
                          <p className="text-2xl font-bold">{selectedUser.user.total_interactions || 0}</p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="contacts">
                      {selectedUser.trusted_contacts.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No trusted contacts</div>
                      ) : (
                        <div className="space-y-3">
                          {selectedUser.trusted_contacts.map((contact: any, idx: number) => (
                            <div key={idx} className="p-3 border rounded">
                              <p className="font-semibold">{contact.name}</p>
                              <p className="text-sm text-gray-600">{contact.email}</p>
                              <p className="text-sm text-gray-600">{contact.phone}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="medical" className="space-y-4">
                      {!selectedUser.medical_profile ? (
                        <div className="text-center py-4 text-gray-500">No medical profile configured</div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                              <p className="text-sm text-gray-600">Blood Group</p>
                              <p className="font-medium text-red-600 font-bold">{selectedUser.medical_profile.blood_group || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Emergency Contact</p>
                              <p className="font-medium">{selectedUser.medical_profile.emergency_contact_name || 'N/A'}</p>
                              <p className="text-sm text-gray-500">{selectedUser.medical_profile.emergency_contact_phone}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Allergies</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedUser.medical_profile.allergies?.length ? selectedUser.medical_profile.allergies.map((a: string, i: number) => (
                                  <Badge key={i} variant="destructive">{a}</Badge>
                                )) : <span className="text-sm text-gray-400">None</span>}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Chronic Conditions</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedUser.medical_profile.chronic_conditions?.length ? selectedUser.medical_profile.chronic_conditions.map((c: string, i: number) => (
                                  <Badge key={i} variant="secondary">{c}</Badge>
                                )) : <span className="text-sm text-gray-400">None</span>}
                              </div>
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <h3 className="font-semibold mb-3">Medicine History</h3>
                            {!selectedUser.medicine_records || selectedUser.medicine_records.length === 0 ? (
                              <p className="text-sm text-gray-500 italic">No medicines recorded.</p>
                            ) : (
                              <div className="space-y-2">
                                {selectedUser.medicine_records.map((med: any) => (
                                  <div key={med.id} className="p-3 border rounded-lg bg-white flex justify-between items-center">
                                    <div>
                                      <p className="font-bold text-blue-700">{med.name} <span className="text-sm text-gray-500 font-normal">({med.dosage})</span></p>
                                      <p className="text-xs text-gray-600 mt-1">
                                        Frequency: {med.frequency} | Status: <Badge variant={med.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{med.status}</Badge>
                                      </p>
                                    </div>
                                    <div className="text-right text-xs text-gray-500">
                                      <p>From: {new Date(med.start_date || '').toLocaleDateString()}</p>
                                      {med.end_date && <p>To: {new Date(med.end_date).toLocaleDateString()}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </TabsContent>

                    <TabsContent value="appointments" className="space-y-4">
                      {!selectedUser.appointments || selectedUser.appointments.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No appointments found.</div>
                      ) : (
                        <div className="space-y-3">
                          {selectedUser.appointments.map((apt: any) => (
                            <div key={apt.id} className="p-4 border rounded-lg bg-white">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-bold text-lg">{apt.doctor_name}</p>
                                  <p className="text-sm text-gray-600">{apt.specialization}</p>
                                </div>
                                <Badge variant={apt.status === 'Confirmed' ? 'default' : apt.status === 'Cancelled' ? 'destructive' : 'secondary'}>
                                  {apt.status}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 mt-3 text-sm bg-gray-50 p-2 rounded">
                                <div>
                                  <p className="text-gray-500 text-xs">Category</p>
                                  <p className="font-medium">{apt.purpose_category || apt.purpose || 'General'}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Priority</p>
                                  <p className="font-medium">Level {apt.priority_level || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Day</p>
                                  <p className="font-medium">{apt.appointment_day}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Token #</p>
                                  <p className="font-medium">{apt.token_number || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select a user from the Users tab to view details
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Real-Time Activity Feed</CardTitle>
                <CardDescription>Live stream of user interactions across SafeSpace</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.slice(0, 10).map((user) => (
                    <div key={user.id} className="p-4 border rounded-lg hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {user.oauth_profile_image && (
                            <img 
                              src={user.oauth_profile_image} 
                              alt={user.first_name}
                              className="w-10 h-10 rounded-full"
                            />
                          )}
                          <div>
                            <p className="font-semibold">{user.first_name} {user.last_name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className="flex gap-2 mt-2">
                              {user.sos_alerts_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  🚨 {user.sos_alerts_count} SOS
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                📊 {user.total_interactions || 0} interactions
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>Joined {new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Safety Network Insights</CardTitle>
                  <CardDescription>Trusted contacts and safety feature adoption</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Users with Contacts</p>
                      <p className="text-3xl font-bold">{summary?.users_with_contacts || 0}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Contacts Configured</p>
                      <p className="text-3xl font-bold">{summary?.total_contacts || 0}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Safety Alerts</p>
                      <p className="text-3xl font-bold">{summary?.total_sos_alerts || 0}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3">Recommendations</h3>
                    <div className="space-y-2">
                      {summary && summary.users_with_contacts / summary.total_users < 0.5 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm font-medium text-yellow-800">⚠️ Low Trusted Contacts Adoption</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Adoption rate is below 50%. Consider encouraging users to set up trusted contacts.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="queue">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-900">Live Scheduling Queue</CardTitle>
                <CardDescription>Manage active waiting list patients dynamically assigned by urgency priority.</CardDescription>
              </CardHeader>
              <CardContent>
                {queue.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    No active patients in the queue.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {queue.map((apt: any) => (
                      <div key={apt.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
                        <div className="flex-1 flex gap-4 w-full items-center">
                          <div className={`flex items-center justify-center h-14 w-14 rounded-full font-bold text-xl ${
                             apt.priority_level === 1 ? 'bg-red-100 text-red-600 border-2 border-red-500' :
                             apt.priority_level === 2 ? 'bg-orange-100 text-orange-600 border border-orange-400' :
                             'bg-blue-100 text-blue-600'
                          }`}>
                            #{apt.token_number || '-'}
                          </div>
                          <div>
                            <p className="font-bold text-lg">{apt.student_name} <span className="text-sm font-normal text-gray-500 tracking-tight">({apt.appointment_day})</span></p>
                            <p className="text-sm text-gray-600 font-medium">To see: <Badge variant="outline">{apt.doctor_name}</Badge></p>
                            <div className="flex gap-2 mt-2 flex-wrap items-center">
                              {apt.priority_level === 1 && <Badge variant="destructive" className="animate-pulse">URGENT</Badge>}
                              <Badge variant="secondary">{apt.purpose_category || apt.purpose || 'General'}</Badge>
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md ml-2 border border-blue-100 flex items-center">
                                📅 Booked: {new Date(apt.created_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center">Waited: {Math.floor((new Date().getTime() - new Date(apt.created_at).getTime()) / 60000)} mins</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4 md:mt-0">
                          <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateAppointment(apt.id, 'Completed')}>
                            Send Patient In ✓
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleUpdateAppointment(apt.id, 'Cancelled')}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
