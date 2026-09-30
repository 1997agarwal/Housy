// Translates text the SERVER generates (validation errors, timeline entries, quote findings) at display time.
// The server keeps writing English — it is what's stored, and it keeps old projects working — and the client maps it
// to Hindi here. `server-text.test.ts` scans the source for every message the server can throw and fails if one has
// no Hindi, so a new untranslated message can't slip in. Text typed by users (notes, feedback, chat) is never touched.
import type { Lang } from './messages';
import { PROJECT_TYPES } from './catalog';

const PHASE_HI = new Map<string, string>();
for (const t of PROJECT_TYPES) for (const p of t.phases) if (p.nameHi) PHASE_HI.set(p.name, p.nameHi);
const phase = (name: string) => PHASE_HI.get(name) ?? (name.startsWith('Change: ') ? `बदलाव: ${name.slice(8)}` : name);                       // milestone names are phase names (or "Change: …" typed by the user)

const VISIT: Record<string, string> = { 'site visit': 'साइट विज़िट', 'design consultation': 'डिज़ाइन कंसल्टेशन', 'plot visit': 'प्लॉट विज़िट' };
const visit = (s: string) => VISIT[s.toLowerCase()] ?? s;
const CATEGORY: Record<string, string> = {
  materials: 'सामान', 'labour (outside housy)': 'मज़दूरी (Housy के बाहर)', 'equipment rental': 'उपकरण किराया', 'fixtures & appliances': 'फ़िक्सचर और उपकरण',
  'furniture & décor': 'फ़र्नीचर और सजावट', 'permits & fees': 'परमिट और फ़ीस', other: 'अन्य',
};
const FIELD: Record<string, string> = {
  'Property area': 'प्रॉपर्टी का क्षेत्रफल', 'Property value': 'प्रॉपर्टी का मूल्य', 'Measured area': 'नापा हुआ क्षेत्रफल', 'Measured drain distance': 'नापी हुई नाली की दूरी',
  Area: 'क्षेत्रफल', 'Drain distance': 'नाली की दूरी', Amount: 'राशि', Budget: 'बजट', Price: 'कीमत', Days: 'दिन',
  Description: 'विवरण', Message: 'संदेश', Reply: 'जवाब', Resolution: 'समाधान', Position: 'स्थान', Width: 'चौड़ाई', Length: 'लंबाई', 'Septic position': 'सेप्टिक की जगह',
};
const f = (s: string) => FIELD[s] ?? s;
const CRITERION: Record<string, string> = { 'quality of work': 'काम की गुणवत्ता', punctuality: 'समय की पाबंदी', behaviour: 'व्यवहार', 'value for money': 'पैसे का मूल्य' };

