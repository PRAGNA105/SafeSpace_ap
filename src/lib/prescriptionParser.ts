/**
 * Prescription Parser - uses Groq Vision API for OCR + extraction.
 * Falls back to client-side Tesseract.js if no API key is configured.
 *
 * Output conforms to the enums used in MedicineRecordsTab.
 */

export const MEDICINE_TYPE_ENUM = [
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
] as const;

export const FREQUENCY_ENUM = [
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
] as const;

export const MEAL_TIMING_ENUM = [
  'Before food',
  'After food',
  'With food',
  'On empty stomach',
  'Any time',
] as const;

export const DURATION_ENUM = [
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
] as const;

export type MedicineTypeEnum = (typeof MEDICINE_TYPE_ENUM)[number];
export type FrequencyEnum = (typeof FREQUENCY_ENUM)[number];
export type MealTimingEnum = (typeof MEAL_TIMING_ENUM)[number];
export type DurationEnum = (typeof DURATION_ENUM)[number];

export interface ParsedMedicine {
  medicine_name: string;
  medicine_type: MedicineTypeEnum | '';
  dosage: string;
  frequency: FrequencyEnum | '';
  meal_timing: MealTimingEnum | '';
  duration: DurationEnum | '';
  instructions: string;
}

export interface ParsedPrescription {
  medicines: ParsedMedicine[];
  doctorName: string;
  patientName: string;
  diagnosis: string;
  vitals: string;
  rawText: string;
}

export type { ParsedPrescription as ParsedPrescriptionLegacy };

export const KNOWN_MEDICINES = [
  'Paracetamol', 'Ibuprofen', 'Aspirin', 'Diclofenac', 'Naproxen', 'Cetirizine',
  'Levocetirizine', 'Dextromethorphan', 'Ambroxol', 'Azithromycin', 'Pantoprazole',
  'Omeprazole', 'Domperidone', 'Ondansetron', 'Metformin', 'Glimepiride', 'Insulin',
  'Amlodipine', 'Telmisartan', 'Losartan', 'Atorvastatin', 'Amoxicillin',
  'Ciprofloxacin', 'Doxycycline', 'Cefixime', 'Clotrimazole', 'Betamethasone',
  'Mupirocin', 'Vitamin C', 'Vitamin D', 'Calcium', 'Iron', 'Multivitamin',
  'Folic acid', 'Metoprolol', 'Enalapril', 'Ranitidine', 'Esomeprazole',
  'Montelukast', 'Salbutamol', 'Fluticasone', 'Prednisolone', 'Dexamethasone',
  'Clopidogrel', 'Warfarin', 'Levothyroxine', 'Alprazolam', 'Diazepam',
  'Sertraline', 'Fluoxetine', 'Escitalopram', 'Gabapentin', 'Tramadol',
  'Aceclofenac', 'Rabeprazole', 'Ceftriaxone', 'Ofloxacin', 'Norfloxacin',
  'Metronidazole', 'Albendazole', 'Ivermectin',
  'Pantop DSR', 'Pantop D', 'Pantop', 'Pan D', 'Pan 40', 'Rantac', 'Rantac D',
  'Ondem MD', 'Ondem', 'Emeset MD', 'Emeset', 'Vomikind MD', 'Perinorm',
  'PCM', 'Dolo 650', 'Dolo', 'Crocin', 'Calpol', 'Combiflam', 'Flexon',
  'ORS', 'Glucon-D', 'Glucon D', 'Electral',
  'Meftal-P', 'Meftal Spas', 'Meftal', 'Drotin',
  'Augmentin', 'Amoxyclav', 'Zifi', 'Taxim-O', 'Oracep', 'Monocef',
  'Calpol', 'Zincovit', 'T-Minic', 'Ascoril', 'Sinarest', 'Grilinctus',
  'Shelcal', 'Limcee', 'Becosules', 'Revital', 'Supradyn',
  'Avil', 'Allegra', 'Montair', 'Deriphyllin', 'Asthalin', 'Budecort',
  'Gelusil', 'Digene', 'Mucaine', 'Sucralfate',
  'Norflox TZ', 'Oflomac', 'Metrogyl', 'Flagyl',
  'B Complex', 'Neurobion', 'Mecobalamin', 'Methylcobalamin',
];

