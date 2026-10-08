let geoCountriesData = null; 
let charts = {};
let currentLang = 'en';
let mapInstance = null;
let activeHorizon = 'short';
let activePersona = 'overview';
let lastResponseData = null;

const DROPDOWN_OPTIONS = {
  en: {
    metrics: [
      { val: "T2M_MIN", text: "Night-time Min Temperature (T2M_MIN)" },
      { val: "T2M_MAX", text: "Day-time Max Temperature (T2M_MAX)" },
      { val: "T2M", text: "Mean Temperature (T2M)" },
      { val: "PRECTOTCORR", text: "Precipitation (PRECTOTCORR)" }
    ],
    seasons: [
      { val: "ALL", text: "Full Calendar Year (Jan - Dec)" },
      { val: "MAM", text: "Pre-Monsoon / Summer (Mar - May)" },
      { val: "JJAS", text: "Monsoon Wet Period (Jun - Sep)" },
      { val: "DJF", text: "Winter Dry Period (Dec - Feb)" },
      { val: "ON", text: "Post-Monsoon Transition (Oct - Nov)" }
    ],
    mitigation: [
      { val: "0", text: "Business-As-Usual (No Policy Action)" },
      { val: "0.3", text: "Moderate: 20% Tree Canopy + Cool Roofs (-0.30°C)" },
      { val: "0.6", text: "Aggressive: 40% Canopy + Water Body Preservation (-0.60°C)" }
    ]
  },
  bn: {
    metrics: [
      { val: "T2M_MIN", text: "নাইট-টাইম সর্বনিম্ন তাপমাত্রা (T2M_MIN)" },
      { val: "T2M_MAX", text: "দিনের সর্বোচ্চ তাপমাত্রা (T2M_MAX)" },
      { val: "T2M", text: "গড় তাপমাত্রা (T2M)" },
      { val: "PRECTOTCORR", text: "বৃষ্টিপাত / প্রিসিপিটেশন (PRECTOTCORR)" }
    ],
    seasons: [
      { val: "ALL", text: "সম্পূর্ণ ক্যালেন্ডার বছর (জানু - ডিসে)" },
      { val: "MAM", text: "প্রাক-বর্ষা / গ্রীষ্মকাল (মার্চ - মে)" },
      { val: "JJAS", text: "বর্ষা মৌসুম (জুন - সেপ্টে)" },
      { val: "DJF", text: "শীতকাল (ডিসে - ফেব)" },
      { val: "ON", text: "পোস্ট-মনসুন রূপান্তর (অক্টো - নভে)" }
    ],
    mitigation: [
      { val: "0", text: "পূর্বাবস্থা বজায় রাখা (পলিসি পদক্ষেপ ছাড়া)" },
      { val: "0.3", text: "পরিমিত নীতি: ২০% বৃক্ষরোপণ ও কুল রুফ (-০.৩০° সে.)" },
      { val: "0.6", text: "আগ্রাসী নীতি: ৪০% ক্যানোপি ও জলাশয় সংরক্ষণ (-০.৬০° সে.)" }
    ]
  }
};

