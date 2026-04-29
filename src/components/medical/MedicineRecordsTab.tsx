import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  CircleDot,
  Clock,
  FileText,
  Loader2,
  Pill,
  Search,
  ShoppingBag,
  Stethoscope,
  X,
} from 'lucide-react';
import {
  KNOWN_MEDICINES,
  scanPrescription,
  type ParsedMedicine,
  type ParsedPrescription,
} from '@/lib/prescriptionParser';
import { toast } from 'sonner';

interface MedicineDraft {
  id?: number;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  start_date: string;
  end_date: string;
  refill_date: string;
  expiry_date: string;
  status: string;
  prescription?: { name?: string; mime_type?: string; data?: string } | null;
}

interface PurchaseDraft {
  medicine_name: string;
  purchase_date: string;
  quantity: string;
  amount: string;
  notes: string;
}

interface MedicineRecordsTabProps {
  medicines: any[];
  medicineDraft: MedicineDraft;
  onMedicineDraftChange: (field: string, value: any) => void;
  onPrescriptionUpload: (file: File | null) => void;
  onSaveMedicine: () => void;
  onEditMedicine: (medicine: any) => void;
  onDeleteMedicine: (id: number) => void;
  purchases: any[];
  purchaseDraft: PurchaseDraft;
  onPurchaseDraftChange: (field: string, value: string) => void;
  onSavePurchase: () => void;
}

const MEDICINE_TYPES = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Cream/Ointment',
  'Drops',
  'Inhaler',
  'Powder',
  'Patch',
  'Suppository',
];

const COMMON_DOSAGES = [
  '5mg',
  '10mg',
  '25mg',
  '50mg',
  '100mg',
  '150mg',
  '200mg',
  '250mg',
  '500mg',
  '650mg',
  '1g',
  '2.5ml',
  '5ml',
  '10ml',
];

const COMMON_FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Once daily (morning)',
  'Once daily (night)',
  'At bedtime',
  'Every 8 hours',
  'Every 12 hours',
  'Once weekly',
  'As needed (SOS)',
  'Alternate days',
];

const MEAL_TIMINGS = [
  'Before food',
  'After food',
  'With food',
  'On empty stomach',
  'Any time',
];

const DURATION_PRESETS = [
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '1 month',
  '2 months',
  '3 months',
  '6 months',
  'Ongoing',
];

const COMMON_INSTRUCTIONS = [
  'Avoid driving',
  'Keep refrigerated',
  'Do not crush',
  'Take with plenty of water',
  'Avoid alcohol',
  'Avoid sunlight exposure',
  'Complete full course',
  'Store in cool dry place',
];