const SHORTHAND_FREQUENCY: Record<string, FrequencyEnum> = {
  od: 'Once daily',
  om: 'Once daily (morning)',
  on: 'Once daily (night)',
  bd: 'Twice daily',
  bid: 'Twice daily',
  tds: 'Three times daily',
  tid: 'Three times daily',
  qid: 'Four times daily',
  qds: 'Four times daily',
  q8h: 'Every 8 hours',
  q12h: 'Every 12 hours',
  sos: 'As needed (SOS)',
  prn: 'As needed (SOS)',
  hs: 'At bedtime',
  nocte: 'At bedtime',
  'once weekly': 'Once weekly',
  'alternate days': 'Alternate days',
  'alt days': 'Alternate days',
  eod: 'Alternate days',
};

const SHORTHAND_TYPE: Record<string, MedicineTypeEnum> = {
  tab: 'Tablet',
  tablet: 'Tablet',
  tabs: 'Tablet',
  cap: 'Capsule',
  capsule: 'Capsule',
  caps: 'Capsule',
  syp: 'Syrup',
  syrup: 'Syrup',
  syr: 'Syrup',
  susp: 'Syrup',
  suspension: 'Syrup',
  inj: 'Injection',
  injection: 'Injection',
  cream: 'Cream/Ointment',
  oint: 'Cream/Ointment',
  ointment: 'Cream/Ointment',
  gel: 'Cream/Ointment',
  drop: 'Drops',
  drops: 'Drops',
  gtt: 'Drops',
  inh: 'Inhaler',
  inhaler: 'Inhaler',
  rotacap: 'Inhaler',
  powder: 'Powder',
  sachet: 'Powder',
  patch: 'Patch',
  supp: 'Suppository',
  suppository: 'Suppository',
};

function resolveFrequency(raw: string): FrequencyEnum | '' {
  if (!raw) return '';
  const lower = raw.toLowerCase().trim();

  for (const entry of FREQUENCY_ENUM) {
    if (lower === entry.toLowerCase()) return entry;
  }

  if (SHORTHAND_FREQUENCY[lower]) return SHORTHAND_FREQUENCY[lower];

  for (const [key, value] of Object.entries(SHORTHAND_FREQUENCY)) {
    if (lower.includes(key)) return value;
  }

  if (/twice/i.test(raw)) return 'Twice daily';
  if (/three\s*times/i.test(raw)) return 'Three times daily';
  if (/four\s*times/i.test(raw)) return 'Four times daily';
  if (/once.*morning/i.test(raw)) return 'Once daily (morning)';
  if (/once.*night/i.test(raw)) return 'Once daily (night)';
  if (/once.*daily|once.*day/i.test(raw)) return 'Once daily';
  if (/bed\s*time/i.test(raw)) return 'At bedtime';
  return '';
}

function resolveType(raw: string): MedicineTypeEnum | '' {
  if (!raw) return '';
  const lower = raw.toLowerCase().trim();

  for (const entry of MEDICINE_TYPE_ENUM) {
    if (lower === entry.toLowerCase()) return entry;
  }

  if (SHORTHAND_TYPE[lower]) return SHORTHAND_TYPE[lower];

  for (const [key, value] of Object.entries(SHORTHAND_TYPE)) {
    if (lower.includes(key)) return value;
  }

  return '';
}

function resolveMealTiming(raw: string): MealTimingEnum | '' {
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (/before\s*(food|meal|eating)/i.test(lower)) return 'Before food';
  if (/after\s*(food|meal|eating)/i.test(lower)) return 'After food';
  if (/with\s*(food|meal)/i.test(lower)) return 'With food';
  if (/empty\s*stomach/i.test(lower)) return 'On empty stomach';
  if (/any\s*time/i.test(lower)) return 'Any time';
  return '';
}

function resolveDuration(raw: string): DurationEnum | '' {
  if (!raw) return '';
  const lower = raw.toLowerCase().trim();

  for (const entry of DURATION_ENUM) {
    if (lower === entry.toLowerCase()) return entry;
  }

  if (/ongoing|continue|long\s*term|indefinite/i.test(lower)) return 'Ongoing';

  const match = lower.match(/(\d+)\s*(day|week|month)/i);
  if (!match) return '';

  const count = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  if (unit.startsWith('day')) {
    if (count <= 3) return '3 days';
    if (count <= 5) return '5 days';
    if (count <= 7) return '7 days';
    if (count <= 10) return '10 days';
    if (count <= 14) return '14 days';
    return '14 days';
  }

  if (unit.startsWith('week')) {
    if (count <= 1) return '7 days';
    if (count <= 2) return '14 days';
    return '1 month';
  }

  if (count <= 1) return '1 month';
  if (count <= 2) return '2 months';
  if (count <= 3) return '3 months';
  if (count <= 6) return '6 months';
  return 'Ongoing';
}