const HEALTH_DATA = {
  en: [
    {
      title: "Cardiovascular Crisis & Nocturnal Stroke",
      trigger: "NASA Metric: T2M_MIN > 25°C (Tropical Nights)",
      tag: "CRITICAL",
      tagClass: "risk-high",
      desc: "Failure of nighttime core cooling causes elevated cardiac output, nocturnal hypertension, and fatal thrombotic events.",
      action: "Emergency room triage & nocturnal cooling shelters.",
      clickHint: "🔍 Click for Clinical Deep-Dive & Action Plan",
      mechanism: "When nocturnal temperatures fail to drop below 25°C, the human autonomic thermoregulatory system cannot shift into restorative sleep homeostasis. Peripheral cutaneous vasodilation remains constantly activated, forcing the heart to pump vigorously to dissipate core heat. Dehydration thickens blood viscosity while nocturnal systolic pressure surges, causing a statistically proven peak in early-morning myocardial infarctions and ischemic strokes in high-density informal urban settlements.",
      vulnerable: "Senior citizens (60+), individuals with pre-existing coronary heart disease or hypertension, pregnant women, and laborers dwelling in poorly ventilated structures.",
      steps: [
        { label: "Phase 1: Immediate Citizen Protocol", detail: "Hydrate with electrolyte fluids before sleep; establish passive cross-ventilation; utilize damp cotton cloths on pulses or cold-water floor mopping to reduce ambient radiative temperature." },
        { label: "Phase 2: Hospital Emergency Triage", detail: "Mandate tertiary medical centers to establish Dedicated Nocturnal Rehydration Triage units with rapid-infusion cold saline during heatwaves." },
        { label: "Phase 3: Municipal Built-Environment Intervention", detail: "Deploy reflective high-albedo white paint subsidies across dense informal settlements, and construct designated public night shelters." }
      ]
    },
    {
      title: "Heat Exhaustion & Chronic Kidney Disease (CKDu)",
      trigger: "NASA Metric: T2M_MAX Daytime Spikes & Wet-Bulb Stress",
      tag: "HIGH RISK",
      tagClass: "risk-high",
      desc: "Repetitive dehydration in outdoor workers triggers syncope and silent renal failure (CKDu).",
      action: "Mandatory shaded breaks & roadside hydration hubs.",
      clickHint: "🔍 Click for Clinical Deep-Dive & Action Plan",
      mechanism: "Continuous physical exertion under near-40°C peak temperatures exceeds the evaporative cooling capacity of sweat. Dehydration causes hypovolemia, rhabdomyolysis (skeletal muscle breakdown releasing myoglobin into circulation), and repeated subclinical renal ischemia. This persistent cycle leads to chronic tubular atrophy and irreversible Chronic Kidney Disease of non-traditional origin (CKDu) among manual workers.",
      vulnerable: "Outdoor transport workers, construction laborers, traffic personnel, street hawkers, and delivery riders.",
      steps: [
        { label: "Phase 1: Immediate Field First-Aid", detail: "If syncope, confusion, or cessation of sweating occurs, immediately move patient to shade, apply cold packs to carotid and groin arteries, and elevate feet." },
        { label: "Phase 2: Occupational Heat Regulation Policy", detail: "Enforce mandatory 15-minute shaded rest breaks every hour between 11:00 AM and 3:00 PM on heat alert days for all outdoor civic contracts." },
        { label: "Phase 3: City-Wide Hydration Infrastructure", detail: "Municipal authority must install automated cool potable water refill stations and shaded misting booths at every major transit hub." }
      ]
    },
    {
      title: "Vector Epidemic & Microbial Acceleration",
      trigger: "NASA Metric: Winter Warming & Erratic Pre-Monsoon Precipitation",
      tag: "EPIDEMIC",
      tagClass: "risk-alert",
      desc: "Elevated baseline temperature shortens vector incubation periods, turning seasonal disease into a persistent threat.",
      action: "Predictive targeted larviciding prior to precipitation peaks.",
      clickHint: "🔍 Click for Clinical Deep-Dive & Action Plan",
      mechanism: "Warmer winter minimum temperatures prevent the typical winter die-off of disease vectors. Concurrently, warmer temperatures drastically accelerate the viral Extrinsic Incubation Period (EIP), allowing vectors to transmit pathogen serotypes in significantly fewer days. Intermittent anomalous rain creates distributed stagnant micro-pools on impervious concrete surfaces.",
      vulnerable: "Young children, individuals suffering secondary infections, and residents living near unmanaged construction excavations.",
      steps: [
        { label: "Phase 1: Proactive Community Eradication", detail: "Enforce 72-hour cycle purge of clear standing water from drainage trays, pots, and residential rooftop gardens." },
        { label: "Phase 2: NASA Data-Driven Vector Strike", detail: "Deploy biological larvicides exactly 3-5 days after anomalous precipitation events detected by ClimaDhaka." },
        { label: "Phase 3: Clinical Resource Stockpiling", detail: "Pre-allocate intravenous rehydration fluid stockpiles and testing kits across urban primary health clinics." }
      ]
    },
    {
      title: "Respiratory Crisis & Tropospheric Ozone Trapping",
      trigger: "NASA Metric: Urban Differential Heat Signature (ΔT Dome)",
      tag: "MODERATE",
      tagClass: "risk-med",
      desc: "Thermal stagnation traps PM2.5 and accelerates ground ozone formation, causing acute asthma and pediatric distress.",
      action: "Low-emission buffer zones around high-density school districts.",
      clickHint: "🔍 Click for Clinical Deep-Dive & Action Plan",
      mechanism: "The intense concrete-induced thermal differential (ΔT) generates an urban heat dome and temperature inversion layer over the megacity. Stagnant air combined with intense ultraviolet solar radiation accelerates photochemical reactions between vehicular exhaust emissions, synthesizing ground-level ozone (O3). Ozone oxidizes airway epithelial cells, triggering severe bronchospasm and COPD exacerbation.",
      vulnerable: "Pediatric populations under 12, elderly individuals with chronic respiratory disease, and daily road commuters.",
      steps: [
        { label: "Phase 1: High-Smog Exposure Minimization", detail: "Issue civic air alerts advising vulnerable citizens to wear particulate masks during peak midday hours and avoid outdoor sports." },
        { label: "Phase 2: Dust Suppression & Water Sprinkling", detail: "Deploy high-volume misting water trucks along high-traffic corridors during stagnant thermal peaks to cool road surfaces." },
        { label: "Phase 3: Urban Green Buffer Enclaves", detail: "Establish multi-tier green vegetation belts around schools and major hospitals to act as biological particulate filters." }
      ]
    },
    {
      title: "Waterborne Enteric Epidemics & Contamination",
      trigger: "NASA Metric: Precipitation Spikes & Pre-Monsoon Heat",
      tag: "SURGE RISK",
      tagClass: "risk-med",
      desc: "Warm temperatures accelerate bacterial growth; erratic flash floods cause sewage infiltration into drinking water mains.",
      action: "Chlorination shock-treatment in vulnerable informal settlements.",
      clickHint: "🔍 Click for Clinical Deep-Dive & Action Plan",
      mechanism: "Ambient warming elevates water reservoir temperatures, accelerating the exponential binary fission of waterborne pathogens. When sudden intense precipitation spikes occur, non-absorptive urban catchments overwhelm wastewater drainage networks. Pressurized sewage overflow infiltrates subterranean cracked water supply pipes, producing severe acute diarrhea surges.",
      vulnerable: "Settlement residents relying on communal pipes, undernourished infants, and people consuming roadside street food.",
      steps: [
        { label: "Phase 1: Household Boiling & Chemical Disinfection", detail: "Mandate boiling of all municipal drinking water for at least 10 minutes or using water purification chlorine tablets in storage containers." },
        { label: "Phase 2: Pipe-Network Shock Chlorination", detail: "Water authority must execute automated chlorine booster injection within 24 hours of flash flood events." },
        { label: "Phase 3: Pre-Positioning Emergency Rehydration Supplies", detail: "Coordinate with health agencies to pre-stage massive caches of Oral Rehydration Salts (ORS) in community clinics." }
      ]
    }
  ],
  bn: [
    {
      title: "কার্ডিওভাসকুলার সংকট ও নিশাচর স্ট্রোক",
      trigger: "নাসা প্যারামিটার: নাইট-টাইম T2M_MIN > ২৫° সে. (ক্রান্তীয় রাত্রি)",
      tag: "চরম ঝুঁকি",
      tagClass: "risk-high",
      desc: "রাতে শরীর ঠান্ডা হতে না পারলে রক্তচাপ ও পালস রেট বৃদ্ধি পায়, যার ফলে ঘুমের মধ্যে হার্ট অ্যাটাক ও স্ট্রোকের ঝুঁকি বাড়ে।",
      action: "জরুরি বিভাগে কোল্ড-রুম ও রাতের চিকিৎসা সুবিধা।",
      clickHint: "🔍 বিস্তারিত শারীরবৃত্তীয় কারণ ও করণীয় জানতে ক্লিক করুন",
      mechanism: "রাতে তাপমাত্রা ২৫ ডিগ্রি সেলসিয়াসের নিচে না নামলে মানবদেহের অভ্যন্তরীণ কোর তাপমাত্রা স্বাভাবিক হতে পারে না। শরীরকে ঠান্ডা রাখার জন্য কার্ডিয়াক প্রক্রিয়া চালু রাখতে হয়। এতে রক্ত ঘন হয়ে যাওয়া এবং রাতের বেলা রক্তচাপ অনিয়ন্ত্রিত হয়ে ঘুমের মধ্যেই হার্ট অ্যাটাক ও স্ট্রোকের ঝুঁকি বৃদ্ধি পায়।",
      vulnerable: "ষাটোর্ধ্ব প্রবীণ নাগরিক, হৃদরোগ ও উচ্চ রক্তচাপের রোগী, অন্তঃসত্ত্বা নারী এবং টিনের ছাউনিযুক্ত ঘরে বসবাসকারী শ্রমজীবী মানুষ।",
      steps: [
        { label: "ধাপ ১: তাৎক্ষণিক পারিবারিক সুরক্ষা", detail: "ঘুমানোর আগে পর্যাপ্ত পানি ও ইলেক্ট্রোলাইট গ্রহণ; ঘরে বাতাস চলাচল নিশ্চিত করা; মেঝের অতিরিক্ত তাপ বিকিরণ কমাতে মেঝে ভেজা কাপড় দিয়ে মোছা।" },
        { label: "ধাপ ২: হাসপাতাল প্রস্তুতি", detail: "মেডিকেল সেন্টারের জরুরি বিভাগে রাতের বেলা বিশেষায়িত ট্রায়াজ এবং কোল্ড-সালাইন বেড প্রস্তুত রাখা।" },
        { label: "ধাপ ৩: নগর অবকাঠামোগত পদক্ষেপ", detail: "ঘনবসতিপূর্ণ টিনের চালের ঘরে তাপ প্রতিফলনকারী সাদা রঙ (Cool Roof) ভর্তুকি দেওয়া এবং শীতাতপ নিয়ন্ত্রিত জরুরি নাইট-শেল্টার চালু করা।" }
      ]
    },
    {
      title: "হিট স্ট্রোক, সিনকোপ ও ক্রনিক কিডনি রোগ (CKDu)",
      trigger: "নাসা প্যারামিটার: দিনের চরম তাপমাত্রা (T2M_MAX) ও আর্দ্রতা",
      tag: "উচ্চ ঝুঁকি",
      tagClass: "risk-high",
      desc: "খোলা আকাশের নিচে কর্মরত শ্রমিকদের দীর্ঘমেয়াদী পানিশূন্যতা ও ইলেক্ট্রোলাইট ঘাটতি নীরব কিডনি ফেইলিউর (CKDu) তৈরি করে।",
      action: "মোড়ে মোড়ে ছায়াযুক্ত বিশ্রামাগার ও বিনামূল্যে স্যালাইন।",
      clickHint: "🔍 বিস্তারিত শারীরবৃত্তীয় কারণ ও করণীয় জানতে ক্লিক করুন",
      mechanism: "চরম তাপদাহে দীর্ঘক্ষণ রোদে কায়িক শ্রম দিলে ঘাম নির্গমনের মাধ্যমে শরীর ঠান্ডা হওয়ার স্বাভাবিক ক্ষমতা হারিয়ে ফেলে। এর ফলে র্যাবডোমায়োলাইসিস এবং বারবার কিডনির রেনাল টিউবিউল ক্ষতিগ্রস্ত হয়ে নীরব ক্রনিক কিডনি রোগ (CKDu) মহামারী আকারে দেখা দেয়।",
      vulnerable: "পরিবহন চালক, নির্মাণ শ্রমিক, ট্রাফিক পুলিশ সদস্য, হকার ও ডেলিভারি কর্মীরা।",
      steps: [
        { label: "ধাপ ১: তাৎক্ষণিক ফিল্ড ফার্স্ট-এইড", detail: "কারও বিভ্রান্তি বা ঘাম বন্ধ হওয়ার লক্ষণ দেখা দিলে সাথে সাথে ছায়ায় এনে ঘাড়ে ও বগলে বরফ/ঠান্ডা পানি দেওয়া এবং পা উঁচু করে শোয়ানো।" },
        { label: "ধাপ ২: বাধ্যতামূলক কর্মবিরতি নীতিমালা", detail: "তীব্র তাপদাহের দিনগুলোতে বেলা ১১টা থেকে বিকেল ৩টা পর্যন্ত বাইরের কায়িক শ্রমে প্রতি ঘণ্টায় বাধ্যতামূলক ১৫ মিনিটের ছায়াযুক্ত বিরতির সরকারি নির্দেশনা জারি।" },
        { label: "ধাপ ৩: নগরব্যাপী কুলিং নেটওয়ার্ক", detail: "সিটি কর্পোরেশনের উদ্যোগে গুরুত্বপূর্ণ মোড়গুলোতে বিনামূল্যে বিশুদ্ধ ঠান্ডা পানি ও ওআরএস স্যালাইন বুথ স্থাপন।" }
      ]
    },
    {
      title: "ভেক্টর মহামারী ও রোগবাহী জীবাণুর বিস্তার",
      trigger: "নাসা প্যারামিটার: শীতকালীন উষ্ণতা ও প্রাক-বর্ষার বৃষ্টিপাত",
      tag: "মহামারী অ্যালার্ট",
      tagClass: "risk-alert",
      desc: "শীতের উষ্ণতা বাড়ায় ক্ষতিকর মশার বংশবৃদ্ধি দ্রুত হয় এবং মশাবাহিত রোগ সারা বছরব্যাপী ঝুঁকিতে রূপ নেয়।",
      action: "বৃষ্টির পূর্বাভাস দেখে তাৎক্ষণিক লার্ভিসাইডিং স্প্রে।",
      clickHint: "🔍 বিস্তারিত শারীরবৃত্তীয় কারণ ও করণীয় জানতে ক্লিক করুন",
      mechanism: "শীতকালে সর্বনিম্ন তাপমাত্রা বেশি থাকায় রোগবাহী মশার স্বাভাবিক মৃত্যুহার হ্রাস পায়। তাপমাত্রা বৃদ্ধির ফলে মশার দেহের অভ্যন্তরে জীবাণুর ইনকিউবেশন পিরিয়ড দ্রুততর হয়, যার ফলে মশা অনেক কম সময়েই সংক্রামক হয়ে ওঠে।",
      vulnerable: "শিশু, গর্ভবতী নারী, প্রবীণ এবং নির্মাণাধীন ভবনের আশপাশে বসবাসকারী সাধারণ মানুষ।",
      steps: [
        { label: "ধাপ ১: নাগরিক দায়িত্ব", detail: "প্রতি ৭২ ঘণ্টা পর পর ড্রেন, এসির ট্রে ও ছাদবাগানের জমে থাকা পানি সম্পূর্ণ অপসারণ করা।" },
        { label: "ধাপ ২: ডেটা-চালিত স্প্রেয়িং", detail: "ক্লাইমাঢাকা ড্যাশবোর্ডে অনিয়মিত বৃষ্টির স্পাইক ধরা পড়ার ঠিক ৩-৫ দিনের মাথায় চিহ্নিত হটস্পটে জৈব লার্ভিসাইডিং পরিচালনা।" },
        { label: "ধাপ ৩: স্বাস্থ্যকেন্দ্র সক্ষমতা", detail: "ওয়ার্ডভিত্তিক নগর স্বাস্থ্যকেন্দ্রগুলোতে আগে থেকেই পর্যাপ্ত টেস্টিং কিট ও স্যালাইনের সুবিধা প্রস্তুত রাখা।" }
      ]
    },
    {
      title: "শ্বাসকষ্ট, অ্যাজমা ও ট্রপোস্ফেরিক ওজোন ট্র্যাপিং",
      trigger: "নাসা প্যারামিটার: মেগাসিটির নিজস্ব আরবান হিট ডোম (ΔT)",
      tag: "মাঝারি ঝুঁকি",
      tagClass: "risk-med",
      desc: "তাপের কারণে ধোঁয়া ও বিষাক্ত ওজোন গ্যাস আটকে থাকে, যা শিশুদের ব্রংকাইটিস ও শ্বাসকষ্ট বাড়িয়ে দেয়।",
      action: "স্কুল এলাকায় যানবাহনের গতি নিয়ন্ত্রণ ও সবুজ বেষ্টনী।",
      clickHint: "🔍 বিস্তারিত শারীরবৃত্তীয় কারণ ও করণীয় জানতে ক্লিক করুন",
      mechanism: "কংক্রিট ভূপৃষ্ঠের অতিরিক্ত তাপ শহরের ওপর একটি বায়ুমণ্ডলীয় তাপীয় ছাতা সৃষ্টি করে বাতাসকে স্থির করে ফেলে। স্থির বাতাসে তীব্র সূর্যের অতিবেগুনি রশ্মির উপস্থিতিতে যানবাহনের ধোঁয়া থেকে গ্রাউন্ড-লেভেল ক্ষতিকর ওজোন গ্যাস তৈরি হয় যা ফুসফুসের ক্ষতি করে।",
      vulnerable: "১২ বছরের কম বয়সী শিশু, হাঁপানি ও ক্রনিক ব্রংকাইটিসের রোগী এবং নিয়মিত ট্রাফিকে থাকা পথচারী।",
      steps: [
        { label: "ধাপ ১: ধোঁয়াশা সতর্কতা", detail: "দুপুরে ওজোন ও ধূলিকণার মাত্রা সর্বোচ্চ থাকা অবস্থায় সংবেদনশীল রোগীদের বাইরে কার্যকর মাস্ক ব্যবহার করা।" },
        { label: "ধাপ ২: রাস্তার তাপমাত্রা নিয়ন্ত্রণ", detail: "দুপুরের পিক আওয়ারে প্রধান সড়কগুলোতে ওয়াটার-ক্যানন দিয়ে পানি ছিটানো যাতে পৃষ্ঠের তাপমাত্রা কমে।" },
        { label: "ধাপ ৩: গ্রিন বাফার জোন", detail: "স্কুল ও হাসপাতালের চারপাশে ঘন পাতার গাছপালার পরিবেশবান্ধব বায়ো-ফিল্টার বাফার জোন তৈরি।" }
      ]
    },
    {
      title: "কলেরা, ডায়রিয়া ও পানিবাহিত সংক্রামক রোগ",
      trigger: "নাসা প্যারামিটার: বৃষ্টির তীব্রতা ও প্রাক-বর্ষার গরম",
      tag: "আকস্মিক বৃদ্ধি",
      tagClass: "risk-med",
      desc: "অতিরিক্ত গরমে খাবার পানিতে ব্যাকটেরিয়ার বংশবৃদ্ধি দ্রুত হয় এবং আকস্মিক বৃষ্টিতে সুয়ারেজ পানি মিশে ডায়রিয়া ছড়ায়।",
      action: "সংবেদনশীল বস্তিগুলোতে পানির ক্লোরিনেশন ও ফিল্টার বিতরণ।",
      clickHint: "🔍 বিস্তারিত শারীরবৃত্তীয় কারণ ও করণীয় জানতে ক্লিক করুন",
      mechanism: "পরিবেশের তাপমাত্রা বাড়ার সাথে সাথে উন্মুক্ত পানিতে ক্ষতিকর ব্যাকটেরিয়ার প্রজনন দ্রুত বাড়ে। এরপর হঠাৎ ভারী বৃষ্টিপাতে পয়ঃনিষ্কাশন লাইন উপচে গিয়ে খাবার পানির সরবরাহ পাইপলাইনে সুয়ারেজ পানি প্রবেশ করে দ্রুত রোগ ছড়ায়।",
      vulnerable: "বস্তিবাসী, ভাসমান মানুষ, শিশু এবং অনিরাপদ রাস্তার খাবার গ্রহণকারী সাধারণ পথচারী।",
      steps: [
        { label: "ধাপ ১: পানি বিশুদ্ধকরণ", detail: "খাবার পানি অন্তত ১০ মিনিট ফুটিয়ে অথবা ক্লোরিন ট্যাবলেট দিয়ে বিশুদ্ধ করে ব্যবহার করা।" },
        { label: "ধাপ ২: পাইপলাইনে স্বয়ংক্রিয় ক্লোরিনেশন", detail: "ভারী বৃষ্টির পর পানি সরবরাহকারী কর্তৃপক্ষ কর্তৃক প্রধান লাইনে তাৎক্ষণিক ক্লোরিনেশন প্রয়োগ।" },
        { label: "ধাপ ৩: কমিউনিটি প্রস্তুতি", detail: "ওয়ার্ড স্বাস্থ্যকেন্দ্রে জরুরি খাবার স্যালাইন ও ফ্লুইডের অগ্রিম মজুত গড়ে তোলা।" }
      ]
    }
  ]
};

