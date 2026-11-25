import { Cpu, MapPin, Radio, Stethoscope, Zap } from 'lucide-react';
// ABO/Rh Compatibility Matrix Data
export interface BloodGroupInfo {
  canDonateTo: string[];
  canReceiveFrom: string[];
  plasmaDonateTo: string[];
  plasmaReceiveFrom: string[];
  rarity: string;
  notes: string;
}

export const BLOOD_MATRIX: Record<string, BloodGroupInfo> = {
  'O-': {
    canDonateTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-'],
    plasmaDonateTo: ['O-'],
    plasmaReceiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    rarity: 'Universal Red Cell Donor (6.6% population)',
    notes: 'Crucial for trauma emergencies when recipient blood group is unknown.',
  },
  'O+': {
    canDonateTo: ['O+', 'A+', 'B+', 'AB+'],
    canReceiveFrom: ['O+', 'O-'],
    plasmaDonateTo: ['O+', 'O-'],
    plasmaReceiveFrom: ['O+', 'A+', 'B+', 'AB+'],
    rarity: 'Most Common Blood Group (37.4% population)',
    notes: 'High demand across surgical theaters and intensive care units.',
  },
  'A-': {
    canDonateTo: ['A-', 'A+', 'AB-', 'AB+'],
    canReceiveFrom: ['A-', 'O-'],
    plasmaDonateTo: ['A-', 'O-'],
    plasmaReceiveFrom: ['A-', 'A+', 'AB-', 'AB+'],
    rarity: 'Rare (6.3% population)',
    notes: 'Compatible red cell substitute for A+ and AB+ recipients.',
  },
  'A+': {
    canDonateTo: ['A+', 'AB+'],
    canReceiveFrom: ['A+', 'A-', 'O+', 'O-'],
    plasmaDonateTo: ['A+', 'A-', 'O+', 'O-'],
    plasmaReceiveFrom: ['A+', 'AB+'],
    rarity: 'Common (35.7% population)',
    notes: 'Regularly needed for cancer therapies and scheduled orthopedic surgeries.',
  },
  'B-': {
    canDonateTo: ['B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['B-', 'O-'],
    plasmaDonateTo: ['B-', 'O-'],
    plasmaReceiveFrom: ['B-', 'B+', 'AB-', 'AB+'],
    rarity: 'Rare (1.5% population)',
    notes: 'Critical reserve group with limited voluntary donor pools.',
  },
  'B+': {
    canDonateTo: ['B+', 'AB+'],
    canReceiveFrom: ['B+', 'B-', 'O+', 'O-'],
    plasmaDonateTo: ['B+', 'B-', 'O+', 'O-'],
    plasmaReceiveFrom: ['B+', 'AB+'],
    rarity: 'Prevalent in South Asia (32.0% population)',
    notes: 'High incidence of emergency requisition in regional trauma centers.',
  },
  'AB-': {
    canDonateTo: ['AB-', 'AB+'],
    canReceiveFrom: ['AB-', 'A-', 'B-', 'O-'],
    plasmaDonateTo: ['AB-', 'A-', 'B-', 'O-'],
    plasmaReceiveFrom: ['AB-', 'AB+'],
    rarity: 'Rarest Blood Group (0.6% population)',
    notes: 'Universal plasma donor; indispensable in neonatal critical care.',
  },
  'AB+': {
    canDonateTo: ['AB+'],
    canReceiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    plasmaDonateTo: ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
    plasmaReceiveFrom: ['AB+'],
    rarity: 'Universal Red Cell Recipient (3.4% population)',
    notes: 'Can receive packed red cells from any donor group.',
  },
};

export const PROTOCOL_STEPS = [
  {
    step: '01',
    title: 'Emergency Requisition Desk',
    subtitle: 'Immediate Clinical Intake',
    desc: 'Patient attendants, emergency room physicians, or trauma coordinators log urgent blood needs including ABO/Rh group, component type (PRBC, Platelets, FFP), and hospital geocoordinates.',
    icon: Radio,
    badge: 'Sub-Second Ingestion',
  },
  {
    step: '02',
    title: 'Gemini AI Clinical Triage',
    subtitle: 'Intelligent Urgency Prioritization',
    desc: 'Gemini AI validates clinical requisition parameters, computes cross-match feasibility, filters fraudulent pings, and escalates critical trauma requests to high-frequency dispatch channels.',
    icon: Cpu,
    badge: 'Clinical Verification',
  },
  {
    step: '03',
    title: 'Geospatial Mesh Routing',
    subtitle: 'Haversine Proximity Search',
    desc: 'Our real-time geospatial engine evaluates active voluntary donors within a 15 km dynamic perimeter, factoring in regional traffic density and donor donation intervals (90-day cooldown).',
    icon: MapPin,
    badge: 'Sub-15km Geofence',
  },
  {
    step: '04',
    title: 'Instant Encrypted Handshake',
    subtitle: 'Mutual Consent & In-Transit Radar',
    desc: 'Nearby matched donors receive an urgent pulse notification. Upon voluntary acceptance, an encrypted bidirectional handshake is established, providing live ETA and navigation.',
    icon: Zap,
    badge: 'RLS Privacy Protected',
  },
  {
    step: '05',
    title: 'Bedside Verification & Safe Intake',
    subtitle: 'Licensed Clinical Handshake',
    desc: 'The donor arrives at the accredited hospital or blood bank. Licensed medical staff perform cross-matching, blood screening, and supervise the transfusion under CDSCO protocols.',
    icon: Stethoscope,
    badge: 'CDSCO Compliant',
  },
];

export const FAQS = [
  {
    q: 'Is Lifnex a blood bank or storage facility?',
    a: 'No. Lifnex is strictly an emergency communication and coordination technology network. We do not collect, test, process, store, or sell blood products. We connect patients and hospitals directly with voluntary donors in real time. All physical blood screening, cross-matching, and transfusions are conducted exclusively by licensed clinicians at accredited healthcare facilities.',
  },
  {
    q: 'How does Lifnex protect donor privacy and prevent unsolicited calls?',
    a: 'Donor personal information (including phone numbers and exact home coordinates) is strictly protected by Supabase Row-Level Security (RLS). Contact details are never publicly broadcast. Only after a donor voluntarily reviews an emergency request and confirms availability is a secure, temporary handshake generated for hospital coordination.',
  },
  {
    q: 'Who is eligible to request blood through the platform?',
    a: 'Emergency requisitions can be initiated by patients, registered family attendants, trauma care staff, or verified hospital coordinators. Requisitions are reviewed through automated clinical checks and hospital dispatch personnel to maintain network integrity.',
  },
  {
    q: 'What is the Gemini AI Clinical Triage engine?',
    a: 'Our backend integrates Gemini Clinical AI to analyze request descriptions, verify biological compatibility matrices, identify urgent trauma markers (e.g. postpartum hemorrhage, arterial rupture), and prioritize emergency broadcasts over routine requests.',
  },
  {
    q: 'Are there any fees or charges for donors or patients?',
    a: 'Lifnex is 100% free for voluntary donors and emergency patients. Lifnex firmly adheres to the National Blood Policy of India prohibiting commercialized blood sales. Voluntary blood donation is a noble humanitarian act that must never be monetized.',
  },
];

