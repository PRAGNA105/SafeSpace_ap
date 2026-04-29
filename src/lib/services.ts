import { apiCall, setAuthToken, clearAuthToken, getAuthToken } from './api';

// Auth Service
export const authService = {
  register: async (email: string, password: string, firstName: string, lastName?: string, phone?: string) => {
    const response = await apiCall('auth.php?action=register', {
      method: 'POST',
      body: { email, password, first_name: firstName, last_name: lastName, phone },
      requiresAuth: false,
    });

    if (response.success && response.token) {
      setAuthToken(response.token);
    }

    return response;
  },

  login: async (email: string, password: string) => {
    const response = await apiCall('auth.php?action=login', {
      method: 'POST',
      body: { email, password },
      requiresAuth: false,
    });

    if (response.success && response.token) {
      setAuthToken(response.token);
    }

    return response;
  },

  logout: async () => {
    try {
      await apiCall('auth.php?action=logout', {
        method: 'POST',
      });
    } finally {
      clearAuthToken();
    }
  },

  isAuthenticated: () => {
    return getAuthToken() !== null;
  },
};

// User Service
export const userService = {
  getProfile: async () => {
    return apiCall('user.php?action=profile', { method: 'GET' });
  },

  updateProfile: async (data: Record<string, any>) => {
    return apiCall('user.php?action=update', {
      method: 'POST',
      body: data,
    });
  },

  addTrustedContact: async (contactName: string, contactEmail: string, contactPhone?: string) => {
    return apiCall('user.php?action=add-contact', {
      method: 'POST',
      body: { contact_name: contactName, contact_email: contactEmail, contact_phone: contactPhone },
    });
  },

  getTrustedContacts: async () => {
    return apiCall('user.php?action=trusted-contacts', { method: 'GET' });
  },

  // Track user activity (heartbeat)
  updateLastActive: async () => {
    return apiCall('user.php?action=heartbeat', {
      method: 'POST',
      body: {},
    });
  },
};

// Feedback Service
export const feedbackService = {
  submit: async (data: { type: string; title: string; description: string; is_anonymous: boolean }) => {
    return apiCall('feedback.php?action=submit', {
      method: 'POST',
      body: data,
    });
  },

  getMyReports: async () => {
    return apiCall('feedback.php?action=my_reports', { method: 'GET' });
  },
};

// Announcement Service
export const announcementService = {
  getAll: async () => {
    return apiCall('announcements.php', {
      method: 'GET',
      requiresAuth: false,
    });
  },
};