const TRANSLATIONS = {
  en: {
    subtitle: "NASA Space Apps 2026 — Global Megacity Blueprint (Team AstroLogic)",
    btnLang: "বাংলা",
    exportBtn: "⬇ Export Science Bundle",
    badgeOffline: "Offline Ready",
    lblPersonaSelect: "🎯 Select Perspective / Role:",
    btnPOverview: "🌐 Overview (All)",
    btnPCitizen: "👤 Citizen Mode",
    btnPPlanner: "🏛 City Planner Mode",
    btnPScientist: "🔬 Scientist / Judge Mode",
    cityLbl: "🌐 Global Blueprint City:",
    metricLbl: "Metric:",
    seasonLbl: "Season Decomposition:",
    startYearLbl: "Start Year: ",
    detectBtn: "Detect Trends",
    lblPhei: "Population-Weighted Heat Exposure Index (PHEI)",
    lblExpTotal: "Total Urban Population Exposed",
    lblExpSlum: "High-Vulnerability Slum / Informal Dwellers",
    lblDensity: "Urban Built-up Density",
    simLbl: "🌱 <strong>C40 Urban Heat Mitigation Simulator (2035):</strong>",
    bmdLbl: "🛰 Cross-Validate with In-Situ Meteorological Ground Truth",
    deltaTitle: "Differential Urban Heat Footprint (ΔT = City - Rural Baseline)",
    deltaSub: "Isolating local anthropogenic urban heat signature from broad regional climate trends.",
    provBtn: "Toggle Provenance Drawer",
    smsTitle: "📱 Low-Bandwidth Citizen Early Warning System (Live SMS Broadcast)",
    smsSub: "Designed for citizens and informal outdoor workers with zero smartphone access.",
    smsSender: "From: ",
    smsFooter: "Dial: ",
    smsMetaCovLbl: "Target Coverage:",
    smsMetaStdLbl: "Global Standard:",
    smsMetaStdVal: "UN Early Warnings for All (EW4All) & ITU Protocol",
    smsMetaTrigLbl: "Action Trigger:",
    smsMetaTrigVal: "Automated NASA Night-time Anomaly Threshold (T2M_MIN ≥ 25°C)",
    summaryTitle: "Scientific Interpretation & Trend Attribution",
    healthTitle: "🏥 Epidemiological Vulnerability & Public Health Nexus (Surveillance)",
    healthSub: "Causal mapping between detected NASA climate trends and primary health risks in urban megacities.",
    matrixTitle: "🏛 Authority Resilience Roadmap: Data-to-Decision Matrix",
    matrixSub: "Phased multi-agency interventions triggered by detected climate trends.",
    tabShort: "Short-Term (0-1 Yr)",
    tabMid: "Mid-Term (3-5 Yrs)",
    tabLong: "Long-Term (10-15 Yrs)",
    statDirection: "Direction:",
    statTheilSen: "Theil-Sen Slope:",
    statPVal: "P-Value:",
    statRateWidening: "Differential Slope (Rate of Urban Widening):",
    perYear: "/year",
    sigText: "Statistically Significant",
    nonSigText: "Not Significant at α=0.05",
    wideningText: "Urban Heat Island is Actively Widening",
    stableText: "Urban Heat Gap is Equilibrium/Stable",
    labelObserved: "Observed (NASA Satellite)",
    labelTheilSenBAU: "Theil-Sen Trend & 2035 BAU Projection",
    labelMitigated: "Policy Mitigated Trajectory",
    labelInSitu: "In-Situ Station Ground Truth (Calibrated)",
    labelObservedDelta: "Observed ΔT (City - Rural Baseline)",
    labelDeltaProj: "Differential Trend & 2035 Projection",
    labelDeltaMitigated: "Mitigated Urban Gap",
    geoTargetPrefix: "Target Core:",
    geoBaselinePrefix: "Control Baseline:"
  },
  bn: {
    subtitle: "নাসা স্পেস অ্যাপস ২০২৬ — গ্লোবাল মেগাসিটি ব্লুপ্রিন্ট (টিম অ্যাস্ট্রোলজিক)",
    btnLang: "English",
    exportBtn: "⬇ ওপেন সায়েন্স বান্ডল ডাউনলোড",
    badgeOffline: "অফলাইন প্রস্তুত",
    lblPersonaSelect: "🎯 দৃষ্টিকোণ / ব্যবহারকারীর ধরন নির্বাচন:",
    btnPOverview: "🌐 সম্পূর্ণ ওভারভিউ",
    btnPCitizen: "👤 সাধারণ নাগরিক মোড",
    btnPPlanner: "🏛 নগর পরিকল্পনাবিদ মোড",
    btnPScientist: "🔬 বিজ্ঞানী ও বিচারক মোড",
    cityLbl: "🌐 আন্তর্জাতিক মেগাসিটি নির্বাচন:",
    metricLbl: "ক্লাইমেট ভ্যারিয়েবল:",
    seasonLbl: "ঋতুভিত্তিক বিভাজন:",
    startYearLbl: "শুরুর বছর: ",
    detectBtn: "ট্রেন্ড বিশ্লেষণ করুন",
    lblPhei: "জনসংখ্যা-ভারযুক্ত তাপ ঝুঁকি সূচক (PHEI)",
    lblExpTotal: "মোট ঝুঁকিপূর্ণ নগর জনসংখ্যা",
    lblExpSlum: "উচ্চ ঝুঁকিপূর্ণ বস্তি ও টিনের ঘরের জনগোষ্ঠী",
    lblDensity: "জনসংখ্যার ঘনত্ব (প্রতি বর্গ কিমি)",
    simLbl: "🌱 <strong>C40 ক্লাইমেট সিমুলেটর ও নীতি মডেলিং (২০৩৫):</strong>",
    bmdLbl: "🛰 ইন-সিটু আবহাওয়া স্টেশনের সাথে নির্ভুলতা যাচাই",
    deltaTitle: "ডিফারেনশিয়াল আরবান তাপমাত্রিক প্রভাব (ΔT = নগর - গ্রামীণ বেসলাইন)",
    deltaSub: "আঞ্চলিক পরিবর্তন থেকে শহরের স্থানীয় মানবসৃষ্ট তাপমাত্রিক বৃদ্ধি আলাদা করার পদ্ধতি।",
    provBtn: "নাসার ডেটা প্রোভেন্যান্স দেখুন",
    smsTitle: "📱 সাধারণ জনগণের জন্য আর্লি ওয়ার্নিং সিস্টেম (স্বয়ংক্রিয় এসএমএস বার্তা)",
    smsSub: "স্মার্টফোন বা ইন্টারনেটবিহীন শ্রমজীবী ও সাধারণ মানুষের জীবন বাঁচানোর জন্য সরাসরি সেল-ব্রডকাস্ট।",
    smsSender: "প্রেরক: ",
    smsFooter: "ডায়াল করুন: ",
    smsMetaCovLbl: "কভারেজ আওতা:",
    smsMetaStdLbl: "আন্তর্জাতিক মানদণ্ড:",
    smsMetaStdVal: "জাতিসংঘ আর্লি ওয়ার্নিংস ফর অল (EW4All) ও আইটিইউ প্রটোকল",
    smsMetaTrigLbl: "স্বয়ংক্রিয় ট্রিগার:",
    smsMetaTrigVal: "নাসা নাইট-টাইম অ্যানোমালি থ্রেশহোল্ড (T2M_MIN ≥ ২৫° সে.)",
    summaryTitle: "বিজ্ঞানভিত্তিক পর্যবেক্ষণ ও অনুসন্ধান ফলাফল",
    healthTitle: "🏥 জনস্বাস্থ্য ঝুঁকি ও মহামারী নজরদারি ড্যাশবোর্ড",
    healthSub: "নাসার ক্লাইমেট ট্রেন্ডের সাথে মেগাসিটির প্রধান স্বাস্থ্য সংকটের কারণিক সম্পর্ক। বিস্তারিত জানতে কার্ডে ক্লিক করুন।",
    matrixTitle: "🏛 নগর কর্তৃপক্ষের জন্য কর্মপরিকল্পনা: ডেটা-টু-ডিসিশন রোডম্যাপ",
    matrixSub: "নাসার ক্লাইমেট ট্রেন্ডের ওপর ভিত্তি করে সিটি এজেন্সিগুলোর পর্যায়ক্রমিক রূপরেখা।",
    tabShort: "স্বল্পমেয়াদী (০-১ বছর)",
    tabMid: "মধ্যমেয়াদী (৩-৫ বছর)",
    tabLong: "দীর্ঘমেয়াদী (১০-১৫ বছর)",
    statDirection: "দিক:",
    statTheilSen: "থেইল-সেন পরিবর্তনের হার:",
    statPVal: "পি-ভ্যালু:",
    statRateWidening: "ডিফারেনশিয়াল বৃদ্ধির হার (আরবান প্রসারণ):",
    perYear: "/বছর",
    sigText: "পরিসংখ্যানগতভাবে স্পষ্ট বৃদ্ধি (Significant)",
    nonSigText: "বার্ষিক গড়ে তাৎপর্যপূর্ণ নয় (Non-significant)",
    wideningText: "আরবান হিট প্রভাব ক্রমেই বৃদ্ধি পাচ্ছে",
    stableText: "তাপমাত্রার ব্যবধান সাম্যাবস্থায় রয়েছে",
    labelObserved: "পর্যবেক্ষিত রিডিং (নাসা স্যাটেলাইট)",
    labelTheilSenBAU: "থেইল-সেন ট্রেন্ড ও ২০৩৫ পূর্বাবস্থা প্রজেকশন",
    labelMitigated: "নীতি বাস্তবায়িত হ্রাসমূলক গতিপথ",
    labelInSitu: "ইন-সিটু আবহাওয়া স্টেশন গ্রাউন্ড ট্রুথ (ক্যালিব্রেটেড)",
    labelObservedDelta: "পর্যবেক্ষিত ΔT (নগর - গ্রামীণ বেসলাইন)",
    labelDeltaProj: "ডিফারেনশিয়াল ট্রেন্ড ও ২০৩৫ প্রজেকশন",
    labelDeltaMitigated: "হ্রাসকৃত আরবান তাপমাত্রার ব্যবধান",
    geoTargetPrefix: "লক্ষ্য মেগাসিটি:",
    geoBaselinePrefix: "গ্রামীণ নিয়ন্ত্রণ বেসলাইন:"
  }
};

