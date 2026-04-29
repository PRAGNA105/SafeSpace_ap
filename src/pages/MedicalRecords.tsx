import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldPlus, Lock, Pill, History, BellRing, ShieldCheck } from 'lucide-react';
import MedicalProfileTab from '@/components/medical/MedicalProfileTab';
import MedicineRecordsTab from '@/components/medical/MedicineRecordsTab';
import MedicalHistoryTab from '@/components/medical/MedicalHistoryTab';
import MedicalRemindersTab from '@/components/medical/MedicalRemindersTab';
import { medicalRecordsService } from '@/lib/services';
import {
  clearMedicalPin,
  hasMedicalPin,
  isMedicalUnlocked,
  lockMedicalRecords,
  saveMedicalPin,
  unlockMedicalRecords,
} from '@/lib/medicalLock';

const emptyProfile = {
  blood_group: '',
  allergies: [] as string[],
  chronic_conditions: [] as string[],
  current_medications: [] as string[],
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relation: '',
  medical_notes: '',
  pin_enabled: false,
  biometric_enabled: false,
  location_access_enabled: false,
};

const emptyMedicine = {
  name: '',
  dosage: '',
  frequency: '',
  instructions: '',
  start_date: '',
  end_date: '',
  refill_date: '',
  expiry_date: '',
  status: 'active',
  prescription: null,
};

const emptyPharmacy = {
  name: '',
  address: '',
  phone: '',
  notes: '',
  is_preferred: true,
};

const emptyPurchase = {
  medicine_name: '',
  purchase_date: '',
  quantity: '',
  amount: '',
  notes: '',
};

const emptyReminder = {
  title: '',
  reminder_type: 'medicine',
  schedule_type: 'daily',
  days_of_week: [] as string[],
  reminder_time: '09:00',
  start_date: '',
  end_date: '',
  next_trigger_at: '',
  notes: '',
  is_enabled: true,
  medicine_id: null as number | null,
};