const EXACT: Record<string, string> = {
  // ── client-side fallbacks when the server sent no message ──
  'Couldn’t load messages — check your connection.': 'संदेश लोड नहीं हो सके — कनेक्शन जाँचें।', 'That recording is too large — keep it shorter.': 'वह रिकॉर्डिंग बहुत बड़ी है — छोटी रखें।', 'Could not reach Housy — your message was not sent.': 'Housy तक नहीं पहुँच सके — आपका संदेश नहीं भेजा गया।',
  'Could not save — please try again': 'सेव नहीं हो सका — कृपया फिर कोशिश करें', 'Could not save': 'सेव नहीं हो सका', 'Could not book': 'बुकिंग नहीं हो सकी', 'Could not join waitlist': 'वेटलिस्ट में नहीं जुड़ सके',
  'Action failed — please try again': 'काम नहीं हो सका — कृपया फिर कोशिश करें', 'Could not send': 'भेजा नहीं जा सका', 'Something went wrong': 'कुछ गड़बड़ हो गई', 'Could not load project': 'प्रोजेक्ट लोड नहीं हो सका',
  'Could not reach Housy — check your connection and try again': 'Housy तक नहीं पहुँच सके — कनेक्शन जाँचकर फिर कोशिश करें', 'bad project id': 'प्रोजेक्ट आईडी सही नहीं है',
  // ── request / auth ──
  'Unknown action': 'अज्ञात कार्रवाई', 'Unknown city': 'अज्ञात शहर', 'Not found': 'नहीं मिला', 'Project not found': 'प्रोजेक्ट नहीं मिला', 'Photo not found': 'फ़ोटो नहीं मिली', 'Voice note not found': 'वॉइस नोट नहीं मिला',
  'Not authorised': 'आपको इसकी अनुमति नहीं है', 'Server is missing HOUSY_SESSION_SECRET': 'सर्वर में HOUSY_SESSION_SECRET सेट नहीं है',
  'Enter a valid 10-digit Indian mobile number': '10 अंकों का सही भारतीय मोबाइल नंबर डालें', 'Enter the 6-digit code': '6 अंकों का कोड डालें', 'Please log in with your mobile number': 'कृपया अपने मोबाइल नंबर से लॉग इन करें',
  'Code expired — request a new one': 'कोड की समय-सीमा खत्म हो गई — नया कोड मँगाएँ', 'Too many attempts — request a new code': 'बहुत ज़्यादा कोशिशें हो गईं — नया कोड मँगाएँ', 'Incorrect code': 'कोड सही नहीं है',
  'Could not send the SMS. Please try again.': 'SMS नहीं भेजा जा सका। कृपया फिर कोशिश करें।', 'SMS login is not configured on this server.': 'इस सर्वर पर SMS लॉगिन सेट नहीं है।',
  'Request is too large': 'अनुरोध बहुत बड़ा है', 'Request body is required': 'अनुरोध की जानकारी ज़रूरी है', 'Request body is not valid JSON': 'अनुरोध की जानकारी सही प्रारूप में नहीं है', 'Request body must be a JSON object': 'अनुरोध की जानकारी सही प्रारूप में होनी चाहिए',
  // ── uploads ──
  'No image provided': 'कोई फ़ोटो नहीं मिली', 'Upload a JPEG, PNG or WebP image': 'JPEG, PNG या WebP फ़ोटो अपलोड करें', 'Image is too large (max 2 MB)': 'फ़ोटो बहुत बड़ी है (अधिकतम 2 MB)', 'That file is not a valid image': 'यह फ़ाइल सही फ़ोटो नहीं है',
  'No voice note provided': 'कोई वॉइस नोट नहीं मिला', 'That is not a voice recording': 'यह वॉइस रिकॉर्डिंग नहीं है', 'Voice note is too long': 'वॉइस नोट बहुत लंबा है', 'That file is not a valid voice recording': 'यह फ़ाइल सही वॉइस रिकॉर्डिंग नहीं है',
  // ── chat ──
  'That person is not on this project': 'यह व्यक्ति इस प्रोजेक्ट में नहीं है', 'This conversation has reached its message limit — contact Housy support': 'इस बातचीत की संदेश-सीमा पूरी हो गई है — Housy सपोर्ट से संपर्क करें',
  'This project was cancelled': 'यह प्रोजेक्ट रद्द हो चुका है', 'Write a message first': 'पहले संदेश लिखें',
  // ── issues ──
  'Choose what kind of problem this is': 'चुनें कि यह किस तरह की समस्या है', 'Problems can be reported once work has started': 'काम शुरू होने के बाद ही समस्या दर्ज की जा सकती है',
  'That milestone is not part of this project': 'यह माइलस्टोन इस प्रोजेक्ट का हिस्सा नहीं है', 'Problem not found': 'समस्या नहीं मिली', 'This problem is resolved — reopen it to add more': 'यह समस्या हल हो चुकी है — और जोड़ने के लिए इसे दोबारा खोलें',
  'Already resolved': 'पहले से हल हो चुकी है', 'This problem is still open': 'यह समस्या अभी खुली है',
  // ── home plan / profile ──
  'Plan must contain rooms': 'प्लान में कमरे होने चाहिए', 'Invalid room id': 'कमरे की पहचान सही नहीं है', 'Unknown room type': 'कमरे का प्रकार अज्ञात है', 'Every room needs a name': 'हर कमरे का नाम होना चाहिए',
  'Enter your full name': 'अपना पूरा नाम डालें', 'Enter a valid email or leave it blank': 'सही ईमेल डालें या खाली छोड़ दें', 'Choose a language': 'भाषा चुनें',
  'Tell us where you live relative to the property': 'बताएँ कि आप प्रॉपर्टी के सापेक्ष कहाँ रहते हैं', 'Choose the city where your property is': 'वह शहर चुनें जहाँ आपकी प्रॉपर्टी है',
  'Choose a property type': 'प्रॉपर्टी का प्रकार चुनें', 'Choose a timeline': 'समय-सीमा चुनें', 'Pick at least one thing you want to do': 'कम से कम एक काम चुनें जो आप करवाना चाहते हैं', 'Invalid account': 'अकाउंट सही नहीं है',
  // ── projects ──
  'Unknown project type': 'प्रोजेक्ट का प्रकार अज्ञात है', 'Choose a city': 'शहर चुनें', 'Name is required': 'नाम ज़रूरी है', 'Pick a visit slot': 'विज़िट का समय चुनें',
  'That visit time has already passed — pick a new slot': 'वह समय निकल चुका है — नया समय चुनें', 'Pick a slot within the next two months': 'अगले दो महीनों के भीतर का समय चुनें', 'Invalid quality tier': 'क्वालिटी की श्रेणी सही नहीं है',
  'Pick a design style': 'डिज़ाइन स्टाइल चुनें', 'Pick at least one room': 'कम से कम एक कमरा चुनें', 'Unknown room selected': 'चुना हुआ कमरा अज्ञात है',
  'Visit already completed': 'विज़िट पहले ही पूरी हो चुकी है', 'The visit has already happened': 'विज़िट हो चुकी है', 'Pick a future time slot': 'आगे का कोई समय चुनें',
  'Work has already started — contact Housy support to cancel': 'काम शुरू हो चुका है — रद्द करने के लिए Housy सपोर्ट से संपर्क करें', 'No quote to accept': 'मंज़ूर करने के लिए कोई कोटेशन नहीं है',
  'Choose a category': 'श्रेणी चुनें', 'Choose how you paid': 'चुनें कि भुगतान कैसे किया', 'Pick a valid date (not in the future)': 'सही तारीख़ चुनें (भविष्य की नहीं)', 'Expense not found': 'ख़र्च नहीं मिला',
  'Scope changes can be requested while work is in progress': 'काम चलने के दौरान ही बदलाव का अनुरोध किया जा सकता है', 'Give the change a short title (3–80 characters)': 'बदलाव को छोटा शीर्षक दें (3–80 अक्षर)',
  'Describe the change in at least 10 characters': 'बदलाव को कम से कम 10 अक्षरों में समझाएँ', 'Choose who should do the extra work': 'चुनें कि अतिरिक्त काम कौन करेगा', 'Change not found': 'बदलाव नहीं मिला',
  'This change has already been priced': 'इस बदलाव की कीमत पहले ही तय हो चुकी है', 'Project is not active': 'प्रोजेक्ट अभी सक्रिय नहीं है', 'There is no price to approve yet': 'मंज़ूर करने के लिए अभी कोई कीमत नहीं है',
  'This change is already decided': 'इस बदलाव पर पहले ही फ़ैसला हो चुका है', 'Milestone not found': 'माइलस्टोन नहीं मिला', 'Milestone already started': 'माइलस्टोन शुरू हो चुका है',
  'Finish and approve earlier milestones first': 'पहले पिछले माइलस्टोन पूरे करके मंज़ूर करें', 'Milestone is not in progress': 'माइलस्टोन अभी चल नहीं रहा', 'There is nothing to review yet': 'अभी जाँचने के लिए कुछ नहीं है',
  'Tell the crew what needs to change': 'टीम को बताएँ कि क्या बदलना है', 'Maximum revisions reached — contact Housy support to resolve this': 'अधिकतम बदलाव-अनुरोध पूरे हो गए — इसे सुलझाने के लिए Housy सपोर्ट से संपर्क करें',
  'Nothing to approve yet': 'अभी मंज़ूर करने के लिए कुछ नहीं है', 'Photos can only be added while the work is in progress': 'फ़ोटो सिर्फ़ काम चलने के दौरान जोड़ी जा सकती हैं',
  'Add a new photo showing the requested changes': 'माँगे गए बदलाव दिखाती हुई एक नई फ़ोटो जोड़ें', 'Add at least one site photo as proof of work': 'काम के सबूत के तौर पर कम से कम एक साइट फ़ोटो जोड़ें',
  // ── reviews ──
  'You can review your crew once the project is completed': 'प्रोजेक्ट पूरा होने के बाद ही आप टीम को रेटिंग दे सकते हैं', 'That person did not work on this project': 'इस व्यक्ति ने इस प्रोजेक्ट पर काम नहीं किया',
  'You have already reviewed this person for this project': 'आप इस प्रोजेक्ट के लिए इस व्यक्ति को पहले ही रेट कर चुके हैं',
  // ── timeline / findings / flags (fixed text) ──
  'Project completed 🎉': 'प्रोजेक्ट पूरा हुआ 🎉', 'You declined the quote and cancelled the project': 'आपने कोटेशन अस्वीकार करके प्रोजेक्ट रद्द किया', 'You cancelled the project': 'आपने प्रोजेक्ट रद्द किया',
  'You removed your budget': 'आपने अपना बजट हटा दिया', 'Fixed price: only changes if you change the scope in writing.': 'तय कीमत: तभी बदलेगी जब आप लिखित में काम का दायरा बदलेंगे।',
  'Structural work involved — a licensed structural engineer must sign off before any demolition. This is built into the plan.': 'स्ट्रक्चरल काम शामिल है — किसी भी तोड़फोड़ से पहले लाइसेंस्ड स्ट्रक्चरल इंजीनियर की मंज़ूरी ज़रूरी है। यह प्लान में पहले से शामिल है।',
  'Distance to the nearest drain/septic is unknown — the site visit will measure it; cost may change.': 'नज़दीकी नाली/सेप्टिक की दूरी पता नहीं — साइट विज़िट में नापी जाएगी; लागत बदल सकती है।',
  'Map approval from your local development authority is required before construction. Timeline assumes approval is obtained during the design phase.': 'निर्माण से पहले स्थानीय विकास प्राधिकरण से नक्शा पास कराना ज़रूरी है। समय-सीमा मानती है कि मंज़ूरी डिज़ाइन चरण में मिल जाएगी।',
  'Design is approved by you in 3D before any work or material order starts.': 'कोई भी काम या सामान का ऑर्डर शुरू होने से पहले डिज़ाइन आपकी 3D मंज़ूरी से पास होता है।',
  'You approve the 3D design before any work starts.': 'काम शुरू होने से पहले 3D डिज़ाइन आपकी मंज़ूरी से पास होता है।',
  'Premium tier: material lead-times can add 3–7 days.': 'प्रीमियम श्रेणी: सामान मिलने में 3–7 दिन अतिरिक्त लग सकते हैं।',
};