// Static city fallback catalogue when backend discovery is offline
const STATIC_FALLBACK_CITIES = [
  { id: "dhaka", name: "Dhaka (Bangladesh)" },
  { id: "cairo", name: "Cairo (Egypt)" },
  { id: "delhi", name: "Delhi (India)" },
  { id: "jakarta", name: "Jakarta (Indonesia)" },
  { id: "lagos", name: "Lagos (Nigeria)" }
];

async function initCitySelector() {
  const select = document.getElementById('city-select');
  try {
    const res = await fetch('/api/cities');
    if (!res.ok) throw new Error("Cities endpoint unreachable");
    const cities = await res.json();
    if (cities && cities.length > 0) {
      const currentVal = select.value || "dhaka";
      select.innerHTML = cities.map(c => `<option value="${c.id}" ${c.id === currentVal ? 'selected' : ''}>${c.name}</option>`).join('');
      return;
    }
  } catch (e) {
    console.warn("Could not fetch city list dynamically, using static fallback.");
  }
  // Enforce static dropdown population when offline
  const currentVal = select.value || "dhaka";
  select.innerHTML = STATIC_FALLBACK_CITIES.map(c => `<option value="${c.id}" ${c.id === currentVal ? 'selected' : ''}>${c.name}</option>`).join('');
}

function populateDropdowns() {
  const tDrop = DROPDOWN_OPTIONS[currentLang];

  const metricSelect = document.getElementById('param-select');
  const prevMetric = metricSelect.value || "T2M_MIN";
  metricSelect.innerHTML = tDrop.metrics.map(m => `<option value="${m.val}" ${m.val === prevMetric ? 'selected' : ''}>${m.text}</option>`).join('');

  const seasonSelect = document.getElementById('season-select');
  const prevSeason = seasonSelect.value || "ALL";
  seasonSelect.innerHTML = tDrop.seasons.map(s => `<option value="${s.val}" ${s.val === prevSeason ? 'selected' : ''}>${s.text}</option>`).join('');

  const mitSelect = document.getElementById('mitigation-select');
  const prevMit = mitSelect.value || "0";
  mitSelect.innerHTML = tDrop.mitigation.map(mit => `<option value="${mit.val}" ${mit.val === prevMit ? 'selected' : ''}>${mit.text}</option>`).join('');
}

// 1. Safe Leaflet Map Initialization
// 1. Safe Leaflet Map Initialization with Offline Vector Fallback
// 1. Premium Offline Visualization with Dynamic Country Highlighting
function initMap(targetLat, targetLon, targetName, baseLat, baseLon, baseName) {
  if (typeof L === 'undefined') return;

  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  if (!mapInstance) {
    mapInstance = L.map('map', {
      zoomControl: true,
      minZoom: 2,
      maxZoom: 18
    }).setView([targetLat, targetLon], 5);

    if (navigator.onLine) {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(mapInstance);
    } else {
      mapEl.style.backgroundColor = '#070f1e'; // Deep Space Navy
    }
  } else {
    mapInstance.setView([targetLat, targetLon], 5);
  }

  // Clear existing dynamic layers (markers, lines, and heat halos)
  mapInstance.eachLayer((layer) => {
    if (layer instanceof L.CircleMarker || layer instanceof L.Polyline || layer instanceof L.Circle) {
      mapInstance.removeLayer(layer);
    }
  });

  // Offline Country Vector Layer with Active Megacity Country Highlighting
  if (!navigator.onLine) {
    const renderStyledGeo = (geoData) => {
      // Remove old geoJSON layer if stored to prevent duplicate overlapping
      if (window.currentGeoLayer) {
        mapInstance.removeLayer(window.currentGeoLayer);
      }

      window.currentGeoLayer = L.geoJSON(geoData, {
        style: (feature) => {
          const cName = (feature.properties && (feature.properties.name || feature.properties.ADMIN || "")) || "";
          
          // Check if feature matches the current target country
          const isTargetCountry = 
            (targetName.includes("Dhaka") && cName.includes("Bangladesh")) ||
            (targetName.includes("Cairo") && cName.includes("Egypt")) ||
            (targetName.includes("Delhi") && cName.includes("India")) ||
            (targetName.includes("Jakarta") && cName.includes("Indonesia")) ||
            (targetName.includes("Lagos") && cName.includes("Nigeria"));

          if (isTargetCountry) {
            return {
              color: '#00f5d4',       // Vibrant Neon Cyan for active nation
              weight: 2,
              fillColor: '#00bbf9',
              fillOpacity: 0.28
            };
          }

          return {
            color: '#1b324f',         // Subtle Dark Slate for other countries
            weight: 1,
            fillColor: '#0e1e36',
            fillOpacity: 0.75
          };
        }
      }).addTo(mapInstance);

      window.currentGeoLayer.bringToBack();
    };

    if (geoCountriesData) {
      renderStyledGeo(geoCountriesData);
    } else {
      fetch('./countries.geojson')
        .then(res => res.json())
        .then(data => {
          geoCountriesData = data;
          renderStyledGeo(data);
        })
        .catch(err => console.warn("GeoJSON load failed:", err));
    }
  }

  // 1. Thermal Heat Dome Halo (Urban Heat Island Signature)
  L.circle([targetLat, targetLon], {
    radius: 45000, // 45km heat dissipation footprint
    color: '#ff0054',
    weight: 1,
    fillColor: '#ff0054',
    fillOpacity: 0.18,
    dashArray: '3, 6'
  }).addTo(mapInstance);

  // 2. Geodesic Baseline Comparative Vector Line
  L.polyline([[targetLat, targetLon], [baseLat, baseLon]], {
    color: '#ffbe0b',
    weight: 2,
    opacity: 0.85,
    dashArray: '5, 8'
  }).addTo(mapInstance);

  // 3. Target Urban Core Marker (High-Contrast Radar SVG)
  const targetMarker = L.circleMarker([targetLat, targetLon], {
    radius: 9,
    fillColor: '#ff0054',
    color: '#ffffff',
    weight: 2.5,
    fillOpacity: 1
  }).addTo(mapInstance);

  targetMarker.bindPopup(`
    <div style="font-family: sans-serif; font-size: 13px; color: #111;">
      <b style="color: #ff0054;">● ${targetName} Urban Core</b><br>
      Lat: ${targetLat}°, Lon: ${targetLon}°<br>
      <span style="display:inline-block; margin-top:3px; padding:2px 6px; background:#ffe3ec; color:#ff0054; border-radius:4px; font-size:11px; font-weight:bold;">
        Anthropogenic Thermal Core
      </span>
    </div>
  `).openPopup();

  // 4. Baseline Control Marker
  const baselineMarker = L.circleMarker([baseLat, baseLon], {
    radius: 7.5,
    fillColor: '#00f5d4',
    color: '#ffffff',
    weight: 2,
    fillOpacity: 1
  }).addTo(mapInstance);

  baselineMarker.bindPopup(`
    <div style="font-family: sans-serif; font-size: 13px; color: #111;">
      <b style="color: #0b8a75;">● ${baseName}</b><br>
      Lat: ${baseLat}°, Lon: ${baseLon}°<br>
      <span style="display:inline-block; margin-top:3px; padding:2px 6px; background:#e0fdf8; color:#0b8a75; border-radius:4px; font-size:11px; font-weight:bold;">
        Non-Urban Climate Control
      </span>
    </div>
  `);

  setTimeout(() => {
    mapInstance.invalidateSize();
  }, 100);
}
function renderHealthCards() {
  const container = document.getElementById('health-grid');
  if (!container) return;
  const items = HEALTH_DATA[currentLang];
  container.innerHTML = items.map((h, idx) => `
    <div class="health-item" onclick="openHealthModal(${idx})">
      <div>
        <h4>${h.title} <span class="risk-tag ${h.tagClass}">${h.tag}</span></h4>
        <div style="font-size:0.75rem; color:#f77f00; margin-bottom:6px;">⚡ ${h.trigger}</div>
        <p>${h.desc}</p>
      </div>
      <div>
        <div class="health-sol"><strong>Action:</strong> ${h.action}</div>
        <div class="click-hint">${h.clickHint}</div>
      </div>
    </div>
  `).join('');
}