function renderSummaryHtml(summary: any) {
  const profile = summary.profile || {};
  const medicines = summary.medicines || [];
  const reminders = summary.reminders || [];
  const pharmacies = summary.pharmacies || [];
  const history = summary.history || [];

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>SafeSpace Medical Summary</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #1e293b; }
          h1, h2 { color: #1d4ed8; }
          .section { margin-top: 28px; }
          .card { border: 1px solid #dbeafe; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
          .muted { color: #64748b; font-size: 13px; }
          ul { padding-left: 18px; }
        </style>
      </head>
      <body>
        <h1>SafeSpace Medical Summary</h1>
        <div class="muted">Generated ${new Date(summary.generated_at).toLocaleString()}</div>

        <div class="section">
          <h2>Medical Profile</h2>
          <div class="card">
            <div><strong>Blood Group:</strong> ${profile.blood_group || 'Not set'}</div>
            <div><strong>Allergies:</strong> ${(profile.allergies || []).join(', ') || 'None listed'}</div>
            <div><strong>Chronic Conditions:</strong> ${(profile.chronic_conditions || []).join(', ') || 'None listed'}</div>
            <div><strong>Current Medications:</strong> ${(profile.current_medications || []).join(', ') || 'None listed'}</div>
            <div><strong>Emergency Contact:</strong> ${profile.emergency_contact_name || 'Not set'} ${profile.emergency_contact_relation ? `(${profile.emergency_contact_relation})` : ''}</div>
            <div><strong>Emergency Phone:</strong> ${profile.emergency_contact_phone || 'Not set'}</div>
            <div><strong>Notes:</strong> ${profile.medical_notes || 'None'}</div>
          </div>
        </div>

        <div class="section">
          <h2>Medicines</h2>
          ${medicines.length === 0 ? '<div class="card">No medicines recorded.</div>' : medicines
            .map((medicine: any) => `
              <div class="card">
                <div><strong>${medicine.name}</strong> (${medicine.status})</div>
                <div>${medicine.dosage || 'No dosage'} • ${medicine.frequency || 'No frequency'}</div>
                <div>Start ${medicine.start_date || '—'} | End ${medicine.end_date || '—'}</div>
                <div>Refill ${medicine.refill_date || '—'} | Expiry ${medicine.expiry_date || '—'}</div>
              </div>
            `).join('')}
        </div>

        <div class="section">
          <h2>Reminders</h2>
          ${reminders.length === 0 ? '<div class="card">No reminders configured.</div>' : reminders
            .map((reminder: any) => `
              <div class="card">
                <div><strong>${reminder.title}</strong></div>
                <div>${reminder.reminder_type} • ${reminder.schedule_type} • ${reminder.reminder_time || 'No time'}</div>
                <div>Next trigger: ${reminder.next_trigger_at || 'Not scheduled'}</div>
              </div>
            `).join('')}
        </div>



        <div class="section">
          <h2>Recent Timeline</h2>
          ${history.length === 0 ? '<div class="card">No history yet.</div>' : `<ul>${history
            .map((item: any) => `<li><strong>${item.date}</strong>: ${item.title} (${item.type})</li>`)
            .join('')}</ul>`}
        </div>
      </body>
    </html>
  `;
}

export default function MedicalRecords() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profile, setProfile] = useState(emptyProfile);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [nearbyPharmacies, setNearbyPharmacies] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [medicineDraft, setMedicineDraft] = useState<any>(emptyMedicine);
  const [pharmacyDraft, setPharmacyDraft] = useState<any>(emptyPharmacy);
  const [purchaseDraft, setPurchaseDraft] = useState<any>(emptyPurchase);
  const [reminderDraft, setReminderDraft] = useState<any>(emptyReminder);
  const [pinDraft, setPinDraft] = useState('');
  const [unlockPin, setUnlockPin] = useState('');
  const [locked, setLocked] = useState(false);

  const needsPinSetup = useMemo(() => {
    if (!userId || !profile.pin_enabled) {
      return false;
    }
    return !hasMedicalPin(userId);
  }, [profile.pin_enabled, userId]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await medicalRecordsService.getDashboard();
      if (!response.success) {
        throw new Error(response.message || 'Failed to load medical records');
      }

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const nextUserId = Number(storedUser.id);
      setUserId(nextUserId);
      setProfile({ ...emptyProfile, ...(response.data.profile || {}) });
      setMedicines(response.data.medicines || []);
      setPharmacies(response.data.pharmacies?.preferred || []);
      setNearbyPharmacies(response.data.pharmacies?.nearby || []);
      setPurchases(response.data.pharmacies?.purchases || []);
      setReminders(response.data.reminders || []);
      setHistory(response.data.history || []);

      if (response.data.profile?.pin_enabled && nextUserId) {
        setLocked(!isMedicalUnlocked(nextUserId));
      } else {
        setLocked(false);
      }
    } catch (error: any) {
      toast.error('Could not load medical records', {
        description: error.message || 'Please try again shortly.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    if (!token || !user) {
      navigate('/login');
      return;
    }

    loadDashboard();
  }, [navigate]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        const response = await medicalRecordsService.getHistory(historySearch, historyFilter);
        if (response.success) {
          setHistory(response.data || []);
        }
      } catch {
        /* keep last successful history snapshot */
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [historyFilter, historySearch]);

  const handleProfileChange = (field: string, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (profile.pin_enabled) {
      if (pinDraft.length !== 4 && needsPinSetup) {
        toast.error('A 4-digit PIN is required', {
          description: 'Create a PIN before enabling the medical records lock.',
        });
        return;
      }
    }

    setIsSavingProfile(true);
    try {
      const response = await medicalRecordsService.saveProfile(profile);
      if (!response.success) {
        throw new Error(response.message || 'Failed to save profile');
      }

      if (userId && profile.pin_enabled && pinDraft.length === 4) {
        await saveMedicalPin(userId, pinDraft);
      } else if (userId && !profile.pin_enabled) {
        clearMedicalPin(userId);
      }

      setProfile({ ...emptyProfile, ...(response.data || profile) });
      setLocked(Boolean(response.data?.pin_enabled) && userId ? !isMedicalUnlocked(userId) : false);

      toast.success('Medical profile saved', {
        description: 'Your emergency and health details are up to date.',
      });
    } catch (error: any) {
      toast.error('Could not save profile', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePrescriptionUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setMedicineDraft((prev: any) => ({
      ...prev,
      prescription: {
        name: file.name,
        mime_type: file.type,
        data,
      },
    }));
  };

  const handleSaveMedicine = async () => {
    try {
      const response = await medicalRecordsService.saveMedicine(medicineDraft);
      if (!response.success) {
        throw new Error(response.message || 'Failed to save medicine');
      }

      toast.success('Medicine saved', {
        description: 'This record is now part of your treatment history.',
      });
      setMedicineDraft(emptyMedicine);
      loadDashboard();
    } catch (error: any) {
      toast.error('Could not save medicine', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleDeleteMedicine = async (id: number) => {
    try {
      await medicalRecordsService.deleteMedicine(id);
      toast.success('Medicine removed');
      loadDashboard();
    } catch (error: any) {
      toast.error('Could not remove medicine', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleSavePharmacy = async () => {
    try {
      const response = await medicalRecordsService.savePharmacy(pharmacyDraft);
      if (!response.success) {
        throw new Error(response.message || 'Failed to save pharmacy');
      }

      toast.success('Preferred pharmacy saved');
      setPharmacyDraft(emptyPharmacy);
      loadDashboard();
    } catch (error: any) {
      toast.error('Could not save pharmacy', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleSavePurchase = async () => {
    try {
      const response = await medicalRecordsService.savePurchase({
        ...purchaseDraft,
        quantity: purchaseDraft.quantity ? Number(purchaseDraft.quantity) : null,
        amount: purchaseDraft.amount ? Number(purchaseDraft.amount) : null,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to save purchase');
      }

      toast.success('Purchase added');
      setPurchaseDraft(emptyPurchase);
      loadDashboard();
    } catch (error: any) {
      toast.error('Could not save purchase', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleSaveReminder = async () => {
    try {
      const response = await medicalRecordsService.saveReminder(reminderDraft);
      if (!response.success) {
        throw new Error(response.message || 'Failed to save reminder');
      }

      toast.success('Reminder saved');
      setReminderDraft(emptyReminder);
      loadDashboard();
    } catch (error: any) {
      toast.error('Could not save reminder', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleDeleteReminder = async (id: number) => {
    try {
      await medicalRecordsService.deleteReminder(id);
      toast.success('Reminder removed');
      loadDashboard();
    } catch (error: any) {
      toast.error('Could not remove reminder', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleDownloadSummary = async () => {
    try {
      const response = await medicalRecordsService.getSummary();
      if (!response.success) {
        throw new Error(response.message || 'Failed to generate summary');
      }

      const html = renderSummaryHtml(response.data);
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) {
        throw new Error('Popup blocked. Please allow popups to download the summary.');
      }

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
    } catch (error: any) {
      toast.error('Could not generate summary', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleUnlock = async () => {
    if (!userId) {
      return;
    }

    const valid = await unlockMedicalRecords(userId, unlockPin);
    if (!valid) {
      toast.error('Incorrect PIN', {
        description: 'Please try again.',
      });
      return;
    }

    setLocked(false);
    setUnlockPin('');
    toast.success('Medical records unlocked');
  };

  const handleLockNow = () => {
    if (!userId) {
      return;
    }

    lockMedicalRecords(userId);
    setLocked(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6">
        <div className="mx-auto max-w-6xl">
          <Card className="border-blue-100">
            <CardContent className="py-14 text-center text-slate-600">Loading your medical records…</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6">
        <div className="mx-auto flex max-w-md items-center justify-center pt-16">
          <Card className="w-full border-blue-100 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <Lock className="h-7 w-7" />
              </div>
              <CardTitle className="mt-3 text-slate-900">Medical Records Locked</CardTitle>
              <CardDescription>Enter your 4-digit PIN to open your pharmacy and medical records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={unlockPin}
                onChange={(e) => setUnlockPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Enter PIN"
              />
              <Button onClick={handleUnlock} className="w-full bg-blue-600 hover:bg-blue-700">
                Unlock Records
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-blue-100 bg-white/90 p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              <ShieldCheck className="h-4 w-4" />
              Pharmacy & Medical Records
            </div>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">A calm, secure place for your care history</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Track medicines, prescriptions, pharmacies, reminders, and treatment history in a format that is easy to understand during stressful moments.
            </p>
          </div>
          <div className="flex gap-3">
            {profile.pin_enabled && (
              <Button variant="outline" onClick={handleLockNow}>
                <Lock className="mr-2 h-4 w-4" />
                Lock Now
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-white p-2 shadow-sm md:grid-cols-4">
            <TabsTrigger value="profile" className="gap-2 rounded-xl py-3">
              <ShieldPlus className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="medicines" className="gap-2 rounded-xl py-3">
              <Pill className="h-4 w-4" />
              Medicines
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 rounded-xl py-3">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="reminders" className="gap-2 rounded-xl py-3">
              <BellRing className="h-4 w-4" />
              Reminders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <MedicalProfileTab
              profile={profile}
              onProfileChange={handleProfileChange}
              onSaveProfile={handleSaveProfile}
              isSaving={isSavingProfile}
              pinDraft={pinDraft}
              onPinDraftChange={setPinDraft}
              needsPinSetup={needsPinSetup}
              pharmacies={pharmacies}
              pharmacyDraft={pharmacyDraft}
              onPharmacyDraftChange={(field, value) => setPharmacyDraft((prev: any) => ({ ...prev, [field]: value }))}
              onSavePharmacy={handleSavePharmacy}
              nearbyPharmacies={nearbyPharmacies}
            />
          </TabsContent>

          <TabsContent value="medicines">
            <MedicineRecordsTab
              medicines={medicines}
              medicineDraft={medicineDraft}
              onMedicineDraftChange={(field, value) => setMedicineDraft((prev: any) => ({ ...prev, [field]: value }))}
              onPrescriptionUpload={handlePrescriptionUpload}
              onSaveMedicine={handleSaveMedicine}
              onEditMedicine={(medicine) => setMedicineDraft(medicine)}
              onDeleteMedicine={handleDeleteMedicine}
              purchases={purchases}
              purchaseDraft={purchaseDraft}
              onPurchaseDraftChange={(field, value) => setPurchaseDraft((prev: any) => ({ ...prev, [field]: value }))}
              onSavePurchase={handleSavePurchase}
            />
          </TabsContent>

          <TabsContent value="history">
            <MedicalHistoryTab
              items={history}
              search={historySearch}
              filter={historyFilter}
              onSearchChange={setHistorySearch}
              onFilterChange={setHistoryFilter}
              onDownloadSummary={handleDownloadSummary}
            />
          </TabsContent>

          <TabsContent value="reminders">
            <MedicalRemindersTab
              reminders={reminders}
              medicines={medicines}
              reminderDraft={reminderDraft}
              onReminderDraftChange={(field, value) => {
                if (field === 'id') {
                  const existingReminder = reminders.find((item) => item.id === value);
                  if (existingReminder) {
                    setReminderDraft({
                      ...existingReminder,
                      next_trigger_at: existingReminder.next_trigger_at
                        ? existingReminder.next_trigger_at.slice(0, 16)
                        : '',
                    });
                  }
                  return;
                }

                setReminderDraft((prev: any) => ({ ...prev, [field]: value }));
              }}
              onSaveReminder={handleSaveReminder}
              onDeleteReminder={handleDeleteReminder}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
