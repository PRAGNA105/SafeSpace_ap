import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { syncAuthStorage } from '@/lib/api';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import SafetyHub from './pages/SafetyHub';
import WellnessHub from './pages/WellnessHub';
import Resources from './pages/Resources';
import SecurityDirectory from './pages/SecurityDirectory';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import MedicalWaitlist from "./pages/MedicalWaitlist";
import BookAppointment from "./pages/BookAppointment";
import MyAppointments from "./pages/MyAppointments";
import AdminAppointments from "./pages/AdminAppointments";
import QueueDashboard from "./pages/QueueDashboard";
import SelfHelpGuides from './pages/self_help_guides';
import NotFound from './pages/NotFound';
import FeedbackReport from './pages/FeedbackReport';
import MedicalRecords from './pages/MedicalRecords';
import ChatbotAssistant from './components/ChatbotAssistant';
import LabTestBooking from './pages/LabTestBooking';

const queryClient = new QueryClient();

function AuthStorageSync() {
  useEffect(() => {
    syncAuthStorage();
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthStorageSync />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/safety" element={<SafetyHub />} />
          <Route path="/wellness" element={<WellnessHub />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/self_guidance" element={<SelfHelpGuides />} />
          <Route path="/security" element={<SecurityDirectory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/medical/waitlist" element={<MedicalWaitlist />} />
          <Route path="/medical/book-appointment" element={<BookAppointment />} />
          <Route path="/medical/my-appointments" element={<MyAppointments />} />
          <Route path="/medical/queue" element={<QueueDashboard />} />
          <Route path="/admin/appointments" element={<AdminAppointments />} />
          <Route path="/feedback" element={<FeedbackReport />} />
          <Route path="/medical/records" element={<MedicalRecords />} />
          <Route path="/medical/lab-test" element={<LabTestBooking />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        {/* Chatbot Assistant - Available on all pages */}
        <ChatbotAssistant />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