function openHealthModal(idx) {
  const item = HEALTH_DATA[currentLang][idx];
  const modal = document.getElementById('health-modal');
  if (!modal) return;
  
  document.getElementById('modal-title').innerHTML = `
    ${item.title} <span class="risk-tag ${item.tagClass}">${item.tag}</span>
  `;
  document.getElementById('modal-trigger').textContent = item.trigger;

  const isBn = currentLang === 'bn';
  const mechTitle = isBn ? "🔬 শারীরবৃত্তীয় ও ক্লিনিক্যাল প্রক্রিয়া (Physiological Mechanism)" : "🔬 Clinical & Physiological Mechanism";
  const vulnTitle = isBn ? "👥 উচ্চ ঝুঁকিপূর্ণ জনগোষ্ঠী (Vulnerable Demographics)" : "👥 Highly Vulnerable Demographics";
  const stepTitle = isBn ? "📋 ধাপে ধাপে কার্যকর সমাধান ও কর্মপরিকল্পনা (Step-by-Step Action Plan)" : "📋 Step-by-Step Action Plan & Interventions";

  const stepsHtml = item.steps.map(s => `
    <div class="step-card">
      <strong>${s.label}</strong>
      <span>${s.detail}</span>
    </div>
  `).join('');

  document.getElementById('modal-body').innerHTML = `
    <div class="modal-section">
      <h4>${mechTitle}</h4>
      <p>${item.mechanism}</p>
    </div>
    <div class="modal-section">
      <h4>${vulnTitle}</h4>
      <p>${item.vulnerable}</p>
    </div>
    <div class="modal-section">
      <h4>${stepTitle}</h4>
      <div class="step-list">${stepsHtml}</div>
    </div>
  `;

  modal.classList.add('active');
}

function closeHealthModal(event) {
  if (event && event.target && event.target.closest && event.target.closest('.modal-content') && !event.target.classList.contains('modal-close')) {
    return;
  }
  const modal = document.getElementById('health-modal');
  if (modal) modal.classList.remove('active');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeHealthModal();
});

function switchHorizon(horizon) {
  activeHorizon = horizon;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const btn = document.getElementById(`tab-${horizon}`);
  if (btn) btn.classList.add('active');
  if (lastResponseData) {
    renderAuthorityMatrix(lastResponseData);
  }
}

function setPersona(role) {
  activePersona = role;
  document.querySelectorAll('.p-btn').forEach(btn => btn.classList.remove('active'));
  const targetBtn = document.getElementById(`btn-p-${role}`);
  if (targetBtn) targetBtn.classList.add('active');

  const allSections = document.querySelectorAll('.persona-target');
  allSections.forEach(sec => sec.style.display = '');

  if (role === 'citizen') {
    const toHide = ['sec-phei', 'sec-simulator', 'sec-city-charts', 'sec-delta', 'sec-matrix', 'sec-interpretation'];
    toHide.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const target = document.getElementById('sec-citizen-sms');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  } else if (role === 'planner') {
    const toHide = ['sec-citizen-sms', 'sec-health'];
    toHide.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const target = document.getElementById('sec-simulator');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  } else if (role === 'scientist') {
    const toHide = ['sec-citizen-sms'];
    toHide.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const target = document.getElementById('sec-city-charts');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  }
}

function renderPHEI(phei, cfg) {
  if (!phei) return;
  const pheiValEl = document.getElementById('val-phei');
  if (pheiValEl) pheiValEl.textContent = phei.score;

  const badge = document.getElementById('badge-phei');
  if (badge) {
    badge.textContent = phei.level;
    badge.className = 'phei-badge ' + (phei.level === 'CRITICAL' ? 'bg-alert' : '');
  }

  const unitMillion = currentLang === 'bn' ? 'মিলিয়ন' : 'Million';
  const slumRatio = cfg.demographics ? Math.round(cfg.demographics.slum_ratio * 100) : 38;
  
  const expTotalEl = document.getElementById('val-exp-total');
  if (expTotalEl) expTotalEl.textContent = `${phei.exposed_total_m} ${unitMillion}`;

  const expSlumEl = document.getElementById('val-exp-slum');
  if (expSlumEl) expSlumEl.textContent = `${phei.exposed_slum_m} ${unitMillion} (${slumRatio}%)`;

  const densityEl = document.getElementById('val-density');
  if (densityEl) densityEl.textContent = `${(phei.density_sqkm || 30093).toLocaleString()} / km²`;
}

async function renderCitizenSMS(res) {
  try {
    const cityKey = res.city_config.id;
    const latestTmin = (res.dhaka && res.dhaka.values) ? res.dhaka.values[res.dhaka.values.length - 1] : 26.2;
    const advisoryRes = await fetch(`/api/citizen-advisory?city=${cityKey}&t2m_min=${latestTmin}&t2m_max=38.5`);
    if (!advisoryRes.ok) throw new Error("Advisory route error");
    const adv = await advisoryRes.json();
    const t = TRANSLATIONS[currentLang];

    document.getElementById('sms-tier-badge').textContent = (adv.alert_tier || 'YELLOW_ADVISORY').replace('_', ' ');
    document.getElementById('sms-text-content').textContent = currentLang === 'bn' ? adv.sms_broadcast_bn : adv.sms_broadcast_en;
    document.getElementById('sms-sender-lbl').innerHTML = `${t.smsSender} <strong>${adv.sender}</strong>`;
    document.getElementById('sms-footer-lbl').innerHTML = `${t.smsFooter} <strong>${adv.hotline}</strong> (Free Municipal Hotline)`;
    document.getElementById('sms-meta-cov-val').textContent = adv.coverage;
  } catch (err) {
    console.warn("Using offline fallback citizen advisory:", err);
    const t = TRANSLATIONS[currentLang];
    const isBn = currentLang === 'bn';
    const fallbackSender = isBn ? "দুর্যোগ ব্যবস্থাপনা ও ত্রাণ মন্ত্রণালয়" : "Ministry of Disaster Management";
    const fallbackHotline = "*16100#";
    const fallbackMsg = isBn
      ? "সতর্কতা: রাতে তাপমাত্রা স্বাভাবিকের চেয়ে বেশি। ঘুমানোর পূর্বে পর্যাপ্ত পানি পান করুন এবং ঘরে স্বাভাবিক বাতাস চলাচল নিশ্চিত রাখুন।"
      : "ALERT: Night temperatures exceed baseline limits. Stay hydrated with electrolytes and ensure natural cross-ventilation.";

    const tierBadge = document.getElementById('sms-tier-badge');
    if (tierBadge) tierBadge.textContent = "YELLOW ADVISORY";
    const txtContent = document.getElementById('sms-text-content');
    if (txtContent) txtContent.textContent = fallbackMsg;
    const senderLbl = document.getElementById('sms-sender-lbl');
    if (senderLbl) senderLbl.innerHTML = `${t.smsSender} <strong>${fallbackSender}</strong>`;
    const footerLbl = document.getElementById('sms-footer-lbl');
    if (footerLbl) footerLbl.innerHTML = `${t.smsFooter} <strong>${fallbackHotline}</strong> (Free Municipal Hotline)`;
    const metaCovVal = document.getElementById('sms-meta-cov-val');
    if (metaCovVal) metaCovVal.textContent = "Offline Emergency Broadcast (Cached Mesh)";
  }
}

