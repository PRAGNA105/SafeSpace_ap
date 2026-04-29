import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollText, Search, Download } from 'lucide-react';

interface MedicalHistoryTabProps {
  items: any[];
  search: string;
  filter: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  onDownloadSummary: () => void;
}

const badgeClassName: Record<string, string> = {
  medicine: 'bg-blue-100 text-blue-800',
  purchase: 'bg-orange-100 text-orange-800',
  reminder: 'bg-emerald-100 text-emerald-800',
};

export default function MedicalHistoryTab({
  items,
  search,
  filter,
  onSearchChange,
  onFilterChange,
  onDownloadSummary,
}: MedicalHistoryTabProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <ScrollText className="h-5 w-5 text-blue-600" />
            Treatment Timeline
          </CardTitle>
          <CardDescription>
            Search your medical history and export a printable summary for doctor visits or pharmacy check-ins.
          </CardDescription>
        </div>
        <Button onClick={onDownloadSummary} className="bg-blue-600 hover:bg-blue-700">
          <Download className="mr-2 h-4 w-4" />
          Download Summary
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search medicines, reminders, purchases..."
            />
          </div>
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All records</option>
            <option value="medicine">Medicines</option>
            <option value="purchase">Purchases</option>
            <option value="reminder">Reminders</option>
          </select>
        </div>

        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-slate-500">No records match your current search.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="absolute left-0 top-0 h-full w-1 bg-blue-200" />
                <div className="ml-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={badgeClassName[item.type] || 'bg-slate-100 text-slate-700'}>
                        {item.type}
                      </Badge>
                      <span className="text-sm text-slate-500">{item.date}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{item.details}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

