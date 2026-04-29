import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BellRing, Clock3, CalendarClock } from 'lucide-react';

interface ReminderDraft {
  id?: number;
  medicine_id?: number | null;
  title: string;
  reminder_type: string;
  schedule_type: string;
  days_of_week: string[];
  reminder_time: string;
  start_date: string;
  end_date: string;
  next_trigger_at: string;
  notes: string;
  is_enabled: boolean;
}

interface MedicalRemindersTabProps {
  reminders: any[];
  medicines: any[];
  reminderDraft: ReminderDraft;
  onReminderDraftChange: (field: string, value: any) => void;
  onSaveReminder: () => void;
  onDeleteReminder: (id: number) => void;
}

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MedicalRemindersTab({
  reminders,
  medicines,
  reminderDraft,
  onReminderDraftChange,
  onSaveReminder,
  onDeleteReminder,
}: MedicalRemindersTabProps) {
  const toggleDay = (day: string) => {
    const current = reminderDraft.days_of_week || [];
    onReminderDraftChange(
      'days_of_week',
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day]
    );
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <BellRing className="h-5 w-5 text-blue-600" />
            Reminder Center
          </CardTitle>
          <CardDescription>Set up medicine intake, refill, or appointment reminders with flexible daily or weekly schedules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reminder-title">Reminder title</Label>
              <Input
                id="reminder-title"
                value={reminderDraft.title}
                onChange={(e) => onReminderDraftChange('title', e.target.value)}
                placeholder="Morning diabetes medicine"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-type">Reminder type</Label>
              <select
                id="reminder-type"
                value={reminderDraft.reminder_type}
                onChange={(e) => onReminderDraftChange('reminder_type', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="medicine">Medicine intake</option>
                <option value="refill">Refill alert</option>
                <option value="appointment">Doctor appointment</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="schedule-type">Schedule</Label>
              <select
                id="schedule-type"
                value={reminderDraft.schedule_type}
                onChange={(e) => onReminderDraftChange('schedule_type', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom / appointment</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="linked-medicine">Linked medicine</Label>
              <select
                id="linked-medicine"
                value={reminderDraft.medicine_id ?? ''}
                onChange={(e) => onReminderDraftChange('medicine_id', e.target.value ? Number(e.target.value) : null)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {medicines.map((medicine) => (
                  <option key={medicine.id} value={medicine.id}>
                    {medicine.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {reminderDraft.schedule_type === 'weekly' && (
            <div className="space-y-2">
              <Label>Days of week</Label>
              <div className="flex flex-wrap gap-2">
                {weekdays.map((day) => {
                  const active = reminderDraft.days_of_week.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-full px-3 py-1 text-sm transition ${
                        active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reminder-time">Reminder time</Label>
              <Input
                id="reminder-time"
                type="time"
                value={reminderDraft.reminder_time}
                onChange={(e) => onReminderDraftChange('reminder_time', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next-trigger">Next trigger</Label>
              <Input
                id="next-trigger"
                type="datetime-local"
                value={reminderDraft.next_trigger_at}
                onChange={(e) => onReminderDraftChange('next_trigger_at', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reminder-start">Start date</Label>
              <Input
                id="reminder-start"
                type="date"
                value={reminderDraft.start_date}
                onChange={(e) => onReminderDraftChange('start_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-end">End date</Label>
              <Input
                id="reminder-end"
                type="date"
                value={reminderDraft.end_date}
                onChange={(e) => onReminderDraftChange('end_date', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-notes">Notes</Label>
            <Textarea
              id="reminder-notes"
              value={reminderDraft.notes}
              onChange={(e) => onReminderDraftChange('notes', e.target.value)}
              placeholder="Reminder context, dosage cues, appointment prep..."
            />
          </div>

          <Button onClick={onSaveReminder} className="bg-blue-600 hover:bg-blue-700">
            {reminderDraft.id ? 'Update Reminder' : 'Save Reminder'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <CalendarClock className="h-5 w-5 text-emerald-600" />
            Upcoming Notifications
          </CardTitle>
          <CardDescription>Use color cues to spot active schedules, refills, and appointments quickly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reminders.length === 0 ? (
            <p className="text-sm text-slate-500">No reminders yet.</p>
          ) : (
            reminders.map((reminder) => (
              <div key={reminder.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{reminder.title}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {reminder.schedule_type} • {reminder.reminder_time || 'No time'}
                    </div>
                  </div>
                  <Badge className={reminder.is_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}>
                    {reminder.is_enabled ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                  <div className="inline-flex items-center gap-1">
                    <Clock3 className="h-4 w-4" />
                    {reminder.start_date || 'No start date'}
                  </div>
                  {reminder.next_trigger_at && <div>Next: {reminder.next_trigger_at.replace('T', ' ')}</div>}
                </div>
                {reminder.days_of_week?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {reminder.days_of_week.map((day: string) => (
                      <Badge key={day} className="bg-blue-100 text-blue-800">
                        {day}
                      </Badge>
                    ))}
                  </div>
                )}
                {reminder.notes && <p className="mt-3 text-sm text-slate-600">{reminder.notes}</p>}
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onReminderDraftChange('id', reminder.id)}>
                    Load into editor
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDeleteReminder(reminder.id)}>
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