function renderAuthorityMatrix(res) {
  const container = document.getElementById('matrix-content');
  if (!container) return;
  const isBn = currentLang === 'bn';
  const cfg = res.city_config;
  const agencies = cfg.local_agencies || {
    health: isBn ? "স্বাস্থ্য অধিদপ্তর" : "Directorate General of Health Services",
    water: isBn ? "ঢাকা ওয়াসা" : "Dhaka WASA",
    municipal: isBn ? "উত্তর ও দক্ষিণ সিটি কর্পোরেশন" : "DNCC & DSCC",
    urban_planning: isBn ? "রাজউক" : "RAJUK"
  };
  let content = "";

  if (activeHorizon === 'short') {
    content = isBn ? `
      <div class="matrix-grid">
        <div class="matrix-col">
          <h4>🚨 জরুরি হিটওয়েভ ও স্বাস্থ্য প্রটোকল (${agencies.health})</h4>
          <ul>
            <li><strong>অটোমেটিক হিট অ্যালার্ট:</strong> নাসা অ্যানোমালি ট্রিগার হলে ৪৮ ঘণ্টা আগেই হাসপাতালগুলোতে কোল্ড ফ্লুইড মজুত নিশ্চিত করা।</li>
            <li><strong>শীতাতপ নাইট শেল্টার:</strong> ঘনবসতিপূর্ণ এলাকার শ্রমিকদের জন্য কমিউনিটি সেন্টারে অস্থায়ী শীতল রাত্রিকালীন আশ্রয় চালু।</li>
            <li><strong>কর্মঘণ্টা নিয়ন্ত্রণ:</strong> তীব্র তাপদাহে বেলা ১১টা থেকে বিকাল ৩টা পর্যন্ত ভারী কায়িক শ্রমে বাধ্যতামূলক বিরতি।</li>
          </ul>
        </div>
        <div class="matrix-col">
          <h4>💧 তাৎক্ষণিক হাইড্রেশন ও মিস্ট নেটওয়ার্ক (${agencies.water})</h4>
          <ul>
            <li><strong>ওয়াটার এটিএম বুথ:</strong> প্রধান প্রধান বাসস্ট্যান্ড ও মোড়গুলোতে বিনামূল্যে বিশুদ্ধ ঠান্ডা পানির কর্নার স্থাপন।</li>
            <li><strong>রাস্তায় পানি ছিটানো:</strong> পিকে তাপদাহ ও ধূলিদূষণ কমাতে দুপুরের পিক আওয়ারে প্রধান সড়কে ভ্রাম্যমাণ মিস্ট-ক্যানন দিয়ে পানি ছিটানো।</li>
            <li><strong>পাইপলাইন নজরদারি:</strong> ভারী বৃষ্টির ২৪ ঘণ্টার মধ্যে ঘনবসতিপূর্ণ এলাকার পানিবাহিত জীবাণু ধ্বংসে ক্লোরিনেশন নিশ্চিত করা।</li>
          </ul>
        </div>
        <div class="matrix-col">
          <h4>🦟 ক্লাইমেট ডেটা-চালিত ভেক্টর অপারেশন (${agencies.municipal})</h4>
          <ul>
            <li><strong>বৃষ্টিপাতের পর স্প্রে:</strong> নাসা রেইনফল স্পাইক ট্র্যাক করার ৩-৫ দিনের মাথায় ড্রেন ও হটস্পটে বায়োলজিক্যাল লার্ভিসাইডিং স্প্রে।</li>
            <li><strong>ছাদবাগান মনিটরিং:</strong> ড্রোনের মাধ্যমে ভবনের ছাদে জমে থাকা পানি ও মশার প্রজনন উৎস মনিটরিং।</li>
          </ul>
        </div>
      </div>
    ` : `
      <div class="matrix-grid">
        <div class="matrix-col">
          <h4>🚨 Emergency Heat Protocols (${agencies.health})</h4>
          <ul>
            <li><strong>Automated Pre-Alerts:</strong> Pre-stage cold IV fluid reserves in regional hospitals 48 hours prior to forecasted anomalies.</li>
            <li><strong>Nocturnal Public Shelters:</strong> Open air-conditioned public community centers at night for high-density informal workers.</li>
            <li><strong>Midday Labor Curtailment:</strong> Mandate hourly 15-minute shaded cooling pauses between 11 AM - 3 PM during active heat spikes.</li>
          </ul>
        </div>
        <div class="matrix-col">
          <h4>💧 Immediate Hydration & Mist Infrastructure (${agencies.water})</h4>
          <ul>
            <li><strong>Intersectional Hydration:</strong> Deploy automated cool potable water refill stations and free ORS at primary transit hubs.</li>
            <li><strong>Mobile Water Misting:</strong> High-volume water vaporization along dense corridors to suppress ambient temperatures.</li>
            <li><strong>Shock-Chlorination:</strong> Immediate chlorine dosing in municipal supply lines following erratic precipitation spikes.</li>
          </ul>
        </div>
        <div class="matrix-col">
          <h4>🦟 Targeted Vector Precision (${agencies.municipal})</h4>
          <ul>
            <li><strong>Data-Triggered Larviciding:</strong> Automated dispatch of biological larvicides exactly 72 hours after NASA rainfall anomalies.</li>
            <li><strong>Rooftop Drone Audits:</strong> Thermal drone surveillance over stagnant pools in construction sites and rooftop gardens.</li>
          </ul>
        </div>
      </div>
    `;
  } else if (activeHorizon === 'mid') {
    content = isBn ? `
      <div class="matrix-grid">
        <div class="matrix-col">
          <h4>🏢 বিল্ডিং কোড ও কুল রুফ রেগুলেশন (${agencies.urban_planning})</h4>
          <ul>
            <li><strong>কুল রুফ ম্যান্ডেট:</strong> নতুন বাণিজ্যিক ভবনে ন্যূনতম ৩০% ছাদবাগান এবং হাই-অ্যালবেডো সাদা কোটিং বাধ্যতামূলক করা।</li>
            <li><strong>হিট ইনসুলেশন নীতি:</strong> টিনের ছাউনিযুক্ত শিল্প কারখানায় থার্মাল ইনসুলেশন ফয়েল ব্যবহারে প্রণোদনা প্রদান।</li>
          </ul>
        </div>
        <div class="matrix-col">
          <h4>🌿 পারভিয়াস পেভমেন্ট ও ড্রেনেজ নেটওয়ার্ক (${agencies.municipal})</h4>
          <ul>
            <li><strong>ছিদ্রযুক্ত ফুটপাত ব্লক:</strong> নতুন ফুটপাতে পানি শোষণকারী ইন্টারলকিং ব্লক স্থাপন যাতে ভূগর্ভে আর্দ্রতা জমে থাকে।</li>
            <li><strong>খাল ও জলাধার পুনরুদ্ধার:</strong> প্রাকৃতিক আরবান কুলিং বাফার বজায় রাখতে জলাধার সম্প্রসারণ।</li>
          </ul>
        </div>
        <div class="matrix-col">
          <h4>📊 রিয়েল-টাইম মাইক্রোক্লাইমেট সেন্সর গ্রিড (${agencies.municipal})</h4>
          <ul>
            <li><strong>ওয়ার্ডভিত্তিক আইওটি সেন্সর:</strong> শহরের প্রতিটি ওয়ার্ডে স্বয়ংক্রিয় ক্লাইমেট সেন্সর স্থাপন করে স্যাটেলাইট তথ্যের ক্যালিব্রেশন।</li>
            <li><strong>হিট-হেলথ বাজেট প্রটোকল:</strong> হিটওয়েভ প্রতিরোধে স্থানীয় বার্ষিক বাজেটে নির্দিষ্ট জরুরি তহবিল বরাদ্দ।</li>
          </ul>
        </div>
      </div>
    ` : `
      <div class="matrix-grid">
        <div class="matrix-col">
          <h4>🏢 Building Code & Cool Roof Retrofits (${agencies.urban_planning})</h4>
          <ul>
            <li><strong>Mandatory Cool Surfaces:</strong> Require minimum 0.70 solar reflectance and 30% green vegetation on new commercial roofs.</li>
            <li><strong>Insulation Subsidies:</strong> Tax waivers on reflective thermal insulation foil for informal settlement tin roofs.</li>
          </ul>
        </div>
        <div class="matrix-col">
          <h4>🌿 Permeable Urban Drainage Network (${agencies.municipal})</h4>
          <ul>
            <li><strong>Porous Pavement Mandate:</strong> Replace solid non-porous concrete curbs with water-permeable pavement blocks.</li>
            <li><strong>Canal Ecosystem Recovery:</strong> Restore urban retention ponds as active urban micro-climate heat sinks.</li>
          </ul>
        </div>
        <div class="matrix-col">
          <h4>📊 Hyper-Local Environmental Sensor Grid (${agencies.municipal})</h4>
          <ul>
            <li><strong>Ward-Level Micro-Sensors:</strong> Deploy 100 automated IoT weather stations to calibrate satellite readings against wet-bulb temps.</li>
            <li><strong>Institutionalized EAP:</strong> Formally codify the Heatwave Early Action Protocol into city disaster financing budgets.</li>
          </ul>
        </div>
      </div>
    `;
  } else {
    content = isBn ? `
      <div class="matrix-grid">
        <div class="matrix-col">
          <h4>🌳 মেগাসিটি গ্রিন ক্যানোপি মিশন ২০৩৫ (${agencies.urban_planning})</h4>
          <ul>
            <li><strong>ক্যানোপি বৃদ্ধি:</strong> সড়ক বিভাজক, রেললাইন বাফার এবং পতিত জমিতে স্থানীয় প্রজাতির চিরহরিৎ গাছের ঘন জঙ্গল তৈরি।</li>
            <li><strong>বায়ু চলাচল করিডোর:</strong> প্রধান পার্ক ও উন্মুক্ত এলাকার মধ্যে অবিচ্ছিন্ন সবুজ বায়ু চলাচল করিডোর সংযুক্তিকরণ।</li>
          </ul>
        </div>
        <div class="matrix-col">
          <h4>🌊 ব্লু-গ্রিন স্পঞ্জ সিটি সিস্টেম (${agencies.water})</h4>
          <ul>
            <li><strong>পেরিফেরাল নদী বাফার:</strong> শহরের চারপাশের নদী ও জলাভূমির ১ কিমি এলাকা ইকোলজিক্যাল কুলিং বাফার হিসেবে সংরক্ষণ।</li>
            <li><strong>স্পঞ্জ সিটি মডেল:</strong> এমন ভূগর্ভস্থ রিজার্ভার তৈরি যাতে বর্ষার পানি ধারণ করে গ্রীষ্মের খরায় পুনঃব্যবহার করা যায়।</li>
          </ul>
        </div>
        <div class="matrix-col">
          <h4>⚡ শূন্য-নির্গমন পরিবহন ও ইন্ডাস্ট্রিয়াল জোন ডিকাপলিং (${agencies.municipal})</h4>
          <ul>
            <li><strong>ইলেকট্রিক গণপরিবহন:</strong> ২০৩৫ সালের মধ্যে নগর গণপরিবহনকে সম্পূর্ণ ইলেকট্রিক ব্যাটারিতে রূপান্তর করা।</li>
            <li><strong>শিল্পকারখানার তাপ স্থানান্তর:</strong> অতিরিক্ত তাপ উৎপাদনকারী ভারী শিল্পগুলোকে আবাসিক গ্রিডের বাইরে স্থানান্তর।</li>
          </ul>
        </div>
      </div>
    ` : `
      <div class="matrix-grid">
        <div class="matrix-col">
          <h4>🌳 Megacity Green Canopy Expansion 2035 (${agencies.urban_planning})</h4>
          <ul>
            <li><strong>Scale Canopy Density:</strong> Aggressively scale urban vegetation along railway buffers and road medians.</li>
            <li><strong>Continuous Air Corridors:</strong> Interconnect major regional parks with unbroken tree belts.</li>
          </ul>
        </div>
        <div class="matrix-col">
          <h4>🌊 Peripheral Blue-Green Sponge City System (${agencies.water})</h4>
          <ul>
            <li><strong>River Cooling Buffer:</strong> Preserve 1 km eco-restoration belts along perimeter waterways to sustain air exchange.</li>
            <li><strong>Sponge City Transformation:</strong> Engineer subterranean ecological retention vaults capable of absorbing flash monsoons.</li>
          </ul>
        </div>
        <div class="matrix-col">
          <h4>⚡ Zero-Emission Mobility & Thermal Decoupling (${agencies.municipal})</h4>
          <ul>
            <li><strong>100% Electric Mass Transit:</strong> Eliminate vehicular combustion heat exhaust by transitioning all transit to electric by 2035.</li>
            <li><strong>Industrial Thermal Zoning:</strong> Legally mandate relocation of heavy heat-emitting manufacturing away from residential zones.</li>
          </ul>
        </div>
      </div>
    `;
  }

  container.innerHTML = content;
}