function inferTypeFromName(name: string): MedicineTypeEnum | '' {
  const lower = name.toLowerCase();
  if (/syp\b|syrup|susp|suspension|drops|oral\s*sol/i.test(lower)) return 'Syrup';
  if (/tab\b|tablet/i.test(lower)) return 'Tablet';
  if (/cap\b|capsule/i.test(lower)) return 'Capsule';
  if (/inj\b|injection/i.test(lower)) return 'Injection';
  if (/cream|oint|gel/i.test(lower)) return 'Cream/Ointment';
  if (/drop/i.test(lower)) return 'Drops';
  if (/inh|inhaler|rotacap/i.test(lower)) return 'Inhaler';

  const knownSyrups = ['calpol', 'meftal-p', 'crocin', 'ondem', 'emeset', 't-minic', 'ascoril', 'sinarest', 'grilinctus', 'augmentin'];
  if (knownSyrups.some((item) => lower.includes(item))) return 'Syrup';

  return '';
}

function normaliseRawMedicine(raw: any): ParsedMedicine {
  const rawName = raw.medicine_name || raw.name || '';
  const rawType = raw.medicine_type || raw.type || '';
  const rawFreq = raw.frequency || '';
  const rawMeal = raw.meal_timing || '';
  const rawDur = raw.duration || '';
  const rawInstructions = raw.instructions || '';

  const mealTiming = resolveMealTiming(rawMeal) || resolveMealTiming(rawInstructions);

  let cleanInstructions = rawInstructions;
  if (mealTiming) {
    cleanInstructions = cleanInstructions
      .replace(/\b(before|after|with)\s*(food|meal|eating)\b/gi, '')
      .replace(/\b(empty\s*stomach)\b/gi, '')
      .replace(/\b(any\s*time)\b/gi, '')
      .replace(/[.,;]\s*[.,;]/g, '.')
      .replace(/^\s*[.,;]\s*/, '')
      .trim();
  }

  return {
    medicine_name: rawName.replace(/^(tab|cap|syp|inj|drops?)\b\.?\s*/i, '').trim() || rawName,
    medicine_type: resolveType(rawType) || inferTypeFromName(rawName),
    dosage: raw.dosage || '',
    frequency: resolveFrequency(rawFreq),
    meal_timing: mealTiming,
    duration: resolveDuration(rawDur),
    instructions: cleanInstructions,
  };
}

const GROQ_PROMPT = `You are an expert Medical Informatics Agent specializing in digitizing handwritten prescriptions from Indian hospitals and OPD slips.

Analyze this prescription image carefully. This is likely an Indian hospital OPD slip with handwritten notes.

Return ONLY valid JSON (no markdown, no backticks, no extra text):
{
  "medicines": [
    {
      "medicine_name": "Full medicine brand name (e.g. Pantop DSR, Ondem MD, PCM)",
      "medicine_type": "Tablet|Capsule|Syrup|Injection|Cream/Ointment|Drops|Inhaler|Powder|Patch|Suppository",
      "dosage": "e.g. 500mg, 40mg, DSR",
      "frequency": "Once daily|Twice daily|Three times daily|Four times daily|Once daily (morning)|Once daily (night)|At bedtime|Every 8 hours|Every 12 hours|Once weekly|As needed (SOS)|Alternate days",
      "meal_timing": "Before food|After food|With food|On empty stomach|Any time",
      "duration": "3 days|5 days|7 days|10 days|14 days|1 month|2 months|3 months|6 months|Ongoing",
      "instructions": "Other special instructions"
    }
  ],
  "doctorName": "Dr. Name or empty string",
  "patientName": "Patient name if visible",
  "diagnosis": "Chief complaints like H/o nausea, c/o dizziness etc.",
  "vitals": "BP, PR, Temp, SpO2, RBS values if present",
  "rawText": "Complete text you can read from the image"
}

Critical Rules for Indian Prescriptions:
- Look for "Rx" or "Adv" section - medicines are listed after this marker
- "Tab" = Tablet, "Cap" = Capsule, "Syp" = Syrup, "Inj" = Injection
- Keep brand names intact: "Pantop DSR" not just "Pantoprazole", "Ondem MD" not "Ondansetron", "PCM" = Paracetamol
- Common Indian OPD medicines: Pantop DSR, Ondem MD, PCM 500/650, Dolo 650, ORS, Glucon-D, Electral, Meftal-P, Pan D, Rantac
- Frequency shorthand: OD=Once daily, BD=Twice daily, TDS=Three times daily, SOS=As needed (SOS), HS=At bedtime, SD=Single dose
- "(SOS)" written next to medicine = frequency is "As needed (SOS)"
- "Adv of fluids" or "Plenty of fluids" = instruction, not a medicine
- ORS and Glucon-D are "Powder" type medicines
- "F/u" or "Follow up" = instruction, not a medicine
- Extract ALL items under Rx, even ORS, Glucon-D, electral sachets
- "H/o" = History of, "c/o" = Complaint of - these are diagnosis, not medicines
- Read vitals from left margin: BP, PR, Temp, SpO2, RBS
- If handwriting is ambiguous, prefer the most common Indian OPD medicine that fits the letters
- If you cannot read a field, use an empty string ""
- If no medicines are found, return an empty medicines array`;

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function callGroq(apiKey: string, model: string, body: object): Promise<Response> {
  return fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, ...body }),
  });
}

