// Buying guidance: which materials matter for each kind of job and what to ask for at each quality tier.
// Specs and standards, not prices or brands — prices vary by city and week, and a spec you can check on the box beats a logo.
// Browser-safe (used on the plan page).
import type { Tier } from './catalog';

interface Loc { en: string; hi: string }
export interface MaterialGuide { id: string; name: Loc; pick: Record<Tier, Loc>; tip: Loc }
const L = (en: string, hi: string): Loc => ({ en, hi });
const g = (id: string, name: Loc, eco: Loc, std: Loc, prem: Loc, tip: Loc): MaterialGuide => ({ id, name, pick: { economy: eco, standard: std, premium: prem }, tip });

const WATERPROOF = g('waterproof', L('Waterproofing', 'वाटरप्रूफ़िंग'),
  L('Cementitious coating, 2 coats, with flood test', 'सीमेंट-आधारित कोटिंग, 2 कोट, फ़्लड टेस्ट के साथ'),
  L('Polymer-modified cementitious coating, 2–3 coats, 48-hour flood test', 'पॉलिमर-मॉडिफ़ाइड सीमेंट कोटिंग, 2–3 कोट, 48 घंटे का फ़्लड टेस्ट'),
  L('Flexible polyurethane or crystalline system with protective screed, 48-hour flood test', 'फ़्लेक्सिबल पॉलीयूरेथेन या क्रिस्टलाइन सिस्टम, सुरक्षा स्क्रीड और 48 घंटे का फ़्लड टेस्ट'),
  L('Never tile before the flood test passes. Leaks are the costliest failure and hardest to fix.', 'फ़्लड टेस्ट पास होने से पहले कभी टाइल न लगवाएँ। लीकेज सबसे महँगी और ठीक करने में सबसे मुश्किल खराबी है।'));

const PAINT = g('paint', L('Paint & putty', 'पेंट और पुट्टी'),
  L('Acrylic putty + interior emulsion, 2 coats over primer', 'एक्रिलिक पुट्टी + इंटीरियर इमल्शन, प्राइमर पर 2 कोट'),
  L('Acrylic putty + washable emulsion, 2 coats over primer', 'एक्रिलिक पुट्टी + धुलने लायक इमल्शन, प्राइमर पर 2 कोट'),
  L('Polymer putty + premium washable or anti-stain emulsion; exterior: weather-shield with anti-algae', 'पॉलिमर पुट्टी + प्रीमियम धुलने लायक/दाग-रोधी इमल्शन; बाहर के लिए: एंटी-एल्गी वेदर-शील्ड'),
  L('Ask for the sealed tins to be opened in front of you and count coats — thinning paint is the common shortcut.', 'सील बंद डिब्बे अपने सामने खुलवाएँ और कोट गिनें — पेंट में पानी मिलाना आम शॉर्टकट है।'));

const WIRING = g('wiring', L('Wires, switches & board', 'तार, स्विच और बोर्ड'),
  L('ISI-marked FR copper wire (1.5 / 2.5 / 4 mm²), 6–8 module MCB box', 'ISI मार्क वाला FR कॉपर तार (1.5 / 2.5 / 4 mm²), MCB बॉक्स'),
  L('ISI-marked FR-LSH copper wire, MCBs + RCCB, separate circuits for AC and kitchen', 'ISI मार्क वाला FR-LSH कॉपर तार, MCB + RCCB, AC और किचन के अलग सर्किट'),
  L('FR-LSH copper wire, RCBO per critical circuit, surge protection, modular switches with shutters', 'FR-LSH कॉपर तार, ज़रूरी सर्किट पर RCBO, सर्ज प्रोटेक्शन, शटर वाले मॉड्यूलर स्विच'),
  L('Insist on copper and on proper earthing. Aluminium wire and a missing earth are the real fire risks.', 'कॉपर और सही अर्थिंग पर अड़े रहें। एल्यूमीनियम तार और अर्थिंग का न होना ही आग का असली खतरा है।'));

