import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, MessageSquare, AlertTriangle, Lightbulb, CheckCircle2, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { feedbackService, authService } from '@/lib/services';
import { useEffect } from 'react';

export default function FeedbackReport() {
  const [reportType, setReportType] = useState('feedback');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    if (!authService.isAuthenticated()) return;
    try {
      const response = await feedbackService.getMyReports();
      if (response.success) {
        setSubmissions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await feedbackService.submit({
        type: reportType,
        title,
        description,
        is_anonymous: isAnonymous
      });

      if (response.success) {
        toast.success('Submitted successfully', {
          description: `Your ${reportType} has been recorded (Tracking ID: ${response.tracking_id})`
        });
        setTitle('');
        setDescription('');
        fetchReports(); // Refresh list
      } else {
        toast.error(response.message || 'Failed to submit');
      }
    } catch (error) {
      toast.error('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feedback': return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'report': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'suggestion': return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      default: return <MessageSquare className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-orange-100 text-orange-800';
      case 'Reviewed': return 'bg-green-100 text-green-800';
      case 'Resolved': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-gray-600 hover:text-blue-600 transition-colors" />
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">SafeSpace</span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Feedback & Reporting System</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Voice Matters</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Help us improve our campus environment. Submit suggestions, report hazards, or provide feedback securely and anonymously.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Submission Form */}
          <Card className="lg:col-span-2 shadow-sm border-slate-200">
            <CardHeader className="border-b bg-white border-slate-100">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-blue-600" />
                Submit a Report
              </CardTitle>
              <CardDescription className="text-gray-500">
                All submissions are encrypted and reviewed by the appropriate department.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="type" className="font-semibold text-gray-700">Submission Type</Label>
                  <Select value={reportType} onValueChange={(val) => setReportType(val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feedback">General Feedback</SelectItem>
                      <SelectItem value="report">Hazard / Incident Report</SelectItem>
                      <SelectItem value="suggestion">Improvement Suggestion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-semibold text-gray-700">Title / Location</Label>
                  <Input 
                    id="title" 
                    placeholder="E.g., Broken pipe in Science Building Restroom" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-semibold text-gray-700">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Provide as many details as possible..." 
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center h-5">
                    <input
                      id="anonymous"
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="anonymous" className="font-semibold text-gray-900 cursor-pointer text-base">Submit Anonymously</Label>
                    <p className="text-sm text-gray-500 mt-1">If checked, your personal information will not be attached to this submission. Tracking will only be available on this device.</p>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 h-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    "Submit Report securely"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Status Tracker */}
          <div className="space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  My Submissions
                </CardTitle>
                <CardDescription>
                  Track the status of your recent reports
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {submissions.map((sub, index) => (
                    <div key={index} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                           {getTypeIcon(sub.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{sub.tracking_id}</span>
                            <Badge className={`${getStatusColor(sub.status)} text-[10px] font-bold px-2 py-0.5 border-0 bg-opacity-20`}>{sub.status}</Badge>
                          </div>
                          <h4 className="font-semibold text-slate-800 text-sm leading-tight mb-2">{sub.title}</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">{new Date(sub.created_at).toLocaleDateString()}</span>
                            {sub.anonymous && (
                              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium flex items-center gap-1">
                                <Shield className="h-3 w-3" /> Anonymous
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-md">
              <CardContent className="p-6">
                <Shield className="h-8 w-8 text-blue-200 mb-4" />
                <h3 className="font-bold text-xl mb-2">Emergency?</h3>
                <p className="text-blue-100 text-sm mb-4 leading-relaxed">
                  For immediate assistance or life-threatening situations, do not use this form. Please contact campus security or emergency services directly.
                </p>
                <Link to="/security">
                  <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
                    <LinkIcon className="h-4 w-4 mr-2" /> View Emergency Contacts
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
