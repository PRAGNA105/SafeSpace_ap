import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, HeartPulse, MapPin, LockKeyhole } from 'lucide-react';

const COMMON_MEDICINES = [
  "Paracetamol", "Ibuprofen", "Aspirin", "Diclofenac", "Naproxen",
  "Cetirizine", "Levocetirizine", "Dextromethorphan", "Ambroxol", "Azithromycin",
  "Pantoprazole", "Omeprazole", "Domperidone", "Ondansetron", "ORS",
  "Metformin", "Glimepiride", "Insulin",
  "Amlodipine", "Telmisartan", "Losartan", "Atorvastatin",
  "Amoxicillin", "Ciprofloxacin", "Doxycycline", "Cefixime",
  "Clotrimazole", "Betamethasone", "Mupirocin",
  "Vitamin C", "Vitamin D", "Calcium", "Iron supplements", "Multivitamin",
  "Folic acid", "Iron tablets", "Pregnancy test kit",
  "Antiseptic liquid", "Bandages", "Cotton rolls", "Hand sanitizer"
];

const COMMON_ALLERGIES = [
  "Penicillin", "Peanuts", "Dust", "Pollen", "Latex", "Aspirin", "Ibuprofen", "Sulfa drugs", "Pet dander", "Dairy", "Eggs"
];