const TILE = g('tiles', L('Tiles & adhesive', 'टाइल और चिपकाने वाला मसाला'),
  L('Ceramic wall tiles; anti-skid ceramic floor; cement-sand bed', 'सिरेमिक दीवार टाइल; एंटी-स्किड सिरेमिक फ़र्श; सीमेंट-रेत बेड'),
  L('Vitrified/porcelain floor (anti-skid, R10+), glazed wall tiles; polymer tile adhesive', 'विट्रिफ़ाइड/पोर्सलेन फ़र्श (एंटी-स्किड, R10+), ग्लेज़्ड दीवार टाइल; पॉलिमर टाइल एडहेसिव'),
  L('Large-format porcelain with epoxy grout; premium polymer adhesive; tile spacers for tight joints', 'बड़े साइज़ की पोर्सलेन टाइल, इपॉक्सी ग्राउट; प्रीमियम पॉलिमर एडहेसिव; कसे जोड़ के लिए स्पेसर'),
  L('Wet areas need anti-skid floors. Buy 8–10% extra from the same batch — a later batch rarely matches.', 'गीली जगहों पर एंटी-स्किड फ़र्श चाहिए। एक ही बैच से 8–10% ज़्यादा खरीदें — बाद का बैच शायद ही मेल खाता है।'));

const PLUMB = g('plumbing', L('Pipes & fittings', 'पाइप और फ़िटिंग'),
  L('CPVC hot/cold lines, PVC drainage, standard chrome taps', 'गर्म/ठंडे के लिए CPVC लाइन, ड्रेनेज के लिए PVC, सामान्य क्रोम नल'),
  L('CPVC/UPVC supply with concealed stop-cocks, PVC drains with proper traps, quality ceramic-disc taps', 'छिपे स्टॉप-कॉक वाली CPVC/UPVC सप्लाई, सही ट्रैप वाली PVC ड्रेन, सिरेमिक-डिस्क नल'),
  L('Concealed diverter and rain-shower system, wall-hung WC with in-wall cistern, soft-close seat', 'छिपा डाइवर्टर और रेन-शावर, दीवार में टंकी वाला वॉल-हंग WC, सॉफ़्ट-क्लोज़ सीट'),
  L('Pressure-test the lines for at least 24 hours before closing the wall. Ask for the test to be photographed.', 'दीवार बंद करने से पहले लाइनों को कम से कम 24 घंटे प्रेशर-टेस्ट करवाएँ और उसकी फ़ोटो माँगें।'));

const CARPENTRY = g('carpentry', L('Boards & hardware', 'बोर्ड और हार्डवेयर'),
  L('BWP/MR-grade plywood carcass, laminate shutters, standard hinges and channels', 'BWP/MR ग्रेड प्लाईवुड ढाँचा, लैमिनेट शटर, सामान्य कब्ज़े और चैनल'),
  L('BWP plywood (IS 303/710) carcass, 1 mm laminate or acrylic shutters, soft-close hinges and telescopic channels', 'BWP प्लाईवुड (IS 303/710) ढाँचा, 1 mm लैमिनेट या एक्रिलिक शटर, सॉफ़्ट-क्लोज़ कब्ज़े और चैनल'),
  L('Marine-grade ply, PU/veneer finish, imported-quality hardware with lifetime-warranty mechanisms', 'मरीन-ग्रेड प्लाई, PU/वेनियर फ़िनिश, लंबी वारंटी वाले उच्च गुणवत्ता के हार्डवेयर'),
  L('Wardrobes and kitchens fail at the hinges and channels first — spend on hardware, not on the shutter face.', 'वार्डरोब और किचन सबसे पहले कब्ज़ों और चैनल पर खराब होते हैं — खर्च हार्डवेयर पर करें, शटर के ऊपरी रूप पर नहीं।'));

const STRUCT = g('structure', L('Cement, steel & bricks', 'सीमेंट, सरिया और ईंट'),
  L('OPC 43 / PPC cement, Fe 500 TMT bars from a BIS-certified mill, fly-ash bricks', 'OPC 43 / PPC सीमेंट, BIS प्रमाणित मिल का Fe 500 TMT सरिया, फ़्लाई-ऐश ईंट'),
  L('PPC cement for RCC, Fe 500D TMT, fly-ash/AAC blocks, washed sand with a silt test', 'RCC के लिए PPC सीमेंट, Fe 500D TMT, फ़्लाई-ऐश/AAC ब्लॉक, सिल्ट टेस्ट के साथ धुली रेत'),
  L('Fe 500D/550D corrosion-resistant TMT, ready-mix concrete, AAC blocks with polymer mortar', 'Fe 500D/550D जंग-रोधी TMT, रेडी-मिक्स कंक्रीट, पॉलिमर मसाले के साथ AAC ब्लॉक'),
  L('Have the engineer check bar diameters and cover on site before every pour. Never let concrete be poured on trust.', 'हर ढलाई से पहले इंजीनियर से सरिये का व्यास और कवर साइट पर जँचवाएँ। भरोसे पर कंक्रीट न डलवाएँ।'));

