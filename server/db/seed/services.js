// Home-care services catalog (bilingual). Source of truth for the seed.
// Images reuse the existing /img/services/*.jpg assets, mapped by relevance.
export const SERVICES = [
  {
    slug: 'gp', icon: 'stethoscope', image: '/img/services/medical-supervision.jpg',
    title_ar: 'طبيب عام', title_en: 'General Practitioner (GP)',
    body_ar: [
      'زيارات طبيب عام إلى منزلك للفحص السريري وتقييم الحالة ووصف العلاج المناسب ومتابعته.',
      '• كشف وتشخيص ومتابعة الحالات الحادة والمزمنة في المنزل.',
      '• إحالة وتنسيق مع الأخصائيين عند الحاجة.',
    ],
    body_en: [
      'General practitioner home visits for clinical examination, assessment, prescribing and follow-up of treatment.',
      '• Diagnosis and follow-up of acute and chronic conditions at home.',
      '• Referral and coordination with specialists when needed.',
    ],
  },
  {
    slug: 'physiotherapy', icon: 'dumbbell', image: '/img/services/healing-care.jpg',
    title_ar: 'العلاج الطبيعي', title_en: 'Physiotherapy',
    body_ar: [
      'جلسات علاج طبيعي وتأهيل في المنزل على يد أخصائيين معتمدين لاستعادة الحركة والقوة.',
      '• برامج تأهيل بعد العمليات والإصابات والجلطات.',
      '• تمارين لتحسين المدى الحركي وتخفيف الألم.',
    ],
    body_en: [
      'Home physiotherapy and rehabilitation sessions by certified specialists to restore mobility and strength.',
      '• Rehabilitation programs after surgery, injuries and strokes.',
      '• Exercises to improve range of motion and relieve pain.',
    ],
  },
  {
    slug: 'iv-injection', icon: 'syringe', image: '/img/services/diagnostic-laboratory-tests.jpg',
    title_ar: 'الحقن الوريدي', title_en: 'IV Injection',
    body_ar: [
      'إعطاء الأدوية والسوائل عبر الوريد في المنزل بإشراف تمريضي متخصص وبأعلى معايير السلامة.',
      '• تركيب كانيولا وريدية وإعطاء المحاليل والمضادات الوريدية.',
      '• مراقبة الحالة أثناء وبعد الحقن.',
    ],
    body_en: [
      'Administering medications and fluids intravenously at home under specialized nursing supervision with the highest safety standards.',
      '• IV cannula insertion and infusion of fluids and IV antibiotics.',
      '• Monitoring the patient during and after the injection.',
    ],
  },
  {
    slug: 'laboratory-investigation', icon: 'flask', image: '/img/services/respiratory-care.jpg',
    title_ar: 'التحاليل الطبية', title_en: 'Laboratory Investigation',
    body_ar: [
      'سحب العينات وإجراء التحاليل المخبرية من منزلك وتسليم النتائج بدقة وسرية.',
      '• سحب عينات الدم والبول وغيرها دون عناء الذهاب للمختبر.',
      '• نتائج موثوقة من مختبرات معتمدة.',
    ],
    body_en: [
      'Sample collection and laboratory tests from your home, with accurate and confidential results.',
      '• Blood, urine and other sample collection without going to the lab.',
      '• Reliable results from accredited laboratories.',
    ],
  },
  {
    slug: 'im-injection', icon: 'syringe', image: '/img/services/immunization-and-basic-vaccinations.jpg',
    title_ar: 'الحقن العضلي', title_en: 'IM Injection',
    body_ar: [
      'إعطاء الحقن العضلية في المنزل بطريقة آمنة ومعقّمة على يد كادر تمريضي مؤهل.',
      '• إعطاء الأدوية والفيتامينات الموصوفة.',
      '• التزام كامل بإجراءات التعقيم والسلامة.',
    ],
    body_en: [
      'Safe, sterile intramuscular injections at home by a qualified nursing team.',
      '• Administering prescribed medications and vitamins.',
      '• Full adherence to sterilization and safety procedures.',
    ],
  },
  {
    slug: 'stoma-care', icon: 'bandage', image: '/img/services/physical-and-occupational-therapy-and-rehabilitation.jpg',
    title_ar: 'العناية بالفغرة', title_en: 'Stoma Care',
    body_ar: [
      'رعاية متخصصة لفغرة الأمعاء أو المسالك مع تغيير الأكياس والعناية بالجلد المحيط.',
      '• الوقاية من التسلخات والالتهابات حول الفغرة.',
      '• تثقيف المريض وأسرته على العناية الصحيحة.',
    ],
    body_en: [
      'Specialized care for intestinal or urinary stomas, including pouch changes and surrounding-skin care.',
      '• Preventing irritation and infection around the stoma.',
      '• Educating the patient and family on proper care.',
    ],
  },
  {
    slug: 'tpn', icon: 'apple', image: '/img/services/nutritional-care.jpg',
    title_ar: 'التغذية الوريدية الكاملة', title_en: 'Total Parenteral Nutrition (TPN)',
    body_ar: [
      'إعطاء التغذية الوريدية الكاملة في المنزل للمرضى غير القادرين على التغذية الفموية بإشراف دقيق.',
      '• تحضير وتركيب محاليل التغذية الوريدية بأمان.',
      '• متابعة الحالة الغذائية والعلامات الحيوية.',
    ],
    body_en: [
      'Total parenteral nutrition (TPN) at home for patients unable to feed orally, under careful supervision.',
      '• Safe preparation and administration of nutrition infusions.',
      '• Monitoring nutritional status and vital signs.',
    ],
  },
  {
    slug: 'dressing', icon: 'bandage', image: '/img/services/physical-and-occupational-therapy-and-rehabilitation.jpg',
    title_ar: 'تغيير الضمادات', title_en: 'Wound Dressing',
    body_ar: [
      'تغيير الضمادات والعناية بالجروح في المنزل بأدوات معقّمة لتسريع الشفاء ومنع العدوى.',
      '• تنظيف الجرح وتقييمه ومتابعة التئامه.',
      '• استخدام ضمادات حديثة مناسبة لكل حالة.',
    ],
    body_en: [
      'Wound dressing changes and care at home with sterile supplies to speed healing and prevent infection.',
      '• Wound cleaning, assessment and healing follow-up.',
      '• Modern dressings suited to each case.',
    ],
  },
  {
    slug: 'enema', icon: 'hand-heart', image: '/img/services/integrated-nursing-services.jpg',
    title_ar: 'الحقنة الشرجية', title_en: 'Enema',
    body_ar: [
      'إجراء الحقنة الشرجية في المنزل بطريقة آمنة ومريحة على يد كادر تمريضي مختص.',
      '• علاج الإمساك أو التحضير لبعض الإجراءات الطبية.',
      '• مراعاة الخصوصية والراحة التامة.',
    ],
    body_en: [
      'Safe, comfortable enema procedures at home by a specialized nursing team.',
      '• Treating constipation or preparing for certain procedures.',
      '• Full respect for privacy and comfort.',
    ],
  },
  {
    slug: 'ecg', icon: 'heart-pulse', image: '/img/services/patient-and-family-education.jpg',
    title_ar: 'تخطيط القلب', title_en: 'Electrocardiogram (ECG)',
    body_ar: [
      'إجراء تخطيط القلب الكهربائي في المنزل وتوفير النتائج للطبيب المختص للتقييم.',
      '• فحص سريع وغير مؤلم لنشاط القلب.',
      '• مناسب لكبار السن وأصحاب الحالات المزمنة.',
    ],
    body_en: [
      'Electrocardiogram (ECG) performed at home, with results provided to the treating physician.',
      '• Quick, painless assessment of heart activity.',
      '• Ideal for the elderly and chronic patients.',
    ],
  },
  {
    slug: 'bladder-irrigation', icon: 'hand-heart', image: '/img/services/integrated-nursing-services.jpg',
    title_ar: 'غسيل المثانة', title_en: 'Bladder Irrigation',
    body_ar: [
      'غسيل المثانة في المنزل بإجراءات معقّمة للحفاظ على سلامة المسالك البولية.',
      '• إزالة الترسبات ومنع انسداد القسطرة.',
      '• تقليل خطر التهابات المسالك البولية.',
    ],
    body_en: [
      'Bladder irrigation at home with sterile technique to maintain urinary-tract health.',
      '• Clearing sediment and preventing catheter blockage.',
      '• Reducing the risk of urinary-tract infections.',
    ],
  },
  {
    slug: 'catheterization', icon: 'hand-heart', image: '/img/services/integrated-nursing-services.jpg',
    title_ar: 'القسطرة البولية', title_en: 'Urinary Catheterization',
    body_ar: [
      'تركيب وتغيير القسطرة البولية والعناية بها في المنزل بأمان وتعقيم تام.',
      '• تخفيف احتباس البول والعناية المستمرة بالقسطرة.',
      '• متابعة لمنع الالتهابات والمضاعفات.',
    ],
    body_en: [
      'Urinary catheter insertion, change and care at home with full safety and sterilization.',
      '• Relieving urinary retention and ongoing catheter care.',
      '• Follow-up to prevent infection and complications.',
    ],
  },
  {
    slug: 'foley-catheterization', icon: 'hand-heart', image: '/img/services/integrated-nursing-services.jpg',
    title_ar: 'تركيب قسطرة فولي', title_en: 'Foley Catheterization',
    body_ar: [
      'تركيب قسطرة فولي البولية وتثبيتها والعناية بها على يد كادر تمريضي مؤهل.',
      '• إجراء معقّم يقلل خطر العدوى.',
      '• متابعة دورية للتغيير في الوقت المناسب.',
    ],
    body_en: [
      'Insertion, fixation and care of a Foley urinary catheter by a qualified nursing team.',
      '• A sterile procedure that minimizes infection risk.',
      '• Regular follow-up for timely replacement.',
    ],
  },
  {
    slug: 'peg-tube-dressing', icon: 'bandage', image: '/img/services/physical-and-occupational-therapy-and-rehabilitation.jpg',
    title_ar: 'تغيير ضماد أنبوب المعدة (PEG)', title_en: 'PEG Tube Dressing',
    body_ar: [
      'العناية بأنبوب التغذية عبر المعدة (PEG) وتغيير الضماد حول موضعه بانتظام.',
      '• الوقاية من التهاب الجلد حول الأنبوب.',
      '• التأكد من ثبات الأنبوب وسلامته.',
    ],
    body_en: [
      'Care for the gastrostomy (PEG) feeding tube and regular dressing changes around the site.',
      '• Preventing skin inflammation around the tube.',
      '• Ensuring the tube is secure and intact.',
    ],
  },
  {
    slug: 'tracheostomy-care', icon: 'lungs', image: '/img/services/wound-burn-and-bed-ulcer-care.jpg',
    title_ar: 'العناية بفتحة القصبة الهوائية', title_en: 'Tracheostomy Care',
    body_ar: [
      'عناية متخصصة بفتحة القصبة الهوائية وتنظيفها وتغيير الضمادات للحفاظ على مجرى تنفس آمن.',
      '• تنظيف وتعقيم منتظم لمنع العدوى.',
      '• تثقيف المرافقين على العناية الطارئة.',
    ],
    body_en: [
      'Specialized tracheostomy care, cleaning and dressing changes to maintain a safe airway.',
      '• Regular cleaning and sterilization to prevent infection.',
      '• Training caregivers on emergency care.',
    ],
  },
  {
    slug: 'ngt-insertion', icon: 'activity', image: '/img/services/nutritional-care.jpg',
    title_ar: 'إدخال أنبوب أنفي معدي', title_en: 'NGT Insertion',
    body_ar: [
      'إدخال الأنبوب الأنفي المعدي في المنزل للتغذية أو الدواء بطريقة آمنة ودقيقة.',
      '• تركيب الأنبوب والتأكد من موضعه الصحيح.',
      '• راحة المريض وتقليل المضاعفات.',
    ],
    body_en: [
      'Nasogastric tube (NGT) insertion at home for feeding or medication, safely and accurately.',
      '• Placing the tube and confirming correct position.',
      '• Patient comfort and reduced complications.',
    ],
  },
  {
    slug: 'ngt-care', icon: 'apple', image: '/img/services/nutritional-care.jpg',
    title_ar: 'العناية بالأنبوب الأنفي المعدي', title_en: 'NGT Care',
    body_ar: [
      'العناية بالأنبوب الأنفي المعدي ومتابعته وتغييره في موعده مع ضمان سلامة التغذية.',
      '• تنظيف الأنبوب ومنع انسداده.',
      '• متابعة موضع الأنبوب وحالة الجلد.',
    ],
    body_en: [
      'Ongoing nasogastric tube care, monitoring and timely replacement to ensure safe feeding.',
      '• Flushing the tube and preventing blockage.',
      '• Monitoring tube position and skin condition.',
    ],
  },
  {
    slug: 'spc-care', icon: 'hand-heart', image: '/img/services/integrated-nursing-services.jpg',
    title_ar: 'العناية بالقسطرة فوق العانة', title_en: 'Suprapubic Catheter (SPC) Care',
    body_ar: [
      'العناية بالقسطرة البولية فوق العانة وتغييرها والعناية بموضعها في المنزل.',
      '• تعقيم الموضع ومنع الالتهابات.',
      '• متابعة دورية لضمان عمل القسطرة بكفاءة.',
    ],
    body_en: [
      'Care and replacement of the suprapubic urinary catheter (SPC) and its site at home.',
      '• Site sterilization and infection prevention.',
      '• Regular follow-up to ensure proper function.',
    ],
  },
  {
    slug: 'condom-catheterization', icon: 'hand-heart', image: '/img/services/integrated-nursing-services.jpg',
    title_ar: 'تركيب القسطرة الخارجية', title_en: 'Condom Catheterization',
    body_ar: [
      'تركيب القسطرة الخارجية (الواقي) للرجال كبديل مريح وأقل توغّلاً لتصريف البول.',
      '• خيار آمن يقلل خطر العدوى مقارنة بالقسطرة الداخلية.',
      '• العناية بالجلد ومتابعة الاستخدام.',
    ],
    body_en: [
      'Fitting an external (condom) catheter for men as a comfortable, less-invasive option for urine drainage.',
      '• A safe option with lower infection risk than indwelling catheters.',
      '• Skin care and usage follow-up.',
    ],
  },
  {
    slug: 'suction', icon: 'lungs', image: '/img/services/palliative-care.jpg',
    title_ar: 'الشفط', title_en: 'Suction',
    body_ar: [
      'شفط الإفرازات من مجرى التنفس في المنزل للحفاظ على تنفس سهل وآمن للمريض.',
      '• إزالة الإفرازات لمرضى القصبة الهوائية وصعوبات البلع.',
      '• إجراء معقّم وسريع يقلل خطر الاختناق.',
    ],
    body_en: [
      'Airway suction at home to keep the patient breathing easily and safely.',
      '• Clearing secretions for tracheostomy patients and those with swallowing difficulty.',
      '• A sterile, quick procedure that reduces choking risk.',
    ],
  },
];