const statusClassName: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  upcoming: 'bg-blue-100 text-blue-800',
  expired: 'bg-rose-100 text-rose-800',
  completed: 'bg-slate-200 text-slate-700',
};

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 border ${
        selected
          ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
      }`}
    >
      {label}
    </button>
  );
}

function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  label,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder: string;
  label: string;
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes((search || value).toLowerCase()) &&
      suggestion !== value
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <Input
          id={id}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setSearch(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={placeholder}
          className="pl-9"
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-20 w-full bg-white border border-slate-200 mt-1 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {filtered.slice(0, 8).map((suggestion) => (
              <div
                key={suggestion}
                className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm border-b last:border-0 border-slate-50"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(suggestion);
                  setOpen(false);
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PendingMedicineCard({
  med,
  index,
  onConfirm,
  onDismiss,
}: {
  med: ParsedMedicine;
  index: number;
  onConfirm: (med: ParsedMedicine) => void;
  onDismiss: (index: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 p-4 space-y-2 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CircleDot className="h-4 w-4 text-amber-500" />
          <span className="font-semibold text-slate-900 text-sm">
            {med.medicine_name || 'Unknown'}
          </span>
          <Badge className="bg-amber-100 text-amber-800 text-[10px]">Pending</Badge>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(index)}
          className="text-slate-400 hover:text-rose-500 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
        {med.medicine_type && (
          <div>
            <span className="text-slate-400">Type:</span> {med.medicine_type}
          </div>
        )}
        {med.dosage && (
          <div>
            <span className="text-slate-400">Dosage:</span> {med.dosage}
          </div>
        )}
        {med.frequency && (
          <div>
            <span className="text-slate-400">Freq:</span> {med.frequency}
          </div>
        )}
        {med.meal_timing && (
          <div>
            <span className="text-slate-400">Meal:</span> {med.meal_timing}
          </div>
        )}
        {med.duration && (
          <div>
            <span className="text-slate-400">Duration:</span> {med.duration}
          </div>
        )}
        {med.instructions && (
          <div className="col-span-2">
            <span className="text-slate-400">Note:</span> {med.instructions}
          </div>
        )}
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => onConfirm(med)}
        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 w-full"
      >
        <CheckCircle2 className="h-3.5 w-3.5" /> Confirm & Add to Form
      </Button>
    </div>
  );
}

export default function MedicineRecordsTab({
  medicines,
  medicineDraft,
  onMedicineDraftChange,
  onPrescriptionUpload,
  onSaveMedicine,
  onEditMedicine,
  onDeleteMedicine,
  purchases,
  purchaseDraft,
  onPurchaseDraftChange,
  onSavePurchase,
}: MedicineRecordsTabProps) {
  const [selectedType, setSelectedType] = useState('');
  const [selectedMealTiming, setSelectedMealTiming] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [medSearch, setMedSearch] = useState('');
  const [pendingMeds, setPendingMeds] = useState<ParsedMedicine[]>([]);
  const [scannedDoctor, setScannedDoctor] = useState('');
  const [inlineScanning, setInlineScanning] = useState(false);
  const [inlineScanProgress, setInlineScanProgress] = useState(0);
  const scanFileRef = useRef<HTMLInputElement>(null);

  const handlePendingMeds = (meds: ParsedMedicine[], doctor: string) => {
    setPendingMeds((previous) => [...previous, ...meds]);
    setScannedDoctor(doctor);
  };

  const handleDurationSelect = (duration: string) => {
    setSelectedDuration(duration);
    const start = new Date();
    onMedicineDraftChange('start_date', start.toISOString().split('T')[0]);

    if (duration === 'Ongoing') return;

    const match = duration.match(/(\d+)\s*(day|week|month)/i);
    if (!match) return;

    const end = new Date();
    const count = parseInt(match[1], 10);

    if (match[2].startsWith('day')) end.setDate(end.getDate() + count);
    else if (match[2].startsWith('week')) end.setDate(end.getDate() + count * 7);
    else end.setMonth(end.getMonth() + count);

    onMedicineDraftChange('end_date', end.toISOString().split('T')[0]);
  };

  const handleMealTiming = (timing: string) => {
    setSelectedMealTiming(timing);
    const current = medicineDraft.instructions;
    const prefix = timing === 'Any time' ? '' : timing;
    onMedicineDraftChange(
      'instructions',
      prefix ? (current ? `${prefix}. ${current}` : prefix) : current
    );
  };

  const handleConfirmPending = (med: ParsedMedicine) => {
    onMedicineDraftChange('name', med.medicine_name);
    if (med.dosage) onMedicineDraftChange('dosage', med.dosage);
    if (med.frequency) onMedicineDraftChange('frequency', med.frequency);
    if (med.instructions) onMedicineDraftChange('instructions', med.instructions);

    if (med.meal_timing) {
      setSelectedMealTiming(med.meal_timing);
      const current = medicineDraft.instructions;
      if (med.meal_timing !== 'Any time' && !current.includes(med.meal_timing)) {
        onMedicineDraftChange(
          'instructions',
          current ? `${med.meal_timing}. ${current}` : med.meal_timing
        );
      }
    }

    if (med.medicine_type) setSelectedType(med.medicine_type);
    if (med.duration) {
      setSelectedDuration(med.duration);
      handleDurationSelect(med.duration);
    }

    setPendingMeds((previous) => previous.filter((item) => item !== med));
    toast.success(`Loaded: ${med.medicine_name}`, {
      description: 'Review the form and save.',
    });
  };

  const handleDismissPending = (index: number) => {
    setPendingMeds((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleInlineScan = async (file: File) => {
    const isPDF = file.type === 'application/pdf';

    if (isPDF) {
      onPrescriptionUpload(file);
      toast.success('PDF Prescription Saved', {
        description: 'Document attached. Enter details manually.',
      });
      return;
    }

    setInlineScanning(true);
    setInlineScanProgress(0);

    try {
      const result: ParsedPrescription = await scanPrescription(file, setInlineScanProgress);
      if (result.medicines.length > 0) {
        handlePendingMeds(result.medicines, result.doctorName);
        onPrescriptionUpload(file);
        toast.success(`Found ${result.medicines.length} medicine(s)`, {
          description: 'Review pending cards below.',
        });
      } else {
        onPrescriptionUpload(file);
        toast.info('No medicines detected', {
          description: 'Prescription saved as document. Enter details manually.',
        });
      }
    } catch (error: any) {
      onPrescriptionUpload(file);
      toast.error('Scan failed', {
        description: `Prescription saved as document. ${error?.message || ''}`,
      });
    } finally {
      setInlineScanning(false);
    }
  };

  const filteredTimeline = medicines.filter(
    (medicine) =>
      !medSearch || medicine.name?.toLowerCase().includes(medSearch.toLowerCase())
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <Card className="border-blue-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Pill className="h-5 w-5 text-blue-600" /> Add Medicine
            </CardTitle>
            <CardDescription>
              Manual entry with autocomplete and quick-picks, or scan a prescription.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Medicine Type
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {MEDICINE_TYPES.map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    selected={selectedType === type}
                    onClick={() => setSelectedType(selectedType === type ? '' : type)}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="medicine-name">Medicine Name</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <AutocompleteInput
                    id="medicine-name"
                    label=""
                    value={medicineDraft.name}
                    onChange={(value) => onMedicineDraftChange('name', value)}
                    suggestions={KNOWN_MEDICINES}
                    placeholder="Start typing..."
                  />
                </div>
                <input
                  ref={scanFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleInlineScan(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => scanFileRef.current?.click()}
                  disabled={inlineScanning}
                  className="w-full gap-2 border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-xs h-8"
                >
                  {inlineScanning ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                  {inlineScanning ? `Scanning ${inlineScanProgress}%` : 'Scan Prescription'}
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicine-status">Status</Label>
                <select
                  id="medicine-status"
                  value={medicineDraft.status}
                  onChange={(event) => onMedicineDraftChange('status', event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="expired">Expired</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                value={medicineDraft.dosage}
                onChange={(event) => onMedicineDraftChange('dosage', event.target.value)}
                placeholder="e.g. 500mg"
              />
              <div className="flex flex-wrap gap-1.5">
                {COMMON_DOSAGES.map((dosage) => (
                  <Chip
                    key={dosage}
                    label={dosage}
                    selected={medicineDraft.dosage === dosage}
                    onClick={() => onMedicineDraftChange('dosage', dosage)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_FREQUENCIES.map((frequency) => (
                  <Chip
                    key={frequency}
                    label={frequency}
                    selected={medicineDraft.frequency === frequency}
                    onClick={() => onMedicineDraftChange('frequency', frequency)}
                  />
                ))}
              </div>
              <Input
                id="frequency"
                value={medicineDraft.frequency}
                onChange={(event) => onMedicineDraftChange('frequency', event.target.value)}
                placeholder="Or type custom frequency"
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Clock className="inline h-3.5 w-3.5 mr-1" />
                Meal Timing
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {MEAL_TIMINGS.map((timing) => (
                  <Chip
                    key={timing}
                    label={timing}
                    selected={selectedMealTiming === timing}
                    onClick={() => handleMealTiming(timing)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Duration (auto-fills dates)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_PRESETS.map((duration) => (
                  <Chip
                    key={duration}
                    label={duration}
                    selected={selectedDuration === duration}
                    onClick={() => handleDurationSelect(duration)}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={medicineDraft.start_date}
                  onChange={(event) => onMedicineDraftChange('start_date', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={medicineDraft.end_date}
                  onChange={(event) => onMedicineDraftChange('end_date', event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="refill-date">Refill reminder date</Label>
                <Input
                  id="refill-date"
                  type="date"
                  value={medicineDraft.refill_date}
                  onChange={(event) => onMedicineDraftChange('refill_date', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry-date">Expiry date</Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={medicineDraft.expiry_date}
                  onChange={(event) => onMedicineDraftChange('expiry_date', event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={medicineDraft.instructions}
                onChange={(event) => onMedicineDraftChange('instructions', event.target.value)}
                placeholder="Special instructions..."
                className="min-h-24"
              />
              <div className="flex flex-wrap gap-1.5">
                {COMMON_INSTRUCTIONS.map((instruction) => (
                  <Chip
                    key={instruction}
                    label={instruction}
                    selected={medicineDraft.instructions.includes(instruction)}
                    onClick={() => {
                      const current = medicineDraft.instructions;
                      if (current.includes(instruction)) {
                        onMedicineDraftChange(
                          'instructions',
                          current.replace(instruction, '').replace(/\.\s*\./g, '.').trim()
                        );
                      } else {
                        onMedicineDraftChange(
                          'instructions',
                          current ? `${current}. ${instruction}` : instruction
                        );
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={onSaveMedicine}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200 h-11 text-base"
            >
              {medicineDraft.id ? 'Update Medicine' : 'Save Medicine'}
            </Button>
          </CardContent>
        </Card>

        {pendingMeds.length > 0 && (
          <Card className="border-amber-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-slate-900 text-base">
                <CircleDot className="h-5 w-5 text-amber-500" /> Scanned Medicines
                <Badge className="bg-amber-100 text-amber-800 text-xs ml-auto">
                  {pendingMeds.length} pending
                </Badge>
              </CardTitle>
              {scannedDoctor && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Stethoscope className="h-3.5 w-3.5" /> Doctor: {scannedDoctor}
                </div>
              )}
              <CardDescription>
                Confirm each medicine to auto-fill the form, then save it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingMeds.map((med, index) => (
                <PendingMedicineCard
                  key={`${med.medicine_name}-${index}`}
                  med={med}
                  index={index}
                  onConfirm={handleConfirmPending}
                  onDismiss={handleDismissPending}
                />
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-xs text-slate-500 hover:text-rose-600"
                onClick={() => setPendingMeds([])}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Dismiss All
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <ShoppingBag className="h-5 w-5 text-orange-500" /> Purchase History
            </CardTitle>
            <CardDescription>
              Track pharmacy purchases for continuity of care.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <AutocompleteInput
              id="purchase-medicine"
              label="Medicine Purchased"
              value={purchaseDraft.medicine_name}
              onChange={(value) => onPurchaseDraftChange('medicine_name', value)}
              suggestions={[...new Set([...medicines.map((medicine) => medicine.name), ...KNOWN_MEDICINES])]}
              placeholder="Medicine name"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                type="date"
                value={purchaseDraft.purchase_date}
                onChange={(event) => onPurchaseDraftChange('purchase_date', event.target.value)}
              />
              <Input
                value={purchaseDraft.quantity}
                onChange={(event) => onPurchaseDraftChange('quantity', event.target.value)}
                placeholder="Qty"
              />
              <Input
                value={purchaseDraft.amount}
                onChange={(event) => onPurchaseDraftChange('amount', event.target.value)}
                placeholder="Amount (Rs)"
              />
            </div>
            <Textarea
              value={purchaseDraft.notes}
              onChange={(event) => onPurchaseDraftChange('notes', event.target.value)}
              placeholder="Store notes, batch details, reimbursement info"
              className="min-h-20"
            />
            <Button variant="outline" onClick={onSavePurchase}>
              Save Purchase
            </Button>
            <div className="space-y-2 pt-2">
              {purchases.length === 0 ? (
                <p className="text-sm text-slate-500">No purchase entries yet.</p>
              ) : (
                purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-slate-900">{purchase.medicine_name}</div>
                      <div className="text-sm text-slate-500">{purchase.purchase_date}</div>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      Qty {purchase.quantity || '-'}
                      {purchase.amount ? ` • Rs${purchase.amount}` : ''}
                    </p>
                    {purchase.notes && (
                      <p className="mt-1 text-sm text-slate-500">{purchase.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <AlertTriangle className="h-5 w-5 text-emerald-600" /> Medication Timeline
          </CardTitle>
          <CardDescription>Active and past medicines at a glance.</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={medSearch}
              onChange={(event) => setMedSearch(event.target.value)}
              placeholder="Search medicines..."
              className="pl-9 h-9"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredTimeline.length === 0 ? (
            <p className="text-sm text-slate-500">No medicines recorded yet.</p>
          ) : (
            filteredTimeline.map((medicine) => (
              <div
                key={medicine.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{medicine.name}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {medicine.dosage || 'No dosage'} • {medicine.frequency || 'No frequency set'}
                    </div>
                  </div>
                  <Badge className={statusClassName[medicine.status] || statusClassName.active}>
                    {medicine.status}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                  <div>Start: {medicine.start_date || '-'}</div>
                  <div>End: {medicine.end_date || '-'}</div>
                  <div>Refill: {medicine.refill_date || '-'}</div>
                  <div>Expiry: {medicine.expiry_date || '-'}</div>
                </div>
                {medicine.instructions && (
                  <p className="mt-3 text-sm text-slate-600">{medicine.instructions}</p>
                )}
                {medicine.prescription?.name && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-blue-700">
                    <FileText className="h-4 w-4" /> {medicine.prescription.name}
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEditMedicine(medicine)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDeleteMedicine(medicine.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
