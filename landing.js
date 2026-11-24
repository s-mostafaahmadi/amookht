/* LANDING-SIM: TestDaF/ÖSD are simulations only. Amookht landing v7 — one merged exam-simulation block, full feature overview, Android download.
   Hooked from testdaf-daily-plan.html: router uses (window.renderLandingV6||renderLanding)(). */
(function () {
  'use strict';
  var APK = '/downloads/Amookht-Android.apk';
  var EXAM_KEY = 'amookht_lx_exam';
  var isApp = function () { return /AmookhtAndroid\//.test(navigator.userAgent); };
  function st() { try { return typeof S !== 'undefined' ? S : null; } catch (e) { return null; } }
  var lang = function () { var s = st(), l = (s && s.uiLanguage) || 'fa'; return l === 'en' || l === 'de' ? l : 'fa'; };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---------- icons (24px stroke) ---------- */
  var P = {
    headphones: 'M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z',
    book: 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z',
    pen: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z',
    mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8',
    layers: 'M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    refresh: 'M21 4v6h-6M3 20v-6h6M5.5 9a8 8 0 0 1 13.2-3L21 10M3 14l2.3 4a8 8 0 0 0 13.2-3',
    alert: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01',
    star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z',
    chart: 'M4 20h16M7 16v-5M12 16V6M17 16v-8',
    calendar: 'M4 5h16v16H4zM16 3v4M8 3v4M4 10h16',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 7v5l3 2',
    spark: 'M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
    chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    monitor: 'M3 4h18v12H3zM8 21h8M12 16v5',
    folder: 'M3 6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    phone: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2',
    download: 'M12 3v12M7 10l5 5 5-5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
    globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20',
    check: 'M20 6 9 17l-5-5',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
    moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
    sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    menu: 'M4 7h16M4 12h16M4 17h16',
    close: 'M6 6l12 12M18 6 6 18',
    send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
    grad: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6',
    key: 'M15 7a4 4 0 1 1-3.5 6L4 20.5V17h3v-3h3l1.5-1.5A4 4 0 0 1 15 7z',
    sliders: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M10 10v4M18 16v4',
    play: 'M8 5v14l11-7z'
  };
  function I(name, cls) { return '<svg class="lx-ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + P[name] + '"/></svg>'; }

  /* ---------- copy ---------- */
  var C = {
    fa: {
      dir: 'rtl',
      nav: { exams: 'آزمون‌ها', day: 'برنامه روزانه', features: 'امکانات', premium: 'Premium', app: 'اپلیکیشن', pricing: 'قیمت', faq: 'سؤالات', widget: 'اپلیکیشن' },
      login: 'ورود', register: 'شروع رایگان', menu: 'منو', theme: 'تغییر حالت روشن و تیره',
      badge: 'یادگیری آلمانی از A1 تا C2 — برنامهٔ روزانه، تمرین، مرور و گزارش پیشرفت',
      h1a: 'آلمانی را هر روز یاد بگیرید،', h1b: 'با شبیه‌سازی آزمون تمرین کنید',
      lead: 'برای زندگی روزمره، کار، مهاجرت، دانشگاه یا آزمون — Amookht برنامه روزانه، تمرین شنیدن، خواندن، نوشتن و صحبت، تمرین‌های کوتاه لغت و گرامر در سطح خودتان، دفتر عبارات با مرور فاصله‌دار و گزارش پیشرفت را در یک جا جمع کرده است.',
      simNoteT: 'TestDaF · ÖSD Zertifikat B2',
      simNote: 'با زمان‌بندی واقعی، تصحیح خودکار و نتیجهٔ هر بخش — داخل همان برنامهٔ یادگیری روزانه.',
      ctaStart: 'شروع رایگان', ctaApp: 'دانلود', ctaLogin: 'قبلاً حساب دارم',
      trust: ['۳ روز اول Premium رایگان', 'بدون نیاز به کارت بانکی', 'ورود با Google', 'فارسی · English · Deutsch'],
      mock: {
        week: 'هفته ۳ · روز ۲', goal: 'آزمون بعدی · TestDaF', today: 'برنامه امروز', progress: 'پیشرفت امروز',
        free: 'مطالعه آزاد', time: 'زمان مطالعه امروز', min: 'دقیقه', due: 'لغت برای مرور امروز', rec: 'پاسخ Sprechen ضبط شد',
        skills: ['واژگان', 'گرامر', 'شنیدن', 'خواندن', 'نوشتن', 'صحبت']
      },
      stats: [['A1–C2', 'تمرین برای همه سطح‌ها'], ['۳۵ موضوع', 'گرامر با ۱٬۱۲۰ جمله تمرین'], ['۲۴', 'موضوع مطالعه آزاد'], ['۲۶۲', 'تکلیف Sprechen']],
      proof: [
        ['۴۰ + ۳۵ سؤال', 'TestDaF: ۴۰ سؤال Lesen (۶۰ دقیقه) و ۳۵ سؤال Hören (۴۰ دقیقه) با تصحیح خودکار'],
        ['۲ آزمون کامل', 'ÖSD Zertifikat B2 در قالب رسمی، با صداهای اتریشی و سوئیسی و تصویرهای Sprechen'],
        ['۳۵ موضوع · ۱٬۱۲۰ جمله', 'تمرین گرامر با ترجمه، در کنار ۲۴ موضوع مطالعه آزاد و ۲۶۲ تکلیف Sprechen']
      ],
      proofNote: 'این اعداد از محتوای واقعی برنامه شمرده شده‌اند، نه از متن تبلیغاتی · آخرین بازبینی: ۲۹ آبان ۱۴۰۵',
      examsK: 'آزمون‌های TestDaF و ÖSD', examsH: 'شبیه‌سازی کامل TestDaF و ÖSD Zertifikat B2', examsP: 'هر دو آزمون را در شرایط واقعی تمرین کنید — با زمان‌بندی رسمی، تصحیح خودکار و نتیجهٔ هر بخش.',
      frTag: 'برای همه زبان‌آموزان', frTitle: 'مطالعه آزاد', frDesc: 'بدون فشار آزمون و بدون محدودیت زمان؛ هر روز چند تمرین کوتاه و مفید در سطح خودتان.',
      frList: ['سه سطح: مبتدی (A1–A2)، متوسط (B1–B2) و پیشرفته (C1–C2)', 'جفت‌کردن لغت، der/die/das، ساخت جمله و عبارت‌های کاربردی', '۲۴ موضوع روزمره، کاری و دانشگاهی', 'ربات تمرین گرامر با ۳۵ موضوع', 'مربی آلمانی و مترجم هوشمند'],
      frCta: 'شروع یادگیری',
      simTag: 'آزمون کامل', simTitle: 'آزمون‌های کامل، در قالب رسمی', simDesc: 'هر دو آزمون در یک بخش: TestDaF و ÖSD Zertifikat B2، هر کدام با زمان‌بندی رسمی، تصحیح خودکار و نتیجهٔ هر بخش.',
      simList: ['TestDaF: چهار بخش Lesen، Hören، Schreiben و Sprechen با زمان‌بندی واقعی آزمون', '۴۰ سؤال Lesen (۶۰ دقیقه) و ۳۵ سؤال Hören (۴۰ دقیقه) با تصحیح خودکار', 'ÖSD Zertifikat B2: دو آزمون کامل در قالب Modellsatz رسمی، با صداهای اتریشی و سوئیسی', 'Schreiben با شمارش کلمه، Sprechen با ضبط صدا و مقایسه با پاسخ نمونه', 'نتیجه و مرور هر بخش، با حدنصاب رسمی'],
      simHint: 'آزمون مورد نظر را انتخاب کنید؛ هر وقت خواستید عوضش کنید.',
      tdTag: 'پذیرش دانشگاه‌های آلمان', osTag: 'ÖSD Zertifikat B2',
      premium: 'Premium', freeTag: 'رایگان',
      dayK: 'نمونه یک روز در برنامه یادگیری', dayH: 'یک روز مطالعه، مثل روز آزمون', dayP: 'برنامه هر روز آماده است؛ فقط بلوک بعدی را شروع کنید. ترتیب بلوک‌ها با تمرکز همان روز تغییر می‌کند.',
      blocks: [
        ['Hören', 60, 'headphones', 'شنیدن مرحله‌ای: اول بدون متن، بعد تحلیل و بازشنوی'],
        ['Lesen', 45, 'book', 'خواندن با استراتژی حل و کنترل زمان'],
        ['Schreiben', 50, 'pen', 'Argumentation یا توصیف نمودار با ساختار آزمون'],
        ['Sprechen', 35, 'mic', 'ضبط پاسخ، مقایسه با نمونه و تکرار'],
        ['Grammatik & Wortschatz', 25, 'layers', 'واژگان و ساختارهای پرکاربرد آزمون'],
        ['Wiederholung', 25, 'refresh', 'مرور فعال فلش‌کارت‌ها و خطاهای قبلی']
      ],
      minShort: 'دقیقه', total: 'جمع روز',
      dayNotes: [['calendar', 'جمعه‌ها', 'ارزیابی، تحلیل اشتباهات و گزارش هفتگی'], ['clock', 'وقت بیشتر دارید؟', '۱۵ تا ۶۰ دقیقه زمان اضافه برای فلش‌کارت و مرور'], ['sliders', 'وقت کمتر دارید؟', 'در «مطالعه آزاد» زمان را خودتان تعیین کنید']],
      featK: 'همه امکانات در یک نگاه', featH: 'هرچه برای یادگیری آلمانی لازم دارید، در یک برنامه', featP: 'بیشتر امکانات رایگان‌اند؛ ابزارهای هوشمند با Premium فعال می‌شوند و ۳ روز اول برای حساب‌های تازه رایگان است.',
      filter: ['همه', 'رایگان', 'Premium'],
      groups: [
        ['برنامه و مطالعه', [
          ['target', 'داشبورد روزانه', 'هر روز می‌بینید چه چیزی مانده، چقدر وقت گذاشته‌اید و قدم بعدی چیست.', 0],
          ['sliders', 'مطالعه آزاد', 'تمرین‌های کوتاه لغت، گرامر و جمله‌سازی در سه سطح، بدون محدودیت زمان.', 0],
          ['grad', 'آزمون‌های کامل TestDaF و ÖSD', 'TestDaF و ÖSD Zertifikat B2 در یک بخش؛ با زمان‌بندی رسمی و تصحیح خودکار.', 0],
          ['clock', 'تایمر مطالعه', 'زمان مطالعه ثبت می‌شود و در تاریخچه می‌ماند.', 0]
        ]],
        ['تمرین مهارت‌ها', [
          ['headphones', 'Hören', 'فایل‌های صوتی با تمرین مرحله‌ای، متن پنهان و بازشنوی هدفمند.', 0],
          ['book', 'Lesen', 'متن‌های آزمونی با پاسخ‌نامه و توضیح راه حل.', 0],
          ['pen', 'Schreiben', 'Argumentation و Grafikbeschreibung با چک‌لیست ساختار.', 0],
          ['mic', 'Sprechen', 'پاسخ خود را ضبط کنید، دوباره گوش دهید و تکرار کنید.', 0]
        ]],
        ['حافظه و مرور', [
          ['layers', 'دفتر عبارات و فلش‌کارت', 'مرور فاصله‌دار لغت‌ها، درست در روزی که لازم است.', 0],
          ['alert', 'دفتر خطا', 'اشتباه‌ها جمع می‌شوند تا دوباره تکرار نشوند.', 0],
          ['star', 'علاقه‌مندی‌ها', 'هر متنی را انتخاب کنید و با یک ستاره برای بعد نگه دارید.', 0],
          ['chart', 'تاریخچه و گزارش', 'نمره و زمان هر مهارت، روز به روز و هفته به هفته.', 0]
        ]],
        ['ابزارهای هوشمند', [
          ['chat', 'مربی آلمانی و مربی گفتگو', 'هر سؤالی را همان لحظه بپرسید و با مربی‌های هوشمند به آلمانی گفتگو کنید.', 1],
          ['globe', 'مترجم فارسی ↔ آلمانی', 'ترجمه هر کلمه و جمله با تلفظ طبیعی و همایندها.', 1],
          ['spark', 'بازخورد هوشمند نوشتن و صحبت', 'نمره، خطاها و پیشنهاد بهبود برای متن و صدای شما.', 1],
          ['monitor', 'کتابخانه و ابزار PDF', 'آپلود PDF، یادداشت‌برداری، هایلایت و قلم روی فایل‌ها.', 1]
        ]],
        ['همه‌جا در دسترس', [
          ['phone', 'اپ اندروید', 'همان حساب و همان پیشرفت، روی گوشی.', 0],
          ['key', 'ورود با Google', 'بدون رمز عبور جدید، با یک کلیک وارد شوید.', 0],
          ['globe', 'سه زبان رابط', 'فارسی، English و Deutsch.', 0],
          ['moon', 'حالت تیره', 'برای مطالعه شبانه، راحت برای چشم.', 0]
        ]]
      ],
      weekly: 'تحلیل هفتگی خطاها',
      appK: 'اپلیکیشن Amookht', appH: 'برنامه‌تان همیشه همراه شماست', appP: 'تمرین روزانه، دفتر عبارات و ضبط Sprechen روی گوشی؛ پیشرفت با حساب شما بین گوشی و کامپیوتر همگام می‌ماند.',
      appList: ['همگام‌سازی خودکار با حساب کاربری', 'ضبط صدا برای تمرین Sprechen', 'نصب مستقیم، بدون نیاز به Google Play'],
      appBtn: 'دانلود مستقیم APK', appMeta: 'نسخه ۱٫۴ · ۳٫۸ مگابایت · اندروید ۶ به بالا',
      qrT: 'با گوشی اسکن کنید', qrP: 'دوربین گوشی را روی کد بگیرید تا دانلود شروع شود.',
      steps: [['دانلود', 'فایل APK را دانلود کنید'], ['اجازه نصب', 'در صورت درخواست، نصب از این منبع را مجاز کنید'], ['ورود', 'اپ را باز کنید و با همان حساب وارد شوید']],
      ios: 'آیفون: سایت را در Safari باز کنید و «Add to Home Screen» را بزنید.',
      priceK: 'قیمت', priceH: 'رایگان شروع کنید، هر وقت خواستید ارتقا دهید',
      freeName: 'رایگان', freePrice: '۰ تومان', freeSub: 'برای همیشه',
      freeList: ['برنامه روزانه و مطالعه آزاد', 'تمرین شنیدن، خواندن، نوشتن و صحبت', 'تمرین‌های کوتاه لغت و گرامر در سه سطح', 'دفتر عبارات، فلش‌کارت و مرور فاصله‌دار', 'دفتر خطا، علاقه‌مندی‌ها و تاریخچه', '۳ روز اول: همه امکانات Premium (به‌جز آپلود فایل در کتابخانه)'],
      freeCta: 'ساخت حساب رایگان',
      proName: 'Premium', proPrice: '۳٬۰۰۰٬۰۰۰ تومان', proSub: 'ماهانه · فعال‌سازی از طریق پشتیبانی تلگرام', proTag: 'پیشنهادی',
      proList: ['همه امکانات نسخه رایگان', 'مربی آلمانی هوشمند', 'مربی گفتگو', 'مترجم فارسی ↔ آلمانی', 'بازخورد هوشمند نوشتن و صحبت', 'تلفظ با صدای طبیعی', 'ربات تمرین گرامر هوشمند', 'تحلیل هفتگی خطاها', 'آزمون‌های کامل TestDaF و ÖSD', 'کتابخانه و ابزار PDF', 'موضوع دلخواه و تمرین اختصاصی', 'تغییر سطح فوری'],
      proCta: 'شروع با ۳ روز رایگان',
      premK: 'Premium', premH: 'امکانات ویژه‌ای که یادگیری را سریع‌تر می‌کند', premP: 'همه ابزارهای هوشمند Amookht در یک اشتراک ماهانه.', premTrial: '🎁 هر حساب تازه، ۳ روز اول همه امکانات Premium را رایگان دارد (به‌جز آپلود فایل در کتابخانه).', premCta: 'ساخت حساب و شروع ۳ روز رایگان',
      faqK: 'سؤالات متداول', faqH: 'پیش از شروع بدانید',
      faq: [
        ['Amookht برای چه کسانی است؟', 'برای همه کسانی که آلمانی یاد می‌گیرند: از مبتدی تا پیشرفته، برای زندگی روزمره، کار، مهاجرت، دانشگاه یا آزمون. اگر برای TestDaF یا ÖSD آماده می‌شوید، آزمون کامل هر دو را هم دارید.'],
        ['من مبتدی هستم؛ به دردم می‌خورد؟', 'بله. در «مطالعه آزاد» سطح خودتان را انتخاب می‌کنید (A1–A2، B1–B2 یا C1–C2) و تمرین‌های کوتاه لغت، گرامر و جمله‌سازی متناسب با همان سطح می‌آیند.'],
        ['۳ روز رایگان Premium یعنی چه؟', 'بعد از ساخت حساب، ۳ روز همه امکانات Premium مثل مربی آلمانی، مربی گفتگو، مترجم، بازخورد هوشمند و کتابخانه برایتان باز است؛ فقط آپلود فایل در کتابخانه مخصوص مشترکان است. بعد از ۳ روز حساب شما رایگان ادامه پیدا می‌کند.'],
        ['قیمت اشتراک Premium چقدر است؟', 'اشتراک Premium ماهانه ۳٬۰۰۰٬۰۰۰ تومان است و همه ابزارهای هوشمند را شامل می‌شود.'],
        ['آزمون‌های TestDaF و ÖSD کجا هستند؟', 'TestDaF و ÖSD Zertifikat B2. در بخش «آزمون‌ها» هر دو آزمون کامل، در قالب رسمی و با زمان‌بندی واقعی در دسترس است.'],
        ['TDN 4 یعنی چه؟', 'نتیجه هر بخش TestDaF در یکی از سطح‌های TDN 3، TDN 4 یا TDN 5 اعلام می‌شود. بیشتر دانشگاه‌های آلمان برای پذیرش در هر چهار بخش TDN 4 می‌خواهند و برنامه TestDaF در Amookht برای همین سطح طراحی شده است.'],
        ['استفاده از Amookht رایگان است؟', 'بله. برنامه روزانه، مطالعه آزاد، تمرین‌ها، دفتر عبارات و گزارش پیشرفت رایگان است. مربی آلمانی، مربی گفتگو، مترجم، بازخورد هوشمند نوشتن و صحبت، ربات گرامر هوشمند، تحلیل هفتگی و کتابخانه در اشتراک Premium هستند.'],
        ['روزی چقدر وقت لازم است؟', 'در «مطالعه آزاد» محدودیت زمانی ندارید؛ حتی ۱۵ دقیقه در روز هم مفید است. برنامه‌های آزمون ۲۴۰ دقیقه را پیشنهاد می‌کنند و زمان روزانه را می‌توانید بین ۱ تا ۵ ساعت تغییر دهید.'],
        ['اپ اندروید را چطور نصب کنم؟', 'فایل APK را از همین صفحه دانلود و باز کنید. اگر گوشی پرسید، نصب از این منبع را مجاز کنید. اگر نسخه ۱٫۰ قدیمی را دارید، یک‌بار آن را حذف و نسخه جدید را نصب کنید.'],
        ['اشتراک Premium را چطور تهیه کنم؟', 'بعد از ساخت حساب، در صفحه Premium روی «تهیه اشتراک از طریق تلگرام» بزنید یا در تلگرام به @Amookht_support پیام دهید.'],
        ['آیا این آزمون‌ها همان آزمون رسمی‌اند؟', 'نه. این آزمون‌ها تمرین‌هایی در قالب و زمان‌بندی آزمون‌اند و با محتوای خود Amookht نوشته شده‌اند؛ نتیجه‌شان راهنمای تمرین است و جای کارنامه رسمی TestDaF یا ÖSD را نمی‌گیرد.'],
        ['اعداد و امکانات این صفحه واقعی‌اند؟', 'بله. اعداد از محتوای خود برنامه شمرده شده‌اند: ۴۰ سؤال Lesen و ۳۵ سؤال Hören در آزمون TestDaF، ۲ آزمون کامل ÖSD B2، ۳۵ موضوع گرامر با ۱٬۱۲۰ جمله، ۲۴ موضوع مطالعه آزاد و ۲۶۲ تکلیف Sprechen. هر مورد فهرست امکانات را می‌توانید بلافاصله بعد از ساخت حساب رایگان داخل برنامه ببینید.']
      ],
      endH: 'از امروز، آلمانی را با برنامه یاد بگیرید', endP: 'حساب رایگان بسازید، ۳ روز همه امکانات Premium را امتحان کنید و اولین تمرین را همین حالا شروع کنید.',
      footP: 'همراه هوشمند یادگیری زبان آلمانی', footProduct: 'محصول', footHelp: 'پشتیبانی', tg: 'پشتیبانی در تلگرام'
    },
    en: {
      dir: 'ltr',
      nav: { exams: 'Exams', day: 'Daily plan', features: 'Features', premium: 'Premium', app: 'App', pricing: 'Pricing', faq: 'FAQ', widget: 'Apps' },
      login: 'Log in', register: 'Start free', menu: 'Menu', theme: 'Toggle light and dark mode',
      badge: 'Learn German from A1 to C2 — daily plan, practice, review and progress reports',
      h1a: 'Learn German every day,', h1b: 'practise with full exam simulations',
      lead: 'For everyday life, work, moving abroad, university or an exam — Amookht brings your daily plan, listening, reading, writing and speaking practice, short vocabulary and grammar exercises at your level, a spaced-repetition deck and progress reports together in one place.',
      simNoteT: 'TestDaF · ÖSD Zertifikat B2',
      simNote: 'Real timing, automatic marking and a result for every part — inside the same daily learning plan.',
      ctaStart: 'Start free', ctaApp: 'Download', ctaLogin: 'I already have an account',
      trust: ['First 3 days of Premium free', 'No bank card needed', 'Sign in with Google', 'فارسی · English · Deutsch'],
      mock: {
        week: 'Week 3 · Day 2', goal: 'Next exam · TestDaF', today: "Today's plan", progress: "Today's progress",
        free: 'Free study', time: 'Study time today', min: 'min', due: 'words due today', rec: 'Sprechen answer recorded',
        skills: ['Vocabulary', 'Grammar', 'Listening', 'Reading', 'Writing', 'Speaking']
      },
      stats: [['A1–C2', 'practice for every level'], ['35 topics', 'grammar with 1,120 practice sentences'], ['24', 'free-study topics'], ['262', 'Sprechen tasks']],
      proof: [
        ['40 + 35 questions', 'TestDaF: 40 Lesen questions (60 min) and 35 Hören questions (40 min), auto-marked'],
        ['2 complete exams', 'ÖSD Zertifikat B2 in the official format, with Austrian and Swiss voices and Sprechen pictures'],
        ['35 topics · 1,120 sentences', 'Grammar drills with translations, plus 24 free-study topics and 262 Sprechen tasks']
      ],
      proofNote: 'These numbers are counted from the content inside the app, not from marketing copy · Last checked: 20 Nov 2026',
      examsK: 'TestDaF & ÖSD exams', examsH: 'Complete TestDaF and ÖSD Zertifikat B2 simulations', examsP: 'Practise both exams under real conditions — official timing, automatic marking and a result for every part.',
      frTag: 'For every learner', frTitle: 'Free study', frDesc: 'No exam pressure and no time limit — a few short, useful exercises at your level every day.',
      frList: ['Three levels: beginner (A1–A2), intermediate (B1–B2), advanced (C1–C2)', 'Word pairs, der/die/das, sentence building and useful phrases', '24 everyday, work and university topics', 'Grammar practice bot with 35 topics', 'AI German tutor and translator'],
      frCta: 'Start learning',
      simTag: 'Full exam', simTitle: 'Full exams in the official format', simDesc: 'Both exams in one place: TestDaF and ÖSD Zertifikat B2, each with official timing, automatic marking and a result for every part.',
      simList: ['TestDaF: four parts — Lesen, Hören, Schreiben, Sprechen — with real exam timing', '40 Lesen items (60 min) and 35 Hören items (40 min), marked automatically', 'ÖSD Zertifikat B2: two complete exams in the official model-set format, with Austrian and Swiss voices', 'Schreiben with a word counter, Sprechen recorded and compared with model answers', 'Results and review for every part, with official pass marks'],
      simHint: 'Pick your exam — and change it whenever you like.',
      tdTag: 'Admission to German universities', osTag: 'ÖSD Zertifikat B2',
      premium: 'Premium', freeTag: 'Free',
      dayK: 'A sample day in the learning plan', dayH: 'One study day, just like the exam day', dayP: 'Every day is planned for you — just start the next block. The order adapts to the focus of the day.',
      blocks: [
        ['Hören', 60, 'headphones', 'Staged listening: first without text, then analysis and re-listening'],
        ['Lesen', 45, 'book', 'Reading with solving strategies and time control'],
        ['Schreiben', 50, 'pen', 'Argumentation or chart description in exam format'],
        ['Sprechen', 35, 'mic', 'Record your answer, compare with a model, repeat'],
        ['Grammatik & Wortschatz', 25, 'layers', 'High-frequency exam vocabulary and structures'],
        ['Wiederholung', 25, 'refresh', 'Active review of flashcards and past mistakes']
      ],
      minShort: 'min', total: 'Daily total',
      dayNotes: [['calendar', 'Fridays', 'Assessment, error analysis and weekly report'], ['clock', 'More time?', 'Add 15–60 extra minutes for flashcards and review'], ['sliders', 'Less time?', 'Set your own study time in “Free study”']],
      featK: 'Everything at a glance', featH: 'All you need to learn German, in one app', featP: 'Most features are free; smart tools unlock with Premium, and new accounts get the first 3 days free.',
      filter: ['All', 'Free', 'Premium'],
      groups: [
        ['Plan & study', [
          ['target', 'Daily dashboard', 'See what is left today, how much time you have put in and what comes next.', 0],
          ['sliders', 'Free study', 'Short vocabulary, grammar and sentence exercises at three levels, with no time limit.', 0],
          ['grad', 'TestDaF & ÖSD full exams', 'TestDaF and ÖSD Zertifikat B2 in one place — official timing and automatic marking.', 0],
          ['clock', 'Study timer', 'Your study time is tracked and kept in your history.', 0]
        ]],
        ['Skill practice', [
          ['headphones', 'Hören', 'Audio tasks with staged practice, hidden transcript and targeted re-listening.', 0],
          ['book', 'Lesen', 'Exam-style texts with answer key and explained solutions.', 0],
          ['pen', 'Schreiben', 'Argumentation and Grafikbeschreibung with a structure checklist.', 0],
          ['mic', 'Sprechen', 'Record your answer, listen back and repeat.', 0]
        ]],
        ['Memory & review', [
          ['layers', 'Vocabulary deck', 'Spaced repetition brings each word back exactly when you need it.', 0],
          ['alert', 'Error book', 'Your mistakes are collected so they do not happen again.', 0],
          ['star', 'Favourites', 'Select any text and keep it for later with one star.', 0],
          ['chart', 'History & reports', 'Score and time for every skill, day by day and week by week.', 0]
        ]],
        ['Smart tools', [
          ['chat', 'German tutor & conversation coach', 'Ask any question on the spot and practise conversations with smart coaches.', 1],
          ['globe', 'Persian ↔ German translator', 'Translate any word or sentence, with natural pronunciation and collocations.', 1],
          ['spark', 'AI writing & speaking feedback', 'Score, mistakes and suggestions for your text and voice.', 1],
          ['monitor', 'PDF library & tools', 'Upload PDFs, take notes, highlight and draw on files.', 1]
        ]],
        ['Available everywhere', [
          ['phone', 'Android app', 'Same account, same progress — on your phone.', 0],
          ['key', 'Sign in with Google', 'No new password; sign in with one tap.', 0],
          ['globe', 'Three interface languages', 'فارسی, English and Deutsch.', 0],
          ['moon', 'Dark mode', 'Easy on the eyes for late-night study.', 0]
        ]]
      ],
      weekly: 'Weekly error analysis',
      appK: 'Amookht app', appH: 'Your plan, always with you', appP: 'Daily practice, vocabulary deck and Sprechen recording on your phone; progress stays in sync with your account between phone and computer.',
      appList: ['Automatic sync with your account', 'Voice recording for Sprechen practice', 'Direct install, no Google Play needed'],
      appBtn: 'Download APK', appMeta: 'Version 1.4 · 3.8 MB · Android 6 or later',
      qrT: 'Scan with your phone', qrP: 'Point your phone camera at the code to start the download.',
      steps: [['Download', 'Download the APK file'], ['Allow install', 'If asked, allow installs from this source'], ['Sign in', 'Open the app and sign in with your account']],
      ios: 'iPhone: open the site in Safari and tap “Add to Home Screen”.',
      priceK: 'Pricing', priceH: 'Start free, upgrade whenever you like',
      freeName: 'Free', freePrice: '0 Toman', freeSub: 'Forever',
      freeList: ['Daily plan and free study', 'Listening, reading, writing and speaking practice', 'Short vocabulary and grammar exercises at three levels', 'Vocabulary deck, flashcards and spaced repetition', 'Error book, favourites and history', 'First 3 days: every Premium feature (except library uploads)'],
      freeCta: 'Create free account',
      proName: 'Premium', proPrice: '3,000,000 Toman', proSub: 'Per month · activated via Telegram support', proTag: 'Recommended',
      proList: ['Everything in Free', 'AI German tutor', 'Conversation coach', 'Persian ↔ German translator', 'AI writing and speaking feedback', 'Natural-voice pronunciation', 'Smart grammar practice bot', 'Weekly error analysis', 'Full TestDaF & ÖSD exams', 'Library and PDF tools', 'Your own topics and exercise sets', 'Instant level change'],
      proCta: 'Start with 3 free days',
      premK: 'Premium', premH: 'Smart features that make learning faster', premP: 'All smart Amookht tools in one monthly subscription.', premTrial: '🎁 Every new account gets the first 3 days of every Premium feature free (except library uploads).', premCta: 'Create an account and start 3 free days',
      faqK: 'FAQ', faqH: 'Good to know before you start',
      faq: [
        ['Who is Amookht for?', 'For everyone learning German: beginners to advanced learners, for everyday life, work, moving abroad, university or an exam. If you are preparing for TestDaF or ÖSD, full exams for both are ready too.'],
        ['I am a beginner — is it for me?', 'Yes. In “Free study” you choose your level (A1–A2, B1–B2 or C1–C2) and get short vocabulary, grammar and sentence exercises at that level.'],
        ['What are the 3 free Premium days?', 'After you create an account, every Premium feature — tutor, conversation coach, translator, AI feedback — is open for 3 days; only uploading files to the library is reserved for subscribers. After that your account simply continues for free.'],
        ['How much is Premium?', 'Premium costs 3,000,000 Toman per month and includes every smart tool.'],
        ['Where are the TestDaF and ÖSD exams?', 'TestDaF and ÖSD Zertifikat B2. The “Exams” section gives you complete exams for both, in the official format and with real timing.'],
      ],
      endH: 'Start learning German with a plan today', endP: 'Create a free account, try every Premium feature for 3 days and start your first exercise right now.',
      footP: 'Your smart companion for learning German', footProduct: 'Product', footHelp: 'Support', tg: 'Telegram support'
    },
    de: {
      dir: 'ltr',
      nav: { exams: 'Prüfungen', day: 'Tagesplan', features: 'Funktionen', premium: 'Premium', app: 'App', pricing: 'Preise', faq: 'FAQ', widget: 'Apps' },
      login: 'Anmelden', register: 'Kostenlos starten', menu: 'Menü', theme: 'Hell- und Dunkelmodus wechseln',
      badge: 'Deutsch lernen von A1 bis C2 – Tagesplan, Übungen, Wiederholung und Fortschrittsberichte',
      h1a: 'Deutsch lernen – jeden Tag,', h1b: 'mit vollständigen Prüfungssimulationen',
      lead: 'Für Alltag, Beruf, Auswanderung, Studium oder Prüfung – Amookht vereint Tagesplan, Hören, Lesen, Schreiben und Sprechen, kurze Wortschatz- und Grammatikübungen auf deinem Niveau, ein Merkheft mit verteilter Wiederholung und Fortschrittsberichte an einem Ort.',
      simNoteT: 'TestDaF · ÖSD Zertifikat B2',
      simNote: 'Echte Prüfungszeit, automatische Auswertung und Ergebnis für jeden Teil – im selben Tagesplan.',
      ctaStart: 'Kostenlos starten', ctaApp: 'Download', ctaLogin: 'Ich habe schon ein Konto',
      trust: ['Die ersten 3 Tage Premium gratis', 'Keine Bankkarte nötig', 'Mit Google anmelden', 'فارسی · English · Deutsch'],
      mock: {
        week: 'Woche 3 · Tag 2', goal: 'Nächste Prüfung · TestDaF', today: 'Heutiger Plan', progress: 'Fortschritt heute',
        free: 'Freies Lernen', time: 'Lernzeit heute', min: 'Min.', due: 'Wörter heute fällig', rec: 'Sprechen-Antwort aufgenommen',
        skills: ['Wortschatz', 'Grammatik', 'Hören', 'Lesen', 'Schreiben', 'Sprechen']
      },
      stats: [['A1–C2', 'Übungen für jedes Niveau'], ['35 Themen', 'Grammatik mit 1.120 Übungssätzen'], ['24', 'Themen im freien Lernen'], ['262', 'Sprechaufgaben']],
      proof: [
        ['40 + 35 Aufgaben', 'TestDaF: 40 Lesen-Aufgaben (60 Min.) und 35 Hören-Aufgaben (40 Min.), automatisch ausgewertet'],
        ['2 komplette Prüfungen', 'ÖSD Zertifikat B2 im offiziellen Format, mit österreichischen und Schweizer Stimmen und Sprechen-Bildern'],
        ['35 Themen · 1.120 Sätze', 'Grammatiktraining mit Übersetzungen, dazu 24 Themen im freien Lernen und 262 Sprechaufgaben']
      ],
      proofNote: 'Diese Zahlen stammen aus den Inhalten der App, nicht aus Werbetexten · Zuletzt geprüft: 20.11.2026',
      examsK: 'Prüfungen TestDaF & ÖSD', examsH: 'Vollständige Simulationen für TestDaF und ÖSD Zertifikat B2', examsP: 'Übe beide Prüfungen unter echten Bedingungen – mit offizieller Prüfungszeit, automatischer Auswertung und Ergebnis für jeden Teil.',
      frTag: 'Für alle Lernenden', frTitle: 'Freies Lernen', frDesc: 'Ohne Prüfungsdruck und ohne Zeitlimit – jeden Tag ein paar kurze, nützliche Übungen auf deinem Niveau.',
      frList: ['Drei Niveaus: Anfänger (A1–A2), Mittelstufe (B1–B2), Fortgeschrittene (C1–C2)', 'Wortpaare, der/die/das, Satzbau und nützliche Redewendungen', '24 Themen aus Alltag, Beruf und Studium', 'Grammatik-Trainingsbot mit 35 Themen', 'KI-Deutsch-Tutor und Übersetzer'],
      frCta: 'Jetzt lernen',
      simTag: 'Komplette Prüfung', simTitle: 'Vollständige Prüfungen im offiziellen Format', simDesc: 'Beide Prüfungen an einem Ort: TestDaF und ÖSD Zertifikat B2, jeweils mit offizieller Prüfungszeit, automatischer Auswertung und Ergebnis für jeden Teil.',
      simList: ['TestDaF: vier Teile – Lesen, Hören, Schreiben, Sprechen – mit echter Prüfungszeit', '40 Lesen- und 35 Hören-Aufgaben (60 bzw. 40 Min.), automatisch ausgewertet', 'ÖSD Zertifikat B2: zwei vollständige Prüfungen im Format des offiziellen Modellsatzes, mit österreichischen und Schweizer Stimmen', 'Schreiben mit Wortzähler, Sprechen aufgenommen und mit Musterlösungen verglichen', 'Ergebnis und Auswertung für jeden Teil, mit offiziellen Bestehensgrenzen'],
      simHint: 'Prüfung wählen – jederzeit wechselbar.',
      tdTag: 'Zulassung an deutschen Hochschulen', osTag: 'ÖSD Zertifikat B2',
      premium: 'Premium', freeTag: 'Kostenlos',
      dayK: 'Ein Beispieltag im Lernplan', dayH: 'Ein Lerntag wie der Prüfungstag', dayP: 'Jeder Tag ist fertig geplant – starte einfach den nächsten Block. Die Reihenfolge richtet sich nach dem Fokus des Tages.',
      blocks: [
        ['Hören', 60, 'headphones', 'Hören in Stufen: erst ohne Text, dann Analyse und erneutes Hören'],
        ['Lesen', 45, 'book', 'Lesen mit Lösungsstrategie und Zeitkontrolle'],
        ['Schreiben', 50, 'pen', 'Argumentation oder Grafikbeschreibung im Prüfungsformat'],
        ['Sprechen', 35, 'mic', 'Antwort aufnehmen, mit Muster vergleichen, wiederholen'],
        ['Grammatik & Wortschatz', 25, 'layers', 'Häufige Prüfungswörter und Strukturen'],
        ['Wiederholung', 25, 'refresh', 'Aktive Wiederholung von Karteikarten und Fehlern']
      ],
      minShort: 'Min.', total: 'Tagessumme',
      dayNotes: [['calendar', 'Freitags', 'Prüfung, Fehleranalyse und Wochenbericht'], ['clock', 'Mehr Zeit?', '15–60 Extraminuten für Karteikarten und Wiederholung'], ['sliders', 'Weniger Zeit?', 'Lernzeit im Bereich „Freies Lernen“ selbst festlegen']],
      featK: 'Alles auf einen Blick', featH: 'Alles zum Deutschlernen in einer App', featP: 'Die meisten Funktionen sind kostenlos; smarte Werkzeuge gibt es mit Premium – und neue Konten bekommen die ersten 3 Tage gratis.',
      filter: ['Alle', 'Kostenlos', 'Premium'],
      groups: [
        ['Plan & Lernen', [
          ['target', 'Tages-Dashboard', 'Sieh, was heute noch offen ist, wie viel Zeit du investiert hast und was als Nächstes kommt.', 0],
          ['sliders', 'Freies Lernen', 'Kurze Wortschatz-, Grammatik- und Satzübungen auf drei Niveaus, ohne Zeitlimit.', 0],
          ['grad', 'Prüfungen TestDaF & ÖSD', 'TestDaF und ÖSD Zertifikat B2 an einem Ort – mit offizieller Prüfungszeit und automatischer Auswertung.', 0],
          ['clock', 'Lerntimer', 'Deine Lernzeit wird erfasst und im Verlauf gespeichert.', 0]
        ]],
        ['Fertigkeiten trainieren', [
          ['headphones', 'Hören', 'Audioaufgaben in Stufen, verborgenes Transkript und gezieltes Nachhören.', 0],
          ['book', 'Lesen', 'Prüfungstexte mit Lösungsschlüssel und erklärten Lösungen.', 0],
          ['pen', 'Schreiben', 'Argumentation und Grafikbeschreibung mit Struktur-Checkliste.', 0],
          ['mic', 'Sprechen', 'Antwort aufnehmen, anhören und wiederholen.', 0]
        ]],
        ['Gedächtnis & Wiederholung', [
          ['layers', 'Wortschatz-Karteikarten', 'Verteilte Wiederholung bringt jedes Wort genau dann zurück, wenn du es brauchst.', 0],
          ['alert', 'Fehlerbuch', 'Deine Fehler werden gesammelt, damit sie sich nicht wiederholen.', 0],
          ['star', 'Favoriten', 'Beliebigen Text markieren und mit einem Stern speichern.', 0],
          ['chart', 'Verlauf & Berichte', 'Punkte und Zeit jeder Fertigkeit, Tag für Tag und Woche für Woche.', 0]
        ]],
        ['Smarte Werkzeuge', [
          ['chat', 'Deutsch-Tutor & Gesprächs-Coach', 'Jede Frage sofort stellen und Gespräche mit smarten Coaches üben.', 1],
          ['globe', 'Übersetzer Persisch ↔ Deutsch', 'Jedes Wort und jeden Satz übersetzen – mit natürlicher Aussprache und Kollokationen.', 1],
          ['spark', 'KI-Feedback für Schreiben & Sprechen', 'Bewertung, Fehler und Verbesserungsvorschläge für Text und Stimme.', 1],
          ['monitor', 'PDF-Bibliothek & Werkzeuge', 'PDFs hochladen, Notizen, Markierungen und Stift auf Dateien.', 1]
        ]],
        ['Überall verfügbar', [
          ['phone', 'Android-App', 'Gleiches Konto, gleicher Fortschritt – auf dem Handy.', 0],
          ['key', 'Mit Google anmelden', 'Kein neues Passwort, Anmeldung mit einem Tipp.', 0],
          ['globe', 'Drei Oberflächensprachen', 'فارسی, English und Deutsch.', 0],
          ['moon', 'Dunkelmodus', 'Augenschonend fürs Lernen am Abend.', 0]
        ]]
      ],
      weekly: 'Wöchentliche Fehleranalyse',
      appK: 'Amookht-App', appH: 'Dein Plan, immer dabei', appP: 'Tägliches Training, Wortschatz und Sprechen-Aufnahmen auf dem Handy; dein Fortschritt bleibt zwischen Handy und Computer synchron.',
      appList: ['Automatische Synchronisierung mit deinem Konto', 'Sprachaufnahme für das Sprechen-Training', 'Direkte Installation, ohne Google Play'],
      appBtn: 'APK herunterladen', appMeta: 'Version 1.4 · 3,8 MB · ab Android 6',
      qrT: 'Mit dem Handy scannen', qrP: 'Richte die Handykamera auf den Code, um den Download zu starten.',
      steps: [['Herunterladen', 'APK-Datei herunterladen'], ['Installation erlauben', 'Falls gefragt, Installation aus dieser Quelle erlauben'], ['Anmelden', 'App öffnen und mit deinem Konto anmelden']],
      ios: 'iPhone: Seite in Safari öffnen und „Zum Home-Bildschirm“ tippen.',
      priceK: 'Preise', priceH: 'Kostenlos starten, jederzeit upgraden',
      freeName: 'Kostenlos', freePrice: '0 Toman', freeSub: 'Für immer',
      freeList: ['Tagesplan und Freies Lernen', 'Training in Hören, Lesen, Schreiben und Sprechen', 'Kurze Wortschatz- und Grammatikübungen auf drei Niveaus', 'Wortschatz, Karteikarten und verteilte Wiederholung', 'Fehlerbuch, Favoriten und Verlauf', 'Die ersten 3 Tage: alle Premium-Funktionen (außer Bibliotheks-Upload)'],
      freeCta: 'Kostenloses Konto erstellen',
      proName: 'Premium', proPrice: '3.000.000 Toman', proSub: 'Pro Monat · Freischaltung über den Telegram-Support', proTag: 'Empfohlen',
      proList: ['Alles aus Kostenlos', 'KI-Deutsch-Tutor', 'Gesprächs-Coach', 'Übersetzer Persisch ↔ Deutsch', 'KI-Feedback für Schreiben und Sprechen', 'Aussprache mit natürlicher Stimme', 'Smarter Grammatik-Trainingsbot', 'Wöchentliche Fehleranalyse', 'Vollständige Prüfungen TestDaF & ÖSD', 'Bibliothek und PDF-Werkzeuge', 'Eigene Themen und Übungssets', 'Sofortiger Niveauwechsel'],
      proCta: 'Mit 3 Gratistagen starten',
      premK: 'Premium', premH: 'Smarte Funktionen, die schneller zum Ziel führen', premP: 'Alle smarten Amookht-Werkzeuge in einem Monatsabo.', premTrial: '🎁 Jedes neue Konto bekommt die ersten 3 Tage alle Premium-Funktionen gratis (außer Bibliotheks-Upload).', premCta: 'Konto erstellen und 3 Gratistage starten',
      faqK: 'Häufige Fragen', faqH: 'Gut zu wissen vor dem Start',
      faq: [
        ['Für wen ist Amookht?', 'Für alle, die Deutsch lernen: von Anfängern bis Fortgeschrittenen, für Alltag, Beruf, Auswanderung, Studium oder Prüfung. Wer sich auf TestDaF oder ÖSD vorbereitet, findet zusätzlich vollständige Prüfungen beider.'],
        ['Ich bin Anfänger – passt das für mich?', 'Ja. Im „Freien Lernen“ wählst du dein Niveau (A1–A2, B1–B2 oder C1–C2) und bekommst kurze Wortschatz-, Grammatik- und Satzübungen genau auf diesem Niveau.'],
        ['Was sind die 3 Gratistage Premium?', 'Nach der Registrierung sind 3 Tage lang alle Premium-Funktionen offen – Tutor, Gesprächs-Coach, Übersetzer und KI-Feedback; nur das Hochladen in die Bibliothek ist Abonnenten vorbehalten. Danach läuft dein Konto einfach kostenlos weiter.'],
        ['Was kostet Premium?', 'Premium kostet 3.000.000 Toman pro Monat und enthält alle smarten Werkzeuge.'],
        ['Wo finde ich die Prüfungen TestDaF und ÖSD?', 'TestDaF und ÖSD Zertifikat B2. Im Bereich „Prüfungen“ stehen vollständige Prüfungen für beide im offiziellen Format und mit echter Prüfungszeit bereit.'],
      ],
      endH: 'Ab heute mit Plan Deutsch lernen', endP: 'Erstelle ein kostenloses Konto, teste 3 Tage alle Premium-Funktionen und starte jetzt deine erste Übung.',
      footP: 'Dein smarter Begleiter zum Deutschlernen', footProduct: 'Produkt', footHelp: 'Hilfe', tg: 'Telegram-Support'
    }
  };

  /* ---------- pieces ---------- */
  var COLORS = { Hören: '#a855f7', Lesen: '#0ea5e9', Schreiben: '#f59e0b', Sprechen: '#f43f5e', 'Grammatik & Wortschatz': '#10b981', Wiederholung: '#6366f1' };
  function num(n, l) { return l === 'fa' ? String(n).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }) : String(n); }
  function navLinks(t, cls) {
    var ids = ['exams', 'features', 'premium', 'pricing', 'faq']; /*LANDING-APP: the app page link below replaces the in-page app link*/
    var links = ids.map(function (id) { return '<a href="#lx-' + id + '" class="' + cls + '" onclick="return LX.go(\'' + id + '\')">' + esc(t.nav[id]) + '</a>'; });
    /* widget guide link sits right next to the app link */
    var at = ids.indexOf('app');
    links.splice(at >= 0 ? at + 1 : 3, 0, '<a href="/widgets/guide.html" class="' + (cls ? cls + ' ' : '') + 'lx-nav-widget">' + esc(t.nav.widget) + '</a>');
    return links.join('');
  }
  function appBtn(t, cls) {
    return isApp() ? '' : '<a class="lx-btn ' + (cls || 'lx-btn-ghost') + '" href="/widgets/guide.html">' + I('download') + '<span>' + esc(t.ctaApp) + '</span></a>';
  }
  function langSwitch(cls) {
    var cur = lang();
    return '<div class="lx-lang ' + (cls || '') + '" role="group" aria-label="Language" dir="ltr">' + [['fa', 'فا'], ['en', 'EN'], ['de', 'DE']].map(function (x) {
      return '<button type="button" lang="' + x[0] + '" aria-pressed="' + (cur === x[0]) + '" onclick="setUILanguage(\'' + x[0] + '\')">' + x[1] + '</button>';
    }).join('') + '</div>';
  }
  function heroMock(t, l) {
    var m = t.mock, done = [1, 1, 0.4, 0, 0, 0];
    var rows = t.blocks.map(function (b, i) {
      var c = COLORS[b[0]], st = done[i] === 1 ? 'is-done' : done[i] > 0 ? 'is-now' : '';
      return '<li class="' + st + '" style="--c:' + c + '"><span class="lx-mk-ic">' + I(b[2]) + '</span><b>' + esc(b[0]) + '</b><small>' + num(b[1], l) + ' ' + esc(t.minShort) + '</small><i>' + (done[i] === 1 ? I('check') : '') + '</i>' + (done[i] > 0 && done[i] < 1 ? '<em style="width:' + done[i] * 100 + '%"></em>' : '') + '</li>';
    }).join('');
    var skills = m.skills.map(function (s, i) { var on = i !== 4; return '<span class="' + (on ? 'on' : '') + '">' + esc(s) + '</span>'; }).join('');
    return '<div class="lx-mock" aria-hidden="true">' +
      '<div class="lx-mock-bar"><span></span><span></span><span></span><b>learn.tah3in.com</b></div>' +
      '<div class="lx-mock-body">' +
        '<div class="lx-mk-head"><div><small>' + esc(m.week) + '</small><strong>' + esc(t.mock.today) + ' · ' + num(240, l) + ' ' + esc(t.minShort) + '</strong></div><span class="lx-pill">' + esc(m.goal) + '</span></div>' +
        '<div class="lx-mk-prog"><div class="lx-ring" style="--p:44"><b>' + num(44, l) + '%</b></div><div><small>' + esc(m.progress) + '</small><div class="lx-seg">' + t.blocks.map(function (b, i) { return '<span style="flex:' + b[1] + ';--c:' + COLORS[b[0]] + '" class="' + (done[i] === 1 ? 'd' : done[i] > 0 ? 'h' : '') + '"></span>'; }).join('') + '</div></div></div>' +
        '<ul class="lx-mk-list">' + rows + '</ul>' +
      '</div>' +
    '</div>' +
    '<div class="lx-float lx-float-a" aria-hidden="true"><span>' + I('layers') + '</span><div><b>' + num(12, l) + '</b><small>' + esc(m.due) + '</small></div></div>' +
    '<div class="lx-float lx-float-b" aria-hidden="true"><span>' + I('mic') + '</span><div><b>' + num('1:32', l) + '</b><small>' + esc(m.rec) + '</small></div></div>';
  }
  function simCard(t) {
    return '<article class="lx-exam lx-exam-sim lx-rv">' +
      '<div class="lx-exam-top"><span class="lx-exam-logo">TestDaF · ÖSD</span><span class="lx-tag">' + esc(t.simTag) + '</span></div>' +
      '<h3>' + esc(t.simTitle) + '</h3><p>' + esc(t.simDesc) + '</p>' +
      '<ul class="lx-checks">' + t.simList.map(function (x) { return '<li>' + I('check') + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul>' +
    '</article>';
  }
  /* AMK-PREMIUM 2026-11-15: general path card + premium showcase */
  function freeCard(t) {
    return '<article class="lx-exam lx-exam-free lx-rv">' +
      '<div class="lx-exam-top"><span class="lx-exam-logo">A1–C2</span><span class="lx-tag">' + esc(t.frTag) + '</span></div>' +
      '<h3>' + esc(t.frTitle) + '</h3><p>' + esc(t.frDesc) + '</p>' +
      '<ul class="lx-checks">' + t.frList.map(function (x, i) { return '<li>' + I('check') + '<span>' + esc(x) + (i === 4 ? ' <em class="lx-pro">' + esc(t.premium) + '</em>' : '') + '</span></li>'; }).join('') + '</ul>' +
      '<button type="button" class="lx-btn lx-btn-green" onclick="LX.start(\'free\')">' + esc(t.frCta) + I('arrow', 'lx-flip') + '</button>' +
    '</article>';
  }
  function premiumSection(t) {
    var P2 = window.AmkPremium;
    if (!P2) return '';
    return '<section class="lx-sec lx-alt" id="lx-premium"><div class="lx-wrap">' +
      '<div class="lx-head lx-rv"><span class="lx-kicker">' + esc(t.premK) + '</span><h2>' + esc(t.premH) + '</h2><p>' + esc(t.premP) + '</p></div>' +
      '<div class="lx-prem-trial lx-rv"><span>' + esc(t.premTrial) + '</span><button type="button" class="lx-btn lx-btn-primary lx-btn-sm" onclick="openAuth(\'register\')">' + esc(t.premCta) + '</button></div>' +
      P2.showcase('lx') +
    '</div></section>';
  }
  function featureGrid(t) {
    return '<div class="lx-fgroups">' + t.groups.map(function (g) {
      return '<div class="lx-fgroup"><h3 class="lx-fgroup-h">' + esc(g[0]) + '</h3><div class="lx-fgrid">' + g[1].map(function (f) {
        return '<div class="lx-feat lx-rv" data-pro="' + f[3] + '"><span class="lx-feat-ic">' + I(f[0]) + '</span><div><b>' + esc(f[1]) + (f[3] ? ' <em class="lx-pro">' + esc(t.premium) + '</em>' : '') + '</b><p>' + esc(f[2]) + '</p></div></div>';
      }).join('') + '</div></div>';
    }).join('') + '</div>';
  }
  function phoneMock(t, l) {
    return '<div class="lx-phone" aria-hidden="true"><div class="lx-phone-in">' +
      '<div class="lx-ph-top"><img src="/assets/brand/icon-64.png" width="22" height="22" alt=""><b>Amookht</b></div>' +
      '<div class="lx-ph-card"><small>' + esc(t.mock.progress) + '</small><div class="lx-ring lx-ring-sm" style="--p:68"><b>' + num(68, l) + '%</b></div></div>' +
      t.blocks.slice(0, 4).map(function (b, i) { return '<div class="lx-ph-row" style="--c:' + COLORS[b[0]] + '"><span>' + I(b[2]) + '</span><b>' + esc(b[0]) + '</b><i>' + (i < 2 ? I('check') : '') + '</i></div>'; }).join('') +
      '<div class="lx-ph-nav"><span class="on"></span><span></span><span></span><span></span></div>' +
    '</div></div>';
  }
  function plan(t, pro) {
    var list = pro ? t.proList : t.freeList;
    return '<article class="lx-plan ' + (pro ? 'lx-plan-pro' : '') + ' lx-rv">' + (pro ? '<span class="lx-plan-tag">' + esc(t.proTag) + '</span>' : '') +
      '<h3>' + esc(pro ? t.proName : t.freeName) + '</h3><div class="lx-price">' + esc(pro ? t.proPrice : t.freePrice) + '</div><small class="lx-price-sub">' + esc(pro ? t.proSub : t.freeSub) + '</small>' +
      '<ul class="lx-checks">' + list.map(function (x) { return '<li>' + I('check') + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul>' +
      '<button type="button" class="lx-btn ' + (pro ? 'lx-btn-primary' : 'lx-btn-ghost') + '" onclick="openAuth(\'register\')">' + esc(pro ? t.proCta : t.freeCta) + '</button></article>';
  }

  /* ---------- page ---------- */
  function renderLandingV6() {
    var l = lang(), t = C[l], dark = !!(st() && st().dark), app = isApp();
    var total = t.blocks.reduce(function (s, b) { return s + b[1]; }, 0);
    return '<div class="lx lx-' + l + '" data-learning-content dir="' + t.dir + '" lang="' + l + '" data-filter="all">' +
    /* header */
    '<header class="lx-header"><div class="lx-wrap lx-header-in">' +
      '<button type="button" class="lx-brand" onclick="LX.go(\'top\')"><img src="/assets/brand/brand-header.png" width="38" height="38" alt="Amookht"><span>Amookht</span></button>' +
      '<nav class="lx-nav" aria-label="Main">' + navLinks(t, '') + '</nav>' +
      '<div class="lx-actions">' + langSwitch('lx-lang-head') +
        '<button type="button" class="lx-icon-btn" onclick="toggleDark()" aria-label="' + esc(t.theme) + '" title="' + esc(t.theme) + '">' + I(dark ? 'sun' : 'moon') + '</button>' +
        '<button type="button" class="lx-link-btn lx-hide-sm" onclick="openAuth(\'login\')">' + esc(t.login) + '</button>' +
        '<button type="button" class="lx-btn lx-btn-primary lx-btn-sm" onclick="openAuth(\'register\')">' + esc(t.register) + '</button>' +
        '<button type="button" class="lx-icon-btn lx-menu-btn" onclick="LX.menu()" aria-label="' + esc(t.menu) + '" aria-expanded="false">' + I('menu', 'lx-i-open') + I('close', 'lx-i-close') + '</button>' +
      '</div></div>' +
      '<div class="lx-drawer"><nav class="lx-wrap">' + navLinks(t, 'lx-drawer-link') +  langSwitch('lx-lang-drawer') + '<button type="button" class="lx-btn lx-btn-ghost" onclick="openAuth(\'login\')">' + esc(t.login) + '</button></nav></div>' +
    '</header>' +
    '<main id="lx-top">' +
    /* hero */
    '<section class="lx-hero"><div class="lx-hero-bg" aria-hidden="true"></div><div class="lx-wrap lx-hero-in">' +
      '<div class="lx-hero-copy">' +
        '<span class="lx-badge"><i></i>' + esc(t.badge) + '</span>' +
        '<h1>' + esc(t.h1a) + '<br><span class="lx-grad">' + esc(t.h1b) + '</span></h1>' +
        '<p class="lx-lead">' + esc(t.lead) + '</p>' +
        '<div class="lx-simnote"><span class="lx-simnote-ic">' + I('grad') + '</span><div><b>' + esc(t.simNoteT) + '</b><span class="lx-simnote-tx">' + esc(t.simNote) + '</span></div></div>' +
        '<div class="lx-cta-row"><button type="button" class="lx-btn lx-btn-primary lx-btn-lg" onclick="openAuth(\'register\')">' + esc(t.ctaStart) + I('arrow', 'lx-flip') + '</button>' +
          (app ? '<button type="button" class="lx-btn lx-btn-ghost lx-btn-lg" onclick="openAuth(\'login\')">' + esc(t.ctaLogin) + '</button>' : appBtn(t, 'lx-btn-ghost lx-btn-lg')) + '</div>' +
        '<ul class="lx-trust">' + t.trust.map(function (x) { return '<li>' + I('check') + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul>' +
      '</div>' +
      '<div class="lx-hero-visual">' + heroMock(t, l) + '</div>' +
    '</div></section>' +
    /* stats */
    '<section class="lx-stats"><div class="lx-wrap lx-stats-in">' + t.stats.map(function (s) { return '<div class="lx-stat lx-rv"><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></div>'; }).join('') + '</div></section>' +
    /* proof: audited content (numbers counted from the app, see AUDIT 2026-11-20) */
    '<section class="lx-proof"><div class="lx-wrap lx-proof-in">' + t.proof.map(function (p) { return '<div class="lx-proof-card"><b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span></div>'; }).join('') + '<p class="lx-proof-note">' + esc(t.proofNote) + '</p></div></section>' +
    /* exams */
    '<section class="lx-sec" id="lx-exams"><div class="lx-wrap">' +
      '<div class="lx-head lx-rv"><span class="lx-kicker">' + esc(t.examsK) + '</span><h2>' + esc(t.examsH) + '</h2><p>' + esc(t.examsP) + '</p></div>' +
      '<div class="lx-exams">' + freeCard(t) + simCard(t) + '</div>' +
    '</div></section>' +
    /* day */
    '<section class="lx-sec lx-alt" id="lx-day"><div class="lx-wrap lx-day">' +
      '<div class="lx-head lx-head-start lx-rv"><span class="lx-kicker">' + esc(t.dayK) + '</span><h2>' + esc(t.dayH) + '</h2><p>' + esc(t.dayP) + '</p>' +
        '<div class="lx-day-notes">' + t.dayNotes.map(function (n) { return '<div>' + I(n[0]) + '<span><b>' + esc(n[1]) + '</b>' + esc(n[2]) + '</span></div>'; }).join('') + '</div>' +
      '</div>' +
      '<ol class="lx-timeline lx-rv">' + t.blocks.map(function (b) {
        return '<li style="--c:' + COLORS[b[0]] + '"><span class="lx-tl-ic">' + I(b[2]) + '</span><div class="lx-tl-body"><div class="lx-tl-top"><b>' + esc(b[0]) + '</b><span>' + num(b[1], l) + ' ' + esc(t.minShort) + '</span></div><p>' + esc(b[3]) + '</p><div class="lx-tl-bar"><i style="width:' + Math.round(b[1] / 60 * 100) + '%"></i></div></div></li>';
      }).join('') + '<li class="lx-tl-total"><span>' + esc(t.total) + '</span><b>' + num(total, l) + ' ' + esc(t.minShort) + '</b></li></ol>' +
    '</div></section>' +
    /* features */
    '<section class="lx-sec" id="lx-features"><div class="lx-wrap">' +
      '<div class="lx-head lx-rv"><span class="lx-kicker">' + esc(t.featK) + '</span><h2>' + esc(t.featH) + '</h2><p>' + esc(t.featP) + '</p>' +
        '<div class="lx-filter" role="tablist">' + ['all', 'free', 'pro'].map(function (k, i) { return '<button type="button" role="tab" data-f="' + k + '" aria-selected="' + (i === 0) + '" onclick="LX.filter(\'' + k + '\')">' + esc(t.filter[i]) + '</button>'; }).join('') + '</div>' +
      '</div>' + featureGrid(t) +
    '</div></section>' +
    premiumSection(t) +
    /* app */
    (app ? '' : '<section class="lx-sec lx-app-sec" id="lx-app"><div class="lx-wrap"><div class="lx-app lx-rv">' +
      '<div class="lx-app-visual">' + phoneMock(t, l) + '</div>' +
      '<div class="lx-app-copy"><span class="lx-kicker">' + esc(t.appK) + '</span><h2>' + esc(t.appH) + '</h2><p>' + esc(t.appP) + '</p>' +
        '<ul class="lx-checks lx-checks-light">' + t.appList.map(function (x) { return '<li>' + I('check') + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul>' +
        '<div class="lx-app-dl"><div class="lx-app-dl-main"><a class="lx-btn lx-btn-white lx-btn-lg" href="' + APK + '" download="Amookht-Android.apk">' + I('download') + '<span>' + esc(t.appBtn) + '</span></a><small>' + esc(t.appMeta) + '</small></div>' +
          '<div class="lx-qr"><img src="/assets/brand/apk-qr.svg" width="92" height="92" alt="QR"><div><b>' + esc(t.qrT) + '</b><small>' + esc(t.qrP) + '</small></div></div></div>' +
        '<ol class="lx-steps">' + t.steps.map(function (s, i) { return '<li><span>' + num(i + 1, l) + '</span><div><b>' + esc(s[0]) + '</b><small>' + esc(s[1]) + '</small></div></li>'; }).join('') + '</ol>' +
        '<p class="lx-ios">' + esc(t.ios) + '</p>' +
      '</div>' +
    '</div></div></section>') +
    /* pricing */
    '<section class="lx-sec lx-alt" id="lx-pricing"><div class="lx-wrap">' +
      '<div class="lx-head lx-rv"><span class="lx-kicker">' + esc(t.priceK) + '</span><h2>' + esc(t.priceH) + '</h2></div>' +
      '<div class="lx-plans">' + plan(t, 0) + plan(t, 1) + '</div>' +
    '</div></section>' +
    /* faq */
    '<section class="lx-sec" id="lx-faq"><div class="lx-wrap lx-narrow">' +
      '<div class="lx-head lx-rv"><span class="lx-kicker">' + esc(t.faqK) + '</span><h2>' + esc(t.faqH) + '</h2></div>' +
      '<div class="lx-faq">' + t.faq.map(function (q, i) { return '<details class="lx-rv"' + (i === 0 ? ' open' : '') + '><summary>' + esc(q[0]) + '<span class="lx-plus" aria-hidden="true"></span></summary><p>' + esc(q[1]) + '</p></details>'; }).join('') + '</div>' +
    '</div></section>' +
    /* end cta */
    '<section class="lx-end"><div class="lx-wrap"><div class="lx-end-in lx-rv"><h2>' + esc(t.endH) + '</h2><p>' + esc(t.endP) + '</p><div class="lx-cta-row lx-cta-center">' +
      '<button type="button" class="lx-btn lx-btn-white lx-btn-lg" onclick="openAuth(\'register\')">' + esc(t.ctaStart) + I('arrow', 'lx-flip') + '</button>' + (app ? '' : appBtn(t, 'lx-btn-outline-w lx-btn-lg')) +
    '</div></div></div></section>' +
    '</main>' +
    /* footer */
    '<footer class="lx-footer"><div class="lx-wrap lx-footer-in">' +
      '<div class="lx-foot-brand"><span><img src="/assets/brand/icon-64.png" width="30" height="30" alt=""><b>Amookht</b></span><p>' + esc(t.footP) + '</p></div>' +
      '<div class="lx-foot-col"><b>' + esc(t.footProduct) + '</b>' + navLinks(t, '').replace(/<a href="#lx-faq"[^]*?<\/a>/, '') + '</div>' +
      '<div class="lx-foot-col"><b>' + esc(t.footHelp) + '</b><a href="#lx-faq" onclick="return LX.go(\'faq\')">' + esc(t.nav.faq) + '</a><a href="https://t.me/Amookht_support" target="_blank" rel="noopener noreferrer">' + I('send') + esc(t.tg) + '</a></div>' +
    '</div><div class="lx-wrap lx-foot-bottom"><small dir="ltr">© 2026 Amookht</small><small>Deutsch A1–C2 · TestDaF · ÖSD</small></div></footer>' +
    '</div>';
  }

  /* ---------- behaviour ---------- */
  function root() { return document.querySelector('.lx'); }
  var LX = {
    go: function (id) {
      var r = root(); if (r) r.classList.remove('lx-menu-open');
      var el = id === 'top' ? document.getElementById('lx-top') : document.getElementById('lx-' + id);
      if (el) { var y = el.getBoundingClientRect().top + window.pageYOffset - (id === 'top' ? 200 : 72); window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); }
      return false;
    },
    exam: function (k) {
      k = k === 'oesd' ? 'oesd' : 'testdaf';
      try { localStorage.setItem(EXAM_KEY, k); } catch (e) {}
    },
    filter: function (k) {
      var r = root(); if (!r) return; r.setAttribute('data-filter', k);
      r.querySelectorAll('.lx-filter button').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-f') === k)); });
    },
    menu: function () {
      var r = root(); if (!r) return; var open = r.classList.toggle('lx-menu-open');
      var b = r.querySelector('.lx-menu-btn'); if (b) b.setAttribute('aria-expanded', String(open));
    },
    start: function (k) { if (k === 'testdaf' || k === 'oesd') LX.exam(k); if (typeof openAuth === 'function') openAuth('register'); }
  };
  window.LX = LX;

  var io = null;
  function init() {
    var r = root(); if (!r || r.__lx) return; r.__lx = true;
    var items = r.querySelectorAll('.lx-rv');
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window) || reduce) return;
    r.classList.add('lx-anim');
    if (io) io.disconnect();
    io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('lx-in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { var b = el.getBoundingClientRect(); if (b.top < window.innerHeight) el.classList.add('lx-in'); else io.observe(el); });
    var hdr = r.querySelector('.lx-header');
    var pending = Array.prototype.slice.call(items);
    var onScroll = function () {
      if (!document.body.contains(r)) { window.removeEventListener('scroll', onScroll); return; }
      hdr.classList.toggle('lx-scrolled', window.pageYOffset > 8);
      /* fallback for WebViews where IntersectionObserver lags */
      if (pending.length) pending = pending.filter(function (el) { if (el.classList.contains('lx-in')) return false; if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('lx-in'); return false; } return true; });
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    /* never leave content hidden if no scroll/IO event ever arrives for it */
    setTimeout(function () { if (document.body.contains(r)) r.classList.remove('lx-anim'); }, 9000);
  }
  function watch() {
    var app = document.getElementById('app');
    if (!app) return setTimeout(watch, 50);
    new MutationObserver(function () { if (app.querySelector('.lx')) init(); }).observe(app, { childList: true });
    if (app.querySelector('.lx')) init();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();

  window.renderLandingV6 = renderLandingV6;
})();