const COUNTER = g('counter', L('Kitchen platform & sink', 'किचन प्लेटफ़ॉर्म और सिंक'),
  L('Granite or polished kadappa slab, single-bowl stainless sink (304 grade)', 'ग्रेनाइट या पॉलिश कडप्पा स्लैब, सिंगल-बाउल स्टेनलेस (304 ग्रेड) सिंक'),
  L('Granite 18–20 mm with drip edge, 304-grade sink with drainboard, tiled dado', '18–20 mm ग्रेनाइट ड्रिप-एज के साथ, ड्रेनबोर्ड वाला 304 ग्रेड सिंक, टाइल डैडो'),
  L('Quartz or engineered stone counter, undermount sink, backsplash to the chimney', 'क्वार्ट्ज़ या इंजीनियर्ड स्टोन काउंटर, अंडरमाउंट सिंक, चिमनी तक बैकस्प्लैश'),
  L('Test stainless with a magnet: real 304 is barely magnetic. Cheap sinks rust at the welds.', 'स्टेनलेस को चुंबक से परखें: असली 304 लगभग चुंबकीय नहीं होता। सस्ते सिंक जोड़ों पर जंग खाते हैं।'));

const LIGHT = g('lighting', L('Lighting', 'लाइटिंग'),
  L('LED panels and battens, 3000–4000 K', 'LED पैनल और बैटन, 3000–4000 K'),
  L('LED downlights with dimmable drivers, warm 3000 K for living areas, cool 4000 K for work areas', 'डिमेबल ड्राइवर वाली LED डाउनलाइट, लिविंग में गर्म 3000 K, काम की जगह पर 4000 K'),
  L('Layered lighting: cove, profile and accent, smart dimming, CRI 90+ fixtures', 'परतदार लाइटिंग: कोव, प्रोफ़ाइल और एक्सेंट, स्मार्ट डिमिंग, CRI 90+ फ़िक्सचर'),
  L('Plan the light points before the false ceiling goes up — adding them later means cutting the finished ceiling.', 'फ़ॉल्स सीलिंग लगने से पहले लाइट पॉइंट तय करें — बाद में जोड़ने पर बनी सीलिंग काटनी पड़ती है।'));

