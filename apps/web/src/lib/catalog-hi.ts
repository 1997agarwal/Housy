// Hindi names for catalogue data that has no `Hi` field of its own (keyed by stable ids). Browser-safe.
import type { Lang } from './messages';

const STYLE: Record<string, string> = { Modern: 'मॉडर्न', Contemporary: 'कंटेम्पररी', Minimalist: 'मिनिमलिस्ट', Traditional: 'पारंपरिक', Scandinavian: 'स्कैंडिनेवियन' };
const ROOM: Record<string, string> = {
  living: 'लिविंग रूम', kitchen: 'मॉड्यूलर किचन', master: 'मास्टर बेडरूम', bedroom2: 'बेडरूम 2', kids: 'बच्चों का कमरा',
  dining: 'डाइनिंग', study: 'स्टडी / होम ऑफ़िस', pooja: 'पूजा यूनिट', balcony: 'बालकनी',
};
const FINISH: Record<string, string> = { shutter: 'कैबिनेट और वार्डरोब शटर', lighting: 'लाइटिंग' };
const OPTION: Record<string, string> = {
  laminate: 'लैमिनेट (टिकाऊ, सबसे लोकप्रिय)', acrylic: 'एक्रेलिक (ग्लॉसी, मॉडर्न)', pu: 'PU / वेनियर (प्रीमियम)',
  standard: 'स्टैंडर्ड (पैनल + डाउनलाइट)', designer: 'डिज़ाइनर (कोव, प्रोफ़ाइल और एक्सेंट)',
};
export const ROOM_TYPE_HI: Record<string, string> = {
  living: 'लिविंग रूम', bedroom: 'बेडरूम', kitchen: 'किचन', bathroom: 'बाथरूम', dining: 'डाइनिंग', study: 'स्टडी', pooja: 'पूजा', balcony: 'बालकनी', other: 'अन्य',
};

const pick = (lang: Lang, map: Record<string, string>, id: string, fallback: string) => (lang === 'hi' && map[id]) || fallback;
export const styleName = (st: string, lang: Lang) => pick(lang, STYLE, st, st);
export const roomName = (id: string, name: string, lang: Lang) => pick(lang, ROOM, id, name);
export const finishLabel = (id: string, label: string, lang: Lang) => pick(lang, FINISH, id, label);
export const optionLabel = (id: string, label: string, lang: Lang) => pick(lang, OPTION, id, label);
export const roomTypeName = (type: string, label: string, lang: Lang) => pick(lang, ROOM_TYPE_HI, type, label);

// Rooms in a home plan are named by the user, but the defaults ("Bedroom 2", "Living room") show in Hindi for Hindi readers.
const DEFAULT_ROOM: Record<string, string> = { 'Living room': 'लिविंग रूम', Bedroom: 'बेडरूम', Kitchen: 'किचन', Bathroom: 'बाथरूम', Dining: 'डाइनिंग', Study: 'स्टडी', Pooja: 'पूजा', Balcony: 'बालकनी', Other: 'अन्य' };
export function planRoomName(name: string, lang: Lang): string {
  if (lang !== 'hi') return name;
  const m = name.match(/^(Living room|Bedroom|Kitchen|Bathroom|Dining|Study|Pooja|Balcony|Other)(?: (\d+))?$/);
  return m ? `${DEFAULT_ROOM[m[1]]}${m[2] ? ` ${m[2]}` : ''}` : name;
}