function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'bn' : 'en';
  const t = TRANSLATIONS[currentLang];

  document.getElementById('txt-subtitle').textContent = t.subtitle;
  document.getElementById('btn-lang').textContent = t.btnLang;
  document.getElementById('btn-export').textContent = t.exportBtn;
  document.getElementById('offline-badge').textContent = t.badgeOffline;

  document.getElementById('lbl-persona-select').textContent = t.lblPersonaSelect;
  document.getElementById('btn-p-overview').textContent = t.btnPOverview;
  document.getElementById('btn-p-citizen').textContent = t.btnPCitizen;
  document.getElementById('btn-p-planner').textContent = t.btnPPlanner;
  document.getElementById('btn-p-scientist').textContent = t.btnPScientist;

  document.getElementById('lbl-city').textContent = t.cityLbl;
  document.getElementById('lbl-metric').textContent = t.metricLbl;
  document.getElementById('lbl-season').textContent = t.seasonLbl;
  document.getElementById('lbl-range').childNodes[0].nodeValue = t.startYearLbl;
  document.getElementById('btn-detect').textContent = t.detectBtn;
  
  document.getElementById('lbl-phei').textContent = t.lblPhei;
  document.getElementById('lbl-exp-total').textContent = t.lblExpTotal;
  document.getElementById('lbl-exp-slum').textContent = t.lblExpSlum;
  document.getElementById('lbl-density').textContent = t.lblDensity;
  
  document.getElementById('lbl-sim').innerHTML = t.simLbl;
  document.getElementById('lbl-bmd').textContent = t.bmdLbl;

  document.getElementById('title-delta').textContent = t.deltaTitle;
  document.getElementById('sub-delta').textContent = t.deltaSub;
  document.getElementById('btn-prov-dhaka').textContent = t.provBtn;
  document.getElementById('btn-prov-sylhet').textContent = t.provBtn;

  document.getElementById('sms-title').textContent = t.smsTitle;
  document.getElementById('sms-sub').textContent = t.smsSub;
  document.getElementById('sms-meta-cov-lbl').textContent = t.smsMetaCovLbl;
  document.getElementById('sms-meta-std-lbl').textContent = t.smsMetaStdLbl;
  document.getElementById('sms-meta-std-val').textContent = t.smsMetaStdVal;
  document.getElementById('sms-meta-trig-lbl').textContent = t.smsMetaTrigLbl;
  document.getElementById('sms-meta-trig-val').textContent = t.smsMetaTrigVal;

  document.getElementById('title-summary').textContent = t.summaryTitle;
  document.getElementById('title-health').textContent = t.healthTitle;
  document.getElementById('sub-health').textContent = t.healthSub;

  document.getElementById('matrix-title').textContent = t.matrixTitle;
  document.getElementById('matrix-sub').textContent = t.matrixSub;
  document.getElementById('tab-short').textContent = t.tabShort;
  document.getElementById('tab-mid').textContent = t.tabMid;
  document.getElementById('tab-long').textContent = t.tabLong;

  populateDropdowns();
  renderHealthCards();
  loadComparison();
}

async function fetchComparison(city, variable, season) {
  const res = await fetch(`/api/compare?city=${city}&variable=${variable}&season=${season}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch comparison for ${city}: Status ${res.status}`);
  }
  return await res.json();
}

function sliceByYear(data, startYear) {
  if (!data || !data.years) return data;
  const idx = data.years.findIndex(y => y >= startYear);
  if (idx === -1) return data;
  return {
    ...data,
    years: data.years.slice(idx),
    values: data.values.slice(idx),
    fitted_line: data.fitted_line.slice(idx),
    bmd_ground_truth: data.bmd_ground_truth ? data.bmd_ground_truth.slice(idx) : []
  };
}

function detectAnomalies(values) {
  if (!values || values.length === 0) return [];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / values.length);
  return values.map(v => Math.abs(v - mean) > 1.3 * std);
}

function renderCityCard(elementKey, data, cardTitle, isTarget, mitigationOffset, showBMD) {
  const t = TRANSLATIONS[currentLang];
  const statsDiv = document.getElementById(`stats-${elementKey}`);
  const titleDiv = document.getElementById(`title-${elementKey}`);
  if (titleDiv) titleDiv.textContent = cardTitle;

  if (!data || !data.trend) {
    if (statsDiv) statsDiv.innerHTML = "Offline Fixture Inactive";
    return;
  }

  const isSig = data.trend.significant;
  const anomalies = detectAnomalies(data.values);
  const pointSizes = anomalies.map(isA => isA ? 7 : 3);
  const pointColors = anomalies.map(isA => isA ? '#ff0054' : (isTarget ? '#48cae4' : '#06d6a0'));

  if (statsDiv) {
    statsDiv.innerHTML = `
      <strong>${t.statDirection}</strong> ${data.trend.direction.toUpperCase()}<br>
      <strong>${t.statTheilSen}</strong> ${data.slope.slope.toFixed(4)} ${t.perYear}<br>
      <strong>${t.statPVal}</strong> ${data.trend.p_value.toFixed(5)} 
      <span style="color: ${isSig ? '#06d6a0' : '#f77f00'}">
        (${isSig ? t.sigText : t.nonSigText})
      </span>
    `;
  }

  const futureYears = (data.projection && data.projection.future_years) ? data.projection.future_years : [];
  const allYears = [...data.years, ...futureYears];
  const observedPadded = [...data.values, ...Array(futureYears.length).fill(null)];
  const projectedBau = (data.projection && data.projection.projected_bau) ? data.projection.projected_bau : [];
  const bauProjected = [...data.fitted_line, ...projectedBau];

  const datasets = [
    {
      label: `${cardTitle} ${t.labelObserved}`,
      data: observedPadded,
      borderColor: isTarget ? '#48cae4' : '#06d6a0',
      backgroundColor: 'rgba(72, 202, 228, 0.08)',
      fill: true,
      tension: 0.2,
      pointRadius: [...pointSizes, ...Array(futureYears.length).fill(0)],
      pointBackgroundColor: [...pointColors, ...Array(futureYears.length).fill(null)]
    },
    {
      label: t.labelTheilSenBAU,
      data: bauProjected,
      borderColor: '#ff595e',
      borderWidth: 2,
      borderDash: [6, 4],
      fill: false,
      pointRadius: 0
    }
  ];

  if (mitigationOffset > 0 && isTarget) {
    const mitigatedProjected = bauProjected.map((val, idx) => {
      if (idx < data.years.length) return null;
      return +(val - mitigationOffset).toFixed(4);
    });
    datasets.push({
      label: `${t.labelMitigated} (-${mitigationOffset}°C)`,
      data: mitigatedProjected,
      borderColor: '#06d6a0',
      borderWidth: 2.5,
      borderDash: [3, 3],
      fill: false,
      pointRadius: 0
    });
  }

  if (showBMD && isTarget && data.bmd_ground_truth && data.bmd_ground_truth.length > 0) {
    const bmdPadded = [...data.bmd_ground_truth, ...Array(futureYears.length).fill(null)];
    datasets.push({
      label: t.labelInSitu,
      data: bmdPadded,
      borderColor: '#ffd166',
      borderWidth: 1.5,
      pointRadius: 2.5,
      pointBackgroundColor: '#ffd166',
      fill: false
    });
  }

  const canvas = document.getElementById(`chart-${elementKey}`);
  if (!canvas || typeof Chart === 'undefined') return;
  const ctx = canvas.getContext('2d');
  if (charts[elementKey]) charts[elementKey].destroy();

  charts[elementKey] = new Chart(ctx, {
    type: 'line',
    data: { labels: allYears, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: '#3a506b' }, ticks: { color: '#8d99ae' } },
        y: { grid: { color: '#3a506b' }, ticks: { color: '#8d99ae' } }
      }
    }
  });
}