const COMMON_CONDITIONS = [
  "Diabetes", "Hypertension (Blood Pressure)", "Asthma", "Migraine", "Thyroid Disorder", "Arthritis", "Heart Disease", "Anxiety", "Depression"
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function MultiTagInput({ value, onChange, suggestions, placeholder }: { value: string[], onChange: (v: string[]) => void, suggestions: string[], placeholder: string }) {
  const [inputVal, setInputVal] = useState('');
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    }
  };

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !value.includes(t)) {
      onChange([...value, t]);
    }
    setInputVal('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(t => t !== tagToRemove));
  };
  
  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(inputVal.toLowerCase()) && !value.includes(s)
  );

  return (
    <div className="space-y-2 relative">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer" onClick={() => removeTag(tag)}>
            {tag} <span className="text-blue-500 ml-1">&times;</span>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input 
          value={inputVal} 
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : "Type and press Enter, or select below..."}
          className="w-full"
        />
        {inputVal && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full bg-white border border-slate-200 mt-1 rounded-md shadow-md max-h-48 overflow-y-auto">
            {filteredSuggestions.map(s => (
              <div 
                key={s} 
                className="px-3 py-2 cursor-pointer hover:bg-slate-100 text-sm border-b last:border-0 border-slate-50"
                onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface Pharmacy {
  id?: number;
  name: string;
  address: string;
  phone: string;
  notes: string;
  is_preferred?: boolean;
}

interface MedicalProfileTabProps {
  profile: any;
  onProfileChange: (field: string, value: any) => void;
  onSaveProfile: () => void;
  isSaving: boolean;
  pinDraft: string;
  onPinDraftChange: (value: string) => void;
  needsPinSetup: boolean;
  pharmacies: Pharmacy[];
  pharmacyDraft: Pharmacy;
  onPharmacyDraftChange: (field: string, value: any) => void;
  onSavePharmacy: () => void;
  nearbyPharmacies: Array<{ name: string; address: string; distance_km: number; open_now: boolean }>;
}

const tagInputToList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function MedicalProfileTab({
  profile,
  onProfileChange,
  onSaveProfile,
  isSaving,
  pinDraft,
  onPinDraftChange,
  needsPinSetup,
  pharmacies,
  pharmacyDraft,
  onPharmacyDraftChange,
  onSavePharmacy,
  nearbyPharmacies,
}: MedicalProfileTabProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <Card className="border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <HeartPulse className="h-5 w-5 text-blue-600" />
            Health Profile
          </CardTitle>
          <CardDescription>
            Keep your essentials updated so support and treatment details are always easy to access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="blood-group">Blood Group</Label>
              <Input
                list="blood-groups"
                id="blood-group"
                value={profile.blood_group}
                onChange={(e) => onProfileChange('blood_group', e.target.value)}
                placeholder="A+, O-, AB+, etc."
              />
              <datalist id="blood-groups">
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-medications">Current Medications</Label>
              <MultiTagInput
                value={profile.current_medications || []}
                onChange={(tags) => onProfileChange('current_medications', tags)}
                suggestions={COMMON_MEDICINES}
                placeholder="Start typing medicine name..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies</Label>
            <MultiTagInput
              value={profile.allergies || []}
              onChange={(tags) => onProfileChange('allergies', tags)}
              suggestions={COMMON_ALLERGIES}
              placeholder="e.g. Peanuts, Penicillin..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conditions">Chronic Conditions</Label>
            <MultiTagInput
              value={profile.chronic_conditions || []}
              onChange={(tags) => onProfileChange('chronic_conditions', tags)}
              suggestions={COMMON_CONDITIONS}
              placeholder="e.g. Asthma, Diabetes..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="emergency-name">Emergency Contact (Optional)</Label>
              <Input
                id="emergency-name"
                value={profile.emergency_contact_name}
                onChange={(e) => onProfileChange('emergency_contact_name', e.target.value)}
                placeholder="Priya Sharma"
              />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="emergency-phone">Emergency Phone (Optional)</Label>
              <Input
                id="emergency-phone"
                value={profile.emergency_contact_phone}
                onChange={(e) => onProfileChange('emergency_contact_phone', e.target.value)}
                placeholder="+91 98xxxxxx12"
              />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="emergency-relation">Relationship (Optional)</Label>
              <Input
                id="emergency-relation"
                value={profile.emergency_contact_relation}
                onChange={(e) => onProfileChange('emergency_contact_relation', e.target.value)}
                placeholder="Mother, Friend"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical-notes">Additional Notes (Optional)</Label>
            <Textarea
              id="medical-notes"
              value={profile.medical_notes}
              onChange={(e) => onProfileChange('medical_notes', e.target.value)}
              placeholder="Anything a doctor or pharmacist should know quickly."
              className="min-h-28"
            />
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-900">
              <ShieldCheck className="h-4 w-4" />
              Privacy & Access
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-white/80 p-3">
                <div>
                  <div className="font-medium text-slate-900">PIN lock</div>
                  <div className="text-sm text-slate-600">Require a 4-digit PIN before records open on this device.</div>
                </div>
                <Switch
                  checked={profile.pin_enabled}
                  onCheckedChange={(checked) => onProfileChange('pin_enabled', checked)}
                />
              </div>

              {profile.pin_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="medical-pin">Medical Access PIN</Label>
                  <Input
                    id="medical-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinDraft}
                    onChange={(e) => onPinDraftChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4 digits"
                  />
                  <p className="text-xs text-slate-500">
                    {needsPinSetup
                      ? 'Choose a PIN before saving so the lock can be enabled on this device.'
                      : 'PIN is stored locally on this device and works alongside encrypted backend storage.'}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-4 rounded-xl bg-white/80 p-3">
                <div>
                  <div className="font-medium text-slate-900">Biometric-ready access</div>
                  <div className="text-sm text-slate-600">Flag the module for future native biometric unlock integration.</div>
                </div>
                <Switch
                  checked={profile.biometric_enabled}
                  onCheckedChange={(checked) => onProfileChange('biometric_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl bg-white/80 p-3">
                <div>
                  <div className="font-medium text-slate-900">Location access for nearby pharmacies</div>
                  <div className="text-sm text-slate-600">Show nearby pharmacy suggestions when location is allowed.</div>
                </div>
                <Switch
                  checked={profile.location_access_enabled}
                  onCheckedChange={(checked) => onProfileChange('location_access_enabled', checked)}
                />
              </div>
            </div>
          </div>

          <Button onClick={onSaveProfile} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            {isSaving ? 'Saving…' : 'Save Medical Profile'}
          </Button>
        </CardContent>
      </Card>


    </div>
  );
}

