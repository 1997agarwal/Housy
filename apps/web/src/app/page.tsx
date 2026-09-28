'use client';

import React, { useState } from 'react';
import {
  Home,
  Compass,
  Search,
  MessageSquare,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  ArrowRight,
  Clock,
  Star,
  ShieldCheck,
  Send,
  Phone,
  MapPin,
  Users,
  Calendar,
  ChevronRight,
  Sparkles,
  Calculator,
  Wrench,
  Check,
  Info,
  ExternalLink,
  Hammer
} from 'lucide-react';

// --- DATA TYPES & MOCKS ---
type Tab = 'home' | 'floor-plan' | 'labor' | 'advisor' | 'project';

interface POC {
  id: string;
  name: string;
  role: string;
  trade: string;
  locality: string;
  rating: number;
  reviewsCount: number;
  gangSize: number;
  dayRate: number;
  helperRate: number;
  experienceYears: number;
  verifiedId: string;
  specialties: string[];
  phone: string;
}

const CONTRACTORS: POC[] = [
  {
    id: 'poc-1',
    name: 'Suresh Mistri & Gang',
    role: 'Master Mason & Gang Leader',
    trade: 'Masonry & Tiles',
    locality: 'Civil Lines, Bareilly',
    rating: 4.9,
    reviewsCount: 38,
    gangSize: 4,
    dayRate: 850,
    helperRate: 500,
    experienceYears: 14,
    verifiedId: 'HSY-BLY-001',
    specialties: ['Ancestral Brick Masonry', 'Bathroom Core-cutting', 'Vitrified Tiling'],
    phone: '+919876543210',
  },
  {
    id: 'poc-2',
    name: 'Ram Pal Sharma',
    role: 'Master Plumber',
    trade: 'Plumbing & Drainage',
    locality: 'Subhash Nagar, Bareilly',
    rating: 4.8,
    reviewsCount: 29,
    gangSize: 2,
    dayRate: 800,
    helperRate: 450,
    experienceYears: 11,
    verifiedId: 'HSY-BLY-002',
    specialties: ['Septic Trap Slope Routing', 'CPVC Concealed Piping', 'Sanitary Ware'],
    phone: '+919876543211',
  },
  {
    id: 'poc-3',
    name: 'Rajesh Kumar & Sons',
    role: 'Licensed Electrician',
    trade: 'Electrical & Concealed Wiring',
    locality: 'Rajendra Nagar, Bareilly',
    rating: 4.7,
    reviewsCount: 22,
    gangSize: 2,
    dayRate: 750,
    helperRate: 400,
    experienceYears: 9,
    verifiedId: 'HSY-BLY-003',
    specialties: ['Old House Rewiring', 'Geyser Load Distribution', 'Earthing Pit'],
    phone: '+919876543212',
  },
];