async function scanWithGroq(
  file: File,
  apiKey: string,
  onProgress?: (progress: number) => void
): Promise<ParsedPrescription> {
  onProgress?.(10);
  const base64DataUrl = await fileToBase64(file);
  onProgress?.(30);

  const requestBody = {
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: GROQ_PROMPT },
          {
            type: 'image_url',
            image_url: { url: base64DataUrl },
          },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 2048,
  };

  const models = ['meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.3-70b-versatile'];
  let response: Response | null = null;
  let lastError = '';

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        response = await callGroq(apiKey, model, requestBody);
        if (response.ok) break;

        const status = response.status;
        lastError = await response.text();
        try {
          const errJson = JSON.parse(lastError);
          lastError = errJson?.error?.message || lastError;
        } catch {
          // keep raw error text
        }

        console.warn(`Groq model ${model} failed (${status}):`, lastError);

        if (status === 429 && attempt === 0) {
          onProgress?.(50);
          await new Promise((resolve) => setTimeout(resolve, 3000));
          response = null;
          continue;
        }

        response = null;
        break;
      } catch (error: any) {
        lastError = error?.message || 'Network error';
        console.warn(`Groq model ${model} network error:`, lastError);
        response = null;
        break;
      }
    }

    if (response?.ok) break;
  }

  onProgress?.(80);

  if (!response || !response.ok) {
    throw new Error(lastError || 'All Groq models failed. Check your API key.');
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';
  onProgress?.(90);

  const jsonStr = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    const parsed = JSON.parse(jsonStr);
    onProgress?.(100);
    return {
      medicines: (parsed.medicines || []).map(normaliseRawMedicine),
      doctorName: parsed.doctorName || '',
      patientName: parsed.patientName || '',
      diagnosis: parsed.diagnosis || '',
      vitals: parsed.vitals || '',
      rawText: parsed.rawText || text,
    };
  } catch {
    onProgress?.(100);
    return {
      medicines: [],
      doctorName: '',
      patientName: '',
      diagnosis: '',
      vitals: '',
      rawText: text,
    };
  }
}

const DOSAGE_PATTERN = /(\d+\.?\d*)\s*(mg|mcg|ml|g|iu|units?|tab(?:let)?s?|cap(?:sule)?s?)/gi;

const FREQUENCY_PATTERNS: Array<{ pattern: RegExp; value: FrequencyEnum }> = [
  { pattern: /\b(OD|once\s*(?:a\s*)?daily|once\s*a\s*day)\b/i, value: 'Once daily' },
  { pattern: /\b(BD|BID|twice\s*(?:a\s*)?daily|twice\s*a\s*day)\b/i, value: 'Twice daily' },
  { pattern: /\b(TDS|TID|thrice\s*(?:a\s*)?daily|three\s*times?\s*(?:a\s*)?day)\b/i, value: 'Three times daily' },
  { pattern: /\b(SOS|as\s*needed|PRN)\b/i, value: 'As needed (SOS)' },
  { pattern: /\b(at\s*(?:bed\s*)?time|HS|nocte)\b/i, value: 'At bedtime' },
  { pattern: /\b(QID|four\s*times?\s*(?:a\s*)?day)\b/i, value: 'Four times daily' },
  { pattern: /\bQ8H\b/i, value: 'Every 8 hours' },
  { pattern: /\bQ12H\b/i, value: 'Every 12 hours' },
  { pattern: /\b(EOD|alternate\s*days?)\b/i, value: 'Alternate days' },
];

