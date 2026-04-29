import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Shield,
  Phone,
  ArrowLeft,
  Ambulance,
  User,
  HeartPulse,
  Siren,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { userService } from '@/lib/services';

const healthServices = [
  { service: 'Health Centre (Landline)', number: '01881235193' },
  { service: 'Health Centre (Mobile)', number: '9041053926', info: '24x7 Emergency' },
  { service: 'Medical Officer', number: '01881235187' },
  { service: 'Pharmacist', number: '01881235193' },
  { service: 'Institute Insurance Officer', number: '9599681800' },
  { service: 'Institute Ambulance', number: '9041057943' },
  { service: 'Ambulance (Emergency)', number: '102' },
];

const helplines = [
  { service: 'Anti Ragging Helpline', number: '018001805522' },
  { service: "Women's Helpline", number: '181' },
  { service: "Women's Helpline", number: '1091' },
  { service: 'Police', number: '100' },
  { service: 'Ropar Police Station', number: '01881221177' },
];

const priorityContacts = [
  {
    title: 'Health Centre Emergency',
    description: 'Campus Health Centre mobile - 24x7 Emergency',
    number: '9041053926',
    color: 'red',
    Icon: HeartPulse,
  },
  {
    title: 'Institute Ambulance',
    description: 'IIT Ropar ambulance service',
    number: '9041057943',
    color: 'red',
    Icon: Ambulance,
  },
  {
    title: 'Ropar Police Station',
    description: 'Local police station contact',
    number: '01881221177',
    color: 'blue',
    Icon: Shield,
  },
  {
    title: "Women's Helpline",
    description: 'Immediate women safety support',
    number: '181',
    color: 'purple',
    Icon: Phone,
  },
  {
    title: 'Anti Ragging Helpline',
    description: 'Report ragging or urgent student safety concerns',
    number: '018001805522',
    color: 'orange',
    Icon: Siren,
  },
  {
    title: 'Ambulance Emergency',
    description: 'National Ambulance Service',
    number: '102',
    color: 'red',
    Icon: Ambulance,
  },
];

const priorityStyles = {
  red: {
    border: 'border-l-red-600',
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
    numberBg: 'bg-red-50',
    numberText: 'text-red-700',
  },
  blue: {
    border: 'border-l-blue-600',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    numberBg: 'bg-blue-50',
    numberText: 'text-blue-700',
  },
  purple: {
    border: 'border-l-purple-600',
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-600',
    numberBg: 'bg-purple-50',
    numberText: 'text-purple-700',
  },
  orange: {
    border: 'border-l-orange-500',
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-600',
    numberBg: 'bg-orange-50',
    numberText: 'text-orange-700',
  },
};

export default function SafetyHub() {
  const [trustedContacts, setTrustedContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  useEffect(() => {
    loadTrustedContacts();
  }, []);

  const loadTrustedContacts = async () => {
    try {
      const response = await userService.getTrustedContacts();
      if (response.success) {
        setTrustedContacts(response.contacts || []);
      }
    } catch (error) {
      console.error('Failed to load trusted contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleCall = (number: string, label: string) => {
    if (window.confirm(`Are you sure you want to call ${label}?`)) {
      toast.info(`Calling ${label}...`, {
        description: `Connecting to ${number}`,
      });
      window.location.href = `tel:${number}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">SafeSpace</span>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Safety Hub</h1>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Emergency Assistance</h2>
          <p className="text-gray-600">
            Quick access to emergency services and your trusted contacts.
          </p>
        </div>

        <div className="space-y-4 mb-10">
          {priorityContacts.map((contact) => {
            const styles = priorityStyles[contact.color as keyof typeof priorityStyles];
            const Icon = contact.Icon;

            return (
              <Card
                key={`${contact.title}-${contact.number}`}
                className={`overflow-hidden border-l-4 ${styles.border} hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]`}
                onClick={() => handleCall(contact.number, contact.title)}
              >
                <div className="flex items-center p-5 sm:p-6 gap-4 sm:gap-6">
                  <div className={`${styles.iconBg} p-4 rounded-full shrink-0`}>
                    <Icon className={`h-7 w-7 sm:h-8 sm:w-8 ${styles.iconText}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                      {contact.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                      {contact.description}
                    </p>
                  </div>
                  <div
                    className={`${styles.numberText} ${styles.numberBg} font-bold text-base sm:text-lg px-3 sm:px-4 py-2 rounded-lg shrink-0`}
                  >
                    {contact.number}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <HeartPulse className="h-5 w-5 mr-2 text-red-600" />
              Health Services
            </h3>
            <div className="grid gap-3">
              {healthServices.map((contact) => (
                <Button
                  key={`${contact.service}-${contact.number}`}
                  variant="outline"
                  className="h-auto min-h-[72px] p-4 border-red-100 bg-white hover:bg-red-50 text-gray-900 justify-between gap-4 whitespace-normal"
                  onClick={() => handleCall(contact.number, contact.service)}
                >
                  <div className="flex min-w-0 items-center text-left">
                    <div className="bg-red-100 p-2 rounded-lg mr-4 shrink-0">
                      <Phone className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold leading-snug">{contact.service}</p>
                      {contact.info && (
                        <p className="text-xs text-red-700 mt-1">{contact.info}</p>
                      )}
                    </div>
                  </div>
                  <div className="font-mono text-sm sm:text-base shrink-0 text-red-700">
                    {contact.number}
                  </div>
                </Button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Helplines
            </h3>
            <div className="grid gap-3">
              {helplines.map((contact) => (
                <Button
                  key={`${contact.service}-${contact.number}`}
                  variant="outline"
                  className="h-auto min-h-[72px] p-4 border-blue-100 bg-white hover:bg-blue-50 text-gray-900 justify-between gap-4 whitespace-normal"
                  onClick={() => handleCall(contact.number, contact.service)}
                >
                  <div className="flex min-w-0 items-center text-left">
                    <div className="bg-blue-100 p-2 rounded-lg mr-4 shrink-0">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="font-bold leading-snug">{contact.service}</p>
                  </div>
                  <div className="font-mono text-sm sm:text-base shrink-0 text-blue-700">
                    {contact.number}
                  </div>
                </Button>
              ))}
            </div>
          </section>
        </div>

        {!loadingContacts && trustedContacts.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2 text-blue-600" />
              Your Trusted Contacts
            </h3>
            <div className="grid gap-3">
              {trustedContacts.map((contact, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 justify-between group"
                  onClick={() => handleCall(contact.contact_phone, contact.contact_name)}
                >
                  <div className="flex items-center">
                    <div className="bg-blue-200 p-2 rounded-lg mr-4 group-hover:bg-blue-300 transition-colors">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{contact.contact_name}</p>
                      <p className="text-xs opacity-70">Trusted Contact</p>
                    </div>
                  </div>
                  <div className="font-mono">{contact.contact_phone}</div>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 text-center text-sm text-gray-500 bg-white p-6 rounded-2xl border shadow-sm">
          <p className="font-semibold text-gray-700 mb-2 italic">Remember:</p>
          <p>
            Always speak clearly and provide your exact location to the emergency
            dispatcher.
          </p>
        </div>
      </div>
    </div>
  );
}