export const MATERIALS: Record<string, MaterialGuide[]> = {
  'new-bathroom': [WATERPROOF, TILE, PLUMB],
  kitchen: [COUNTER, TILE, CARPENTRY],
  'wall-break': [g('lintel', L('Support & finishing', 'सहारा और फ़िनिशिंग'),
    L('Steel props during work; RCC lintel designed by the engineer', 'काम के दौरान स्टील प्रॉप; इंजीनियर से डिज़ाइन किया RCC लिंटल'),
    L('Adjustable steel props; RCC or steel-I-beam lintel as specified, non-shrink grout at bearings', 'एडजस्टेबल स्टील प्रॉप; बताए अनुसार RCC या स्टील I-बीम लिंटल, बेयरिंग पर नॉन-श्रिंक ग्राउट'),
    L('Steel I-beam with fire-rated cladding and crack-control mesh in the patching', 'अग्निरोधी क्लैडिंग वाली स्टील I-बीम और पैचिंग में क्रैक-कंट्रोल जाली'),
    L('The engineer’s written sign-off comes before demolition, not after.', 'इंजीनियर की लिखित मंज़ूरी तोड़फोड़ से पहले आती है, बाद में नहीं।')), PAINT, STRUCT],
  rewiring: [WIRING, g('conduit', L('Conduit & boxes', 'कंड्यूट और बॉक्स'),
    L('ISI-marked PVC conduit, 20/25 mm, standard GI boxes', 'ISI मार्क वाला PVC कंड्यूट, 20/25 mm, सामान्य GI बॉक्स'),
    L('Heavy-gauge PVC conduit with proper bends and junction boxes for every joint', 'भारी गेज का PVC कंड्यूट, सही मोड़ और हर जोड़ पर जंक्शन बॉक्स'),
    L('Fire-retardant conduit with spare draw-wires for future circuits', 'आग-रोधी कंड्यूट, भविष्य के सर्किट के लिए अतिरिक्त पुल-वायर'),
    L('No joints inside the wall without an accessible box. Hidden twisted joints cause most electrical fires.', 'दीवार के अंदर बिना खुलने वाले बॉक्स के कोई जोड़ नहीं। छिपे मरोड़े हुए जोड़ ही ज़्यादातर बिजली की आग की वजह हैं।')), LIGHT],
  waterproofing: [WATERPROOF, g('crack', L('Crack repair & screed', 'दरार भराई और स्क्रीड'),
    L('Polymer-modified mortar for cracks, cement screed for slope', 'दरारों के लिए पॉलिमर-मॉडिफ़ाइड मसाला, ढलान के लिए सीमेंट स्क्रीड'),
    L('Chase and fill cracks with polymer mortar and fibre mesh; 1:100 slope toward the outlet', 'दरारें काटकर पॉलिमर मसाले और फ़ाइबर जाली से भरें; निकास की ओर 1:100 ढलान'),
    L('Reflective heat-insulating top coat or brick-bat coba over the membrane', 'झिल्ली के ऊपर परावर्तक ताप-रोधी टॉप कोट या ब्रिक-बैट कोबा'),
    L('Fix the slope first. Water that can’t run off will find the weakest crack.', 'पहले ढलान ठीक करें। जो पानी बह नहीं पाता वह सबसे कमज़ोर दरार ढूँढ लेता है।')), STRUCT],
  painting: [PAINT, g('surface', L('Surface prep', 'सतह की तैयारी'),
    L('Scrape loose paint, fill cracks, one coat of primer', 'ढीला पेंट खुरचें, दरारें भरें, प्राइमर का एक कोट'),
    L('Two coats of putty sanded smooth, alkali-resistant primer on fresh plaster', 'दो कोट पुट्टी और रेगमाल से चिकना, नए प्लास्टर पर क्षार-रोधी प्राइमर'),
    L('Damp-proof primer on seepage walls, fungicidal wash before painting', 'सीलन वाली दीवारों पर डैम्प-प्रूफ़ प्राइमर, पेंट से पहले फफूंद-नाशक धुलाई'),
    L('Peeling paint is almost always damp behind the wall. Fix the leak before repainting.', 'पेंट का उखड़ना लगभग हमेशा दीवार के पीछे सीलन का संकेत है। दोबारा पेंट से पहले लीकेज ठीक करें।'))],
  'full-renovation': [WIRING, PLUMB, TILE, PAINT],
  'new-house': [STRUCT, WATERPROOF, WIRING, g('doors', L('Doors & windows', 'दरवाज़े और खिड़कियाँ'),
    L('Flush doors on sal-wood or engineered frames, powder-coated aluminium windows', 'साल-लकड़ी/इंजीनियर्ड फ़्रेम पर फ़्लश दरवाज़े, पाउडर-कोटेड एल्यूमीनियम खिड़कियाँ'),
    L('Treated hardwood or WPC frames, uPVC or heavy-section aluminium windows with mosquito mesh', 'ट्रीटेड हार्डवुड या WPC फ़्रेम, मच्छर जाली वाली uPVC या भारी सेक्शन एल्यूमीनियम खिड़कियाँ'),
    L('Solid-core teak-faced doors, double-glazed uPVC for noise and heat', 'ठोस कोर वाले टीक-फ़ेस दरवाज़े, शोर और गर्मी के लिए डबल-ग्लास uPVC'),
    L('Windows are where heat and rain get in. Check the drainage slots and gasket, not only the frame.', 'खिड़कियों से ही गर्मी और बारिश अंदर आती है। सिर्फ़ फ़्रेम नहीं, ड्रेनेज स्लॉट और गैस्केट भी जाँचें।'))],
  'interiors-full': [CARPENTRY, LIGHT, g('finish', L('Ceiling & wall finish', 'सीलिंग और दीवार की फ़िनिश'),
    L('POP or gypsum false ceiling in key rooms; emulsion walls', 'मुख्य कमरों में POP या जिप्सम फ़ॉल्स सीलिंग; इमल्शन दीवारें'),
    L('Gypsum board ceiling on GI framework, moisture-resistant board in humid areas, washable paint', 'GI फ़्रेमवर्क पर जिप्सम बोर्ड सीलिंग, नमी वाली जगह पर नमी-रोधी बोर्ड, धुलने लायक पेंट'),
    L('Textured or wallpapered feature walls, wooden or fluted panels, acoustic treatment for media rooms', 'टेक्सचर या वॉलपेपर वाली फ़ीचर दीवारें, लकड़ी/फ़्लूटेड पैनल, मीडिया रूम में साउंड-रोधी काम'),
    L('Keep AC and curtain-track positions in the design drawing before any ceiling work starts.', 'सीलिंग का काम शुरू होने से पहले AC और पर्दे की रेल की जगह डिज़ाइन ड्रॉइंग में तय रखें।'))],
  'interiors-room': [CARPENTRY, LIGHT],
};

export const materialsFor = (typeId: string): MaterialGuide[] => MATERIALS[typeId] ?? [];
export const loc = (l: Loc, lang: 'en' | 'hi') => (lang === 'hi' ? l.hi : l.en);