const DURATION_PATTERNS: Array<{ pattern: RegExp; extract: (match: RegExpMatchArray) => string }> = [
  { pattern: /(\d+)\s*days?/i, extract: (match) => `${match[1]} days` },
  { pattern: /(\d+)\s*weeks?/i, extract: (match) => `${match[1]} weeks` },
  { pattern: /(\d+)\s*months?/i, extract: (match) => `${match[1]} months` },
];

const INSTRUCTION_PATTERNS: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /\b(before\s*(food|meal))\b/i, value: 'Take before food' },
  { pattern: /\b(after\s*(food|meal))\b/i, value: 'Take after food' },
  { pattern: /\b(empty\s*stomach)\b/i, value: 'Take on empty stomach' },
];

function findMatch<T extends string>(text: string, patterns: Array<{ pattern: RegExp; value: T }>): T | '' {
  for (const { pattern, value } of patterns) {
    if (pattern.test(text)) return value;
  }
  return '';
}

function fallbackParse(text: string): ParsedPrescription {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const lower = text.toLowerCase();
  const foundMeds = KNOWN_MEDICINES.filter((medicine) => lower.includes(medicine.toLowerCase()));

  const doctorMatch = text.match(/\bDr\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/);
  const doctorName = doctorMatch ? `Dr. ${doctorMatch[1]}` : '';

  if (foundMeds.length === 0) {
    return {
      medicines: [],
      doctorName,
      patientName: '',
      diagnosis: '',
      vitals: '',
      rawText: text,
    };
  }

  const medicines: ParsedMedicine[] = foundMeds.map((name) => {
    const line = lines.find((entry) => entry.toLowerCase().includes(name.toLowerCase())) || '';
    const dosageMatch = line.match(DOSAGE_PATTERN);
    const rawFreq = findMatch(line, FREQUENCY_PATTERNS);
    const rawDur = (() => {
      for (const { pattern, extract } of DURATION_PATTERNS) {
        const match = line.match(pattern);
        if (match) return extract(match);
      }
      return '';
    })();
    const rawInstruction = findMatch(line, INSTRUCTION_PATTERNS);

    return normaliseRawMedicine({
      medicine_name: name,
      medicine_type: '',
      dosage: dosageMatch ? dosageMatch[0] : '',
      frequency: rawFreq,
      meal_timing: '',
      duration: rawDur,
      instructions: rawInstruction,
    });
  });

  return {
    medicines,
    doctorName,
    patientName: '',
    diagnosis: '',
    vitals: '',
    rawText: text,
  };
}

async function preprocessImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.src = event.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const contrast = 50;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const contrastedGray = factor * (gray - 128) + 128;
        const finalValue = Math.max(0, Math.min(255, contrastedGray));

        data[i] = finalValue;
        data[i + 1] = finalValue;
        data[i + 2] = finalValue;
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 1.0);
    };

    img.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

async function scanWithTesseract(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ParsedPrescription> {
  onProgress?.(10);
  const processedBlob = await preprocessImage(file);
  onProgress?.(30);

  const Tesseract = await import('tesseract.js');
  const result = await Tesseract.default.recognize(processedBlob, 'eng', {
    logger: (message: any) => {
      if (message.status === 'recognizing text' && onProgress) {
        onProgress(30 + Math.round(message.progress * 60));
      }
    },
  });

  onProgress?.(90);
  const parsed = fallbackParse(result.data.text);
  onProgress?.(100);
  return parsed;
}

export async function scanPrescription(
  imageSource: File,
  onProgress?: (progress: number) => void
): Promise<ParsedPrescription> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (apiKey && apiKey.length > 10) {
    try {
      return await scanWithGroq(imageSource, apiKey, onProgress);
    } catch (error) {
      console.warn('Groq API failed, falling back to enhanced offline OCR', error);
    }
  }

  return scanWithTesseract(imageSource, onProgress);
}
