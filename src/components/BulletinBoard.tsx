import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, Activity, ShieldAlert, Megaphone, CheckCircle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { announcementService } from '@/lib/services';

export default function BulletinBoard() {
  const [filter, setFilter] = useState('all');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await announcementService.getAll();
        if (response.success) {
          setAnnouncements(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const filteredAnnouncements = announcements.filter(a => filter === 'all' ? true : a.category === filter);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 mt-8">
      <Card className="border-blue-100 shadow-lg bg-white overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-6 border-b border-blue-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Megaphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Live Announcements</CardTitle>
                <CardDescription className="text-gray-500 font-medium">
                  Real-time notices and critical alerts
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <Button 
                variant={filter === 'all' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                All
              </Button>
              <Button 
                variant={filter === 'health' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('health')}
                className={filter === 'health' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800' : 'text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50'}
              >
                <Activity className="h-4 w-4 mr-1.5" />
                Health
              </Button>
              <Button 
                variant={filter === 'safety' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('safety')}
                className={filter === 'safety' ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:text-orange-800' : 'text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50'}
              >
                <ShieldAlert className="h-4 w-4 mr-1.5" />
                Safety
              </Button>
              <Button 
                variant={filter === 'general' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('general')}
                className={filter === 'general' ? 'bg-gray-100 text-gray-800 border-gray-300' : 'text-gray-600 hover:text-gray-800 border-gray-200'}
              >
                <FileText className="h-4 w-4 mr-1.5" />
                General updates
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">Fetching live alerts...</p>
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No announcements in this category.
              </div>
            ) : (
              filteredAnnouncements.map((announcement) => (
                <div 
                  key={announcement.id} 
                  className={`p-6 flex flex-col sm:flex-row gap-4 transition-colors hover:bg-gray-50
                    ${announcement.urgent ? 'bg-red-50/50 hover:bg-red-50' : ''}
                  `}
                >
                  <div className="flex-shrink-0 mt-1">
                    {announcement.urgent ? (
                      <AlertCircle className="h-8 w-8 text-red-600 animate-pulse" />
                    ) : announcement.category === 'health' ? (
                      <Activity className="h-8 w-8 text-green-600" />
                    ) : announcement.category === 'safety' ? (
                      <ShieldAlert className="h-8 w-8 text-orange-500" />
                    ) : (
                      <CheckCircle className="h-8 w-8 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h4 className={`text-lg font-bold ${announcement.urgent ? 'text-red-700' : 'text-gray-900'}`}>
                        {announcement.title}
                      </h4>
                      <div className="flex items-center gap-2">
                          {announcement.urgent && (
                          <Badge variant="destructive" className="bg-red-600 animate-pulse font-bold tracking-widest text-[10px] uppercase">
                            URGENT
                          </Badge>
                        )}
                        <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm leading-relaxed ${announcement.urgent ? 'text-red-900/80 font-medium' : 'text-gray-600'}`}>
                      {announcement.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
