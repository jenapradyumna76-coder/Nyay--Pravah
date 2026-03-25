// [Section] Main UI controller: navbar scroll state + reusable topic-panel binding

// [Behavior] Run setup only after the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const LANGUAGE_STORAGE_KEY = 'nyay_pravah_lang_v1';
    const FALLBACK_LANG = 'en';
    const nav = document.querySelector('.navbar');
    const logoSection = document.querySelector('.logo-section');
    const heroSection = document.querySelector('.hero-carousel');

    const getCurrentLanguage = () => {
        const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        return savedLang || FALLBACK_LANG;
    };

    const resolveLocalizedValue = (entry, lang) => {
        if (!entry || typeof entry !== 'object') {
            return '';
        }

        return entry[lang] || entry[FALLBACK_LANG] || '';
    };

    // [Behavior] Turn navbar blue only when hero reaches/stays under sticky navbar.
    const handleScroll = () => {
        if (!nav || !heroSection) {
            return;
        }

        const heroTop = heroSection.getBoundingClientRect().top;
        const navHeight = nav.offsetHeight;
        const hasTouchedHero = heroTop <= navHeight;

        if (hasTouchedHero) {
            nav.classList.add('nav-scrolled');
            if (logoSection) {
                logoSection.classList.add('logo-scrolled');
            }
        } else {
            nav.classList.remove('nav-scrolled');
            if (logoSection) {
                logoSection.classList.remove('logo-scrolled');
            }
        }
    };

    // [Behavior] Keep navbar state synced with hero contact point.
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll();

    // [Section] About topic content map.
    // [Note] Keys must match data-about attributes in index.html.
    const aboutContent = {
        mission: {
            title: {
                en: 'Our Mission',
                hi: 'हमारा मिशन',
                od: 'ଆମର ଲକ୍ଷ୍ୟ',
                te: 'మా లక్ష్యం'
            },
            text: {
                en: 'Our mission is to simplify legal access through AI-driven workflows and clear guidance for citizens, lawyers, and judges.',
                hi: 'हमारा मिशन एआई-आधारित वर्कफ़्लो और स्पष्ट मार्गदर्शन के माध्यम से नागरिकों, वकीलों और न्यायाधीशों के लिए कानूनी पहुंच को सरल बनाना है।',
                od: 'ଆମର ଲକ୍ଷ୍ୟ ହେଉଛି ଏଆଇ-ଆଧାରିତ ପ୍ରକ୍ରିୟା ଏବଂ ସ୍ପଷ୍ଟ ମାର୍ଗଦର୍ଶନ ମାଧ୍ୟମରେ ନାଗରିକ, ଆଇନଜୀବୀ ଓ ବିଚାରପତିଙ୍କ ପାଇଁ ଆଇନ ଅଭିଗମ୍ୟତାକୁ ସରଳ କରିବା।',
                te: 'మా లక్ష్యం AI ఆధారిత వర్క్‌ఫ్లోలు మరియు స్పష్టమైన మార్గదర్శకత ద్వారా పౌరులు, న్యాయవాదులు, న్యాయమూర్తులకు న్యాయ సేవల అందుబాటును సులభం చేయడం.'
            }
        },
        team: {
            title: {
                en: 'The Team',
                hi: 'टीम',
                od: 'ଦଳ',
                te: 'బృందం'
            },
            text: {
                en: 'We are a cross-functional team of builders, designers, and legal-tech enthusiasts focused on practical justice solutions.',
                hi: 'हम बिल्डर्स, डिज़ाइनर्स और लीगल-टेक उत्साही लोगों की एक बहु-कार्यात्मक टीम हैं, जो व्यावहारिक न्याय समाधान पर केंद्रित है।',
                od: 'ଆମେ ନିର୍ମାତା, ଡିଜାଇନର ଏବଂ ଲିଗାଲ-ଟେକ ଉତ୍ସାହୀମାନଙ୍କର ଏକ ବହୁମୁଖୀ ଦଳ, ଯେଉଁମାନେ ବ୍ୟବହାରିକ ନ୍ୟାୟ ସମାଧାନ ଉପରେ କାମ କରୁଛନ୍ତି।',
                te: 'మేము నిర్మాణకర్తలు, డిజైనర్లు, లీగల్-టెక్ ఆసక్తిగల వారి బహుళ-పని బృందం; వాస్తవ న్యాయ పరిష్కారాలపై దృష్టి సారిస్తున్నాము.'
            }
        },
        tech: {
            title: {
                en: 'Tech Stack',
                hi: 'टेक स्टैक',
                od: 'ଟେକ୍ ସ୍ଟ୍ୟାକ୍',
                te: 'టెక్ స్టాక్'
            },
            text: {
                en: 'The platform combines modern web interfaces, secure data handling, and AI-assisted search features to improve legal workflows.',
                hi: 'यह प्लेटफ़ॉर्म आधुनिक वेब इंटरफेस, सुरक्षित डेटा हैंडलिंग और एआई-सहायता प्राप्त खोज सुविधाओं को जोड़कर कानूनी वर्कफ़्लो को बेहतर बनाता है।',
                od: 'ଏହି ପ୍ଲାଟଫର୍ମ ଆଧୁନିକ ୱେବ୍ ଇଣ୍ଟରଫେସ୍, ସୁରକ୍ଷିତ ଡାଟା ପରିଚାଳନା ଏବଂ ଏଆଇ-ସହାୟିତ ସର୍ଚ୍ଚ ବୈଶିଷ୍ଟ୍ୟକୁ ଏକସାଥି କରି ଆଇନ ପ୍ରକ୍ରିୟାକୁ ଉନ୍ନତ କରେ।',
                te: 'ఈ ప్లాట్‌ఫారం ఆధునిక వెబ్ ఇంటర్‌ఫేస్‌లు, సురక్షిత డేటా నిర్వహణ, AI ఆధారిత శోధన ఫీచర్లను కలిపి న్యాయ వర్క్‌ఫ్లోలను మెరుగుపరుస్తుంది.'
            }
        },
        roadmap: {
            title: {
                en: 'Roadmap',
                hi: 'रोडमैप',
                od: 'ରୋଡମ୍ୟାପ୍',
                te: 'రోడ్‌మ్యాప్'
            },
            text: {
                en: 'Upcoming phases include improved search ranking, expanded legal datasets, and dashboard enhancements for different user roles.',
                hi: 'आगामी चरणों में बेहतर सर्च रैंकिंग, विस्तृत कानूनी डेटासेट और अलग-अलग उपयोगकर्ता भूमिकाओं के लिए डैशबोर्ड सुधार शामिल हैं।',
                od: 'ଆଗାମୀ ପର୍ଯ୍ୟାୟରେ ଉନ୍ନତ ସର୍ଚ୍ଚ ର୍ୟାଙ୍କିଂ, ବିସ୍ତୃତ ଆଇନ ଡାଟାସେଟ୍ ଏବଂ ଭିନ୍ନ ଭୂମିକା ପାଇଁ ଡ୍ୟାଶବୋର୍ଡ ଉନ୍ନତି ରହିଛି।',
                te: 'తదుపరి దశల్లో మెరుగైన శోధన ర్యాంకింగ్, విస్తరించిన లీగల్ డేటాసెట్లు, వేర్వేరు యూజర్ పాత్రల కోసం డాష్‌బోర్డ్ మెరుగుదలలు ఉన్నాయి.'
            }
        },
        contact: {
            title: {
                en: 'Contact',
                hi: 'संपर्क',
                od: 'ଯୋଗାଯୋଗ',
                te: 'సంప్రదించండి'
            },
            text: {
                en: 'For support, please use the official contact and help channels listed in the footer section.',
                hi: 'सहायता के लिए कृपया फुटर सेक्शन में दिए गए आधिकारिक संपर्क और हेल्प चैनलों का उपयोग करें।',
                od: 'ସହାୟତା ପାଇଁ ଫୁଟର୍ ଭାଗରେ ଦିଆଯାଇଥିବା ଅଧିକାରିକ ଯୋଗାଯୋଗ ଏବଂ ହେଲ୍ପ ଚ୍ୟାନେଲ୍ ବ୍ୟବହାର କରନ୍ତୁ।',
                te: 'సహాయం కోసం దయచేసి ఫుటర్ విభాగంలో ఉన్న అధికారిక సంప్రదింపు మరియు హెల్ప్ ఛానెల్‌లను ఉపయోగించండి.'
            }
        }
    };

    // [Section] Services topic content map.
    // [Note] Keys must match data-service attributes in index.html.
    const servicesContent = {
        'case-search': {
            title: {
                en: 'Case Search',
                hi: 'केस खोज',
                od: 'ମାମଲା ଖୋଜ',
                te: 'కేసు శోధన'
            },
            text: {
                en: 'Users can search judgments, statutes, and precedents with filters for court, year, and topic.',
                hi: 'उपयोगकर्ता कोर्ट, वर्ष और विषय के फ़िल्टर के साथ निर्णय, अधिनियम और मिसालें खोज सकते हैं।',
                od: 'ଉପଯୋଗକର୍ତ୍ତାମାନେ କୋର୍ଟ, ବର୍ଷ ଓ ବିଷୟ ଫିଲ୍ଟର ସହିତ ରାୟ, ଆଇନ ଓ ପୂର୍ବନିର୍ଣ୍ଣୟ ଖୋଜିପାରିବେ।',
                te: 'వినియోగదారులు కోర్టు, సంవత్సరం, విషయం ఫిల్టర్లతో తీర్పులు, చట్టాలు, పూర్వనిర్ణయాలను శోధించవచ్చు.'
            }
        },
        'lawyer-portal': {
            title: {
                en: 'Lawyer Portal',
                hi: 'वकील पोर्टल',
                od: 'ଆଇନଜୀବୀ ପୋର୍ଟାଲ୍',
                te: 'న్యాయవాది పోర్టల్'
            },
            text: {
                en: 'Lawyers can track matters, manage documents, and monitor filing stages in one workspace.',
                hi: 'वकील एक ही कार्यक्षेत्र में मामलों को ट्रैक कर सकते हैं, दस्तावेज़ प्रबंधित कर सकते हैं और फाइलिंग चरणों की निगरानी कर सकते हैं।',
                od: 'ଆଇନଜୀବୀମାନେ ଗୋଟିଏ କାର୍ଯ୍ୟକ୍ଷେତ୍ରରେ ମାମଲା ଟ୍ରାକ୍, ଡକ୍ୟୁମେଣ୍ଟ ପରିଚାଳନା ଏବଂ ଫାଇଲିଂ ପର୍ଯ୍ୟାୟ ନିରୀକ୍ଷଣ କରିପାରିବେ।',
                te: 'న్యాయవాదులు ఒకే వర్క్‌స్పేస్‌లో కేసులను ట్రాక్ చేయడం, పత్రాలను నిర్వహించడం, దాఖలు దశలను పర్యవేక్షించడం చేయగలరు.'
            }
        },
        'legal-aid': {
            title: {
                en: 'Legal Aid',
                hi: 'कानूनी सहायता',
                od: 'ନି:ଶୁଳ୍କ ଆଇନ ସହାୟତା',
                te: 'న్యాయ సహాయం'
            },
            text: {
                en: 'Citizens can discover guided legal support options and step-by-step assistance for common legal needs.',
                hi: 'नागरिक सामान्य कानूनी जरूरतों के लिए मार्गदर्शित कानूनी सहायता विकल्प और चरण-दर-चरण मदद पा सकते हैं।',
                od: 'ନାଗରିକମାନେ ସାଧାରଣ ଆଇନ ଆବଶ୍ୟକତା ପାଇଁ ମାର୍ଗଦର୍ଶିତ ସହାୟତା ବିକଳ୍ପ ଏବଂ ପଦକ୍ରମିକ ସହାୟତା ପାଇପାରିବେ।',
                te: 'పౌరులు సాధారణ న్యాయ అవసరాల కోసం మార్గనిర్దేశిత న్యాయ సహాయ ఎంపికలు, దశలవారీ సహాయం పొందగలరు.'
            }
        },
        'document-vault': {
            title: {
                en: 'Document Vault',
                hi: 'दस्तावेज़ वॉल्ट',
                od: 'ଦଲିଲ ଭଣ୍ଡାର',
                te: 'పత్రాల వాల్ట్'
            },
            text: {
                en: 'The vault securely stores case files and makes retrieval easy through organized records and search tags.',
                hi: 'यह वॉल्ट केस फाइलों को सुरक्षित रूप से संग्रहीत करता है और व्यवस्थित रिकॉर्ड व सर्च टैग से उन्हें ढूंढना आसान बनाता है।',
                od: 'ଏହି ଭଣ୍ଡାର ମାମଲା ଫାଇଲକୁ ସୁରକ୍ଷିତ ଭାବେ ସଂରକ୍ଷଣ କରେ ଏବଂ ସୁସଂଗଠିତ ରେକର୍ଡ ଓ ସର୍ଚ୍ଚ ଟ୍ୟାଗ୍ ମାଧ୍ୟମରେ ଖୋଜାକୁ ସହଜ କରେ।',
                te: 'ఈ వాల్ట్ కేసు ఫైళ్లను సురక్షితంగా నిల్వ చేస్తుంది; క్రమబద్ధమైన రికార్డులు, శోధన ట్యాగ్‌లతో తిరిగి పొందడం సులభం చేస్తుంది.'
            }
        },
        'help-center': {
            title: {
                en: 'Help Center',
                hi: 'सहायता केंद्र',
                od: 'ସହାୟତା କେନ୍ଦ୍ର',
                te: 'సహాయ కేంద్రం'
            },
            text: {
                en: 'A self-service area for FAQs, process guides, and platform support requests.',
                hi: 'एफएक्यू, प्रक्रिया मार्गदर्शिका और प्लेटफ़ॉर्म सहायता अनुरोधों के लिए एक सेल्फ-सर्विस क्षेत्र।',
                od: 'FAQ, ପ୍ରକ୍ରିୟା ଗାଇଡ୍ ଏବଂ ପ୍ଲାଟଫର୍ମ ସହାୟତା ଅନୁରୋଧ ପାଇଁ ଏକ ସ୍ୱୟଂ-ସେବା ଅଞ୍ଚଳ।',
                te: 'FAQలు, ప్రక్రియ మార్గదర్శకాలు, ప్లాట్‌ఫామ్ సపోర్ట్ అభ్యర్థనల కోసం స్వీయ-సేవా విభాగం.'
            }
        }
    };

    const bindTopicPanel = ({
        topicButtonsSelector,
        navLinksSelector,
        titleSelector,
        textSelector,
        panelSelector,
        dataMap,
        dataAttr
    }) => {
        // [Behavior] Resolve all required DOM nodes for one panel binding instance.
        const topicButtons = document.querySelectorAll(topicButtonsSelector);
        const navLinks = document.querySelectorAll(navLinksSelector);
        const titleEl = document.querySelector(titleSelector);
        const textEl = document.querySelector(textSelector);
        const panelEl = document.querySelector(panelSelector);

        if (!titleEl || !textEl || !panelEl) {
            // [Note] Safe exit when a section is missing on a page reusing this script.
            return;
        }

        const activateTopic = (key) => {
            const item = dataMap[key];
            if (!item) {
                return;
            }

            const lang = getCurrentLanguage();

            // [Behavior] Update visible content in the target panel.
            titleEl.textContent = resolveLocalizedValue(item.title, lang);
            textEl.textContent = resolveLocalizedValue(item.text, lang);

            // [Behavior] Keep button visual state synced with active topic key.
            topicButtons.forEach((btn) => {
                const isActive = btn.dataset[dataAttr] === key;
                btn.classList.toggle('is-active', isActive);
            });
        };

        // [Behavior] Handle clicks from in-section topic pills.
        topicButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const key = btn.dataset[dataAttr];
                activateTopic(key);
            });
        });

        // [Behavior] Handle clicks from navbar dropdown shortcuts.
        navLinks.forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const key = link.dataset[dataAttr];
                activateTopic(key);
                // [Behavior] Bring updated panel into view for better UX.
                panelEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });

        const refreshActiveTopic = () => {
            const activeButton = Array.from(topicButtons).find((btn) => btn.classList.contains('is-active'));
            const fallbackButton = topicButtons[0];
            const selectedButton = activeButton || fallbackButton;
            const selectedKey = selectedButton ? selectedButton.dataset[dataAttr] : null;

            if (selectedKey) {
                activateTopic(selectedKey);
            }
        };

        document.addEventListener('nyay:languageChanged', refreshActiveTopic);
        refreshActiveTopic();
    };

    bindTopicPanel({
        topicButtonsSelector: '.js-about-topic',
        navLinksSelector: '.js-about-link',
        titleSelector: '#about-content-title',
        textSelector: '#about-content-text',
        panelSelector: '#about-content-panel',
        dataMap: aboutContent,
        dataAttr: 'about'
    });

    bindTopicPanel({
        topicButtonsSelector: '.js-service-topic',
        navLinksSelector: '.js-service-link',
        titleSelector: '#services-content-title',
        textSelector: '#services-content-text',
        panelSelector: '#services-content-panel',
        dataMap: servicesContent,
        dataAttr: 'service'
    });
});