function renderDeltaCard(deltaData, mitigationOffset) {
  const t = TRANSLATIONS[currentLang];
  const statsDiv = document.getElementById('stats-delta');

  if (!deltaData || !deltaData.trend) {
    if (statsDiv) statsDiv.innerHTML = "Offline Fixture Inactive";
    return;
  }

  const isSig = deltaData.trend.significant;
  const anomalies = detectAnomalies(deltaData.values);
  const pointSizes = anomalies.map(isA => isA ? 7 : 3);
  const pointColors = anomalies.map(isA => isA ? '#fee440' : '#f72585');

  if (statsDiv) {
    statsDiv.innerHTML = `
      <strong>${t.statRateWidening}</strong> ${deltaData.slope.slope.toFixed(4)} ${t.perYear}<br>
      <strong>${t.statPVal}</strong> ${deltaData.trend.p_value.toFixed(5)} 
      <span style="color: ${isSig ? '#06d6a0' : '#f77f00'}">
        (${isSig ? t.wideningText : t.stableText})
      </span>
    `;
  }

  const futureYears = (deltaData.projection && deltaData.projection.future_years) ? deltaData.projection.future_years : [];
  const allYears = [...deltaData.years, ...futureYears];
  const deltaObservedPadded = [...deltaData.values, ...Array(futureYears.length).fill(null)];
  const projectedBau = (deltaData.projection && deltaData.projection.projected_bau) ? deltaData.projection.projected_bau : [];
  const deltaBauProjected = [...deltaData.fitted_line, ...projectedBau];

  const datasets = [
    {
      label: t.labelObservedDelta,
      data: deltaObservedPadded,
      borderColor: '#f72585',
      backgroundColor: 'rgba(247, 37, 133, 0.08)',
      fill: true,
      tension: 0.2,
      pointRadius: [...pointSizes, ...Array(futureYears.length).fill(0)],
      pointBackgroundColor: [...pointColors, ...Array(futureYears.length).fill(null)]
    },
    {
      label: t.labelDeltaProj,
      data: deltaBauProjected,
      borderColor: '#fee440',
      borderWidth: 2,
      borderDash: [6, 4],
      fill: false,
      pointRadius: 0
    }
  ];

  if (mitigationOffset > 0) {
    const mitigatedDelta = deltaBauProjected.map((val, idx) => {
      if (idx < deltaData.years.length) return null;
      return +(val - mitigationOffset).toFixed(4);
    });
    datasets.push({
      label: `${t.labelDeltaMitigated} (-${mitigationOffset}°C)`,
      data: mitigatedDelta,
      borderColor: '#06d6a0',
      borderWidth: 2.5,
      borderDash: [3, 3],
      fill: false,
      pointRadius: 0
    });
  }

  const canvas = document.getElementById('chart-delta');
  if (!canvas || typeof Chart === 'undefined') return;
  const ctx = canvas.getContext('2d');
  if (charts['delta']) charts['delta'].destroy();

  charts['delta'] = new Chart(ctx, {
    type: 'line',
    data: { labels: allYears, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: '#3a506b' }, ticks: { color: '#8d99ae' } },
        y: { grid: { color: '#3a506b' }, ticks: { color: '#8d99ae' } }
      }
    }
  });
}

function updateInterpretation(res, mitigationOffset) {
  const textDiv = document.getElementById('interpretation-text');
  if (!textDiv) return;
  const d = res.dhaka;
  const s = res.sylhet;
  const delta = res.delta;
  const city = res.city_config.name;
  const baseline = res.city_config.baseline.name;

  const simNote = mitigationOffset > 0 
    ? (currentLang === 'bn' 
        ? `<br><br>💡 <strong>সিমুলেশন ফলাফল:</strong> <strong>-${mitigationOffset}°C</strong> নীতি বাস্তবায়ন করলে ২০৩৫ সালের মধ্যে তাপমাত্রা বৃদ্ধির গতিপথ কার্যকরভাবে বাধাগ্রস্ত হবে এবং সংকটাবস্থা প্রায় <strong>${(mitigationOffset / (Math.abs(d.slope.slope) || 0.015)).toFixed(1)} বছর</strong> পিছিয়ে দেওয়া সম্ভব হবে।`
        : `<br><br>💡 <strong>Simulation Insight:</strong> Implementing a <strong>-${mitigationOffset}°C</strong> mitigation policy bends ${city}'s 2035 warming trajectory, effectively delaying urban heat distress thresholds by approximately <strong>${(mitigationOffset / (Math.abs(d.slope.slope) || 0.015)).toFixed(1)} years</strong>.`)
    : '';

  if (currentLang === 'bn') {
    textDiv.innerHTML = `
      <strong>বিশ্লেষণের ভিত্তি:</strong> মেগাসিটি: <code>${city}</code> | প্যারামিটার: <code>${res.variable}</code> | ঋতু: <code>${res.season}</code><br><br>
      • <strong>আঞ্চলিক গ্রামীণ বেসলাইন (${baseline}):</strong> বার্ষিক পরিবর্তনের হার <strong>${s.slope.slope.toFixed(4)}/বছর</strong> (p = <strong>${s.trend.p_value.toFixed(5)}</strong>)। এটি প্রাকৃতিক আবহাওয়া পরিবর্তনের স্বাভাবিক গতিবিধি তুলে ধরে।<br><br>
      • <strong>মেগাসিটি কোর (${city}):</strong> বার্ষিক পরিবর্তনের হার <strong>${d.slope.slope.toFixed(4)}/বছর</strong> (p = <strong>${d.trend.p_value.toFixed(5)}</strong>)।<br><br>
      • <strong>আরবান রেসিডুয়াল সিগনেচার (ΔT):</strong> গ্রামীণ বেসলাইন বাদ দিলে মেগাসিটির নিজস্ব বৃদ্ধির হার <strong>${delta.slope.slope.toFixed(4)}/বছর</strong>। ${delta.slope.slope > 0 ? 'কংক্রিটাইজেশন এবং দ্রুত গাছপালা কমে যাওয়ায় তাপ ধরে রাখার হার বাড়ছে।' : 'আঞ্চলিক পরিবর্তনের সাথে তাপমাত্রার ব্যবধান সাম্যাবস্থায় রয়েছে।'}${simNote}
    `;
  } else {
    textDiv.innerHTML = `
      <strong>Evaluation Context:</strong> Megacity: <code>${city}</code> | Metric: <code>${res.variable}</code> | Season: <code>${res.season}</code><br><br>
      • <strong>Regional Rural Baseline (${baseline}):</strong> Shows a slope of <strong>${s.slope.slope.toFixed(4)}/year</strong> with p = <strong>${s.trend.p_value.toFixed(5)}</strong>. Reflects natural regional background warming.<br><br>
      • <strong>Urban Megacity Core (${city}):</strong> Shows a slope of <strong>${d.slope.slope.toFixed(4)}/year</strong> with p = <strong>${d.trend.p_value.toFixed(5)}</strong>.<br><br>
      • <strong>Urban Residual Footprint (ΔT):</strong> By subtracting rural baseline, the differential slope is <strong>${delta.slope.slope.toFixed(4)}/year</strong> (p = <strong>${delta.trend.p_value.toFixed(5)}</strong>). ${delta.slope.slope > 0 ? 'City is heating faster than regional climate background due to impervious built-up densification.' : 'The differential remains balanced with macro regional movements.'}${simNote}
    `;
  }
}

async function loadComparison() {
  try {
    const cityKey = document.getElementById('city-select').value || "dhaka";
    const variable = document.getElementById('param-select').value || "T2M_MIN";
    const season = document.getElementById('season-select').value || "ALL";
    const startYear = parseInt(document.getElementById('year-range').value) || 2004;
    const mitigationOffset = parseFloat(document.getElementById('mitigation-select').value || "0");
    const showBMD = document.getElementById('chk-bmd').checked;

    let res;
    try {
      res = await fetchComparison(cityKey, variable, season);
    } catch (netErr) {
      console.warn("Backend API route failed, attempting fallback to Dhaka local fixture:", netErr);
      // Fallback query to dhaka if secondary city was not pre-cached on disk
      res = await fetchComparison("dhaka", variable, season);
    }

    lastResponseData = res;
    const cfg = res.city_config;

    initMap(cfg.lat, cfg.lon, cfg.name, cfg.baseline.lat, cfg.baseline.lon, cfg.baseline.name);
    renderHealthCards();
    renderPHEI(res.phei, cfg);
    await renderCitizenSMS(res);

    const t = TRANSLATIONS[currentLang];
    document.getElementById('geo-target').innerHTML = `📍 <strong>${t.geoTargetPrefix}</strong> ${cfg.name} | Lat: ${cfg.lat}°, Lon: ${cfg.lon}°`;
    document.getElementById('geo-baseline').innerHTML = `📍 <strong>${t.geoBaselinePrefix}</strong> ${cfg.baseline.name} (${cfg.baseline.type})`;

    const slicedTarget = sliceByYear(res.dhaka, startYear);
    const slicedBaseline = sliceByYear(res.sylhet, startYear);
    const slicedDelta = sliceByYear(res.delta, startYear);

    renderCityCard('dhaka', slicedTarget, cfg.name, true, mitigationOffset, showBMD);
    renderCityCard('sylhet', slicedBaseline, cfg.baseline.name, false, 0, false);
    renderDeltaCard(slicedDelta, mitigationOffset);
    updateInterpretation(res, mitigationOffset);
    renderAuthorityMatrix(res);

    document.getElementById('prov-dhaka').textContent = JSON.stringify(res.provenance, null, 2);
    document.getElementById('prov-sylhet').textContent = JSON.stringify(res.provenance, null, 2);

    setPersona(activePersona);
  } catch (err) {
    console.error("Dashboard loading error (Offline Recovery Triggered):", err);
    // Clear hanging loading tags so the interface remains clean
    document.querySelectorAll('.loading-text').forEach(el => {
      el.textContent = "Offline Mode: Showing baseline parameters";
    });
  }
}

function exportData() {
  const cityKey = document.getElementById('city-select').value || "dhaka";
  const variable = document.getElementById('param-select').value || "T2M_MIN";
  const season = document.getElementById('season-select').value || "ALL";
  window.location.href = `/api/export?city=${cityKey}&variable=${variable}&season=${season}`;
}

function toggleProv(city) {
  const el = document.getElementById(`prov-${city}`);
  if (el) el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

window.onload = async () => {
  await initCitySelector();
  populateDropdowns();
  loadComparison();
};