export default function MobileApp() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedPOC, setSelectedPOC] = useState<POC | null>(null);
  const [bookingDays, setBookingDays] = useState(5);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  
  // AI Advisor Chat State
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Namaste Harshit ji! Main aapka Housy AI Advisor hoon. Bareilly 5-BHK ancestral home me 2nd bathroom addition ya structural load-bearing wall ke baare me kuch bhi poochiye.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Floor Plan Drainage Engine State
  const [selectedRoom, setSelectedRoom] = useState<string>('bed2');
  const [pipeDistance, setPipeDistance] = useState(18.4);

  // Calculate pricing
  const calcBookingCost = (poc: POC, days: number) => {
    const dailyWage = poc.dayRate + (poc.gangSize - 1) * poc.helperRate;
    const laborSubtotal = dailyWage * days;
    const platformFee = Math.round(laborSubtotal * 0.12);
    const total = laborSubtotal + platformFee;
    return { dailyWage, laborSubtotal, platformFee, total };
  };

  const handleSendMessage = async (customText?: string) => {
    const q = customText || chatInput;
    if (!q.trim()) return;

    const newMsgs = [...messages, { sender: 'user', text: q }];
    setMessages(newMsgs);
    setChatInput('');
    setIsTyping(true);

    try {
      // Call backend API if running, fallback gracefully
      const res = await fetch('http://localhost:4000/api/v1/ai-advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, propertyId: 'prop-bareilly-001' }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setMessages([...newMsgs, { sender: 'ai', text: data.reply }]);
      } else {
        // Smart localized fallback response
        let reply = 'Aapke 30 saal purane ghar ke layout ko dekhte hue, septic line tak 18.4 ft ka run hai. 1:40 ka slope maintain karna aasan hai aur wall me core-cutting safely ho sakti hai.';
        if (q.toLowerCase().includes('wall') || q.toLowerCase().includes('tod') || q.toLowerCase().includes('demolish')) {
          reply = '⚠️ Bareilly ancestral houses me 9-inch brick walls load-bearing hoti hain! Chisel se todne ke bajaye diamond core-cutter ka use karein taaki roof slab pe vibration crack na aaye.';
        } else if (q.toLowerCase().includes('cost') || q.toLowerCase().includes('budget') || q.toLowerCase().includes('kharcha')) {
          reply = '₹8,640 plumbing drainage pipe + core-cutting ka estimated cost hai. Suresh Mistri ki gang 5 din me brickwork aur tiling complete kar sakti hai (₹13,160 approx).';
        }
        setTimeout(() => {
          setMessages([...newMsgs, { sender: 'ai', text: reply }]);
          setIsTyping(false);
        }, 600);
        return;
      }
    } catch {
      setMessages([...newMsgs, { sender: 'ai', text: 'Drainage line slope verified. 1/4 inch per foot fall is recommended for safe waste flow.' }]);
    }
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] text-slate-800 select-none">
      {/* Scrollable Viewport */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        
        {/* =========================================
            TAB 1: HOME DASHBOARD
           ========================================= */}
        {activeTab === 'home' && (
          <div className="p-4 space-y-4">
            {/* Header with Avatar */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Good morning, Harshit 👋
                </h1>
                <p className="text-xs text-slate-500 font-medium">Bareilly, Civil Lines • Ancestral Project</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#E05A2B] text-white flex items-center justify-center font-bold text-base shadow-md shadow-orange-500/20">
                H
              </div>
            </div>

            {/* Active Renovation Card */}
            <div className="bg-gradient-to-br from-[#E05A2B] to-[#C44519] rounded-2xl p-5 text-white shadow-lg shadow-orange-500/25 relative overflow-hidden">
              <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between text-[11px] font-bold tracking-widest uppercase text-orange-100/90 mb-1">
                <span>Active Renovation</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">30-Yr Ancestral House</span>
              </div>
              
              <h2 className="text-lg font-black tracking-tight mb-3">
                Bareilly 5-BHK Renovation
              </h2>

              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-xs font-bold">
                  <span>Milestone Progress</span>
                  <span>40% Completed</span>
                </div>
                <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: '40%' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-xs">
                <div>
                  <span className="text-orange-200 block text-[10px]">BUDGET SPENT</span>
                  <span className="font-extrabold text-white text-sm">₹1,85,000</span>
                  <span className="text-orange-200 text-[10px]"> / ₹7.5L est</span>
                </div>
                <div>
                  <span className="text-orange-200 block text-[10px]">TODAY'S PRIORITY</span>
                  <span className="font-extrabold text-white text-sm flex items-center gap-1">
                    <Droplets size={12} className="text-cyan-300" /> 2nd Bath Feasibility
                  </span>
                </div>
              </div>
            </div>

            {/* Urgent Feasibility Alert Banner */}
            <button
              onClick={() => setActiveTab('floor-plan')}
              className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-left transition hover:bg-amber-100/70"
            >
              <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5">
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">Drainage Check Ready</h3>
                  <span className="text-[10px] text-amber-700 font-semibold bg-amber-200/60 px-1.5 py-0.5 rounded">18.4 ft</span>
                </div>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Septic trap is located in the west courtyard. View 2D blueprint and pipe slope calculation.
                </p>
              </div>
              <ChevronRight size={16} className="text-amber-600 mt-2 shrink-0" />
            </button>

            {/* Quick Actions Grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('floor-plan')}
                  className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm text-left hover:border-orange-300 transition flex flex-col justify-between h-28"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#E05A2B] flex items-center justify-center">
                    <Compass size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Floor Plan Studio</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">2D Blueprint & Slope</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('labor')}
                  className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm text-left hover:border-orange-300 transition flex flex-col justify-between h-28"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Find Workers</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Suresh Mistri & Gang</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('advisor')}
                  className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm text-left hover:border-orange-300 transition flex flex-col justify-between h-28"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Ask Housy AI</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Renovation Advisor</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('project')}
                  className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm text-left hover:border-orange-300 transition flex flex-col justify-between h-28"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <FolderKanban size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Project Tasks</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">3 Active Milestones</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Renovation Guide Card */}
            <div className="bg-[#FFF8F5] border border-[#FFE4D6] rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📚</div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Ancestral Home Guide</h4>
                  <p className="text-[11px] text-slate-600">5 rules for adding bathrooms without dampness</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#E05A2B]" />
            </div>
          </div>
        )}

        {/* =========================================
            TAB 2: FLOOR PLAN STUDIO & DRAINAGE
           ========================================= */}
        {activeTab === 'floor-plan' && (
          <div className="p-4 space-y-4">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#E05A2B] uppercase">Spatial Intelligence</span>
              <h2 className="text-xl font-extrabold text-slate-900">2D Blueprint & Drainage</h2>
              <p className="text-xs text-slate-500">Ancestral 5-BHK layout with septic line calculation</p>
            </div>

            {/* Interactive 2D Blueprint Canvas */}
            <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-slate-800 pb-2">
                <span className="font-mono text-[11px]">GROUND FLOOR LAYOUT (2000 sq ft)</span>
                <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Septic Trap Active
                </span>
              </div>

              {/* Blueprint Grid Layout */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                {/* Row 1 */}
                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
                  <p className="text-[10px] text-slate-400">BEDROOM 1</p>
                  <p className="font-bold text-slate-200 mt-1">14 x 12 ft</p>
                </div>
                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
                  <p className="text-[10px] text-slate-400">BAITHAK (LIVING)</p>
                  <p className="font-bold text-slate-200 mt-1">18 x 15 ft</p>
                </div>
                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
                  <p className="text-[10px] text-slate-400">BEDROOM 3</p>
                  <p className="font-bold text-slate-200 mt-1">12 x 12 ft</p>
                </div>

                {/* Row 2 */}
                <button
                  onClick={() => { setSelectedRoom('bed2'); setPipeDistance(18.4); }}
                  className={`p-2.5 rounded-lg border transition text-left ${selectedRoom === 'bed2' ? 'bg-[#E05A2B]/20 border-[#E05A2B] text-orange-200' : 'bg-slate-800/80 border-slate-700/60 text-slate-300'}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold">BEDROOM 2</p>
                    {selectedRoom === 'bed2' && <Check size={12} className="text-[#E05A2B]" />}
                  </div>
                  <p className="font-bold text-xs mt-1">Target 2nd Bath</p>
                </button>

                <div className="p-2.5 bg-slate-800/40 rounded-lg border border-dashed border-slate-700 flex flex-col items-center justify-center">
                  <p className="text-[10px] text-amber-400 font-bold">AANGAN (COURTYARD)</p>
                  <p className="text-[9px] text-slate-500">Open to Sky</p>
                </div>

                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
                  <p className="text-[10px] text-slate-400">KITCHEN</p>
                  <p className="font-bold text-slate-200 mt-1">10 x 12 ft</p>
                </div>

                {/* Row 3 */}
                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
                  <p className="text-[10px] text-slate-400">BEDROOM 4</p>
                  <p className="font-bold text-slate-200 mt-1">12 x 10 ft</p>
                </div>
                <div className="p-2.5 bg-emerald-950/60 rounded-lg border border-emerald-700/60 text-emerald-300">
                  <p className="text-[10px] text-emerald-400 font-bold">EXISTING TOILET</p>
                  <p className="font-bold text-[11px] mt-1">Primary Septic Trap</p>
                </div>
                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
                  <p className="text-[10px] text-slate-400">BEDROOM 5</p>
                  <p className="font-bold text-slate-200 mt-1">11 x 11 ft</p>
                </div>
              </div>

              {/* Simulated Drainage Line */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <Droplets size={14} />
                  <span>Drain Run: <strong>{pipeDistance} ft</strong></span>
                </div>
                <div className="text-emerald-400 text-xs font-bold">
                  ✓ Slope Drop: 4.6 inches (Feasible)
                </div>
              </div>
            </div>

            {/* Engineering Metrics Card */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Calculator size={16} className="text-[#E05A2B]" /> Feasibility & Material Estimate
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block text-[10px]">REQUIRED PIPE GRADE</span>
                  <span className="font-bold text-slate-800 text-xs">1:48 (1/4" per foot)</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block text-[10px]">WALL STRUCTURE</span>
                  <span className="font-bold text-slate-800 text-xs">9-in Brick Masonry</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block text-[10px]">ESTIMATED DRAINAGE COST</span>
                  <span className="font-bold text-[#E05A2B] text-sm">₹8,640</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block text-[10px]">CORE-CUTTING HOLES</span>
                  <span className="font-bold text-slate-800 text-xs">2 Holes (4-inch dia)</span>
                </div>
              </div>

              {/* Structural Tip */}
              <div className="bg-blue-50 border border-blue-200/80 rounded-lg p-3 text-xs text-blue-900 flex items-start gap-2">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Civil Advisory:</strong> Do not break the wall between Bedroom 2 and the Courtyard with sledgehammers. Use diamond core-drilling to protect the 30-year-old lime mortar.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedPOC(CONTRACTORS[0]);
                  setActiveTab('labor');
                }}
                className="w-full bg-[#E05A2B] hover:bg-[#C44519] text-white py-2.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
              >
                Book Suresh Mistri for Core-Cutting & Masonry <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* =========================================
            TAB 3: VERIFIED LABOR & BOOKING
           ========================================= */}
        {activeTab === 'labor' && (
          <div className="p-4 space-y-4">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#E05A2B] uppercase">Verified Contractors</span>
              <h2 className="text-xl font-extrabold text-slate-900">Bareilly Labor Marketplace</h2>
              <p className="text-xs text-slate-500">Experienced mistri gangs with transparent day rates</p>
            </div>

            {/* Contractor List */}
            <div className="space-y-3">
              {CONTRACTORS.map((poc) => {
                const isSelected = selectedPOC?.id === poc.id;
                return (
                  <div
                    key={poc.id}
                    className={`bg-white rounded-xl border p-4 shadow-sm transition ${isSelected ? 'border-[#E05A2B] ring-2 ring-orange-500/10' : 'border-slate-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-slate-900 text-sm">{poc.name}</h3>
                          <ShieldCheck size={16} className="text-emerald-600" />
                        </div>
                        <p className="text-xs text-slate-500">{poc.role} • {poc.locality}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-[#E05A2B]">₹{poc.dayRate}</span>
                        <span className="text-[10px] text-slate-500 block">/ day mistri</span>
                      </div>
                    </div>

                    {/* Gang & Experience Meta */}
                    <div className="flex items-center gap-3 my-2.5 text-xs text-slate-600">
                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                        <Users size={12} className="text-slate-500" /> Gang of {poc.gangSize}
                      </span>
                      <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                        <Star size={12} className="fill-amber-400 text-amber-400" /> {poc.rating} ({poc.reviewsCount})
                      </span>
                      <span className="text-slate-400 text-[11px] font-mono">{poc.verifiedId}</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {poc.specialties.map((spec) => (
                        <span key={spec} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-100 font-medium">
                          {spec}
                        </span>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedPOC(poc)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
                      >
                        {isSelected ? '✓ Selected for Booking' : 'Select Gang'}
                      </button>
                      <a
                        href={`https://wa.me/${poc.phone}?text=${encodeURIComponent(`Namaste ${poc.name}, Housy platform se Harshit Agarwal ji ka Bareilly ancestral home renovation booking request hai.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
                        title="Chat on WhatsApp"
                      >
                        <Phone size={16} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Booking Flow Box if POC selected */}
            {selectedPOC && (
              <div className="bg-[#FFF8F5] border border-[#FFD5C2] rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-orange-200/60 pb-2">
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Book {selectedPOC.name}
                  </h3>
                  <span className="text-xs text-[#E05A2B] font-bold">5-Day Estimate</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Select Duration:</span>
                    <div className="flex items-center gap-2">
                      {[3, 5, 7, 10].map((days) => (
                        <button
                          key={days}
                          onClick={() => setBookingDays(days)}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold border transition ${bookingDays === days ? 'bg-[#E05A2B] text-white border-[#E05A2B]' : 'bg-white text-slate-700 border-slate-300'}`}
                        >
                          {days}d
                        </button>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const cost = calcBookingCost(selectedPOC, bookingDays);
                    return (
                      <div className="bg-white p-3 rounded-lg border border-orange-200/60 space-y-1.5">
                        <div className="flex justify-between text-slate-600">
                          <span>Gang Wages ({selectedPOC.gangSize} workers × {bookingDays} days):</span>
                          <span className="font-semibold text-slate-900">₹{cost.laborSubtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Housy Platform & Guarantee (12%):</span>
                          <span className="font-semibold text-slate-900">₹{cost.platformFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-900 font-extrabold pt-1 border-t border-slate-100 text-sm">
                          <span>Total Estimated Cost:</span>
                          <span className="text-[#E05A2B]">₹{cost.total.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {bookingConfirmed ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-900">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      Booking Dispatch Generated!
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Suresh Mistri has been notified for your Civil Lines project. You can dispatch confirmation directly to his WhatsApp:
                    </p>
                    <a
                      href={`https://wa.me/${selectedPOC.phone}?text=${encodeURIComponent(
                        `*HOUSY RENOVATION BOOKING CONFIRMATION*\n\nNamaste ${selectedPOC.name},\nHarshit Agarwal ji ne aapko book kiya hai:\n\n📍 Property: Bareilly Ancestral Home, Civil Lines\n🛠️ Scope: 2nd Bathroom Masonry & Core-Cutting\n⏱️ Duration: ${bookingDays} Days (Gang of ${selectedPOC.gangSize})\n💰 Total Agreed: ₹${calcBookingCost(selectedPOC, bookingDays).total.toLocaleString()}\n\nKripya confirmation ke liye reply karein.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md font-bold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <Phone size={14} /> Send WhatsApp Dispatch Message
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={() => setBookingConfirmed(true)}
                    className="w-full bg-[#E05A2B] hover:bg-[#C44519] text-white py-3 rounded-xl font-extrabold text-xs transition shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
                  >
                    Confirm Booking & Generate WhatsApp Dispatch <ArrowRight size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================
            TAB 4: ASK HOUSY AI ADVISOR
           ========================================= */}
        {activeTab === 'advisor' && (
          <div className="p-4 flex flex-col h-[750px]">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#E05A2B] uppercase">Gemini Renovation AI</span>
              <h2 className="text-xl font-extrabold text-slate-900">Ask Housy Advisor</h2>
              <p className="text-xs text-slate-500">Trained on Indian home construction & plumbing codes</p>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2.5 shrink-0">
              {[
                'Can I break 9-inch brick wall in Baithak?',
                'How to add bathroom without digging floors?',
                'Estimate cement & sand bags for 150 sqft tiling',
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSendMessage(chip)}
                  className="whitespace-nowrap bg-white border border-slate-200 hover:border-orange-300 text-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 shadow-sm transition"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 p-1 my-2">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${m.sender === 'user' ? 'bg-[#E05A2B] text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 text-slate-400 text-xs px-3 py-2 rounded-2xl rounded-bl-none animate-pulse">
                    Housy AI is thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="mt-auto shrink-0 flex items-center gap-2 pt-2 border-t border-slate-200 bg-[#FAF9F6]">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about walls, pipes, costs, materials..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E05A2B] shadow-sm"
              />
              <button
                onClick={() => handleSendMessage()}
                className="bg-[#E05A2B] text-white p-2.5 rounded-xl hover:bg-[#C44519] transition shadow-md shadow-orange-500/20"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        {/* =========================================
            TAB 5: PROJECT MILESTONES
           ========================================= */}
        {activeTab === 'project' && (
          <div className="p-4 space-y-4">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#E05A2B] uppercase">Milestone Management</span>
              <h2 className="text-xl font-extrabold text-slate-900">Project Tracker</h2>
              <p className="text-xs text-slate-500">Bareilly Ancestral Home Renovation</p>
            </div>

            {/* 4 Stages Tracker */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900">Execution Stages</h3>

              <div className="space-y-4 relative pl-6 border-l-2 border-orange-200 ml-2">
                {/* Stage 1 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm flex items-center justify-center text-[10px] text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Phase 1: Drainage & Slope Assessment</h4>
                    <p className="text-[11px] text-slate-500">18.4 ft run to courtyard septic tank confirmed (₹8,640 budget).</p>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">COMPLETED</span>
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#E05A2B] border-2 border-white shadow-sm" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Phase 2: Labor Dispatch & Core-Cutting</h4>
                    <p className="text-[11px] text-slate-500">Suresh Mistri & Gang assigned for 4-inch core-drilling.</p>
                    <span className="text-[10px] font-bold text-[#E05A2B] bg-orange-50 px-2 py-0.5 rounded mt-1 inline-block">IN PROGRESS</span>
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-slate-300 border-2 border-white shadow-sm" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-700">Phase 3: Waterproofing & Tiling</h4>
                    <p className="text-[11px] text-slate-400">Dr. Fixit 2-coat chemical membrane on bathroom floor & skirting.</p>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">UPCOMING</span>
                  </div>
                </div>

                {/* Stage 4 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-slate-300 border-2 border-white shadow-sm" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-700">Phase 4: Sanitary Fixtures & Handover</h4>
                    <p className="text-[11px] text-slate-400">Jaquar/Hindware CP fittings and vanity installation.</p>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">UPCOMING</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expenditure Summary */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm space-y-3">
              <h3 className="font-extrabold text-sm">Renovation Ledger</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Demolition & Debris Disposal:</span>
                  <span className="font-mono font-bold text-white">₹45,000</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Structural Lintels & Brickwork:</span>
                  <span className="font-mono font-bold text-white">₹78,000</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Plumbing Advance & Materials:</span>
                  <span className="font-mono font-bold text-white">₹62,000</span>
                </div>
                <div className="flex justify-between text-slate-100 font-extrabold text-sm pt-2 border-t border-slate-800">
                  <span>Total Spent to Date:</span>
                  <span className="text-orange-400 font-mono">₹1,85,000</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================
          FIXED MOBILE BOTTOM NAVIGATION DOCK
         ========================================= */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-2 flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${activeTab === 'home' ? 'text-[#E05A2B]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Home size={20} className={activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('floor-plan')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${activeTab === 'floor-plan' ? 'text-[#E05A2B]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Compass size={20} className={activeTab === 'floor-plan' ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
          <span className="text-[10px] font-bold">Floor Plan</span>
        </button>

        <button
          onClick={() => setActiveTab('labor')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${activeTab === 'labor' ? 'text-[#E05A2B]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Search size={20} className={activeTab === 'labor' ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
          <span className="text-[10px] font-bold">Find Labor</span>
        </button>

        <button
          onClick={() => setActiveTab('advisor')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${activeTab === 'advisor' ? 'text-[#E05A2B]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <MessageSquare size={20} className={activeTab === 'advisor' ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
          <span className="text-[10px] font-bold">Ask AI</span>
        </button>

        <button
          onClick={() => setActiveTab('project')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${activeTab === 'project' ? 'text-[#E05A2B]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <FolderKanban size={20} className={activeTab === 'project' ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
          <span className="text-[10px] font-bold">Project</span>
        </button>
      </nav>
    </div>
  );
}
