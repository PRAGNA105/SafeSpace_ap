import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Phone, ArrowLeft, Ambulance, Siren, HeartPulse, Building2, Flame, HelpingHand, House } from 'lucide-react';

const contactGroups = [
  {
    category: 'Health Services',
    icon: HeartPulse,
    accent: 'text-rose-600',
    description: 'Medical help, ambulance services, pharmacy support, and health centre contacts.',
    contacts: [
      { service: 'Health Centre (Landline)', number: '01881235193' },
      { service: 'Health Centre (Mobile)', number: '9041053926', info: '24x7 Emergency' },
      { service: 'Medical Officer', number: '01881235187' },
      { service: 'Pharmacist', number: '01881235193' },
      { service: 'Institute Insurance Officer', number: '9599681800' },
      { service: 'Institute Ambulance', number: '9041057943' },
      { service: 'Ambulance (Emergency)', number: '102' },
    ],
  },
  {
    category: 'Security',
    icon: Shield,
    accent: 'text-blue-600',
    description: 'Main gate, patrol, and general campus security coverage.',
    contacts: [
      { service: 'Security Gate (Main IN-Gate)', number: '01881235901', info: 'Landline' },
      { service: 'Supervisor Main Gate', number: '9041058562', info: 'Mobile - 24x7' },
      { service: 'Security (Main OUT-Gate)', number: '01881235902', info: 'Landline' },
      { service: 'Supervisor Patrolling', number: '9041057683', info: 'Mobile - 24x7' },
      {
        service: 'Security (General)',
        number: '01881235901',
        info: 'For emergencies: snake, quarrel/fighting, accident, lift',
      },
    ],
  },
  {
    category: 'Estate & Maintenance',
    icon: Building2,
    accent: 'text-amber-600',
    description: 'Power, water, sewage, and maintenance support.',
    contacts: [
      { service: 'Estate & Maintenance', number: '01881235100', info: 'Landline' },
      { service: 'Estate & Maintenance', number: '9041043362', info: 'Power failure, water supply, sewage' },
    ],
  },
  {
    category: 'Fire Services',
    icon: Flame,
    accent: 'text-orange-600',
    description: 'Immediate fire response support.',
    contacts: [{ service: 'Fire Brigade', number: '101' }],
  },
  {
    category: 'Counselling Services',
    icon: HelpingHand,
    accent: 'text-emerald-600',
    description: 'Counselling and mental health support lines.',
    contacts: [
      { service: 'Telemanas Helpline', number: '018008914416', info: '24x7 Free Counselling' },
      { service: 'Counsellors', number: '01181236855' },
      { service: 'Counsellors', number: '01881235113' },
    ],
  },
  {
    category: 'Helplines',
    icon: Siren,
    accent: 'text-fuchsia-600',
    description: 'Institute and national helplines for emergencies and support.',
    contacts: [
      { service: 'Anti Ragging Helpline', number: '018001805522' },
      { service: "Women\'s Helpline", number: '181' },
      { service: "Women\'s Helpline", number: '1091' },
      { service: 'Police', number: '100' },
      { service: 'Ropar Police Station', number: '01881221177' },
    ],
  },
  {
    category: 'Hostels',
    icon: House,
    accent: 'text-cyan-600',
    description: 'Direct hostel contact points across campus.',
    contacts: [
      { service: 'Satluj Hostel', number: '01881236852' },
      { service: 'Beas Hostel', number: '01881236853' },
      { service: 'Raavi Hostel', number: '01881236851' },
      { service: 'Chenab Hostel', number: '01881236854' },
      { service: 'Brahmaputra Boys', number: '01881236857' },
      { service: 'Brahmaputra Girls', number: '01881236856' },
      { service: 'T6 Hostel', number: '9463638533' },
    ],
  },
  {
    category: 'Guest Services',
    icon: Building2,
    accent: 'text-slate-600',
    description: 'Guest house support on campus.',
    contacts: [{ service: 'Guest House', number: '01881236951' }],
  },
];

export default function SecurityDirectory() {
  const emergencyQuickActions = [
    {
      label: 'Ambulance',
      number: '102',
      className: 'bg-red-600 hover:bg-red-700',
      icon: Ambulance,
    },
    {
      label: 'Campus Security',
      number: '01881235901',
      className: 'bg-blue-600 hover:bg-blue-700',
      icon: Shield,
    },
    {
      label: 'Police',
      number: '100',
      className: 'bg-slate-700 hover:bg-slate-800',
      icon: Siren,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">SafeSpace</span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Emergency Directory</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">IIT Ropar Emergency Contacts</h2>
          <p className="text-lg text-gray-600">
            Updated campus emergency numbers for security, health, hostels, counselling, and maintenance.
          </p>
        </div>

        <Card className="bg-red-50 border-red-200 mb-8">
          <CardHeader>
            <CardTitle className="text-red-800 text-center">Quick Emergency Actions</CardTitle>
            <CardDescription className="text-center text-red-700">
              Tap a number below to dial immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {emergencyQuickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    className={action.className}
                    onClick={() => window.open(`tel:${action.number}`)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {action.label} - {action.number}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {contactGroups.map((group) => {
            const Icon = group.icon;
            return (
              <Card key={group.category} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${group.accent}`} />
                    <span>{group.category}</span>
                  </CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.contacts.map((contact) => (
                    <div
                      key={`${group.category}-${contact.service}-${contact.number}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{contact.service}</p>
                          {contact.info && <p className="text-sm text-gray-600 mt-1">{contact.info}</p>}
                        </div>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 shrink-0"
                          onClick={() => window.open(`tel:${contact.number}`)}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          {contact.number}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Emergency Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Best First Calls</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Medical emergencies: 102 or Institute Ambulance</li>
                  <li>• Campus incidents: Security General / Main Gate</li>
                  <li>• Fire emergencies: 101</li>
                  <li>• Women’s safety or police support: 181, 1091, or 100</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Before You Call</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Share your exact hostel, gate, or building name</li>
                  <li>• Mention whether medical help, security, or maintenance is needed</li>
                  <li>• Keep the line free after reporting if follow-up is expected</li>
                  <li>• Use the Safety Hub to reach your trusted contacts too</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
