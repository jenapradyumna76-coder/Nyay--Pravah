// [Section] Simple client-side i18n for navbar language switch.
// [Note] Translations are applied to elements that declare data-i18n keys.
document.addEventListener('DOMContentLoaded', () => {
    const LANGUAGE_STORAGE_KEY = 'nyay_pravah_lang_v1';
    const FALLBACK_LANG = 'en';
    const languageLinks = document.querySelectorAll('.tertiary-menu a[data-lang]');
    const languageButton = document.querySelector('.lang-btn');

    const translations = {
        en: {
            'brand.name': 'NYAY PRAVHA',
            'brand.flow': 'THE FLOW OF JUSTICE',
            'nav.home': 'Home',
            'nav.about': 'About',
            'nav.services': 'Services',
            'nav.about.mission': 'Our Mission',
            'nav.about.team': 'The Team',
            'nav.about.tech': 'Tech Stack',
            'nav.about.roadmap': 'Roadmap',
            'nav.about.contact': 'Contact',
            'nav.service.caseSearch': 'Case Search',
            'nav.service.lawyerPortal': 'Lawyer Portal',
            'nav.service.legalAid': 'Legal Aid',
            'nav.service.documentVault': 'Document Vault',
            'nav.service.helpCenter': 'Help Center',
            'lang.english': 'English',
            'lang.hindi': 'Hindi',
            'lang.odia': 'Odia',
            'lang.telugu': 'Telugu',
            'action.judge': 'Judge',
            'action.lawyer': 'Lawyer',
            'section.services': 'Services',
            'section.description': 'Description',
            'section.about': 'About Us',
            'section.mentor': 'Our Mentor',
            'service.ai.title': 'AI Case Search',
            'service.ai.text': 'Find judgments, precedents, and related case history quickly with intelligent legal search.',
            'service.lawyer.title': 'Lawyer Portal',
            'service.lawyer.text': 'Manage client matters, track filings, and organize legal documents in one secure workspace.',
            'service.judge.title': 'Judge Portal',
            'service.judge.text': 'Enable judges to review case timelines, monitor hearing flow, and access organized legal records quickly.',
            'about.intro': 'We are Team Code Dazzlers, building Nyay Pravah to transform how justice services are discovered, understood, and delivered through smart digital tools.',
            'about.vision.title': 'Our Vision',
            'about.vision.text': 'To create a faster and more inclusive legal ecosystem where citizens, lawyers, and judges can access trusted legal information without friction.',
            'about.build.title': 'What We Build',
            'about.build.text': 'AI-powered case discovery, lawyer and judge portals, and structured legal workflows that reduce complexity and improve decision support.',
            'about.commitment.title': 'Our Commitment',
            'about.commitment.text': 'We focus on transparency, usability, and reliability so legal processes become clearer, quicker, and more accessible to everyone.',
            'mentor.role': 'Technical Mentor & Strategic Advisor',
            'mentor.quote': '"A distinguished academician and researcher at NIST University, Dr. Ashis Kumar Dass serves as the primary mentor for the Nyay Pravah initiative."',
            'mentor.text.one': 'With over 15 years of expertise in Cloud Computing, Blockchain, and System Security, he provides the foundational guidance necessary for building a transparent and secure digital judicial ecosystem.',
            'mentor.text.two': 'His research-driven approach ensures that our platform adheres to the highest standards of data integrity and technical excellence, bridging the gap between innovative engineering and judicial reliability.',
            'footer.ai': 'AI Case Search',
            'footer.faq': 'FAQ / User Guides',
            'footer.status': 'Service Status',
            'footer.api': 'Developer API',
            'footer.privacy': 'Privacy Policy',
            'footer.data': 'Data Handling Protocol',
            'footer.feedback': 'Feedback Portal',
            'footer.accessibility': 'Accessibility',
            'footer.about.nyay': 'About NYAY Pravah',
            'footer.about.team': 'The Team (Code Dazzlers)',
            'footer.about.tech': 'Technology Stack',
            'footer.about.hackathon': "MHERM Hackathon '26",
            'footer.app.name': 'NAV PRAVAH',
            'footer.app.tagline': 'Justice. Accelerated.',
            'footer.policy.website': 'Website Policies',
            'footer.policy.contact': 'Contact Us',
            'footer.policy.help': 'Help',
            'footer.policy.disclaimer': 'Disclaimer',
            'footer.copy.managed': 'Content Managed & Maintained by Code Dazzlers.',
            'footer.copy.built': 'Built for the MHERM Hackathon 2026.',
            'footer.copy.update': 'Last Data Update: March 19, 2026'
        },
        hi: {
            'brand.name': 'न्याय प्रवाह',
            'brand.flow': 'न्याय का प्रवाह',
            'nav.home': 'होम',
            'nav.about': 'हमारे बारे में',
            'nav.services': 'सेवाएं',
            'nav.about.mission': 'हमारा मिशन',
            'nav.about.team': 'टीम',
            'nav.about.tech': 'टेक स्टैक',
            'nav.about.roadmap': 'रोडमैप',
            'nav.about.contact': 'संपर्क',
            'nav.service.caseSearch': 'केस खोज',
            'nav.service.lawyerPortal': 'वकील पोर्टल',
            'nav.service.legalAid': 'कानूनी सहायता',
            'nav.service.documentVault': 'दस्तावेज़ वॉल्ट',
            'nav.service.helpCenter': 'सहायता केंद्र',
            'lang.english': 'अंग्रेज़ी',
            'lang.hindi': 'हिंदी',
            'lang.odia': 'ओड़िया',
            'lang.telugu': 'तेलुगु',
            'action.judge': 'न्यायाधीश',
            'action.lawyer': 'वकील',
            'section.services': 'सेवाएं',
            'section.description': 'विवरण',
            'section.about': 'हमारे बारे में',
            'section.mentor': 'हमारे मार्गदर्शक',
            'service.ai.title': 'एआई केस खोज',
            'service.ai.text': 'बुद्धिमान कानूनी खोज के साथ निर्णय, मिसालें और संबंधित केस इतिहास जल्दी खोजें।',
            'service.lawyer.title': 'वकील पोर्टल',
            'service.lawyer.text': 'क्लाइंट मामलों को प्रबंधित करें, फाइलिंग ट्रैक करें और कानूनी दस्तावेज़ एक सुरक्षित स्थान पर व्यवस्थित करें।',
            'service.judge.title': 'जज पोर्टल',
            'service.judge.text': 'न्यायाधीशों को केस टाइमलाइन देखने, सुनवाई प्रवाह मॉनिटर करने और व्यवस्थित रिकॉर्ड तक तेज पहुंच दें।',
            'about.intro': 'हम टीम कोड डैज़लर्स हैं, जो न्याय सेवाओं को स्मार्ट डिजिटल टूल्स से सरल और प्रभावी बनाने के लिए न्याय प्रवाह का निर्माण कर रहे हैं।',
            'about.vision.title': 'हमारा विज़न',
            'about.vision.text': 'एक तेज और समावेशी कानूनी प्रणाली बनाना, जहां नागरिक, वकील और न्यायाधीश बिना बाधा विश्वसनीय जानकारी तक पहुंच सकें।',
            'about.build.title': 'हम क्या बनाते हैं',
            'about.build.text': 'एआई आधारित केस खोज, वकील और जज पोर्टल, और संरचित कानूनी वर्कफ़्लो जो जटिलता कम करते हैं।',
            'about.commitment.title': 'हमारी प्रतिबद्धता',
            'about.commitment.text': 'हम पारदर्शिता, उपयोगिता और विश्वसनीयता पर ध्यान देते हैं ताकि कानूनी प्रक्रियाएं अधिक स्पष्ट और सुलभ हों।',
            'mentor.role': 'तकनीकी मार्गदर्शक और रणनीतिक सलाहकार',
            'mentor.quote': '"NIST विश्वविद्यालय के प्रतिष्ठित शिक्षाविद और शोधकर्ता, डॉ. आशीष कुमार दास न्याय प्रवाह पहल के प्रमुख मार्गदर्शक हैं।"',
            'mentor.text.one': 'क्लाउड कंप्यूटिंग, ब्लॉकचेन और सिस्टम सुरक्षा में 15+ वर्षों के अनुभव के साथ वे पारदर्शी और सुरक्षित न्यायिक डिजिटल प्रणाली के लिए मार्गदर्शन देते हैं।',
            'mentor.text.two': 'उनका शोध-आधारित दृष्टिकोण हमारे प्लेटफॉर्म को डेटा अखंडता और तकनीकी उत्कृष्टता के उच्च मानकों पर बनाए रखता है।',
            'footer.ai': 'एआई केस खोज',
            'footer.faq': 'FAQ / उपयोगकर्ता मार्गदर्शिका',
            'footer.status': 'सेवा स्थिति',
            'footer.api': 'डेवलपर API',
            'footer.privacy': 'गोपनीयता नीति',
            'footer.data': 'डेटा हैंडलिंग प्रोटोकॉल',
            'footer.feedback': 'फीडबैक पोर्टल',
            'footer.accessibility': 'सुगम्यता',
            'footer.about.nyay': 'न्याय प्रवाह के बारे में',
            'footer.about.team': 'टीम (कोड डैज़लर्स)',
            'footer.about.tech': 'टेक्नोलॉजी स्टैक',
            'footer.about.hackathon': "MHERM हैकाथॉन '26",
            'footer.app.name': 'न्याय प्रवाह',
            'footer.app.tagline': 'न्याय. तेज गति से.',
            'footer.policy.website': 'वेबसाइट नीतियां',
            'footer.policy.contact': 'संपर्क करें',
            'footer.policy.help': 'मदद',
            'footer.policy.disclaimer': 'अस्वीकरण',
            'footer.copy.managed': 'सामग्री का प्रबंधन और रखरखाव कोड डैज़लर्स द्वारा।',
            'footer.copy.built': 'MHERM Hackathon 2026 के लिए निर्मित।',
            'footer.copy.update': 'अंतिम डेटा अपडेट: 19 मार्च 2026'
        },
        od: {
            'brand.name': 'ନ୍ୟାୟ ପ୍ରବାହ',
            'brand.flow': 'ନ୍ୟାୟର ପ୍ରବାହ',
            'nav.home': 'ମୁଖ୍ୟ ପୃଷ୍ଠା',
            'nav.about': 'ଆମ ବିଷୟରେ',
            'nav.services': 'ସେବା',
            'nav.about.mission': 'ଆମର ଲକ୍ଷ୍ୟ',
            'nav.about.team': 'ଦଳ',
            'nav.about.tech': 'ଟେକ୍ ସ୍ଟ୍ୟାକ୍',
            'nav.about.roadmap': 'ରୋଡମ୍ୟାପ୍',
            'nav.about.contact': 'ଯୋଗାଯୋଗ',
            'nav.service.caseSearch': 'ମାମଲା ଖୋଜ',
            'nav.service.lawyerPortal': 'ଆଇନଜୀବୀ ପୋର୍ଟାଲ୍',
            'nav.service.legalAid': 'ନି:ଶୁଳ୍କ ଆଇନ ସହାୟତା',
            'nav.service.documentVault': 'ଦଲିଲ ଭଣ୍ଡାର',
            'nav.service.helpCenter': 'ସହାୟତା କେନ୍ଦ୍ର',
            'lang.english': 'ଇଂରାଜୀ',
            'lang.hindi': 'ହିନ୍ଦୀ',
            'lang.odia': 'ଓଡ଼ିଆ',
            'lang.telugu': 'ତେଲୁଗୁ',
            'action.judge': 'ବିଚାରପତି',
            'action.lawyer': 'ଆଇନଜୀବୀ',
            'section.services': 'ସେବା',
            'section.description': 'ବିବରଣୀ',
            'section.about': 'ଆମ ବିଷୟରେ',
            'section.mentor': 'ଆମ ମେଣ୍ଟର୍',
            'service.ai.title': 'ଏଆଇ ମାମଲା ଖୋଜ',
            'service.ai.text': 'ବୁଦ୍ଧିମାନ ଆଇନ ସନ୍ଧାନ ମାଧ୍ୟମରେ ରାୟ, ପୂର୍ବନିର୍ଣ୍ଣୟ ଓ ସମ୍ବନ୍ଧିତ ଇତିହାସ ଶୀଘ୍ର ଖୋଜନ୍ତୁ।',
            'service.lawyer.title': 'ଆଇନଜୀବୀ ପୋର୍ଟାଲ୍',
            'service.lawyer.text': 'କ୍ଲାଇଂଟ୍ ମାମଲା ପରିଚାଳନା, ଫାଇଲିଂ ଟ୍ରାକ୍ ଏବଂ ଆଇନ ଦସ୍ତାବେଜ ସୁରକ୍ଷିତ ଭାବେ ସଂଗଠିତ କରନ୍ତୁ।',
            'service.judge.title': 'ବିଚାରପତି ପୋର୍ଟାଲ୍',
            'service.judge.text': 'ବିଚାରପତିମାନେ ମାମଲା ସମୟରେଖା ଦେଖିବା, ଶୁଣାଣି ପ୍ରବାହ ନିରୀକ୍ଷଣ ଏବଂ ରେକର୍ଡ ଶୀଘ୍ର ପ୍ରାପ୍ତ କରିପାରିବେ।',
            'about.intro': 'ଆମେ ଟିମ୍ କୋଡ୍ ଡାଜଲର୍ସ, ସ୍ମାର୍ଟ ଡିଜିଟାଲ ଟୁଲ୍ ଦ୍ୱାରା ନ୍ୟାୟ ସେବାକୁ ଅଧିକ ସୁବୋଧ ଓ ସୁଲଭ କରିବାକୁ ନ୍ୟାୟ ପ୍ରବାହ ତିଆରି କରୁଛୁ।',
            'about.vision.title': 'ଆମର ଦୃଷ୍ଟିକୋଣ',
            'about.vision.text': 'ନାଗରିକ, ଆଇନଜୀବୀ ଓ ବିଚାରପତିମାନେ ବିନା ବାଧାରେ ଭରସାଯୋଗ୍ୟ ଆଇନ ସୂଚନା ପାଇପାରିବା ଏକ ଶୀଘ୍ର ଓ ସମାବେଶୀ ପ୍ରଣାଳୀ।',
            'about.build.title': 'ଆମେ କ’ଣ ତିଆରି କରୁଛୁ',
            'about.build.text': 'ଏଆଇ ଆଧାରିତ ମାମଲା ଖୋଜ, ଆଇନଜୀବୀ ଓ ବିଚାରପତି ପୋର୍ଟାଲ୍, ଏବଂ ସଂଗଠିତ ଆଇନ ପ୍ରକ୍ରିୟା।',
            'about.commitment.title': 'ଆମର ପ୍ରତିବଦ୍ଧତା',
            'about.commitment.text': 'ପାରଦର୍ଶିତା, ବ୍ୟବହାର ସହଜତା ଓ ଭରସାଯୋଗ୍ୟତା ଆମର ମୂଳ କେନ୍ଦ୍ରବିନ୍ଦୁ।',
            'mentor.role': 'ତକନିକୀ ମେଣ୍ଟର୍ ଓ କୌଶଳିକ ପରାମର୍ଶଦାତା',
            'mentor.quote': '"NIST ବିଶ୍ୱବିଦ୍ୟାଳୟର ପ୍ରତିଷ୍ଠିତ ଶିକ୍ଷାବିଦ ଓ ଗବେଷକ ଡ଼. ଆଶିଷ କୁମାର ଦାସ ନ୍ୟାୟ ପ୍ରବାହ ପଦକ୍ଷେପର ପ୍ରମୁଖ ମେଣ୍ଟର୍।"',
            'mentor.text.one': 'କ୍ଲାଉଡ କମ୍ପ୍ୟୁଟିଂ, ବ୍ଲକଚେନ ଓ ସିଷ୍ଟମ ସୁରକ୍ଷାରେ 15+ ବର୍ଷର ଅନୁଭବ ସହିତ ସେ ମୂଳ ନିର୍ଦ୍ଦେଶନା ଦେଇଛନ୍ତି।',
            'mentor.text.two': 'ତାଙ୍କର ଗବେଷଣା-ଆଧାରିତ ଦୃଷ୍ଟିକୋଣ ଆମ ପ୍ଲାଟଫର୍ମକୁ ଉଚ୍ଚ ତକନିକୀ ମାନକରେ ରଖେ।',
            'footer.ai': 'ଏଆଇ ମାମଲା ଖୋଜ',
            'footer.faq': 'FAQ / ଉପଯୋଗକର୍ତ୍ତା ଗାଇଡ୍',
            'footer.status': 'ସେବା ସ୍ଥିତି',
            'footer.api': 'ଡେଭେଲପର API',
            'footer.privacy': 'ଗୋପନୀୟତା ନୀତି',
            'footer.data': 'ଡାଟା ପରିଚାଳନ ପ୍ରୋଟୋକଲ',
            'footer.feedback': 'ପ୍ରତିକ୍ରିୟା ପୋର୍ଟାଲ୍',
            'footer.accessibility': 'ଅଭିଗମ୍ୟତା',
            'footer.about.nyay': 'ନ୍ୟାୟ ପ୍ରବାହ ବିଷୟରେ',
            'footer.about.team': 'ଦଳ (କୋଡ୍ ଡାଜଲର୍ସ)',
            'footer.about.tech': 'ପ୍ରଯୁକ୍ତି ସ୍ଟ୍ୟାକ୍',
            'footer.about.hackathon': "MHERM ହ୍ୟାକାଥନ '26",
            'footer.app.name': 'ନ୍ୟାୟ ପ୍ରବାହ',
            'footer.app.tagline': 'ନ୍ୟାୟ. ତ୍ୱରିତ।',
            'footer.policy.website': 'ୱେବସାଇଟ ନୀତି',
            'footer.policy.contact': 'ଯୋଗାଯୋଗ',
            'footer.policy.help': 'ସହାୟତା',
            'footer.policy.disclaimer': 'ଅସ୍ୱୀକୃତି',
            'footer.copy.managed': 'ବିଷୟବସ୍ତୁର ପରିଚାଳନା ଓ ରକ୍ଷଣାବେକ୍ଷଣ କୋଡ୍ ଡାଜଲର୍ସ ଦ୍ୱାରା।',
            'footer.copy.built': 'MHERM Hackathon 2026 ପାଇଁ ନିର୍ମିତ।',
            'footer.copy.update': 'ଶେଷ ଡାଟା ଅଦ୍ୟତନ: 19 ମାର୍ଚ୍ଚ 2026'
        },
        te: {
            'brand.name': 'న్యాయ ప్రవాహ',
            'brand.flow': 'న్యాయం యొక్క ప్రవాహం',
            'nav.home': 'హోమ్',
            'nav.about': 'మా గురించి',
            'nav.services': 'సేవలు',
            'nav.about.mission': 'మా లక్ష్యం',
            'nav.about.team': 'బృందం',
            'nav.about.tech': 'టెక్ స్టాక్',
            'nav.about.roadmap': 'రోడ్‌మ్యాప్',
            'nav.about.contact': 'సంప్రదించండి',
            'nav.service.caseSearch': 'కేసు శోధన',
            'nav.service.lawyerPortal': 'న్యాయవాది పోర్టల్',
            'nav.service.legalAid': 'న్యాయ సహాయం',
            'nav.service.documentVault': 'పత్రాల వాల్ట్',
            'nav.service.helpCenter': 'సహాయ కేంద్రం',
            'lang.english': 'ఇంగ్లీష్',
            'lang.hindi': 'హిందీ',
            'lang.odia': 'ఒడియా',
            'lang.telugu': 'తెలుగు',
            'action.judge': 'న్యాయమూర్తి',
            'action.lawyer': 'న్యాయవాది',
            'section.services': 'సేవలు',
            'section.description': 'వివరణ',
            'section.about': 'మా గురించి',
            'section.mentor': 'మా మార్గదర్శి',
            'service.ai.title': 'AI కేసు శోధన',
            'service.ai.text': 'తెలివైన న్యాయ శోధనతో తీర్పులు, పూర్వనిర్ణయాలు, సంబంధిత కేసు చరిత్రను త్వరగా కనుగొనండి.',
            'service.lawyer.title': 'న్యాయవాది పోర్టల్',
            'service.lawyer.text': 'క్లయింట్ కేసులను నిర్వహించండి, దాఖలాలను ట్రాక్ చేయండి, పత్రాలను ఒకే సురక్షిత స్థలంలో క్రమబద్ధం చేయండి.',
            'service.judge.title': 'న్యాయమూర్తి పోర్టల్',
            'service.judge.text': 'న్యాయమూర్తులు కేసు టైమ్‌లైన్ చూడటం, విచారణ ప్రవాహాన్ని పర్యవేక్షించడం, రికార్డులను వేగంగా పొందడం కోసం సహాయం.',
            'about.intro': 'మేము టీమ్ కోడ్ డాజ్లర్స్, స్మార్ట్ డిజిటల్ సాధనాలతో న్యాయ సేవలను అందుబాటులోకి తేవడానికి న్యాయ ప్రవాహాన్ని నిర్మిస్తున్నాము.',
            'about.vision.title': 'మా దృష్టి',
            'about.vision.text': 'పౌరులు, న్యాయవాదులు, న్యాయమూర్తులు విశ్వసనీయ న్యాయ సమాచారాన్ని సులభంగా పొందగల సమగ్ర వ్యవస్థ.',
            'about.build.title': 'మేము ఏమి నిర్మిస్తున్నాము',
            'about.build.text': 'AI ఆధారిత కేసు శోధన, న్యాయవాది మరియు న్యాయమూర్తి పోర్టల్స్, నిర్మిత న్యాయ వర్క్‌ఫ్లోలు.',
            'about.commitment.title': 'మా నిబద్ధత',
            'about.commitment.text': 'పారదర్శకత, వినియోగ సౌలభ్యం, విశ్వసనీయతపై మా దృష్టి.',
            'mentor.role': 'టెక్నికల్ మెంటర్ & వ్యూహాత్మక సలహాదారు',
            'mentor.quote': '"NIST విశ్వవిద్యాలయానికి చెందిన ప్రతిభావంతుడైన అధ్యాపకుడు, పరిశోధకుడు డా. అశీష్ కుమార్ దాస్ న్యాయ ప్రవాహ కార్యక్రమానికి ప్రధాన మెంటర్."',
            'mentor.text.one': 'క్లౌడ్ కంప్యూటింగ్, బ్లాక్‌చైన్, సిస్టమ్ సెక్యూరిటీలో 15+ ఏళ్ల అనుభవంతో ఆయన బలమైన మార్గదర్శకత్వం అందిస్తున్నారు.',
            'mentor.text.two': 'ఆయన పరిశోధన ఆధారిత దృక్కోణం మా ప్లాట్‌ఫామ్‌ను డేటా సమగ్రత, సాంకేతిక నాణ్యతలో ఉన్నతంగా ఉంచుతుంది.',
            'footer.ai': 'AI కేసు శోధన',
            'footer.faq': 'FAQ / యూజర్ గైడ్స్',
            'footer.status': 'సేవ స్థితి',
            'footer.api': 'డెవలపర్ API',
            'footer.privacy': 'గోప్యతా విధానం',
            'footer.data': 'డేటా హ్యాండ్లింగ్ ప్రోటోకాల్',
            'footer.feedback': 'ఫీడ్‌బ్యాక్ పోర్టల్',
            'footer.accessibility': 'అందుబాటు',
            'footer.about.nyay': 'NYAY ప్రవాహ గురించి',
            'footer.about.team': 'బృందం (కోడ్ డాజ్లర్స్)',
            'footer.about.tech': 'టెక్నాలజీ స్టాక్',
            'footer.about.hackathon': "MHERM హాకథాన్ '26",
            'footer.app.name': 'న్యాయ ప్రవాహ',
            'footer.app.tagline': 'న్యాయం. వేగంగా.',
            'footer.policy.website': 'వెబ్‌సైట్ విధానాలు',
            'footer.policy.contact': 'మమ్మల్ని సంప్రదించండి',
            'footer.policy.help': 'సహాయం',
            'footer.policy.disclaimer': 'అస్వీకరణ',
            'footer.copy.managed': 'కంటెంట్ నిర్వహణ మరియు సంరక్షణ కోడ్ డాజ్లర్స్ ద్వారా.',
            'footer.copy.built': 'MHERM Hackathon 2026 కోసం నిర్మించబడింది.',
            'footer.copy.update': 'చివరి డేటా నవీకరణ: మార్చి 19, 2026'
        }
    };

    const buttonLabels = {
        en: 'English',
        hi: 'हिंदी',
        od: 'ଓଡ଼ିଆ',
        te: 'తెలుగు'
    };

    const normalizeLanguage = (lang) => {
        if (translations[lang]) {
            return lang;
        }

        return FALLBACK_LANG;
    };

    const applyTranslations = (lang) => {
        const activeLang = normalizeLanguage(lang);
        const activeSet = translations[activeLang] || translations[FALLBACK_LANG];
        document.documentElement.lang = activeLang === 'od' ? 'or' : activeLang;

        document.querySelectorAll('[data-i18n]').forEach((node) => {
            const key = node.dataset.i18n;
            const value = activeSet[key] || translations[FALLBACK_LANG][key];
            if (value) {
                node.textContent = value;
            }
        });

        if (languageButton) {
            languageButton.textContent = buttonLabels[activeLang] || buttonLabels[FALLBACK_LANG];
        }
    };

    const setLanguage = (lang, shouldPersist) => {
        const activeLang = normalizeLanguage(lang);
        applyTranslations(activeLang);

        if (shouldPersist) {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, activeLang);
        }

        document.dispatchEvent(new CustomEvent('nyay:languageChanged', {
            detail: { lang: activeLang }
        }));
    };

    languageLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const selectedLang = link.dataset.lang;
            setLanguage(selectedLang, true);
        });
    });

    const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) || FALLBACK_LANG;
    setLanguage(savedLang, false);
});