// Admin Service
export const adminService = {
  // Get all users with their stats
  getAllUsers: async () => {
    return apiCall('admin.php?action=all-users', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  // Get specific user's details and all interactions
  getUserDetails: async (userId: number) => {
    return apiCall(`admin.php?action=user-details&user_id=${userId}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  // Dashboard activity timeline for a user
  getUserActivity: async (userId: number, limit: number = 50) => {
    return apiCall(`admin.php?action=user-activity&user_id=${userId}&limit=${limit}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  // Get dashboard summary
  getDashboardSummary: async () => {
    return apiCall('admin.php?action=dashboard-summary', {
      method: 'GET',
      requiresAuth: true,
    });
  },
};

// Doctor Service
export const doctorService = {
  getSchedule: async () => {
    return apiCall('doctors.php?action=get-schedule', {
      method: 'GET',
      requiresAuth: false,
    });
  },

  getServices: async () => {
    return apiCall('doctors.php?action=get-services', {
      method: 'GET',
      requiresAuth: false,
    });
  },

  getScheduleByService: async (service: string) => {
    return apiCall(`doctors.php?action=get-schedule-by-service&service=${encodeURIComponent(service)}`, {
      method: 'GET',
      requiresAuth: false,
    });
  },

  updateStatus: async (id: number, status: 'Available' | 'Busy' | 'Offline') => {
    return apiCall('doctors.php?action=update-status', {
      method: 'POST',
      body: { id, status },
      requiresAuth: false,
    });
  },
};

// Waiting List Service
export const waitingListService = {
  join: async (doctorId: number, purposeCategory: string, purposeDetail: string, priorityLevel: number, customReason?: string) => {
    return apiCall('waiting_list.php?action=join', {
      method: 'POST',
      body: { 
        doctor_id: doctorId, 
        purpose_category: purposeCategory, 
        purpose_detail: purposeDetail, 
        priority_level: priorityLevel,
        custom_reason: customReason
      },
    });
  },

  getStatus: async () => {
    return apiCall('waiting_list.php?action=status', {
      method: 'GET',
    });
  },

  async getAllAdmin() {
    return apiCall('waiting_list.php?action=admin_all', {
      method: 'GET',
      requiresAuth: true,
    });
  }
};

// Appointment Service
export const appointmentService = {
  async create(data: any) {
    return apiCall('appointments.php?action=create', {
      method: 'POST',
      body: data,
      requiresAuth: true,
    });
  },

  async getMyAppointments() {
    return apiCall('appointments.php?action=my', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  async getAllAdmin(filter: 'all' | 'today' | 'upcoming' | 'past' = 'all') {
    return apiCall(`appointments.php?action=admin_all&filter=${filter}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  async getTodayQueue() {
    return apiCall('appointments.php?action=today_queue', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  async updateStatus(id: number, status: string) {
    return apiCall('appointments.php?action=update_status', {
      method: 'PUT',
      body: { id, status },
      requiresAuth: true,
    });
  }
};

export const queueService = {
  async getStatus(doctorId?: number) {
    const url = doctorId
      ? `queue.php?action=status&doctor_id=${doctorId}`
      : `queue.php?action=status`;
    return apiCall(url, { method: 'GET' });
  }
};

// Lab Test Service
export const labTestService = {
  async create(data: any) {
    return apiCall('lab_tests.php?action=create', {
      method: 'POST',
      body: data,
      requiresAuth: true,
    });
  },

  async getMyRequests() {
    return apiCall('lab_tests.php?action=my', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  async getAllAdmin(status?: string) {
    const url = status
      ? `lab_tests.php?action=admin_all&status=${status}`
      : 'lab_tests.php?action=admin_all';
    return apiCall(url, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  async updateStatus(id: number, data: any) {
    return apiCall('lab_tests.php?action=update', {
      method: 'PUT',
      body: { id, ...data },
      requiresAuth: true,
    });
  },
};

export const medicalRecordsService = {
  getDashboard: async () => {
    return apiCall('medical_records.php?action=dashboard', { method: 'GET', requiresAuth: true });
  },

  getProfile: async () => {
    return apiCall('medical_records.php?action=profile', { method: 'GET', requiresAuth: true });
  },

  saveProfile: async (data: Record<string, any>) => {
    return apiCall('medical_records.php?action=profile', {
      method: 'POST',
      body: data,
      requiresAuth: true,
    });
  },

  getMedicines: async () => {
    return apiCall('medical_records.php?action=medicines', { method: 'GET', requiresAuth: true });
  },

  saveMedicine: async (data: Record<string, any>) => {
    return apiCall('medical_records.php?action=medicine', {
      method: 'POST',
      body: data,
      requiresAuth: true,
    });
  },

  deleteMedicine: async (id: number) => {
    return apiCall('medical_records.php?action=medicine-delete', {
      method: 'POST',
      body: { id },
      requiresAuth: true,
    });
  },

  getPharmacies: async () => {
    return apiCall('medical_records.php?action=pharmacies', { method: 'GET', requiresAuth: true });
  },

  savePharmacy: async (data: Record<string, any>) => {
    return apiCall('medical_records.php?action=pharmacy', {
      method: 'POST',
      body: data,
      requiresAuth: true,
    });
  },

  savePurchase: async (data: Record<string, any>) => {
    return apiCall('medical_records.php?action=purchase', {
      method: 'POST',
      body: data,
      requiresAuth: true,
    });
  },

  getReminders: async () => {
    return apiCall('medical_records.php?action=reminders', { method: 'GET', requiresAuth: true });
  },

  saveReminder: async (data: Record<string, any>) => {
    return apiCall('medical_records.php?action=reminder', {
      method: 'POST',
      body: data,
      requiresAuth: true,
    });
  },

  deleteReminder: async (id: number) => {
    return apiCall('medical_records.php?action=reminder-delete', {
      method: 'POST',
      body: { id },
      requiresAuth: true,
    });
  },

  getHistory: async (search = '', filter = 'all') => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filter) params.set('filter', filter);

    return apiCall(`medical_records.php?action=history${params.toString() ? `&${params.toString()}` : ''}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  getSummary: async () => {
    return apiCall('medical_records.php?action=summary', { method: 'GET', requiresAuth: true });
  },
};
