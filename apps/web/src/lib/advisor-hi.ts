// Hindi for the advisor's verdicts. advisor.ts stays the English source of truth (rules + tests); this maps its exact
// sentences. `advisor-hi.test.ts` runs every answer combination and fails if any sentence has no translation.
import type { Verdict } from './advisor';

const EXACT: Record<string, string> = {
  // headlines
  'Likely non-structural — probably safe to modify': 'शायद स्ट्रक्चरल नहीं है — बदलाव करना संभवतः सुरक्षित',
  'Possible, but get it checked first': 'हो सकता है, लेकिन पहले जँच करवाएँ',
  'Do not proceed without a structural engineer': 'स्ट्रक्चरल इंजीनियर के बिना आगे न बढ़ें',
  'Looks feasible': 'संभव लगता है',
  'Feasible with some planning': 'थोड़ी प्लानिंग के साथ संभव',
  'Needs an expert’s eye before you commit': 'तय करने से पहले किसी एक्सपर्ट को दिखाना ज़रूरी है',
  // wall reasons
  'Exterior walls carry roof and floor loads and protect the building envelope.': 'बाहरी दीवारें छत और फ़र्श का भार उठाती हैं और इमारत की सुरक्षा करती हैं।',
  'Walls thicker than 9 inches are almost always structural.': '9 इंच से मोटी दीवारें लगभग हमेशा स्ट्रक्चरल होती हैं।',
  'A half-brick partition is normally non-structural, but there is a floor above — an expert should confirm nothing rests on it.': 'आधी ईंट की पार्टीशन दीवार आम तौर पर स्ट्रक्चरल नहीं होती, पर ऊपर मंज़िल है — एक्सपर्ट से पक्का करवाएँ कि उस पर कुछ टिका नहीं है।',
  'A half-brick (4.5") partition in a masonry house is normally non-structural.': 'ईंट-दीवार वाले घर में आधी ईंट (4.5") की पार्टीशन दीवार आम तौर पर स्ट्रक्चरल नहीं होती।',
  'In a load-bearing masonry house, 9-inch walls carry the slab above. Even a door-size opening needs an engineer-designed lintel.': 'लोड-बेयरिंग ईंट के घर में 9 इंच की दीवारें ऊपर का स्लैब उठाती हैं। दरवाज़े जितने खुलने के लिए भी इंजीनियर से डिज़ाइन किया लिंटल चाहिए।',
  'In an RCC-framed building, a half-brick wall is normally just a partition.': 'RCC फ़्रेम वाली इमारत में आधी ईंट की दीवार आम तौर पर बस पार्टीशन होती है।',
  'There is a floor above but no beam over this wall — it may be carrying load.': 'ऊपर मंज़िल है पर इस दीवार के ऊपर बीम नहीं है — यह भार उठा रही हो सकती है।',
  'A 9-inch wall in an RCC frame is usually infill, but an engineer should confirm no column or beam is embedded in it.': 'RCC फ़्रेम में 9 इंच की दीवार आम तौर पर भराव होती है, पर इंजीनियर पक्का करें कि उसमें कोई कॉलम या बीम दबा नहीं है।',
  'A wide opening or full removal changes how the frame behaves; get the beam above checked.': 'चौड़ा खुलना या पूरी दीवार हटाने से फ़्रेम का व्यवहार बदलता है; ऊपर की बीम की जाँच करवाएँ।',
  'We can’t tell if this is a framed or load-bearing structure. Until an expert confirms, treat any wall thicker than 4.5" as structural.': 'हम नहीं बता सकते कि यह फ़्रेम वाली है या लोड-बेयरिंग। एक्सपर्ट के पक्का करने तक 4.5" से मोटी हर दीवार को स्ट्रक्चरल मानें।',
  'Widening or removing masonry walls needs propping and a beam designed by an engineer.': 'ईंट की दीवार चौड़ी करने या हटाने के लिए प्रॉपिंग और इंजीनियर से डिज़ाइन की हुई बीम चाहिए।',
  'The building is 30+ years old: brick, mortar and slab condition must be checked before any cutting.': 'इमारत 30+ साल पुरानी है: कोई भी कटाई से पहले ईंट, मसाले और स्लैब की हालत जाँचें।',
  'Pipes, cables or a gas line run through this wall — they must be re-routed and made safe first.': 'इस दीवार में पाइप, केबल या गैस लाइन है — पहले उन्हें दूसरी जगह से निकालकर सुरक्षित करें।',
  'Unknown services inside the wall: trace them with a detector before cutting.': 'दीवार के अंदर क्या है पता नहीं: काटने से पहले डिटेक्टर से पता करें।',
  'You answered “not sure” to something important — the advice stays cautious until it’s confirmed on site.': 'आपने किसी ज़रूरी सवाल पर “पता नहीं” चुना — साइट पर पक्का होने तक सलाह सतर्क रहेगी।',
  // wall steps
  'Do not start any cutting or demolition.': 'कोई भी कटाई या तोड़फोड़ शुरू न करें।',
  'Book a licensed structural engineer to inspect the wall (Housy includes this in a wall project).': 'दीवार की जाँच के लिए लाइसेंस्ड स्ट्रक्चरल इंजीनियर बुक करें (Housy के दीवार प्रोजेक्ट में यह शामिल है)।',
  'Expect propping, a beam/lintel design and written sign-off before work begins.': 'काम शुरू होने से पहले प्रॉपिंग, बीम/लिंटल डिज़ाइन और लिखित मंज़ूरी की उम्मीद रखें।',
  'If you live in a society or a regulated colony, check whether permission is required.': 'अगर आप सोसाइटी या नियमों वाली कॉलोनी में रहते हैं तो देखें कि अनुमति चाहिए या नहीं।',
  'Get a mason or engineer to inspect the wall before you commit.': 'तय करने से पहले किसी राजमिस्त्री या इंजीनियर से दीवार दिखवाएँ।',
  'Trace and isolate pipes, cables or gas lines inside the wall.': 'दीवार के अंदर के पाइप, केबल या गैस लाइन का पता लगाकर उन्हें अलग करें।',
  'Plan dust and debris control; use controlled cutting rather than heavy hammering.': 'धूल और मलबे का इंतज़ाम करें; भारी हथौड़े की जगह नियंत्रित कटाई करें।',
  'Book a Housy site visit to confirm and lock a fixed quote.': 'पक्का करने और तय कोट लेने के लिए Housy साइट विज़िट बुक करें।',
  'Mark and isolate any services, then cut with controlled tools to limit vibration.': 'सर्विस लाइनों को निशान लगाकर अलग करें, फिर कंपन कम रखने के लिए नियंत्रित औज़ारों से काटें।',
  'Protect floors, furniture and neighbouring rooms from dust.': 'फ़र्श, फ़र्नीचर और पास के कमरों को धूल से बचाएँ।',
  'Plan the finish: patching plaster, floor levelling and paint at the joint.': 'फ़िनिश की योजना बनाएँ: जोड़ पर प्लास्टर, फ़र्श लेवलिंग और पेंट।',
  'Book a Housy site visit for a fixed quote.': 'तय कोट के लिए Housy साइट विज़िट बुक करें।',
  // bathroom reasons
  'Distance to the drain is unknown — it decides feasibility, so it must be measured on site.': 'ड्रेन तक की दूरी पता नहीं — यही संभावना तय करती है, इसलिए साइट पर नापना ज़रूरी है।',
  'On an upper floor the drain must run through the slab: plan a sunk slab or raised floor and a proper stack connection.': 'ऊपरी मंज़िल पर ड्रेन स्लैब से होकर जाएगी: सिंक्ड स्लैब या ऊँचा फ़र्श और सही स्टैक कनेक्शन प्लान करें।',
  'There is a room under the new bathroom — a leak would damage it. Use double waterproofing and a 48-hour flood test.': 'नए बाथरूम के नीचे कमरा है — लीकेज से नुकसान होगा। डबल वाटरप्रूफ़िंग और 48 घंटे का फ़्लड टेस्ट करें।',
  'Check what is under the new bathroom; leaks into a room below are the most common failure.': 'देखें कि नए बाथरूम के नीचे क्या है; नीचे के कमरे में लीकेज सबसे आम गड़बड़ी है।',
  'No plumbing shaft nearby: new vertical lines and core-cutting will add cost and time.': 'पास में प्लंबिंग शाफ़्ट नहीं है: नई वर्टिकल लाइनें और कोर-कटिंग से खर्च और समय बढ़ेगा।',
  'Confirm whether a plumbing shaft is nearby — it can noticeably reduce cost.': 'पक्का करें कि पास में प्लंबिंग शाफ़्ट है या नहीं — इससे खर्च काफ़ी घट सकता है।',
  'A nearby plumbing shaft keeps new pipework short and cheaper.': 'पास का प्लंबिंग शाफ़्ट नई पाइपिंग छोटी और सस्ती रखता है।',
  'No window or outside wall: you will need a mechanical exhaust with a duct to outside to control damp.': 'खिड़की या बाहरी दीवार नहीं: सीलन रोकने के लिए बाहर तक डक्ट वाला एग्ज़ॉस्ट फ़ैन चाहिए।',
  // bathroom steps
  'Get a plumber to measure levels before deciding — the layout may need to change.': 'तय करने से पहले प्लंबर से लेवल नपवाएँ — लेआउट बदलना पड़ सकता है।',
  'Ask about a sump/ejector pump or a different location closer to the drain.': 'सम्प/इजेक्टर पंप या ड्रेन के पास दूसरी जगह के बारे में पूछें।',
  'Book a Housy site visit so an expert can propose options with costs.': 'Housy साइट विज़िट बुक करें ताकि एक्सपर्ट खर्च के साथ विकल्प बताएँ।',
  'Have the drain distance and levels measured on site.': 'साइट पर ड्रेन की दूरी और लेवल नपवाएँ।',
  'Decide floor build-up (raised floor or sunk slab) before ordering fixtures.': 'फ़िटिंग ऑर्डर करने से पहले फ़र्श का तरीका (ऊँचा फ़र्श या सिंक्ड स्लैब) तय करें।',
  'Plan waterproofing and a flood test before tiling.': 'टाइलिंग से पहले वाटरप्रूफ़िंग और फ़्लड टेस्ट प्लान करें।',
  'Book a Housy site visit to lock a fixed quote.': 'तय कोट पक्का करने के लिए Housy साइट विज़िट बुक करें।',
  'Confirm levels with a plumber, then finalise the layout and fixtures.': 'प्लंबर से लेवल पक्के करें, फिर लेआउट और फ़िटिंग तय करें।',
  'Waterproof and flood-test before tiling.': 'टाइलिंग से पहले वाटरप्रूफ़िंग और फ़्लड टेस्ट करें।',
};

