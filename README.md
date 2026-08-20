[ 🇬🇧 English ](#-english) | [ 🇮🇷 فارسی ](#-فارسی) | [ 🇸🇦 العربية ](#-العربية)

---

# 🇬🇧 English

## SubGame Lab 🎮🎬
> The Next-Gen AI Studio for Cinema Subtitle & Video Game Localization

### 🌐 Links & Project Identity
*   **App Name**: SubGame Lab
*   **Tagline**: The Next-Gen AI Studio for Cinema Subtitle & Video Game Localization
*   **GitHub Repository**: [github.com/gguhfhu7-sketch/SubGame-Lab](https://github.com/gguhfhu7-sketch/SubGame-Lab)
*   **Live Online Demo**: [subgame-lab-production.up.railway.app](https://subgame-lab-production.up.railway.app/)
*   **Local Dev URL**: `http://localhost:3000`
*   **Official Telegram Community & Announcements**: [t.me/MySaeedLab](https://t.me/MySaeedLab)

---

### 1. Project Overview & Mission
**SubGame Lab** is an all-in-one, high-performance AI studio built with **React 18, TypeScript, Vite, Tailwind CSS, TanStack Virtual, SheetJS, and @google/genai SDK**. Designed specifically for professional cinema subtitle editing and video game dialogue localization, this platform offers translators, localizers, and developers an elite interface to transcribe, translate, style, and synchronize multilingual content seamlessly without schema distortion or performance issues.

---

### 2. Dual Engine Architecture

#### A. Cinema Studio (Subtitle Engine)
Our Cinema Studio provides precision-crafted tools for modern subtitle editing:
*   **Formats**: Native support for `.srt`, `.vtt`, and `.ass` with millisecond-precise timecode accuracy.
*   **AI Video-to-Subtitle**: Automatically extract spoken dialogue and generate timestamps directly from audio/video files (MP4, MKV, WebM) via Gemini Multimodal capabilities.
*   **Bilingual Subtitles**: Merge source and target texts with complete layout and positioning control (Top/Bottom), custom line separators (`\n`, `-`, `|`), bracket enclosing, and ASS/HTML color styling.
*   **Synchronized Live Video Player**: A real-time video player fully synchronized with active subtitle lines, featuring clickable timestamp seeking and a customizable overlay box for visual inspection.
*   **Bulk Time-Shifting**: Instantly shift timestamps (+/- ms) in bulk to fix sync delays across the entire file.

#### B. Game Localization Engine
Specifically tailored to handle complex, non-linear video game dialogue structures:
*   **Formats**: Native support for `.xlsx` (Excel), `.csv`, `.json`, and `.txt` files.
*   **Dynamic Column Mapping**: Interactively map ID/Key, Source Text, and Target Text columns on-the-fly, ensuring zero schema distortion.
*   **Variable & Code Protection Engine**: Advanced RegEx masking for game variables, codes, escape characters, and formatting tags (e.g., `{player}`, `%s`, `\n`, `<color=...>`, BBCode, Markdown) prior to LLM translation, perfectly restoring them post-translation to prevent game crashes.

---

### 3. AI Core & Resilience Features
*   **AI Models**: Powered by the state-of-the-art primary model `gemini-3.6-flash`, with an automated, resilient fallback to `gemini-2.5-flash` in case of service interruptions.
*   **BYOK Multi-Key API Rotation**: Bring Your Own Key (BYOK) system supporting multiple API keys entered line-by-line, automatically rotating keys upon encountering HTTP 429 Rate Limits to ensure continuous batch operations.
*   **Tone & Custom Prompts**: Supports over 50 languages, predefined localization tones (Cinematic, Formal, Gaming Lore, Colloquial), and full support for Custom Tones / System Prompts.
*   **Glossary Dictionary**: Custom dictionary to enforce locked terminology, item names, and character lore across translations.
*   **Virtualized Performance**: Powered by `@tanstack/react-virtual` to render 50,000+ rows smoothly at 60 FPS without UI freezing.
*   **RTL Punctuation Fix**: Automated inversion and correction of brackets, parentheses, quotes, and punctuation for Persian and Arabic to ensure correct RTL rendering.

---

### 4. Critical Network & API Key Guidelines (Iran & Restricted Regions)
Due to geographical restrictions on Google AI services, please adhere to these guidelines:
*   **API Key Creation**: Users **MUST** use a high-quality VPN when creating API keys on Google AI Studio ([aistudio.google.com](https://aistudio.google.com)) to bypass geo-restrictions.
*   **Online Version (Railway)**: A VPN is **NOT required** while using the live online demo after entering your API keys, as requests route through Railway servers.
*   **Local Version (localhost:3000)**: Requires an active VPN with **TUN Mode** enabled to successfully route Node.js traffic past restrictions.
*   **Multi-Key Best Practice**: Users handling large translation tasks **MUST** supply multiple API keys (one per line) to avoid hitting free-tier Rate Limits.

---

### 5. Self-Hosting Guide: Railway Deployment (Step-by-Step)
Deploy your own instance on Railway in minutes:
1.  **Fork the repo**: Fork [github.com/gguhfhu7-sketch/SubGame-Lab](https://github.com/gguhfhu7-sketch/SubGame-Lab).
2.  **Log in to Railway**: Sign up or log in to [railway.com](https://railway.com) using your GitHub account.
3.  **New Project**: Click **"New Project"** -> **"Deploy from GitHub repo"** -> Select your forked `SubGame-Lab` repo.
4.  **Wait for Deployment**: Wait for the build and deployment process to finish.
5.  **Generate Domain**: Go to **Project Settings** -> **Networking** -> Click **"Generate Domain"** to obtain your free live URL.

---

### 6. Local Setup Instructions
To run the application locally on your machine:
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/gguhfhu7-sketch/SubGame-Lab.git
    cd SubGame-Lab
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start development server**:
    ```bash
    npm run dev
    ```
4.  **Open browser**: Open [http://localhost:3000](http://localhost:3000) to view the app.
*(Note: Make sure your VPN has TUN Mode enabled if you are in a restricted region like Iran to route local API requests properly)*.

---

# 🇮🇷 فارسی

## ساب‌گیم لب (SubGame Lab) 🎮🎬
> استودیو نسل جدید هوش مصنوعی برای ویرایش زیرنویس سینما و بومی‌سازی بازی‌های ویدئویی

### 🌐 لینک‌ها و هویت پروژه
*   **نام برنامه**: SubGame Lab
*   **شعار**: استودیو نسل جدید هوش مصنوعی برای ویرایش زیرنویس سینما و بومی‌سازی بازی‌های ویدئویی
*   **مخزن گیت‌هاب**: [github.com/gguhfhu7-sketch/SubGame-Lab](https://github.com/gguhfhu7-sketch/SubGame-Lab)
*   **دمو آنلاین و زنده**: [subgame-lab-production.up.railway.app](https://subgame-lab-production.up.railway.app/)
*   **آدرس توسعه محلی**: `http://localhost:3000`
*   **جامعه و کانال تلگرام رسمی**: [t.me/MySaeedLab](https://t.me/MySaeedLab)

---

### ۱. بررسی اجمالی پروژه و مأموریت
پروژه **SubGame Lab** یک استودیوی همه‌کاره و قدرتمند مبتنی بر هوش مصنوعی است که با آخرین فناوری‌های روز توسعه یافته است: **React 18، TypeScript، Vite، Tailwind CSS، TanStack Virtual، SheetJS** و SDK رسمی **@google/genai**. این پلتفرم به طور ویژه برای ویرایش زیرنویس‌های سینمایی و بومی‌سازی دیالوگ‌های بازی‌های ویدئویی طراحی شده است تا چالش‌های مترجمان، بومی‌سازان و تولیدکنندگان محتوا را برطرف کند. با استفاده از این ابزار می‌توانید محتوای چندرسانه‌ای خود را با سرعت، دقت بالا و کارایی فوق‌العاده پیاده‌سازی، ترجمه و هماهنگ کنید.

---

### ۲. معماری موتور دوگانه (Dual Engine)

#### الف. استودیو سینما (موتور زیرنویس - Cinema Studio)
ابزارهای دقیق و حرفه‌ای برای ویرایش زیرنویس‌های مدرن:
*   **فرمت‌ها**: سازگاری کامل با فرمت‌های `.srt`، `.vtt` و `.ass` با دقت میلی‌ثانیه‌ای در برچسب‌های زمانی.
*   **استخراج هوشمند زیرنویس از ویدیو (AI Video-to-Subtitle)**: استخراج دیالوگ‌های گفتاری از فایل‌های صوتی و ویدیویی (MP4، MKV، WebM) و تولید خودکار زمان‌بندی با بهره‌گیری از قابلیت‌های چندوجهی (Multimodal) مدل هوش مصنوعی Gemini.
*   **زیرنویس‌های دو زبانه (بای‌لینگوال)**: ترکیب و ادغام متون مبدأ و مقصد به همراه کنترل موقعیت نمایش (بالا/پایین)، جداکننده‌های خطوط سفارشی (`\n`، `-`، `|`)، قرار دادن متون داخل پرانتز/براکت و استایل‌دهی رنگی HTML و ASS.
*   **پخش‌کننده ویدیویی زنده و همگام**: پخش‌کننده زنده و همگام‌سازی‌شده با خطوط زیرنویس، امکان پرش زمانی (Seeking) با کلیک روی زمان‌ها و کادر پیش‌نمایش سفارشی.
*   **انتقال زمانی گروهی (Bulk Time-Shifting)**: جابه‌جایی گروهی زمان‌بندی‌ها (مثبت/منفی به میلی‌ثانیه) جهت رفع سریع عدم هماهنگی در کل فایل زیرنویس.

#### ب. موتور بومی‌سازی بازی (Game Localization Engine)
طراحی‌شده برای مدیریت ساختارهای پیچیده و غیرخطی دیالوگ‌های بازی‌های ویدئویی:
*   **فرمت‌ها**: پشتیبانی کامل از فایل‌های `.xlsx` (اکسل)، `.csv`، `.json` و `.txt`.
*   **نگاشت پویا ستون‌ها (Dynamic Column Mapping)**: امکان نگاشت تعاملی ستون‌های شناسه/کلید (ID/Key)، متن مبدأ (Source Text) و متن مقصد (Target Text) بدون هیچ‌گونه به‌هم‌ریختگی در ساختار و شِمای فایل‌های داده.
*   **موتور محافظت از کدها و متغیرها**: استفاده از ماسک‌های پیشرفته RegEx برای محافظت از متغیرهای بازی، کاراکترهای گریز (Escape)، تگ‌های قالب‌بندی و کدهای توسعه‌دهنده (مانند `{player}`، `%s`، `\n`، `<color=...>`، BBCode، Markdown) پیش از ارسال به هوش مصنوعی برای ترجمه و بازگردانی دقیق آن‌ها پس از ترجمه جهت جلوگیری از کرش کردن بازی.

---

### ۳. هسته هوش مصنوعی و ویژگی‌های پایداری (Resilience)
*   **مدل‌های هوش مصنوعی**: استفاده از مدل پیشرفته و قدرتمند `gemini-3.6-flash` به عنوان موتور اصلی، همراه با سیستم پشتیبان خودکار (Fallback) به مدل `gemini-2.5-flash` در صورت بروز هرگونه اختلال.
*   **چرخش خودکار کلیدها (BYOK Multi-Key API Rotation)**: پشتیبانی از وارد کردن چندین کلید API (هر کلید در یک خط). سیستم به طور خودکار در صورت مواجهه با محدودیت نرخ درخواست (خطای HTTP 429)، کلیدها را چرخاند و عملیات ترجمه را بدون توقف ادامه می‌دهد.
*   **لحن‌ها و پرامپت‌های سفارشی**: پشتیبانی از بیش از ۵۰ زبان زنده دنیا، لحن‌های پیش‌فرض بومی‌سازی (سینمایی، رسمی، افسانه‌سرایی بازی، عامیانه) و پشتیبانی کامل از پرامپت‌های سیستم و لحن‌های سفارشی کاربر.
*   **فرهنگ لغت واژگان (Glossary)**: امکان تعریف دیکشنری سفارشی برای قفل کردن اصطلاحات خاص، نام آیتم‌ها، نام شخصیت‌ها و حفظ یکپارچگی داستان بازی.
*   **عملکرد فوق‌العاده با مجازی‌سازی**: بهره‌گیری از کتابخانه `@tanstack/react-virtual` جهت رندر روان و بدون لگ بیش از ۵۰,۰۰۰ ردیف داده با نرخ ۶۰ فریم بر ثانیه.
*   **اصلاح علائم نگارشی راست‌به‌چپ (RTL Punctuation Fix)**: اصلاح و برعکس‌سازی خودکار پرانتزها، براکت‌ها، نقل‌قول‌ها و علائم نگارشی برای زبان‌های فارسی و عربی جهت نمایش صحیح در محیط‌های راست‌به‌چپ.

---

### ۴. دستورالعمل‌های حیاتی شبکه و کلیدهای API (مخصوص ایران و مناطق تحریم‌شده)
به دلیل محدودیت‌های جغرافیایی اعمال‌شده روی خدمات هوش مصنوعی گوگل، لطفاً نکات زیر را به دقت رعایت فرمایید:
*   **ساخت کلید API**: کاربران **باید** هنگام ساخت کلیدهای API در وب‌سایت گوگل آی‌آی استودیو ([aistudio.google.com](https://aistudio.google.com)) از یک ابزار تغییر آی‌پی (VPN) باکیفیت استفاده کنند.
*   **نسخه آنلاین (روی Railway)**: هنگام استفاده از دمو زنده روی سرورهای Railway نیازی به روشن بودن VPN نیست؛ زیرا درخواست‌های ترجمه مستقیماً از طریق سرورهای Railway ارسال و به سمت گوگل هدایت می‌شوند.
*   **نسخه محلی (localhost:3000)**: برای اجرای محلی، حتماً باید از یک VPN با قابلیت **TUN Mode** فعال استفاده کنید تا ترافیک Node.js به درستی هدایت شده و از سد محدودیت‌ها بگذرد.
*   **استفاده از چند کلید (بهترین راهکار)**: برای پروژه‌های ترجمه بزرگ، کاربران **باید** چندین کلید API (هر کدام در یک خط) وارد کنند تا از محدودیت‌های رایگان لیمیت نرخ درخواست (Rate Limit) عبور کنند.

---

### ۵. راهنمای میزبانی شخصی: استقرار در Railway (گام‌به‌گام)
می‌توانید در عرض چند دقیقه نسخه اختصاصی خود را روی Railway مستقر کنید:
1.  **فورک کردن مخزن**: مخزن [github.com/gguhfhu7-sketch/SubGame-Lab](https://github.com/gguhfhu7-sketch/SubGame-Lab) را فورک کنید.
2.  **ثبت‌نام در Railway**: با حساب کاربری گیت‌هاب خود وارد سایت [railway.com](https://railway.com) شوید.
3.  **پروژه جدید**: روی دکمه **"New Project"** کلیک کرده و گزینه **"Deploy from GitHub repo"** را انتخاب نمایید. سپس مخزن فورک‌شده‌ی `SubGame-Lab` را انتخاب کنید.
4.  **صبر برای ساخت**: منتظر بمانید تا فرآیند ساخت و استقرار به طور خودکار به پایان برسد.
5.  **تولید دامنه**: به بخش **Project Settings** -> **Networking** بروید و روی **"Generate Domain"** کلیک کنید تا آدرس زنده و رایگان خود را دریافت نمایید.

---

### ۶. دستورالعمل راه‌اندازی محلی (Local)
برای اجرای برنامه به صورت محلی روی سیستم خود مراحل زیر را دنبال کنید:
1.  **کلون کردن مخزن گیت‌هاب**:
    ```bash
    git clone https://github.com/gguhfhu7-sketch/SubGame-Lab.git
    cd SubGame-Lab
    ```
2.  **نصب پکیج‌ها و وابستگی‌ها**:
    ```bash
    npm install
    ```
3.  **اجرای سرور توسعه محلی**:
    ```bash
    npm run dev
    ```
4.  **باز کردن مرورگر**: مرورگر خود را باز کرده و به آدرس [http://localhost:3000](http://localhost:3000) مراجعه فرمایید.
*(توجه: در صورتی که در ایران هستید، برای ارسال موفق درخواست‌ها به سرور گوگل، حتماً پیش از اجرای برنامه، VPN خود را روی حالت TUN Mode فعال نمایید)*.

---

# 🇸🇦 العربية

## مختبر ساب‌جيم (SubGame Lab) 🎮🎬
> استوديو الجيل القادم الذكي القائم على الذكاء الاصطناعي لتحرير ترجمات السينما وتوطين ألعاب الفيديو

### 🌐 الروابط وهوية المشروع
*   **اسم التطبيق**: SubGame Lab
*   **الشعار**: استوديو الجيل القادم الذكي القائم على الذكاء الاصطناعي لتحرير ترجمات السينما وتوطين ألعاب الفيديو
*   **مستودع جيت هاب**: [github.com/gguhfhu7-sketch/SubGame-Lab](https://github.com/gguhfhu7-sketch/SubGame-Lab)
*   **العرض التجريبي المباشر**: [subgame-lab-production.up.railway.app](https://subgame-lab-production.up.railway.app/)
*   **رابط التطوير المحلي**: `http://localhost:3000`
*   **مجتمع وقناة تليجرام الرسمية**: [t.me/MySaeedLab](https://t.me/MySaeedLab)

---

### ١. نظرة عامة على المشروع ورسالته
يعتبر **SubGame Lab** استوديو متكامل يعمل بالذكاء الاصطناعي وتم بناؤه باستخدام أحدث التقنيات البرمجية: **React 18، TypeScript، Vite، Tailwind CSS، TanStack Virtual، SheetJS**، وحزمة التطوير الرسمية **@google/genai SDK**. تم تصميم هذا المشروع خصيصاً لتلبية احتياجات تحرير وتعديل ترجمات الأفلام السينمائية وتوطين حوارات ألعاب الفيديو، مما يسهل سير عمل المترجمين والمطورين ومنشئي المحتوى. توفر هذه المنصة واجهة ويب احترافية فائقة الأداء لتفريغ النصوص، وترجمتها، وتنسيقها، ومزامنتها بكل سهولة وبدون حدوث أي تشويه في بنية البيانات.

---

### ٢. بنية المحرك المزدوج (Dual Engine)

#### أ. استوديو السينما (محرك الترجمة المرئية - Cinema Studio)
أدوات متطورة ومصممة بدقة لتعديل الترجمات الحديثة:
*   **تنسيقات الملفات**: دعم أصيل لصيغ `.srt` و `.vtt` و `.ass` بدقة متناهية تصل إلى جزء من الألف من الثانية.
*   **تحويل الفيديو إلى ترجمة مرئية بالذكاء الاصطناعي**: استخراج الحوارات المنطوقة من ملفات الفيديو والصوت (MP4، MKV، WebM) وتوليد التوقيتات تلقائياً عبر قدرات Gemini متعددة الوسائط (Multimodal).
*   **ترجمات ثنائية اللغة**: دمج متون اللغة المصدر واللغة المستهدفة مع التحكم الكامل في الموضع (أعلى/أسفل)، وتخصيص فواصل الأسطر (`\n`، `-`، `|`)، وإحاطة النصوص بالأقواس، وتنسيق الألوان البرمجية بصيغ HTML و ASS.
*   **مشغل فيديو حي متزامن**: مشغل فيديو مباشر متزامن بالكامل مع أسطر الترجمة، يدعم الانتقال الزمني بمجرد النقر على الطوابع الزمنية، مع صندوق معاينة مخصص للتحقق البصري.
*   **الإزاحة الزمنية الجماعية (Bulk Time-Shifting)**: إزاحة الطوابع الزمنية (+/- ميلي ثانية) لجميع الأسطر دفعة واحدة لإصلاح مشكلات المزامنة وتأخر الترجمة.

#### ب. محرك توطين الألعاب (Game Localization Engine)
مصمم للتعامل مع هياكل النصوص والسيناريوهات المعقدة وغير الخطية لألعاب الفيديو:
*   **تنسيقات الملفات**: دعم ملفات `.xlsx` (إكسل)، و `.csv`، و `.json`، و `.txt`.
*   **مطابقة الأعمدة الديناميكية**: تعيين تفاعلي لأعمدة المعرّف (ID/Key)، والنص المصدر (Source Text)، والنص المستهدف (Target Text) دون المساس بهيكل البيانات أو تشويه الملفات والمخططات البرمجية.
*   **محرك حماية المتغيرات والأكواد**: استخدام خوارزميات RegEx المتقدمة لحماية متغيرات اللعبة، ورموز الهروب (Escape Characters)، ووسوم التنسيق (مثل `{player}`، `%s`، `\n`، `<color=...>`، BBCode، Markdown) قبل إرسالها للترجمة بالذكاء الاصطناعي، ثم استعادتها بدقة متناهية بعد الترجمة لضمان عدم تعطل الألعاب بسبب أخطاء الترجمة.

---

### ٣. قدرات الذكاء الاصطناعي وميزات الاستقرار (Resilience)
*   **نماذج الذكاء الاصطناعي**: استخدام النموذج الرائد `gemini-3.6-flash` كمحرك أساسي، مع تفعيل نظام الرجوع التلقائي الاحتياطي (Fallback) إلى نموذج `gemini-2.5-flash` في حال حدوث أي انقطاع بالخدمة.
*   **تدوير المفاتيح التلقائي (BYOK Multi-Key API Rotation)**: نظام إدخال مفاتيح متعددة (كل مفتاح في سطر). يقوم النظام تلقائياً بتدوير المفاتيح وتغييرها عند مواجهة خطأ حد الطلبات HTTP 429 لضمان استمرار عمليات الترجمة الضخمة دون توقف.
*   **نبرة الصوت والبرومبت المخصص**: دعم لأكثر من 50 لغة، وتوفير نبرات توطين جاهزة (سينمائي، رسمي، بيئة ألعاب، عامي)، مع دعم كامل لإضافة نبرات مخصصة أو برومبتات للنظام.
*   **قاموس المصطلحات (Glossary)**: لتأكيد وإلزام الذكاء الاصطناعي بمصطلحات محددة، مثل أسماء الأدوات والشخصيات وعوالم الألعاب للحفاظ على ترابط المحتوى.
*   **أداء فائق بالتقسيم الافتراضي**: مدعوم بتقنية `@tanstack/react-virtual` لعرض أكثر من 50,000 صف من البيانات بسلاسة فائقة وبمعدل 60 إطاراً في الثانية دون تجمد للواجهة.
*   **إصلاح علامات الترقيم للغات راست-تو-ليفت (RTL Punctuation Fix)**: تصحيح تلقائي وعكس اتجاه الأقواس، وعلامات الاقتباس، والنقاط لضمان ظهورها بشكل صحيح في اللغتين العربية والفارسية في البيئات التي تدعم الكتابة من اليمين إلى اليسار.

---

### ٤. إرشادات الشبكة الحيوية ومفاتيح الـ API (لمناطق القيود الجغرافية وإيران)
نظراً للقيود الجغرافية المفروضة على خدمات Google AI، يرجى اتباع الإرشادات التالية بدقة:
*   **إنشاء مفتاح الـ API**: **يجب** على المستخدمين تشغيل خدمة VPN عالية الجودة أثناء إنشاء المفاتيح عبر منصة Google AI Studio ([aistudio.google.com](https://aistudio.google.com)) لتخطي الحظر الجغرافي.
*   **النسخة السحابية (Railway)**: **لا يتطلب** تشغيل الـ VPN أثناء استخدام العرض التجريبي الحي على Railway بعد إدخال المفاتيح الخاصة بك؛ لأن الطلبات تمر مباشرة عبر خوادم Railway السحابية.
*   **النسخة المحلية (localhost:3000)**: تتطلب تشغيل الـ VPN مع تفعيل وضع **TUN Mode** لضمان توجيه حركة مرور ترافيك Node.js وتخطي القيود بنجاح.
*   **أفضل الممارسات للمفاتيح المتعددة**: عند التعامل مع مهام ترجمة ضخمة، **يجب** توفير مفاتيح API متعددة (مفتاح في كل سطر) لتجنب تخطي حدود الاستخدام المجاني (Rate Limits).

---

### ٥. دليل الاستضافة الشخصية: النشر على Railway (خطوة بخطوة)
انشر نسختك الخاصة على خوادم Railway في دقائق معدودة:
1.  **عمل فورك للمستودع**: قم بعمل Fork للمستودع [github.com/gguhfhu7-sketch/SubGame-Lab](https://github.com/gguhfhu7-sketch/SubGame-Lab).
2.  **تسجيل الدخول في Railway**: قم بتسجيل الدخول إلى [railway.com](https://railway.com) باستخدام حساب جيت هاب الخاص بك.
3.  **مشروع جديد**: اضغط على **"New Project"** -> ثم اختر **"Deploy from GitHub repo"** -> حدد مستودع `SubGame-Lab` المنسوخ.
4.  **انتظار البناء**: انتظر حتى تكتمل عملية البناء والتشغيل تلقائياً.
5.  **توليد النطاق**: اذهب إلى **Project Settings** -> **Networking** واضغط على **"Generate Domain"** للحصول على رابط إنترنت حي ومجاني لعملك.

---

### ٦. تعليمات التثبيت والتشغيل المحلي
لتشغيل التطبيق محلياً على جهاز الكمبيوتر الخاص بك، اتبع الخطوات التالية:
1.  **استنساخ المستودع**:
    ```bash
    git clone https://github.com/gguhfhu7-sketch/SubGame-Lab.git
    cd SubGame-Lab
    ```
2.  **تثبيت الحزم والتبعيات**:
    ```bash
    npm install
    ```
3.  **بدء تشغيل خادم التطوير المحلي**:
    ```bash
    npm run dev
    ```
4.  **افتح متصفحك**: اذهب إلى العنوان: [http://localhost:3000](http://localhost:3000).
*(ملاحظة: تأكد من تفعيل وضع TUN Mode في برنامج الـ VPN الخاص بك إذا كنت تعمل من منطقة تخضع لقيود جغرافية لضمان تواصل محلي ناجح مع واجهات جوجل البرمجية)*.