type Rule = [RegExp, (m: RegExpMatchArray) => string];
const RULES: Rule[] = [
  [/^🎤 Voice note \((\d+)s\)$/, (m) => `🎤 वॉइस नोट (${m[1]} सेकंड)`],
  [/^Resolved: ([\s\S]+)$/, (m) => `सुलझाया गया: ${m[1]}`],
  [/^Unknown project type: (.+)$/, (m) => `अज्ञात प्रोजेक्ट प्रकार: ${m[1]}`],
  [/^(.+) must be at least (\d+) characters$/, (m) => `${FIELD[m[1]] ?? m[1]} कम से कम ${m[2]} अक्षर का होना चाहिए`],
  // ── errors with numbers/names ──
  [/^Too many code requests\. Try again in (\d+) min$/, (m) => `कोड के बहुत ज़्यादा अनुरोध हो गए। ${m[1]} मिनट बाद फिर कोशिश करें`],
  [/^Too many code requests for this number\. Try again in (\d+) min$/, (m) => `इस नंबर के लिए कोड के बहुत ज़्यादा अनुरोध हो गए। ${m[1]} मिनट बाद फिर कोशिश करें`],
  [/^Please wait (\d+)s before requesting another code$/, (m) => `दूसरा कोड मँगाने से पहले ${m[1]} सेकंड रुकें`],
  [/^Too many sign-ups from your network\. Try again in (\d+) min$/, (m) => `आपके नेटवर्क से बहुत ज़्यादा साइन-अप हो गए। ${m[1]} मिनट बाद फिर कोशिश करें`],
  [/^Messages can be up to (\d+) characters$/, (m) => `संदेश अधिकतम ${m[1]} अक्षरों का हो सकता है`],
  [/^You are sending messages too fast — try again in (\d+)s$/, (m) => `आप बहुत तेज़ी से संदेश भेज रहे हैं — ${m[1]} सेकंड बाद फिर कोशिश करें`],
  [/^Voice notes can be 1–(\d+) seconds$/, (m) => `वॉइस नोट 1–${m[1]} सेकंड का हो सकता है`],
  [/^(Description|Message|Reply|Resolution) must be at least (\d+) characters$/, (m) => `${f(m[1])} कम से कम ${m[2]} अक्षर का होना चाहिए`],
  [/^You already have (\d+) open problems on this project — please wait for them to be resolved$/, (m) => `इस प्रोजेक्ट पर आपकी ${m[1]} समस्याएँ पहले से खुली हैं — उनके हल होने तक इंतज़ार करें`],
  [/^A plan can have at most (\d+) rooms$/, (m) => `एक प्लान में अधिकतम ${m[1]} कमरे हो सकते हैं`],
  [/^(.+) must be between (\d+) and (\d+)$/, (m) => `${f(m[1])} ${m[2]} और ${m[3]} के बीच होना चाहिए`],
  [/^(.+) looks wrong$/, (m) => `${f(m[1])} ठीक नहीं लग रहा`],
  [/^We are not live in (.+) yet — join the waitlist and we will tell you first$/, (m) => `हम अभी ${m[1]} में उपलब्ध नहीं हैं — वेटलिस्ट में जुड़ें, सबसे पहले हम आपको बताएँगे`],
  [/^(.+) is already live — you can book directly$/, (m) => `${m[1]} में हम पहले से उपलब्ध हैं — आप सीधे बुक कर सकते हैं`],
  [/^Unknown .+ option$/, () => 'चुना हुआ विकल्प अज्ञात है'],
  [/^You can log up to (\d+) expenses per project$/, (m) => `एक प्रोजेक्ट में आप अधिकतम ${m[1]} ख़र्च दर्ज कर सकते हैं`],
  [/^Please decide on your (\d+) pending changes first$/, (m) => `पहले अपने ${m[1]} लंबित बदलावों पर फ़ैसला करें`],
  [/^At most (\d+) photos per submission$/, (m) => `एक बार में अधिकतम ${m[1]} फ़ोटो`],
  [/^No verified .+ available in this city yet$/, () => 'इस शहर में इस काम के लिए अभी कोई वेरिफ़ाइड कारीगर उपलब्ध नहीं'],
  [/^Rate (.+) from 1 to 5$/, (m) => `${CRITERION[m[1]] ?? m[1]} को 1 से 5 तक रेट करें`],
  // ── timeline ──
  [/^(Site visit|Design consultation|Plot visit) booked for (.+)$/, (m) => `${visit(m[1])} बुक हुई: ${m[2]}`],
  [/^Visit rescheduled to (.+)$/, (m) => `विज़िट का समय बदलकर ${m[1]} किया गया`],
  [/^(.+) completed the (site visit|design consultation|plot visit) and issued a fixed quote of (₹[\d,]+)(?: \(estimate at booking: (₹[\d,]+)\))?$/,
    (m) => `${m[1]} ने ${visit(m[2])} पूरी करके ${m[3]} का तय कोटेशन जारी किया${m[4] ? ` (बुकिंग के समय अनुमान: ${m[4]})` : ''}`],
  [/^Quote accepted — advance of (₹[\d,]+) paid$/, (m) => `कोटेशन मंज़ूर — ${m[1]} का अग्रिम भुगतान हुआ`],
  [/^(.+) started: (.+)$/, (m) => `${m[1]} ने शुरू किया: ${phase(m[2])}`],
  [/^(.+) submitted for your review: (.+)$/, (m) => `${m[1]} ने आपकी जाँच के लिए जमा किया: ${phase(m[2])}`],
  [/^You asked (.+) for changes to "(.+)" \(round (\d+) of (\d+)\): ([\s\S]*)$/, (m) => `आपने ${m[1]} से "${phase(m[2])}" में बदलाव माँगे (राउंड ${m[3]}/${m[4]}): ${m[5]}`],
  [/^You approved "(.+)" — (₹[\d,]+) released$/, (m) => `आपने "${phase(m[1])}" मंज़ूर किया — ${m[2]} जारी हुए`],
  [/^(.+) added a photo to "(.+)"$/, (m) => `${m[1]} ने "${phase(m[2])}" में एक फ़ोटो जोड़ी`],
  [/^You logged (₹[\d,]+) for (.+)$/, (m) => `आपने ${CATEGORY[m[2]] ?? m[2]} के लिए ${m[1]} दर्ज किए`],
  [/^You set your budget to (₹[\d,]+)$/, (m) => `आपने बजट ${m[1]} तय किया`],
  [/^You requested a change: ([\s\S]+)$/, (m) => `आपने बदलाव माँगा: ${m[1]}`],
  [/^(.+) priced "(.+)" at (₹[\d,]+)$/, (m) => `${m[1]} ने "${m[2]}" की कीमत ${m[3]} तय की`],
  [/^You approved the change "(.+)" \(\+(₹[\d,]+)\) — new total (₹[\d,]+)$/, (m) => `आपने बदलाव "${m[1]}" मंज़ूर किया (+${m[2]}) — नया कुल ${m[3]}`],
  [/^You declined the change "(.+)"$/, (m) => `आपने बदलाव "${m[1]}" अस्वीकार किया`],
  // ── quote findings / estimate flags ──
  [/^Measured (\d+) sq ft on site \(you estimated (\d+)(?:, ([+-]\d+)%)?\)\.$/, (m) => `साइट पर ${m[1]} वर्ग फ़ुट नापा गया (आपका अनुमान ${m[2]}${m[3] ? `, ${m[3]}%` : ''})।`],
  [/^Measured drain\/septic distance: ([\d.]+) ft \(you estimated (.+)\)\.$/, (m) => `नाली/सेप्टिक की नापी हुई दूरी: ${m[1]} फ़ुट (आपका अनुमान ${m[2] === 'unknown' ? 'पता नहीं' : m[2]})।`],
  [/^Measured on site: (\d+) sq ft — matches your estimate\.$/, (m) => `साइट पर नापा: ${m[1]} वर्ग फ़ुट — आपके अनुमान से मेल खाता है।`],
  [/^Expert note: ([\s\S]+)$/, (m) => `एक्सपर्ट का नोट: ${m[1]}`],
  [/^Drain run of ([\d.]+) ft needs about ([\d.]+) in of fall at 1:40 — expect a raised floor or sunk slab, and possibly an extra inspection chamber\.$/,
    (m) => `${m[1]} फ़ुट के ड्रेन रन पर 1:40 ढलान से लगभग ${m[2]} इंच का उतार चाहिए — ऊँचा फ़र्श या सिंक्ड स्लैब, और शायद अतिरिक्त इंस्पेक्शन चैंबर लगेगा।`],
  [/^Drain run of ([\d.]+) ft is comfortably within a workable 1:40 slope\.$/, (m) => `${m[1]} फ़ुट का ड्रेन रन 1:40 की काम-लायक ढलान में आराम से आता है।`],
];

export function translateServerText(text: string, lang: Lang): string {
  if (lang !== 'hi' || typeof text !== 'string' || !text) return text;
  const exact = EXACT[text];
  if (exact) return exact;
  for (const [re, fn] of RULES) { const m = text.match(re); if (m) return fn(m); }
  return text;                                       // unknown or user-written text stays as-is
}