const RULES: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^The drain is ([\d.]+) ft away, needing about ([\d.]+) in of fall at 1:40\. That usually needs a pump\/ejector or relocating the bathroom\.$/,
    (m) => `ड्रेन ${m[1]} फ़ुट दूर है, 1:40 पर लगभग ${m[2]} इंच उतार चाहिए। इसके लिए आम तौर पर पंप/इजेक्टर या बाथरूम की जगह बदलनी पड़ती है।`],
  [/^The drain is ([\d.]+) ft away, needing about ([\d.]+) in of fall at 1:40 — expect a raised floor or a sunk slab and an inspection chamber\.$/,
    (m) => `ड्रेन ${m[1]} फ़ुट दूर है, 1:40 पर लगभग ${m[2]} इंच उतार चाहिए — ऊँचा फ़र्श या सिंक्ड स्लैब और इंस्पेक्शन चैंबर लगेगा।`],
  [/^The drain is ([\d.]+) ft away — about ([\d.]+) in of fall at 1:40 is easy to achieve\.$/,
    (m) => `ड्रेन ${m[1]} फ़ुट दूर है — 1:40 पर लगभग ${m[2]} इंच का उतार आसानी से मिल जाता है।`],
];

export const DISCLAIMER_HI = 'Housy का एडवाइज़र आम चलन पर आधारित एक मार्गदर्शक है, स्ट्रक्चरल इंजीनियर नहीं। किसी भी लोड-बेयरिंग फ़ैसले के लिए लाइसेंस्ड प्रोफ़ेशनल का साइट देखना ज़रूरी है।';

export function advisorText(text: string, lang: 'en' | 'hi'): string {
  if (lang !== 'hi') return text;
  if (EXACT[text]) return EXACT[text];
  for (const [re, fn] of RULES) { const m = text.match(re); if (m) return fn(m); }
  return text;
}

export function localizeVerdict(v: Verdict, lang: 'en' | 'hi'): Verdict {
  if (lang !== 'hi') return v;
  return { ...v, headline: advisorText(v.headline, lang), reasons: v.reasons.map((r) => ({ ...r, text: advisorText(r.text, lang) })), steps: v.steps.map((s) => advisorText(s, lang)) };
}
