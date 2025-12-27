import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello to core app';
  }

  getTermsAndConditions(lang: 'ar' | 'en' | 'fr' = 'ar'): string {
    if (lang === 'en') return this.getTermsEn();
    if (lang === 'fr') return this.getTermsFr();
    return this.getTermsAr();
  }

  private getTermsAr(): string {
    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>الشروط والأحكام - Ammerli</title>
    <style>
        .logo { text-align: center; margin-bottom: 30px; }
        .logo img { max-width: 150px; height: auto; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.8;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #04272D;
            margin-bottom: 10px;
            font-size: 2.5em;
            border-bottom: 3px solid #A2C23A;
            padding-bottom: 15px;
        }
        h2 {
            color: #1A4D52;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.8em;
        }
        h3 {
            color: #555;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 1.3em;
        }
        p, li {
            margin-bottom: 12px;
            text-align: justify;
        }
        ul, ol {
            margin-right: 30px;
            margin-bottom: 20px;
        }
        .last-updated {
            color: #7f8c8d;
            font-style: italic;
            margin-bottom: 30px;
        }
        .important {
            background: #fff3cd;
            border-right: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .contact {
            background: #e8f4f8;
            padding: 20px;
            border-radius: 5px;
            margin-top: 30px;
        }

        .lang-switcher {
            text-align: center;
            margin-bottom: 20px;
        }
        .lang-switcher a {
            margin: 0 10px;
            padding: 8px 16px;
            background: #A2C23A;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 500;
            display: inline-block;
        }
        .lang-switcher a:hover {
            background: #8BAF30;
        }
        
        a { color: #A2C23A; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>
        
        <div class="lang-switcher">
            <a href="/terms-and-conditions">العربية</a>
            <a href="/terms-and-conditions/en">English</a>
            <a href="/terms-and-conditions/fr">Français</a>
        </div>

        <h1>الشروط والأحكام</h1>
        <p class="last-updated">آخر تحديث: ${new Date().toLocaleDateString('ar-DZ')}</p>

        <h2>1. مقدمة</h2>
        <p>مرحباً بكم في منصة Ammerli. من خلال الوصول إلى المنصة أو استخدامها، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل استخدام خدماتنا.</p>
        <p>منصة Ammerli هي منصة تجارة إلكترونية B2B تربط بين تجار الجملة والسوبرماركت في الجزائر، وتوفر حلولاً متكاملة لإدارة الطلبات والمدفوعات والتوصيل.</p>

        <h2>2. التعريفات</h2>
        <ul>
            <li><strong>المنصة:</strong> تطبيق ونظام Ammerli الإلكتروني بجميع خدماته.</li>
            <li><strong>المستخدم:</strong> أي شخص أو جهة تستخدم المنصة سواء كان تاجر جملة أو سوبرماركت.</li>
            <li><strong>البائع:</strong> تاجر الجملة المسجل على المنصة.</li>
            <li><strong>المشتري:</strong> السوبرماركت المسجل على المنصة.</li>
            <li><strong>الخدمات:</strong> جميع الوظائف والميزات المتاحة على المنصة.</li>
        </ul>

        <h2>3. الأهلية والتسجيل</h2>
        <h3>3.1 الأهلية</h3>
        <ul>
            <li>يجب أن يكون المستخدم شخصاً اعتبارياً أو طبيعياً يمتلك الأهلية القانونية الكاملة.</li>
            <li>يجب أن يكون لديك سجل تجاري ساري المفعول إذا كنت تمثل شركة.</li>
            <li>يجب أن تكون في سن قانونية لإبرام عقود ملزمة (18 عاماً على الأقل).</li>
        </ul>

        <h3>3.2 معلومات الحساب</h3>
        <ul>
            <li>يجب عليك تقديم معلومات دقيقة وكاملة وحديثة عند التسجيل.</li>
            <li>أنت مسؤول عن الحفاظ على سرية بيانات حسابك.</li>
            <li>أنت مسؤول عن جميع الأنشطة التي تتم تحت حسابك.</li>
            <li>يجب عليك إخطارنا فوراً بأي استخدام غير مصرح به لحسابك.</li>
        </ul>

        <h2>4. استخدام المنصة</h2>
        <h3>4.1 الاستخدام المصرح به</h3>
        <p>يمكنك استخدام المنصة للأغراض التجارية المشروعة فقط، بما في ذلك:</p>
        <ul>
            <li>تصفح وشراء المنتجات (للمشترين).</li>
            <li>عرض وبيع المنتجات (للبائعين).</li>
            <li>إدارة الطلبات والمدفوعات.</li>
            <li>التواصل مع الأطراف الأخرى عبر المنصة.</li>
        </ul>

        <h3>4.2 الاستخدام المحظور</h3>
        <p>يُمنع منعاً باتاً استخدام المنصة لـ:</p>
        <ul>
            <li>أي نشاط غير قانوني أو احتيالي.</li>
            <li>انتهاك حقوق الملكية الفكرية.</li>
            <li>نشر محتوى ضار أو مسيء أو غير لائق.</li>
            <li>محاولة اختراق أو تعطيل أمان المنصة.</li>
            <li>استخدام روبوتات أو برامج آلية دون إذن.</li>
            <li>جمع بيانات المستخدمين الآخرين.</li>
        </ul>

        <h2>5. المنتجات والأسعار</h2>
        <h3>5.1 قوائم المنتجات</h3>
        <ul>
            <li>البائعون مسؤولون عن دقة معلومات منتجاتهم.</li>
            <li>نحتفظ بالحق في إزالة أي منتج يخالف شروطنا.</li>
            <li>يجب أن تكون جميع المنتجات قانونية ومتوافقة مع القوانين الجزائرية.</li>
        </ul>

        <h3>5.2 الأسعار</h3>
        <ul>
            <li>الأسعار معروضة بالدينار الجزائري (DZD).</li>
            <li>الأسعار تشمل الضرائب ما لم يُذكر خلاف ذلك.</li>
            <li>نحتفظ بالحق في تصحيح أخطاء التسعير.</li>
        </ul>

        <h2>6. الطلبات والدفع</h2>
        <h3>6.1 تقديم الطلبات</h3>
        <ul>
            <li>يشكل تقديم الطلب عرضاً لشراء المنتجات.</li>
            <li>نرسل تأكيداً إلكترونياً بعد تلقي طلبك.</li>
            <li>يمكن للبائع قبول أو رفض الطلب خلال فترة زمنية محددة.</li>
        </ul>

        <h3>6.2 طرق الدفع</h3>
        <p>نقبل طرق الدفع التالية:</p>
        <ul>
            <li><strong>الدفع عند الاستلام (Cash on Delivery):</strong> الدفع نقداً عند استلام البضاعة.</li>
            <li><strong>الدفع الإلكتروني عبر Chargily:</strong> الدفع الفوري عبر بوابة الدفع Chargily المعتمدة.</li>
        </ul>

        <div class="important">
            <h3>6.3 معالجة الدفع عبر Chargily</h3>
            <p>عند اختيار الدفع الإلكتروني، فإنك توافق على:</p>
            <ul>
                <li>خدمات الدفع تتم معالجتها بواسطة Chargily Pay، شريكنا المعتمد في الدفع الإلكتروني.</li>
                <li>تخضع المعاملات لشروط وأحكام Chargily Pay.</li>
                <li>نحن لا نخزن معلومات البطاقة المصرفية الخاصة بك.</li>
                <li>جميع المعاملات آمنة ومشفرة وفقاً لمعايير PCI DSS.</li>
                <li>في حالة فشل الدفع، سيتم إلغاء الطلب تلقائياً.</li>
                <li>تخضع المبالغ المستردة لسياسة الاسترجاع الخاصة بنا ولشروط Chargily.</li>
            </ul>
        </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>

        <h3>6.4 الفواتير</h3>
        <ul>
            <li>يتم إنشاء فاتورة PDF تلقائياً لكل طلب مكتمل.</li>
            <li>تُرسل الفواتير عبر البريد الإلكتروني وتكون متاحة في حسابك.</li>
        </ul>

        <h2>7. التوصيل والشحن</h2>
        <ul>
            <li>يتم تحديد أوقات التوصيل حسب الموقع والتوفر.</li>
            <li>البائع مسؤول عن تحضير وشحن الطلبات في الوقت المحدد.</li>
            <li>يمكنك تتبع حالة طلبك عبر المنصة.</li>
            <li>حالات الطلب: تأكيد، تحضير، قيد التوصيل، تم التوصيل.</li>
        </ul>

        <h2>8. الإلغاء والإرجاع والاسترداد</h2>
        <h3>8.1 الإلغاء</h3>
        <ul>
            <li>يمكن إلغاء الطلبات قبل تأكيد البائع.</li>
            <li>بعد التأكيد، يخضع الإلغاء لموافقة البائع.</li>
        </ul>

        <h3>8.3 الاسترداد</h3>
        <ul>
            <li>تتم معالجة المبالغ المستردة خلال 7-14 يوم عمل.</li>
            <li>يتم الاسترداد بنفس طريقة الدفع الأصلية.</li>
            <li>قد تخضع بعض العمليات لرسوم معالجة.</li>
        </ul>

        <h2>9. حماية البيانات والخصوصية</h2>
        <ul>
            <li>نحن نحترم خصوصيتك ونحمي بياناتك الشخصية.</li>
            <li>يتم جمع البيانات واستخدامها وفقاً لسياسة الخصوصية الخاصة بنا.</li>
            <li>لن نشارك معلوماتك مع أطراف ثالثة دون موافقتك، إلا عند الضرورة القانونية.</li>
            <li>نستخدم Firebase Cloud Messaging (FCM) لإرسال الإشعارات.</li>
        </ul>

        <h2>10. حقوق الملكية الفكرية</h2>
        <ul>
            <li>جميع المحتويات على المنصة محمية بحقوق الطبع والنشر.</li>
            <li>لا يجوز نسخ أو توزيع أو تعديل أي محتوى دون إذن كتابي.</li>
            <li>العلامات التجارية والشعارات هي ملك لأصحابها.</li>
        </ul>

        <h2>11. إخلاء المسؤولية</h2>
        <ul>
            <li>المنصة مقدمة "كما هي" دون أي ضمانات.</li>
            <li>لا نضمن أن الخدمة ستكون خالية من الأخطاء أو متاحة دائماً.</li>
            <li>نحن لسنا مسؤولين عن جودة المنتجات أو تصرفات البائعين.</li>
            <li>المستخدمون مسؤولون عن صحة المعلومات التي يقدمونها.</li>
        </ul>

        <h2>12. تحديد المسؤولية</h2>
        <p>في أقصى حد يسمح به القانون:</p>
        <ul>
            <li>لا نتحمل مسؤولية الأضرار غير المباشرة أو التبعية.</li>
            <li>مسؤوليتنا القصوى محدودة بقيمة الطلب المعني.</li>
            <li>لا نتحمل مسؤولية خسارة البيانات أو الأرباح.</li>
        </ul>

        <h2>13. التعويض</h2>
        <p>أنت توافق على تعويضنا وحمايتنا من أي مطالبات أو خسائر ناتجة عن:</p>
        <ul>
            <li>انتهاكك لهذه الشروط.</li>
            <li>انتهاكك لأي قوانين أو حقوق أطراف ثالثة.</li>
            <li>استخدامك للمنصة.</li>
        </ul>

        <h2>14. إنهاء الحساب</h2>
        <ul>
            <li>يمكنك إغلاق حسابك في أي وقت.</li>
            <li>نحتفظ بالحق في تعليق أو إنهاء حسابك في حالة انتهاك الشروط.</li>
            <li>عند الإنهاء، تفقد الوصول إلى جميع الخدمات.</li>
        </ul>

        <h2>15. التعديلات</h2>
        <ul>
            <li>نحتفظ بالحق في تعديل هذه الشروط في أي وقت.</li>
            <li>سنقوم بإخطارك بالتغييرات الجوهرية.</li>
            <li>استمرارك في استخدام المنصة يعني قبولك للشروط المعدلة.</li>
        </ul>

        <h2>16. القانون الحاكم وتسوية النزاعات</h2>
        <ul>
            <li>تخضع هذه الشروط للقوانين الجزائرية.</li>
            <li>أي نزاع يخضع لاختصاص المحاكم الجزائرية.</li>
            <li>نشجع حل النزاعات ودياً قبل اللجوء للقضاء.</li>
        </ul>

        <h2>17. أحكام عامة</h2>
        <ul>
            <li>إذا كان أي حكم غير قابل للتنفيذ، تظل الأحكام الأخرى سارية.</li>
            <li>عدم ممارستنا لحق لا يعني التنازل عنه.</li>
            <li>هذه الشروط تشكل الاتفاقية الكاملة بيننا.</li>
        </ul>

        <div class="contact">
            <h2>18. معلومات الاتصال</h2>
            <p>للأسئلة أو الاستفسارات حول هذه الشروط، يرجى التواصل معنا:</p>
            <ul>
                <li><strong>البريد الإلكتروني:</strong> contact@amerli.dz</li>
                <li><strong>الهاتف:</strong> +213 550 123 456</li>
                <li><strong>العنوان:</strong> 12 Rue des Frères Boukhalfa، Hydra، Alger، Algérie</li>
            </ul>
        </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #7f8c8d;">
            © ${new Date().getFullYear()} Ammerli. جميع الحقوق محفوظة.
        </p>
    </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>
</body>
</html>
    `;
  }

  private getTermsEn(): string {
    return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms and Conditions - Ammerli</title>
    <style>
        .logo { text-align: center; margin-bottom: 30px; }
        .logo img { max-width: 150px; height: auto; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.8;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #04272D;
            margin-bottom: 10px;
            font-size: 2.5em;
            border-bottom: 3px solid #A2C23A;
            padding-bottom: 15px;
        }
        h2 {
            color: #1A4D52;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.8em;
        }
        h3 {
            color: #555;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 1.3em;
        }
        p, li {
            margin-bottom: 12px;
            text-align: justify;
        }
        ul, ol {
            margin-left: 30px;
            margin-bottom: 20px;
        }
        .last-updated {
            color: #7f8c8d;
            font-style: italic;
            margin-bottom: 30px;
        }
        .important {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .contact {
            background: #e8f4f8;
            padding: 20px;
            border-radius: 5px;
            margin-top: 30px;
        }
        .lang-switcher {
            text-align: center;
            margin-bottom: 20px;
        }
        .lang-switcher a {
            margin: 0 10px;
            padding: 8px 16px;
            background: #A2C23A;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        }
        .lang-switcher a:hover {
            background: #8BAF30;
        }
        a { color: #A2C23A; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="lang-switcher">
            <a href="/terms-and-conditions">العربية</a>
            <a href="/terms-and-conditions/en">English</a>
            <a href="/terms-and-conditions/fr">Français</a>
        </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>

        <h1>Terms and Conditions</h1>
        <p class="last-updated">Last Updated: ${new Date().toLocaleDateString('en-US')}</p>

        <h2>1. Introduction</h2>
        <p>Welcome to Ammerli platform. By accessing or using the platform, you agree to comply with these Terms and Conditions. Please read them carefully before using our services.</p>
        <p>Ammerli is a B2B e-commerce platform connecting wholesalers and supermarkets in Algeria, providing integrated solutions for order management, payments, and delivery.</p>

        <h2>2. Definitions</h2>
        <ul>
            <li><strong>Platform:</strong> The Ammerli application and electronic system with all its services.</li>
            <li><strong>User:</strong> Any person or entity using the platform, whether wholesaler or supermarket.</li>
            <li><strong>Seller:</strong> A registered wholesaler on the platform.</li>
            <li><strong>Buyer:</strong> A registered supermarket on the platform.</li>
            <li><strong>Services:</strong> All functions and features available on the platform.</li>
        </ul>

        <h2>3. Eligibility and Registration</h2>
        <h3>3.1 Eligibility</h3>
        <ul>
            <li>Users must be legal or natural persons with full legal capacity.</li>
            <li>You must have a valid commercial register if representing a company.</li>
            <li>You must be of legal age to enter into binding contracts (at least 18 years old).</li>
        </ul>

        <h3>3.2 Account Information</h3>
        <ul>
            <li>You must provide accurate, complete, and current information when registering.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You are responsible for all activities under your account.</li>
            <li>You must notify us immediately of any unauthorized use of your account.</li>
        </ul>

        <h2>4. Platform Usage</h2>
        <h3>4.1 Authorized Use</h3>
        <p>You may use the platform for legitimate commercial purposes only, including:</p>
        <ul>
            <li>Browsing and purchasing products (for buyers).</li>
            <li>Listing and selling products (for sellers).</li>
            <li>Managing orders and payments.</li>
            <li>Communicating with other parties through the platform.</li>
        </ul>

        <h3>4.2 Prohibited Use</h3>
        <p>Using the platform for the following is strictly prohibited:</p>
        <ul>
            <li>Any illegal or fraudulent activity.</li>
            <li>Violating intellectual property rights.</li>
            <li>Publishing harmful, offensive, or inappropriate content.</li>
            <li>Attempting to hack or disrupt platform security.</li>
            <li>Using bots or automated programs without permission.</li>
            <li>Collecting data of other users.</li>
        </ul>

        <h2>5. Products and Pricing</h2>
        <h3>5.1 Product Listings</h3>
        <ul>
            <li>Sellers are responsible for the accuracy of their product information.</li>
            <li>We reserve the right to remove any product violating our terms.</li>
            <li>All products must be legal and comply with Algerian laws.</li>
        </ul>

        <h3>5.2 Pricing</h3>
        <ul>
            <li>Prices are displayed in Algerian Dinar (DZD).</li>
            <li>Prices include taxes unless otherwise stated.</li>
            <li>We reserve the right to correct pricing errors.</li>
        </ul>

        <h2>6. Orders and Payment</h2>
        <h3>6.1 Placing Orders</h3>
        <ul>
            <li>Submitting an order constitutes an offer to purchase products.</li>
            <li>We send electronic confirmation after receiving your order.</li>
            <li>Sellers can accept or reject orders within a specified timeframe.</li>
        </ul>

        <h3>6.2 Payment Methods</h3>
        <p>We accept the following payment methods:</p>
        <ul>
            <li><strong>Cash on Delivery (COD):</strong> Cash payment upon receiving goods.</li>
            <li><strong>Electronic Payment via Chargily:</strong> Instant payment through Chargily payment gateway.</li>
        </ul>

        <div class="important">
            <h3>6.3 Payment Processing via Chargily</h3>
            <p>When choosing electronic payment, you agree to:</p>
            <ul>
                <li>Payment services are processed by Chargily Pay, our authorized payment partner.</li>
                <li>Transactions are subject to Chargily Pay's terms and conditions.</li>
                <li>We do not store your bank card information.</li>
                <li>All transactions are secure and encrypted according to PCI DSS standards.</li>
                <li>In case of payment failure, the order will be automatically canceled.</li>
                <li>Refunds are subject to our refund policy and Chargily's terms.</li>
            </ul>
        </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>

        <h3>6.4 Invoices</h3>
        <ul>
            <li>A PDF invoice is automatically generated for each completed order.</li>
            <li>Invoices are sent via email and available in your account.</li>
        </ul>

        <h2>7. Delivery and Shipping</h2>
        <ul>
            <li>Delivery times are determined by location and availability.</li>
            <li>Sellers are responsible for preparing and shipping orders on time.</li>
            <li>You can track your order status through the platform.</li>
            <li>Order statuses: Confirmation, Preparation, Delivering, Delivered.</li>
        </ul>

        <h2>8. Cancellation, Returns, and Refunds</h2>
        <h3>8.1 Cancellation</h3>
        <ul>
            <li>Orders can be canceled before seller confirmation.</li>
            <li>After confirmation, cancellation is subject to seller approval.</li>
        </ul>

        <h3>8.2 Refunds</h3>
        <ul>
            <li>Refunds are processed within 7-14 business days.</li>
            <li>Refunds are issued using the original payment method.</li>
            <li>Some transactions may be subject to processing fees.</li>
        </ul>

        <h2>9. Data Protection and Privacy</h2>
        <ul>
            <li>We respect your privacy and protect your personal data.</li>
            <li>Data is collected and used according to our Privacy Policy.</li>
            <li>We will not share your information with third parties without consent, except when legally required.</li>
            <li>We use Firebase Cloud Messaging (FCM) to send notifications.</li>
        </ul>

        <h2>10. Intellectual Property Rights</h2>
        <ul>
            <li>All content on the platform is protected by copyright.</li>
            <li>No content may be copied, distributed, or modified without written permission.</li>
            <li>Trademarks and logos are property of their respective owners.</li>
        </ul>

        <h2>11. Disclaimer</h2>
        <ul>
            <li>The platform is provided "as is" without any warranties.</li>
            <li>We do not guarantee the service will be error-free or always available.</li>
            <li>We are not responsible for product quality or seller actions.</li>
            <li>Users are responsible for the accuracy of information they provide.</li>
        </ul>

        <h2>12. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law:</p>
        <ul>
            <li>We are not liable for indirect or consequential damages.</li>
            <li>Our maximum liability is limited to the value of the order in question.</li>
            <li>We are not liable for data loss or lost profits.</li>
        </ul>

        <h2>13. Indemnification</h2>
        <p>You agree to indemnify and hold us harmless from any claims or losses arising from:</p>
        <ul>
            <li>Your violation of these terms.</li>
            <li>Your violation of any laws or third-party rights.</li>
            <li>Your use of the platform.</li>
        </ul>

        <h2>14. Account Termination</h2>
        <ul>
            <li>You can close your account at any time.</li>
            <li>We reserve the right to suspend or terminate your account for terms violations.</li>
            <li>Upon termination, you lose access to all services.</li>
        </ul>

        <h2>15. Amendments</h2>
        <ul>
            <li>We reserve the right to modify these terms at any time.</li>
            <li>We will notify you of material changes.</li>
            <li>Continued use of the platform means acceptance of modified terms.</li>
        </ul>

        <h2>16. Governing Law and Dispute Resolution</h2>
        <ul>
            <li>These terms are governed by Algerian laws.</li>
            <li>Any dispute is subject to Algerian court jurisdiction.</li>
            <li>We encourage amicable dispute resolution before litigation.</li>
        </ul>

        <h2>17. General Provisions</h2>
        <ul>
            <li>If any provision is unenforceable, other provisions remain valid.</li>
            <li>Failure to exercise a right does not constitute a waiver.</li>
            <li>These terms constitute the entire agreement between us.</li>
        </ul>

        <div class="contact">
            <h2>18. Contact Information</h2>
            <p>For questions or inquiries about these terms, please contact us:</p>
            <ul>
                <li><strong>Email:</strong> contact@amerli.dz</li>
                <li><strong>Phone:</strong> +213 550 123 456</li>
                <li><strong>Address:</strong> 12 Rue des Frères Boukhalfa, Hydra, Alger, Algérie</li>
            </ul>
        </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #7f8c8d;">
            © ${new Date().getFullYear()} Ammerli. All Rights Reserved.
        </p>
    </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>
</body>
</html>
    `;
  }

  private getTermsFr(): string {
    return `
<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conditions Générales - Ammerli</title>
    <style>
        .logo { text-align: center; margin-bottom: 30px; }
        .logo img { max-width: 150px; height: auto; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.8;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #04272D;
            margin-bottom: 10px;
            font-size: 2.5em;
            border-bottom: 3px solid #A2C23A;
            padding-bottom: 15px;
        }
        h2 {
            color: #1A4D52;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.8em;
        }
        h3 {
            color: #555;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 1.3em;
        }
        p, li {
            margin-bottom: 12px;
            text-align: justify;
        }
        ul, ol {
            margin-left: 30px;
            margin-bottom: 20px;
        }
        .last-updated {
            color: #7f8c8d;
            font-style: italic;
            margin-bottom: 30px;
        }
        .important {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .contact {
            background: #e8f4f8;
            padding: 20px;
            border-radius: 5px;
            margin-top: 30px;
        }
        .lang-switcher {
            text-align: center;
            margin-bottom: 20px;
        }
        .lang-switcher a {
            margin: 0 10px;
            padding: 8px 16px;
            background: #A2C23A;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        }
        .lang-switcher a:hover {
            background: #8BAF30;
        }
        a { color: #A2C23A; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="lang-switcher">
            <a href="/terms-and-conditions">العربية</a>
            <a href="/terms-and-conditions/en">English</a>
            <a href="/terms-and-conditions/fr">Français</a>
        </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>

        <h1>Conditions Générales d'Utilisation</h1>
        <p class="last-updated">Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR')}</p>

        <h2>1. Introduction</h2>
        <p>Bienvenue sur la plateforme Ammerli. En accédant ou en utilisant la plateforme, vous acceptez de vous conformer à ces Conditions Générales. Veuillez les lire attentivement avant d'utiliser nos services.</p>
        <p>Ammerli est une plateforme de commerce électronique B2B reliant les grossistes et les supermarchés en Algérie, offrant des solutions intégrées pour la gestion des commandes, des paiements et de la livraison.</p>

        <h2>2. Définitions</h2>
        <ul>
            <li><strong>Plateforme :</strong> L'application et le système électronique Ammerli avec tous ses services.</li>
            <li><strong>Utilisateur :</strong> Toute personne ou entité utilisant la plateforme, qu'il s'agisse d'un grossiste ou d'un supermarché.</li>
            <li><strong>Vendeur :</strong> Un grossiste enregistré sur la plateforme.</li>
            <li><strong>Acheteur :</strong> Un supermarché enregistré sur la plateforme.</li>
            <li><strong>Services :</strong> Toutes les fonctionnalités disponibles sur la plateforme.</li>
        </ul>

        <h2>3. Éligibilité et Inscription</h2>
        <h3>3.1 Éligibilité</h3>
        <ul>
            <li>Les utilisateurs doivent être des personnes morales ou physiques ayant la pleine capacité juridique.</li>
            <li>Vous devez disposer d'un registre de commerce valide si vous représentez une entreprise.</li>
            <li>Vous devez être en âge légal de conclure des contrats contraignants (au moins 18 ans).</li>
        </ul>

        <h3>3.2 Informations du Compte</h3>
        <ul>
            <li>Vous devez fournir des informations exactes, complètes et à jour lors de l'inscription.</li>
            <li>Vous êtes responsable du maintien de la confidentialité de vos identifiants.</li>
            <li>Vous êtes responsable de toutes les activités sous votre compte.</li>
            <li>Vous devez nous informer immédiatement de toute utilisation non autorisée de votre compte.</li>
        </ul>

        <h2>4. Utilisation de la Plateforme</h2>
        <h3>4.1 Utilisation Autorisée</h3>
        <p>Vous pouvez utiliser la plateforme uniquement à des fins commerciales légitimes, notamment :</p>
        <ul>
            <li>Parcourir et acheter des produits (pour les acheteurs).</li>
            <li>Répertorier et vendre des produits (pour les vendeurs).</li>
            <li>Gérer les commandes et les paiements.</li>
            <li>Communiquer avec d'autres parties via la plateforme.</li>
        </ul>

        <h3>4.2 Utilisation Interdite</h3>
        <p>L'utilisation de la plateforme pour les activités suivantes est strictement interdite :</p>
        <ul>
            <li>Toute activité illégale ou frauduleuse.</li>
            <li>Violation des droits de propriété intellectuelle.</li>
            <li>Publication de contenu nuisible, offensant ou inapproprié.</li>
            <li>Tentative de piratage ou de perturbation de la sécurité de la plateforme.</li>
            <li>Utilisation de robots ou de programmes automatisés sans autorisation.</li>
            <li>Collecte de données d'autres utilisateurs.</li>
        </ul>

        <h2>5. Produits et Tarification</h2>
        <h3>5.1 Listes de Produits</h3>
        <ul>
            <li>Les vendeurs sont responsables de l'exactitude des informations sur leurs produits.</li>
            <li>Nous nous réservons le droit de retirer tout produit violant nos conditions.</li>
            <li>Tous les produits doivent être légaux et conformes aux lois algériennes.</li>
        </ul>

        <h3>5.2 Tarification</h3>
        <ul>
            <li>Les prix sont affichés en Dinar Algérien (DZD).</li>
            <li>Les prix incluent les taxes sauf indication contraire.</li>
            <li>Nous nous réservons le droit de corriger les erreurs de tarification.</li>
        </ul>

        <h2>6. Commandes et Paiement</h2>
        <h3>6.1 Passer des Commandes</h3>
        <ul>
            <li>La soumission d'une commande constitue une offre d'achat de produits.</li>
            <li>Nous envoyons une confirmation électronique après réception de votre commande.</li>
            <li>Les vendeurs peuvent accepter ou refuser les commandes dans un délai spécifié.</li>
        </ul>

        <h3>6.2 Méthodes de Paiement</h3>
        <p>Nous acceptons les méthodes de paiement suivantes :</p>
        <ul>
            <li><strong>Paiement à la Livraison (COD) :</strong> Paiement en espèces à la réception des marchandises.</li>
            <li><strong>Paiement Électronique via Chargily :</strong> Paiement instantané via la passerelle Chargily.</li>
        </ul>

        <div class="important">
            <h3>6.3 Traitement des Paiements via Chargily</h3>
            <p>En choisissant le paiement électronique, vous acceptez :</p>
            <ul>
                <li>Les services de paiement sont traités par Chargily Pay, notre partenaire de paiement autorisé.</li>
                <li>Les transactions sont soumises aux conditions générales de Chargily Pay.</li>
                <li>Nous ne stockons pas vos informations de carte bancaire.</li>
                <li>Toutes les transactions sont sécurisées et cryptées selon les normes PCI DSS.</li>
                <li>En cas d'échec du paiement, la commande sera automatiquement annulée.</li>
                <li>Les remboursements sont soumis à notre politique de remboursement et aux conditions de Chargily.</li>
            </ul>
        </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>

        <h3>6.4 Factures</h3>
        <ul>
            <li>Une facture PDF est automatiquement générée pour chaque commande complétée.</li>
            <li>Les factures sont envoyées par e-mail et disponibles dans votre compte.</li>
        </ul>

        <h2>7. Livraison et Expédition</h2>
        <ul>
            <li>Les délais de livraison sont déterminés par l'emplacement et la disponibilité.</li>
            <li>Les vendeurs sont responsables de la préparation et de l'expédition des commandes à temps.</li>
            <li>Vous pouvez suivre l'état de votre commande via la plateforme.</li>
            <li>États de commande : Confirmation, Préparation, En cours de livraison, Livré.</li>
        </ul>

        <h2>8. Annulation, Retours et Remboursements</h2>
        <h3>8.1 Annulation</h3>
        <ul>
            <li>Les commandes peuvent être annulées avant la confirmation du vendeur.</li>
            <li>Après confirmation, l'annulation est soumise à l'approbation du vendeur.</li>
        </ul>

        <h3>8.2 Remboursements</h3>
        <ul>
            <li>Les remboursements sont traités dans un délai de 7 à 14 jours ouvrables.</li>
            <li>Les remboursements sont effectués selon le mode de paiement d'origine.</li>
            <li>Certaines transactions peuvent être soumises à des frais de traitement.</li>
        </ul>

        <h2>9. Protection des Données et Confidentialité</h2>
        <ul>
            <li>Nous respectons votre vie privée et protégeons vos données personnelles.</li>
            <li>Les données sont collectées et utilisées conformément à notre Politique de Confidentialité.</li>
            <li>Nous ne partagerons pas vos informations avec des tiers sans consentement, sauf obligation légale.</li>
            <li>Nous utilisons Firebase Cloud Messaging (FCM) pour envoyer des notifications.</li>
        </ul>

        <h2>10. Droits de Propriété Intellectuelle</h2>
        <ul>
            <li>Tout le contenu de la plateforme est protégé par le droit d'auteur.</li>
            <li>Aucun contenu ne peut être copié, distribué ou modifié sans autorisation écrite.</li>
            <li>Les marques et logos sont la propriété de leurs propriétaires respectifs.</li>
        </ul>

        <h2>11. Clause de Non-responsabilité</h2>
        <ul>
            <li>La plateforme est fournie "telle quelle" sans aucune garantie.</li>
            <li>Nous ne garantissons pas que le service sera sans erreur ou toujours disponible.</li>
            <li>Nous ne sommes pas responsables de la qualité des produits ou des actions des vendeurs.</li>
            <li>Les utilisateurs sont responsables de l'exactitude des informations qu'ils fournissent.</li>
        </ul>

        <h2>12. Limitation de Responsabilité</h2>
        <p>Dans toute la mesure permise par la loi :</p>
        <ul>
            <li>Nous ne sommes pas responsables des dommages indirects ou consécutifs.</li>
            <li>Notre responsabilité maximale est limitée à la valeur de la commande en question.</li>
            <li>Nous ne sommes pas responsables de la perte de données ou de profits.</li>
        </ul>

        <h2>13. Indemnisation</h2>
        <p>Vous acceptez de nous indemniser et de nous dégager de toute responsabilité pour toute réclamation ou perte résultant de :</p>
        <ul>
            <li>Votre violation de ces conditions.</li>
            <li>Votre violation de toute loi ou droit de tiers.</li>
            <li>Votre utilisation de la plateforme.</li>
        </ul>

        <h2>14. Résiliation du Compte</h2>
        <ul>
            <li>Vous pouvez fermer votre compte à tout moment.</li>
            <li>Nous nous réservons le droit de suspendre ou de résilier votre compte en cas de violation des conditions.</li>
            <li>Lors de la résiliation, vous perdez l'accès à tous les services.</li>
        </ul>

        <h2>15. Modifications</h2>
        <ul>
            <li>Nous nous réservons le droit de modifier ces conditions à tout moment.</li>
            <li>Nous vous informerons des changements importants.</li>
            <li>L'utilisation continue de la plateforme signifie l'acceptation des conditions modifiées.</li>
        </ul>

        <h2>16. Loi Applicable et Résolution des Litiges</h2>
        <ul>
            <li>Ces conditions sont régies par les lois algériennes.</li>
            <li>Tout litige est soumis à la juridiction des tribunaux algériens.</li>
            <li>Nous encourageons la résolution amiable des litiges avant toute action en justice.</li>
        </ul>

        <h2>17. Dispositions Générales</h2>
        <ul>
            <li>Si une disposition est inapplicable, les autres dispositions restent valides.</li>
            <li>Le non-exercice d'un droit ne constitue pas une renonciation.</li>
            <li>Ces conditions constituent l'intégralité de l'accord entre nous.</li>
        </ul>

        <div class="contact">
            <h2>18. Informations de Contact</h2>
            <p>Pour toute question ou demande concernant ces conditions, veuillez nous contacter :</p>
            <ul>
                <li><strong>E-mail :</strong> contact@amerli.dz</li>
                <li><strong>Téléphone :</strong> +213 550 123 456</li>
                <li><strong>Adresse :</strong> 12 Rue des Frères Boukhalfa, Hydra, Alger, Algérie</li>
            </ul>
        </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #7f8c8d;">
            © ${new Date().getFullYear()} Ammerli. Tous droits réservés.
        </p>
    </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>
</body>
</html>
    `;
  }

  getPrivacyPolicy(lang: 'ar' | 'en' | 'fr' = 'ar'): string {
    if (lang === 'en') return this.getPrivacyEn();
    if (lang === 'fr') return this.getPrivacyFr();
    return this.getPrivacyAr();
  }

  private getPrivacyAr(): string {
    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>سياسة الخصوصية - Ammerli</title>
    <style>
        .logo { text-align: center; margin-bottom: 30px; }
        .logo img { max-width: 150px; height: auto; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.8;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #04272D;
            margin-bottom: 10px;
            font-size: 2.5em;
            border-bottom: 3px solid #A2C23A;
            padding-bottom: 15px;
        }
        h2 {
            color: #1A4D52;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.8em;
        }
        h3 {
            color: #555;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 1.3em;
        }
        p, li {
            margin-bottom: 12px;
            text-align: justify;
        }
        ul, ol {
            margin-right: 30px;
            margin-bottom: 20px;
        }
        .last-updated {
            color: #7f8c8d;
            font-style: italic;
            margin-bottom: 30px;
        }
        .important {
            background: #fff3cd;
            border-right: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .contact {
            background: #e8f4f8;
            padding: 20px;
            border-radius: 5px;
            margin-top: 30px;
        }

        .lang-switcher {
            text-align: center;
            margin-bottom: 20px;
        }
        .lang-switcher a {
            margin: 0 10px;
            padding: 8px 16px;
            background: #A2C23A;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 500;
            display: inline-block;
        }
        .lang-switcher a:hover {
            background: #8BAF30;
        }
        
        a { color: #A2C23A; text-decoration: none; }
        a:hover { text-decoration: underline; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: right;
        }
        th {
            background-color: #A2C23A;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>
        
        <div class="lang-switcher">
            <a href="/privacy-policy">العربية</a>
            <a href="/privacy-policy/en">English</a>
            <a href="/privacy-policy/fr">Français</a>
        </div>

        <h1>سياسة الخصوصية</h1>
        <p class="last-updated">آخر تحديث: ${new Date().toLocaleDateString('ar-DZ')}</p>

        <h2>1. مقدمة</h2>
        <p>في Ammerli، نحن ملتزمون بحماية خصوصيتك وأمان معلوماتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية ومشاركة بياناتك الشخصية عند استخدامك لمنصتنا.</p>
        <p>باستخدامك للمنصة، فإنك توافق على ممارساتنا المتعلقة بالخصوصية كما هو موضح في هذه السياسة.</p>

        <h2>2. المعلومات التي نجمعها</h2>
        
        <h3>2.1 المعلومات الشخصية</h3>
        <p>نجمع المعلومات التالية عند التسجيل أو استخدام المنصة:</p>
        <ul>
            <li><strong>معلومات الحساب:</strong> الاسم، رقم الهاتف، البريد الإلكتروني، كلمة المرور.</li>
            <li><strong>معلومات الشركة:</strong> اسم الشركة، السجل التجاري، العنوان التجاري.</li>
            <li><strong>معلومات التوصيل:</strong> العناوين، الولاية، البلدية، معلومات الاتصال.</li>
            <li><strong>معلومات الدفع:</strong> تفاصيل الدفع (معالجة آمنة عبر Chargily).</li>
        </ul>

        <h3>2.2 المعلومات التقنية</h3>
        <ul>
            <li><strong>بيانات الجهاز:</strong> نوع الجهاز، نظام التشغيل، الإصدار، المعرف الفريد للجهاز.</li>
            <li><strong>بيانات الاستخدام:</strong> سجل التصفح، الصفحات المزارة، الوقت المستغرق، النقرات.</li>
            <li><strong>بيانات الموقع:</strong> عنوان IP، الموقع التقريبي (عند منح الإذن).</li>
            <li><strong>رموز FCM:</strong> رموز Firebase Cloud Messaging للإشعارات الفورية.</li>
        </ul>

        <h3>2.3 المعلومات التجارية</h3>
        <ul>
            <li>تفاصيل الطلبات والمعاملات.</li>
            <li>السجل التجاري والفواتير.</li>
            <li>التقييمات والمراجعات.</li>
            <li>المحادثات مع خدمة العملاء.</li>
        </ul>

        <h2>3. كيفية استخدام معلوماتك</h2>
        <p>نستخدم معلوماتك للأغراض التالية:</p>

        <h3>3.1 تقديم الخدمات</h3>
        <ul>
            <li>إنشاء وإدارة حسابك.</li>
            <li>معالجة الطلبات والمدفوعات.</li>
            <li>توصيل المنتجات وتتبع الشحنات.</li>
            <li>إصدار الفواتير والتقارير.</li>
        </ul>

        <h3>3.2 التواصل معك</h3>
        <ul>
            <li>إرسال إشعارات الطلبات وتحديثات الحالة.</li>
            <li>إرسال إشعارات انتهاء صلاحية المنتجات.</li>
            <li>الرد على استفساراتك وطلبات الدعم.</li>
            <li>إرسال تحديثات مهمة حول الخدمة.</li>
        </ul>

        <h3>3.3 تحسين الخدمة</h3>
        <ul>
            <li>تحليل استخدام المنصة وتحسين الأداء.</li>
            <li>تطوير ميزات ووظائف جديدة.</li>
            <li>إجراء أبحاث وتحليلات تجارية.</li>
            <li>تخصيص تجربة المستخدم.</li>
        </ul>

        <h3>3.4 الأمان والامتثال</h3>
        <ul>
            <li>حماية المنصة من الاحتيال والإساءة.</li>
            <li>الامتثال للالتزامات القانونية.</li>
            <li>حل النزاعات وإنفاذ اتفاقياتنا.</li>
        </ul>

        <div class="important">
            <h2>4. مشاركة المعلومات</h2>
            <p>نحن لا نبيع معلوماتك الشخصية. قد نشارك معلوماتك في الحالات التالية:</p>
            
            <h3>4.1 مع مزودي الخدمات</h3>
            <ul>
                <li><strong>Chargily Pay:</strong> لمعالجة المدفوعات الإلكترونية بشكل آمن.</li>
                <li><strong>Firebase (Google):</strong> لإرسال الإشعارات الفورية والتحليلات.</li>
                <li><strong>خدمات التخزين السحابي:</strong> لتخزين البيانات والملفات.</li>
                <li><strong>خدمات البريد الإلكتروني:</strong> لإرسال الإشعارات والفواتير.</li>
            </ul>

            <h3>4.2 مع الأطراف التجارية</h3>
            <ul>
                <li>مشاركة معلومات الطلب بين البائع والمشتري (الاسم، العنوان، رقم الهاتف).</li>
                <li>معلومات ضرورية لإتمام المعاملة التجارية.</li>
            </ul>

            <h3>4.3 لأسباب قانونية</h3>
            <ul>
                <li>الامتثال للقوانين والأوامر القضائية.</li>
                <li>حماية حقوقنا وممتلكاتنا.</li>
                <li>منع الاحتيال أو الأنشطة غير القانونية.</li>
            </ul>
        </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>

        <h2>5. معالجة الدفع عبر Chargily</h2>
        <p>عند استخدام خدمة الدفع الإلكتروني:</p>
        <ul>
            <li>تتم معالجة المدفوعات بواسطة Chargily Pay، مزود خدمة دفع مرخص ومعتمد.</li>
            <li>نحن لا نخزن أو نحتفظ بتفاصيل بطاقتك المصرفية.</li>
            <li>تُنقل معلومات الدفع مباشرة إلى Chargily عبر اتصال مشفر.</li>
            <li>تخضع معاملاتك لسياسة خصوصية Chargily ومعايير أمان PCI DSS.</li>
            <li>نتلقى فقط تأكيد الدفع وحالة المعاملة دون تفاصيل البطاقة.</li>
        </ul>

        <h2>6. Firebase Cloud Messaging (FCM)</h2>
        <p>نستخدم FCM لإرسال الإشعارات الفورية:</p>
        <ul>
            <li>نجمع رموز FCM للأجهزة المسجلة.</li>
            <li>نرسل إشعارات حول حالة الطلبات والمدفوعات.</li>
            <li>نرسل تنبيهات حول انتهاء صلاحية المنتجات.</li>
            <li>يمكنك تعطيل الإشعارات من إعدادات الجهاز في أي وقت.</li>
            <li>تخضع FCM لسياسة خصوصية Google.</li>
        </ul>

        <h2>7. أمان البيانات</h2>
        <p>نتخذ التدابير التالية لحماية معلوماتك:</p>
        <ul>
            <li><strong>التشفير:</strong> استخدام HTTPS/SSL لتشفير البيانات أثناء النقل.</li>
            <li><strong>تشفير كلمات المرور:</strong> باستخدام خوارزمية Argon2.</li>
            <li><strong>المصادقة الثنائية:</strong> عبر OTP للوصول الآمن.</li>
            <li><strong>التحكم في الوصول:</strong> نظام صلاحيات محدد حسب الدور.</li>
            <li><strong>النسخ الاحتياطي:</strong> نسخ احتياطية منتظمة للبيانات.</li>
            <li><strong>المراقبة:</strong> مراقبة مستمرة لاكتشاف الأنشطة المشبوهة.</li>
        </ul>

        <h2>8. الاحتفاظ بالبيانات</h2>
        <ul>
            <li>نحتفظ بمعلوماتك طالما كان حسابك نشطاً.</li>
            <li>بعد إغلاق الحساب، نحتفظ بالبيانات للامتثال القانوني والضريبي.</li>
            <li>تُحذف البيانات غير الضرورية بشكل دوري.</li>
            <li>سجلات المعاملات تُحفظ وفقاً للقوانين المحلية.</li>
        </ul>

        <h2>9. حقوقك</h2>
        <p>لديك الحقوق التالية فيما يتعلق بمعلوماتك الشخصية:</p>
        <ul>
            <li><strong>الوصول:</strong> طلب نسخة من بياناتك الشخصية.</li>
            <li><strong>التصحيح:</strong> تحديث أو تصحيح المعلومات غير الدقيقة.</li>
            <li><strong>الحذف:</strong> طلب حذف بياناتك (مع مراعاة الالتزامات القانونية).</li>
            <li><strong>التقييد:</strong> طلب تقييد معالجة بياناتك.</li>
            <li><strong>الاعتراض:</strong> الاعتراض على معالجة بياناتك لأغراض معينة.</li>
            <li><strong>النقل:</strong> الحصول على بياناتك بتنسيق قابل للنقل.</li>
        </ul>
        <p>لممارسة هذه الحقوق، يرجى التواصل معنا على: contact@amerli.dz</p>

        <h2>10. ملفات تعريف الارتباط (Cookies)</h2>
        <ul>
            <li>نستخدم ملفات تعريف الارتباط لتحسين تجربة المستخدم.</li>
            <li>نجمع معلومات حول التفضيلات والجلسات.</li>
            <li>يمكنك التحكم في ملفات تعريف الارتباط عبر إعدادات المتصفح.</li>
        </ul>

        <h2>11. خصوصية الأطفال</h2>
        <ul>
            <li>منصتنا غير مخصصة للأشخاص دون 18 عاماً.</li>
            <li>لا نجمع معلومات من الأطفال عن قصد.</li>
            <li>إذا علمنا بجمع بيانات طفل، سنحذفها فوراً.</li>
        </ul>

        <h2>12. الروابط الخارجية</h2>
        <ul>
            <li>قد تحتوي المنصة على روابط لمواقع خارجية.</li>
            <li>لسنا مسؤولين عن ممارسات الخصوصية لهذه المواقع.</li>
            <li>ننصحك بمراجعة سياسات الخصوصية الخاصة بهم.</li>
        </ul>

        <h2>13. التحديثات على سياسة الخصوصية</h2>
        <ul>
            <li>قد نحدث هذه السياسة من وقت لآخر.</li>
            <li>سنخطرك بالتغييرات الجوهرية عبر البريد الإلكتروني أو إشعار على المنصة.</li>
            <li>استمرارك في استخدام المنصة بعد التحديثات يعني قبولك لها.</li>
        </ul>

        <h2>14. الامتثال لمتطلبات Google Play Console</h2>
        <p>تلتزم منصة Ammerli بجميع متطلبات Google Play Console المتعلقة بالخصوصية:</p>
        <ul>
            <li>الإفصاح الكامل عن جميع البيانات المجمعة واستخدامها.</li>
            <li>طلب الأذونات الضرورية فقط وشرح استخدامها.</li>
            <li>توفير طرق آمنة لنقل وتخزين البيانات.</li>
            <li>عدم بيع البيانات الشخصية لأطراف ثالثة.</li>
            <li>احترام خيارات المستخدم في مشاركة البيانات.</li>
        </ul>

        <div class="contact">
            <h2>16. التواصل معنا</h2>
            <p>إذا كانت لديك أسئلة أو مخاوف بشأن خصوصيتك أو هذه السياسة، يرجى التواصل معنا:</p>
            <ul>
                <li><strong>البريد الإلكتروني:</strong> contact@amerli.dz</li>
                <li><strong>الهاتف:</strong> +213 550 123 456</li>
                <li><strong>العنوان:</strong> 12 Rue des Frères Boukhalfa، Hydra، Alger، Algérie</li>
            </ul>
            <p><strong>مسؤول حماية البيانات:</strong> privacy@Ammerli.com</p>
        </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #7f8c8d;">
            © ${new Date().getFullYear()} Ammerli. جميع الحقوق محفوظة.
        </p>
    </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>
</body>
</html>
    `;
  }

  private getPrivacyEn(): string {
    return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Ammerli</title>
    <style>
        .logo { text-align: center; margin-bottom: 30px; }
        .logo img { max-width: 150px; height: auto; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.8;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #04272D;
            margin-bottom: 10px;
            font-size: 2.5em;
            border-bottom: 3px solid #A2C23A;
            padding-bottom: 15px;
        }
        h2 {
            color: #1A4D52;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.8em;
        }
        h3 {
            color: #555;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 1.3em;
        }
        p, li {
            margin-bottom: 12px;
            text-align: justify;
        }
        ul, ol {
            margin-left: 30px;
            margin-bottom: 20px;
        }
        .last-updated {
            color: #7f8c8d;
            font-style: italic;
            margin-bottom: 30px;
        }
        .important {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .contact {
            background: #e8f4f8;
            padding: 20px;
            border-radius: 5px;
            margin-top: 30px;
        }
        .lang-switcher {
            text-align: center;
            margin-bottom: 20px;
        }
        .lang-switcher a {
            margin: 0 10px;
            padding: 8px 16px;
            background: #A2C23A;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        }
        .lang-switcher a:hover {
            background: #8BAF30;
        }
        a { color: #A2C23A; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="lang-switcher">
            <a href="/privacy-policy">العربية</a>
            <a href="/privacy-policy/en">English</a>
            <a href="/privacy-policy/fr">Français</a>
        </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>

        <h1>Privacy Policy</h1>
        <p class="last-updated">Last Updated: ${new Date().toLocaleDateString('en-US')}</p>

        <h2>1. Introduction</h2>
        <p>At Ammerli, we are committed to protecting your privacy and the security of your personal information. This policy explains how we collect, use, protect, and share your personal data when you use our platform.</p>
        <p>By using the platform, you agree to our privacy practices as described in this policy.</p>

        <h2>2. Information We Collect</h2>
        
        <h3>2.1 Personal Information</h3>
        <p>We collect the following information when you register or use the platform:</p>
        <ul>
            <li><strong>Account Information:</strong> Name, phone number, email, password.</li>
            <li><strong>Company Information:</strong> Company name, commercial register, business address.</li>
            <li><strong>Delivery Information:</strong> Addresses, state, municipality, contact information.</li>
            <li><strong>Payment Information:</strong> Payment details (securely processed via Chargily).</li>
        </ul>

        <h3>2.2 Technical Information</h3>
        <ul>
            <li><strong>Device Data:</strong> Device type, operating system, version, unique device identifier.</li>
            <li><strong>Usage Data:</strong> Browsing history, pages visited, time spent, clicks.</li>
            <li><strong>Location Data:</strong> IP address, approximate location (when permission granted).</li>
            <li><strong>FCM Tokens:</strong> Firebase Cloud Messaging tokens for push notifications.</li>
        </ul>

        <h3>2.3 Commercial Information</h3>
        <ul>
            <li>Order and transaction details.</li>
            <li>Commercial records and invoices.</li>
            <li>Reviews and ratings.</li>
            <li>Customer service conversations.</li>
        </ul>

        <div class="important">
            <h2>3. Payment Processing via Chargily</h2>
            <p>When using electronic payment services:</p>
            <ul>
                <li>Payments are processed by Chargily Pay, a licensed and authorized payment service provider.</li>
                <li>We do not store or retain your bank card details.</li>
                <li>Payment information is transmitted directly to Chargily via encrypted connection.</li>
                <li>Your transactions are subject to Chargily's privacy policy and PCI DSS security standards.</li>
                <li>We only receive payment confirmation and transaction status without card details.</li>
            </ul>
        </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>

        <h2>4. Firebase Cloud Messaging (FCM)</h2>
        <p>We use FCM to send push notifications:</p>
        <ul>
            <li>We collect FCM tokens for registered devices.</li>
            <li>We send notifications about order and payment status.</li>
            <li>We send alerts about product expiration.</li>
            <li>You can disable notifications from device settings at any time.</li>
            <li>FCM is subject to Google's privacy policy.</li>
        </ul>

        <h2>5. How We Use Your Information</h2>
        <ul>
            <li>Create and manage your account.</li>
            <li>Process orders and payments.</li>
            <li>Deliver products and track shipments.</li>
            <li>Issue invoices and reports.</li>
            <li>Send order notifications and status updates.</li>
            <li>Respond to your inquiries and support requests.</li>
            <li>Improve platform performance and develop new features.</li>
            <li>Protect against fraud and comply with legal obligations.</li>
        </ul>

        <h2>6. Data Security</h2>
        <p>We take the following measures to protect your information:</p>
        <ul>
            <li><strong>Encryption:</strong> Using HTTPS/SSL to encrypt data in transit.</li>
            <li><strong>Password Encryption:</strong> Using Argon2 algorithm.</li>
            <li><strong>Two-Factor Authentication:</strong> Via OTP for secure access.</li>
            <li><strong>Access Control:</strong> Role-based permission system.</li>
            <li><strong>Backup:</strong> Regular data backups.</li>
            <li><strong>Monitoring:</strong> Continuous monitoring for suspicious activities.</li>
        </ul>

        <h2>7. Your Rights</h2>
        <p>You have the following rights regarding your personal information:</p>
        <ul>
            <li><strong>Access:</strong> Request a copy of your personal data.</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information.</li>
            <li><strong>Deletion:</strong> Request deletion of your data (subject to legal obligations).</li>
            <li><strong>Restriction:</strong> Request restriction of data processing.</li>
            <li><strong>Objection:</strong> Object to processing of your data for specific purposes.</li>
            <li><strong>Portability:</strong> Obtain your data in a portable format.</li>
        </ul>
        <p>To exercise these rights, please contact us at: contact@amerli.dz</p>

        <h2>8. Google Play Console Compliance</h2>
        <p>Ammerli platform complies with all Google Play Console privacy requirements:</p>
        <ul>
            <li>Full disclosure of all collected data and its use.</li>
            <li>Request only necessary permissions with clear explanations.</li>
            <li>Provide secure methods for data transfer and storage.</li>
            <li>No selling of personal data to third parties.</li>
            <li>Respect user choices regarding data sharing.</li>
        </ul>

        <h2>9. Children's Privacy</h2>
        <ul>
            <li>Our platform is not intended for persons under 18 years old.</li>
            <li>We do not knowingly collect information from children.</li>
            <li>If we learn of collecting a child's data, we will delete it immediately.</li>
        </ul>

        <h2>10. Policy Updates</h2>
        <ul>
            <li>We may update this policy from time to time.</li>
            <li>We will notify you of material changes via email or platform notification.</li>
            <li>Continued use of the platform after updates means acceptance.</li>
        </ul>

        <div class="contact">
            <h2>11. Contact Us</h2>
            <p>If you have questions or concerns about your privacy or this policy, please contact us:</p>
            <ul>
                <li><strong>Email:</strong> contact@amerli.dz</li>
                <li><strong>Phone:</strong> +213 550 123 456</li>
                <li><strong>Address:</strong> 12 Rue des Frères Boukhalfa, Hydra, Alger, Algérie</li>
            </ul>
            <p><strong>Data Protection Officer:</strong> privacy@Ammerli.com</p>
        </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #7f8c8d;">
            © ${new Date().getFullYear()} Ammerli. All Rights Reserved.
        </p>
    </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>
</body>
</html>
    `;
  }

  private getPrivacyFr(): string {
    return `
<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Politique de Confidentialité - Ammerli</title>
    <style>
        .logo { text-align: center; margin-bottom: 30px; }
        .logo img { max-width: 150px; height: auto; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.8;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #04272D;
            margin-bottom: 10px;
            font-size: 2.5em;
            border-bottom: 3px solid #A2C23A;
            padding-bottom: 15px;
        }
        h2 {
            color: #1A4D52;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.8em;
        }
        h3 {
            color: #555;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 1.3em;
        }
        p, li {
            margin-bottom: 12px;
            text-align: justify;
        }
        ul, ol {
            margin-left: 30px;
            margin-bottom: 20px;
        }
        .last-updated {
            color: #7f8c8d;
            font-style: italic;
            margin-bottom: 30px;
        }
        .important {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .contact {
            background: #e8f4f8;
            padding: 20px;
            border-radius: 5px;
            margin-top: 30px;
        }
        .lang-switcher {
            text-align: center;
            margin-bottom: 20px;
        }
        .lang-switcher a {
            margin: 0 10px;
            padding: 8px 16px;
            background: #A2C23A;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        }
        .lang-switcher a:hover {
            background: #8BAF30;
        }
        a { color: #A2C23A; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="lang-switcher">
            <a href="/privacy-policy">العربية</a>
            <a href="/privacy-policy/en">English</a>
            <a href="/privacy-policy/fr">Français</a>
        </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>

        <h1>Politique de Confidentialité</h1>
        <p class="last-updated">Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR')}</p>

        <h2>1. Introduction</h2>
        <p>Chez Ammerli, nous nous engageons à protéger votre vie privée et la sécurité de vos informations personnelles. Cette politique explique comment nous collectons, utilisons, protégeons et partageons vos données personnelles lorsque vous utilisez notre plateforme.</p>
        <p>En utilisant la plateforme, vous acceptez nos pratiques de confidentialité telles que décrites dans cette politique.</p>

        <h2>2. Informations que Nous Collectons</h2>
        
        <h3>2.1 Informations Personnelles</h3>
        <p>Nous collectons les informations suivantes lors de l'inscription ou de l'utilisation de la plateforme :</p>
        <ul>
            <li><strong>Informations de Compte :</strong> Nom, numéro de téléphone, e-mail, mot de passe.</li>
            <li><strong>Informations de l'Entreprise :</strong> Nom de l'entreprise, registre de commerce, adresse commerciale.</li>
            <li><strong>Informations de Livraison :</strong> Adresses, état, municipalité, coordonnées.</li>
            <li><strong>Informations de Paiement :</strong> Détails de paiement (traités de manière sécurisée via Chargily).</li>
        </ul>

        <h3>2.2 Informations Techniques</h3>
        <ul>
            <li><strong>Données de l'Appareil :</strong> Type d'appareil, système d'exploitation, version, identifiant unique de l'appareil.</li>
            <li><strong>Données d'Utilisation :</strong> Historique de navigation, pages visitées, temps passé, clics.</li>
            <li><strong>Données de Localisation :</strong> Adresse IP, localisation approximative (avec autorisation).</li>
            <li><strong>Tokens FCM :</strong> Tokens Firebase Cloud Messaging pour les notifications push.</li>
        </ul>

        <h3>2.3 Informations Commerciales</h3>
        <ul>
            <li>Détails des commandes et des transactions.</li>
            <li>Dossiers commerciaux et factures.</li>
            <li>Avis et évaluations.</li>
            <li>Conversations avec le service client.</li>
        </ul>

        <div class="important">
            <h2>3. Traitement des Paiements via Chargily</h2>
            <p>Lors de l'utilisation des services de paiement électronique :</p>
            <ul>
                <li>Les paiements sont traités par Chargily Pay, un fournisseur de services de paiement agréé et autorisé.</li>
                <li>Nous ne stockons ni ne conservons les détails de votre carte bancaire.</li>
                <li>Les informations de paiement sont transmises directement à Chargily via une connexion cryptée.</li>
                <li>Vos transactions sont soumises à la politique de confidentialité de Chargily et aux normes de sécurité PCI DSS.</li>
                <li>Nous recevons uniquement la confirmation de paiement et l'état de la transaction sans les détails de la carte.</li>
            </ul>
        </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>

        <h2>4. Firebase Cloud Messaging (FCM)</h2>
        <p>Nous utilisons FCM pour envoyer des notifications push :</p>
        <ul>
            <li>Nous collectons des tokens FCM pour les appareils enregistrés.</li>
            <li>Nous envoyons des notifications sur l'état des commandes et des paiements.</li>
            <li>Nous envoyons des alertes sur l'expiration des produits.</li>
            <li>Vous pouvez désactiver les notifications depuis les paramètres de l'appareil à tout moment.</li>
            <li>FCM est soumis à la politique de confidentialité de Google.</li>
        </ul>

        <h2>5. Comment Nous Utilisons Vos Informations</h2>
        <ul>
            <li>Créer et gérer votre compte.</li>
            <li>Traiter les commandes et les paiements.</li>
            <li>Livrer les produits et suivre les expéditions.</li>
            <li>Émettre des factures et des rapports.</li>
            <li>Envoyer des notifications de commande et des mises à jour d'état.</li>
            <li>Répondre à vos demandes et demandes de support.</li>
            <li>Améliorer les performances de la plateforme et développer de nouvelles fonctionnalités.</li>
            <li>Protéger contre la fraude et se conformer aux obligations légales.</li>
        </ul>

        <h2>6. Sécurité des Données</h2>
        <p>Nous prenons les mesures suivantes pour protéger vos informations :</p>
        <ul>
            <li><strong>Cryptage :</strong> Utilisation de HTTPS/SSL pour crypter les données en transit.</li>
            <li><strong>Cryptage des Mots de Passe :</strong> Utilisation de l'algorithme Argon2.</li>
            <li><strong>Authentification à Deux Facteurs :</strong> Via OTP pour un accès sécurisé.</li>
            <li><strong>Contrôle d'Accès :</strong> Système de permissions basé sur les rôles.</li>
            <li><strong>Sauvegarde :</strong> Sauvegardes régulières des données.</li>
            <li><strong>Surveillance :</strong> Surveillance continue pour détecter les activités suspectes.</li>
        </ul>

        <h2>7. Vos Droits</h2>
        <p>Vous avez les droits suivants concernant vos informations personnelles :</p>
        <ul>
            <li><strong>Accès :</strong> Demander une copie de vos données personnelles.</li>
            <li><strong>Correction :</strong> Mettre à jour ou corriger des informations inexactes.</li>
            <li><strong>Suppression :</strong> Demander la suppression de vos données (sous réserve d'obligations légales).</li>
            <li><strong>Restriction :</strong> Demander la restriction du traitement des données.</li>
            <li><strong>Opposition :</strong> S'opposer au traitement de vos données à des fins spécifiques.</li>
            <li><strong>Portabilité :</strong> Obtenir vos données dans un format portable.</li>
        </ul>
        <p>Pour exercer ces droits, veuillez nous contacter à : contact@amerli.dz</p>

        <h2>8. Conformité avec Google Play Console</h2>
        <p>La plateforme Ammerli est conforme à toutes les exigences de confidentialité de Google Play Console :</p>
        <ul>
            <li>Divulgation complète de toutes les données collectées et de leur utilisation.</li>
            <li>Demander uniquement les autorisations nécessaires avec des explications claires.</li>
            <li>Fournir des méthodes sécurisées pour le transfert et le stockage des données.</li>
            <li>Aucune vente de données personnelles à des tiers.</li>
            <li>Respecter les choix des utilisateurs concernant le partage des données.</li>
        </ul>

        <h2>9. Confidentialité des Enfants</h2>
        <ul>
            <li>Notre plateforme n'est pas destinée aux personnes de moins de 18 ans.</li>
            <li>Nous ne collectons pas sciemment d'informations auprès des enfants.</li>
            <li>Si nous apprenons avoir collecté des données d'un enfant, nous les supprimerons immédiatement.</li>
        </ul>

        <h2>10. Mises à Jour de la Politique</h2>
        <ul>
            <li>Nous pouvons mettre à jour cette politique de temps à autre.</li>
            <li>Nous vous informerons des changements importants par e-mail ou notification sur la plateforme.</li>
            <li>L'utilisation continue de la plateforme après les mises à jour signifie l'acceptation.</li>
        </ul>

        <div class="contact">
            <h2>11. Nous Contacter</h2>
            <p>Si vous avez des questions ou des préoccupations concernant votre vie privée ou cette politique, veuillez nous contacter :</p>
            <ul>
                <li><strong>E-mail :</strong> contact@amerli.dz</li>
                <li><strong>Téléphone :</strong> +213 550 123 456</li>
                <li><strong>Adresse :</strong> 12 Rue des Frères Boukhalfa, Hydra, Alger, Algérie</li>
            </ul>
            <p><strong>Délégué à la Protection des Données :</strong> privacy@Ammerli.com</p>
        </div>

        <div class="logo">
            <img src="/public/assets/logo.png" alt="Ammerli Logo">
        </div>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #7f8c8d;">
            © ${new Date().getFullYear()} Ammerli. Tous droits réservés.
        </p>
    </div>

</body>
</html>
    `;
  }
}
