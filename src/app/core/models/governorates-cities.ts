export interface City {
  id: string;
  name: string;
}

export interface Governorate {
  id: string;
  name: string;
  cities: City[];
}

export const governorates: Governorate[] = [
  {
    id: 'alexandria',
    name: 'الإسكندرية',
    cities: [
      { id: 'alexandria', name: 'الإسكندرية' },
      { id: 'smouha', name: 'سموحة' },
      { id: 'miami', name: 'ميامي' },
      { id: 'sidi_gaber', name: 'سيدي جابر' },
      { id: 'sporting', name: 'سبورتنج' },
      { id: 'moharam_bek', name: 'محرم بك' },
      { id: 'mandara', name: 'المنتزه / المندرة' },
      { id: 'victoria', name: 'فيكتوريا' },
      { id: 'el_agamy', name: 'العجمي' },
      { id: 'borg_el_arab', name: 'برج العرب' },
      { id: 'abou_keer', name: 'أبو قير' },
      { id: 'al_ibrahimeya', name: 'الإبراهيمية' },
      { id: 'bakos', name: 'باكوس' },
      { id: 'camp_cesar', name: 'كامب شيزار' },
      { id: 'karmouz', name: 'كرموز' }
    ]
  },
  {
    id: 'matruh',
    name: 'مطروح',
    cities: [
      { id: 'matruh', name: 'مرسى مطروح' }
    ]
  },
  {
    id: 'port_said',
    name: 'بورسعيد',
    cities: [
      { id: 'port_said', name: 'بورسعيد' }
    ]
  },
  {
    id: 'damietta',
    name: 'دمياط',
    cities: [
      { id: 'damietta', name: 'دمياط' }
    ]
  },
  {
    id: 'sharqia',
    name: 'الشرقية',
    cities: [
      { id: 'zagazig', name: 'الزقازيق' },
      { id: 'bilbeis', name: 'بلبيس' }
    ]
  },
  {
    id: 'ismailia',
    name: 'الإسماعيلية',
    cities: [
      { id: 'ismailia', name: 'الإسماعيلية' }
    ]
  },
  {
    id: 'behaira',
    name: 'البحيرة',
    cities: [
      { id: 'damanhur', name: 'دمنهور' },
      { id: 'kafr_el_dawwar', name: 'كفر الدوار' }
    ]
  },
  {
    id: 'kafr_el_sheikh',
    name: 'كفر الشيخ',
    cities: [
      { id: 'kafr_el_sheikh', name: 'كفر الشيخ' }
    ]
  },
  {
    id: 'gharbiya',
    name: 'الغربية',
    cities: [
      { id: 'mahalla', name: 'المحلة الكبرى' },
      { id: 'tanta', name: 'طنطا' }
    ]
  },
  {
    id: 'dakahlia',
    name: 'الدقهلية',
    cities: [
      { id: 'mansoura', name: 'المنصورة' },
      { id: 'mit_ghamr', name: 'ميت غمر' }
    ]
  },
  {
    id: 'menofia',
    name: 'المنوفية',
    cities: [
      { id: 'shibin_el_kom', name: 'شبين الكوم' },
      { id: 'sadat_city', name: 'مدينة السادات' }
    ]
  },
  {
    id: 'qalyubia',
    name: 'القليوبية',
    cities: [
      { id: 'banha', name: 'بنها' },
      { id: 'shubra_el_kheima', name: 'شبرا الخيمة' }
    ]
  },
  {
    id: 'cairo',
    name: 'القاهرة',
    cities: [
      { id: 'cairo', name: 'القاهرة' },
      { id: 'nasr_city', name: 'مدينة نصر' },
      { id: 'heliopolis', name: 'مصر الجديدة' },
      { id: 'new_cairo', name: 'القاهرة الجديدة' },
      { id: 'shubra', name: 'شبرا' },
      { id: 'maadi', name: 'المعادي' },
      { id: 'mokattam', name: 'المقطم' },
      { id: 'zamalek', name: 'الزمالك' },
      { id: 'downtown', name: 'وسط البلد' },
      { id: 'ain_shams', name: 'عين شمس' },
      { id: 'el_marg', name: 'المرج' },
      { id: 'el_matariya', name: 'المطرية' },
      { id: 'el_salam', name: 'السلام' },
      { id: 'dar_el_salaam', name: 'دار السلام' },
      { id: 'sayeda_zeinab', name: 'السيدة زينب' },
      { id: 'helwan', name: 'حلوان' },
      { id: 'el_basatin', name: 'البساتين' },
      { id: 'el_khalifa', name: 'الخليفة' },
      { id: 'el_zekazik', name: 'الزيتون' }
    ]
  },
  {
    id: 'giza',
    name: 'الجيزة',
    cities: [
      { id: 'giza', name: 'الجيزة' },
      { id: 'sixth_of_october', name: '6 أكتوبر' },
      { id: 'sheikh_zayed', name: 'الشيخ زايد' }
    ]
  },
  {
    id: 'suez',
    name: 'السويس',
    cities: [
      { id: 'suez', name: 'السويس' }
    ]
  },
  {
    id: 'faiyum',
    name: 'الفيوم',
    cities: [
      { id: 'faiyum', name: 'الفيوم' }
    ]
  },
  {
    id: 'bani_suef',
    name: 'بني سويف',
    cities: [
      { id: 'beni_suef', name: 'بني سويف' }
    ]
  },
  {
    id: 'menya',
    name: 'المنيا',
    cities: [
      { id: 'minya', name: 'المنيا' }
    ]
  },
  {
    id: 'assiut',
    name: 'أسيوط',
    cities: [
      { id: 'asyut', name: 'أسيوط' },
      { id: 'new_asyut', name: 'أسيوط الجديدة' },
      { id: 'abnub', name: 'أبنوب' },
      { id: 'abu_tig', name: 'أبو تيج' },
      { id: 'el_badari', name: 'البداري' },
      { id: 'el_fateh', name: 'الفتح' },
      { id: 'el_ghanayem', name: 'الغنايم' },
      { id: 'el_qusiya', name: 'القوصية' },
      { id: 'dairut', name: 'ديروط' },
      { id: 'manfalut', name: 'منفلوط' },
      { id: 'sahel_selim', name: 'ساحل سليم' },
      { id: 'sidfa', name: 'صدفا' }
    ]
  },
  {
    id: 'sohag',
    name: 'سوهاج',
    cities: [
      { id: 'sohag', name: 'سوهاج' },
      { id: 'new_sohag', name: 'سوهاج الجديدة' },
      { id: 'akhmim', name: 'أخميم' },
      { id: 'new_akhmim', name: 'أخميم الجديدة' },
      { id: 'dar_el_salam', name: 'دار السلام' },
      { id: 'saqultah', name: 'ساقلتة' },
      { id: 'el_balyana', name: 'البلينا' },
      { id: 'el_maragha', name: 'المراغة' },
      { id: 'girga', name: 'جرجا' },
      { id: 'juhayna', name: 'جهينة' },
      { id: 'tahta', name: 'طهطا' },
      { id: 'tima', name: 'طما' }
    ]
  },
  {
    id: 'qena',
    name: 'قنا',
    cities: [
      { id: 'qena', name: 'قنا' },
      { id: 'nag_hammadi', name: 'نجع حمادي' },
      { id: 'deshna', name: 'دشنا' },
      { id: 'abu_tesht', name: 'أبو تشت' },
      { id: 'naqada', name: 'نقادة' },
      { id: 'qift', name: 'قفط' },
      { id: 'qus', name: 'قوص' },
      { id: 'el_waqf', name: 'الوقف' }
    ]
  },
  {
    id: 'luxor',
    name: 'الأقصر',
    cities: [
      { id: 'luxor', name: 'الأقصر' },
      { id: 'tiba_new', name: 'طيبة الجديدة' },
      { id: 'esna', name: 'إسنا' },
      { id: 'armant', name: 'أرمنت' },
      { id: 'qurna', name: 'القرنة' },
      { id: 'el_tod', name: 'الطود' }
    ]
  },
  {
    id: 'aswan',
    name: 'أسوان',
    cities: [
      { id: 'aswan', name: 'أسوان' },
      { id: 'edfu', name: 'إدفو' },
      { id: 'kom_ombo', name: 'كوم أمبو' },
      { id: 'daraw', name: 'دراو' },
      { id: 'new_aswan', name: 'أسوان الجديدة' }
    ]
  },
  {
    id: 'red_sea',
    name: 'البحر الأحمر',
    cities: [
      { id: 'hurghada', name: 'الغردقة' }
    ]
  },
  {
    id: 'new_valley',
    name: 'الوادي الجديد',
    cities: [
      { id: 'kharga', name: 'الخارجة' }
    ]
  },
  {
    id: 'north_sinai',
    name: 'شمال سيناء',
    cities: [
      { id: 'arish', name: 'العريش' }
    ]
  },
  {
    id: 'south_sinai',
    name: 'جنوب سيناء',
    cities: [
      { id: 'tour', name: 'الطور' },
      { id: 'sharm_el_sheikh', name: 'شرم الشيخ' }
    ]
  }
];