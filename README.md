# SubGame Lab 🎮🎬

**AI workspace for cinema subtitles and video game localization**  
**استودیوی هوش مصنوعی برای زیرنویس فیلم و بومی‌سازی بازی**  
**استوديو ذكاء اصطناعي لترجمة الأفلام وتوطين الألعاب**

[🇬🇧 English](#english) · [🇮🇷 فارسی](#persian) · [🇸🇦 العربية](#arabic)

[Live demo](https://subgame-lab-production-5e1a.up.railway.app/) · [GitHub](https://github.com/gguhfhu7-sketch/SubGame-Lab) · [Telegram](https://t.me/MySaeedLab)

---

<a id="english"></a>
## 🇬🇧 English

### What's new in this update?

**More provider choice, separate Cinema/Game workspaces, and improvements to translation reliability.**

- **Custom Provider / BYOK:** Gemini is no longer the only option for text translation. Connect an compatible text-generation API using your own Base URL, API Key, and Model ID. If Gemini is unavailable to you, select Custom Provider and continue with a compatible service you can access.
- **Expanded Gemini model catalog:** The application now lists additional Flash options alongside Pro and progressive streaming, with an in-app model guide. The current configured translation default is `gemini-3.8-flash`; see the model list below.
- **Separate Cinema and Game sessions:** Each mode has its own document, file format, translations, and settings. Switching modes saves the current workspace and restores the other, instead of showing a cinema file as a game document.
- **Browser autosave:** Mode sessions are saved locally using IndexedDB/Dexie and loaded again on startup. Autosave is not cloud synchronization or a substitute for exporting backups.
- **UI/UX improvements:** Adjusted header spacing, wrapping, and file-badge visibility to reduce overlap. Translation progress now displays the selected custom provider/model rather than substituting a Gemini label.
- **More robust Custom Provider requests:** Added a translation deadline, response-size limits, bounded concurrency, response validation, request/job identifiers, and timing diagnostics. Permanent errors such as invalid configuration or unauthorized keys no longer follow the same retry path as temporary failures.
- **Cancellation and stale-response checks:** Batch translation uses AbortController and job identity checks; the custom translation backend also responds to client disconnection.
- **File-processing fixes:** Improved SRT/VTT millisecond rounding, timestamp handling, WebVTT metadata/cue settings, ASS event parsing, MicroDVD FPS-header detection on import, nested JSON paths, and JSON target-field selection.
- **Stronger game-variable checks:** The editor checks missing and extra occurrences of recognized placeholders, including repeated variables, instead of checking presence alone.
- **Provider-aware quality review:** Quality auditing supports Custom Provider as well as Gemini and processes the input in smaller groups.

These are changes reflected in the supplied source, not a claim that every issue is fixed or every service/device has been tested. Model availability and performance depend on the provider, account, network, and workload.

### What can you do with SubGame Lab?

**Cinema Mode**

Import `.srt`, `.vtt`, `.ass`, `.ssa`, or `.sub` subtitles; edit source text, translations, and timecodes; translate in batches; create bilingual subtitle output; and preview subtitles over a local video. Gemini-based audio transcription can generate SRT text from media that your browser can decode. File-container and codec compatibility varies by browser.

**Game Mode**

Import `.csv`, `.json`, `.xlsx`, or `.txt` localization files; map source, target, key, and context columns where supported; translate dialogue and UI strings; inspect placeholder warnings; and export supported formats. Review the output against your game's expected schema before shipping, especially for complex workbooks and nested data.

**Shared tools**

Multiple target languages, localization tones, custom instructions, adjustable batch sizes and pacing, multi-key Gemini configuration, search/filtering, find-and-replace, single-line retranslation, virtualized lists, and Persian/Arabic/English interface text. Add terminology rules to the custom prompt when you need consistent character names or vocabulary; model compliance still needs review.

### Using a Custom Provider instead of Gemini

1. Open **API Key** settings and select **Custom Provider**.
2. Enter an optional provider name.
3. Enter the **Base API URL**, including the API version/path supplied by your provider. For example: `https://api.example.com/v1`.
4. Paste your **API Key** and the exact **Model ID** supported by that service.
5. Click **Test Connection**. Resolve any URL, authentication, model, or quota error before translating.
6. Choose a file, target language, and tone, then start translation.

The application uses `POST /chat/completions`, a `messages` array, and `Authorization: Bearer ...`. The model must be able to return the requested JSON translation structure. The endpoint suffix is appended automatically when the supplied URL does not already end in `/chat/completions`.

**Compatibility, not a provider lock-in:** compatible text-generation API from services such as OpenRouter, Groq, DeepSeek, Together, or another API supplier may be usable when they meet this contract. These names are examples, not a tested compatibility matrix. An arbitrary API key alone is not sufficient: the URL, authentication scheme, endpoint, and model must match.

**Important limits:**

- No Gemini key is required for text translation or quality review through a configured Custom Provider. Gemini audio transcription and the Gemini streaming path are separate features; Custom Provider does not automatically replace them.
- Standard Custom Provider translation is batch-based. Selecting the app's Gemini Live Stream option with a custom provider falls back to standard custom translation.
- This version blocks local/private/metadata destinations in Custom Provider validation. A localhost Ollama or LM Studio URL will not work unchanged, even when its API is compatible text-generation API. Do not disable network protections on a public deployment just to connect it.
- Use the direct API endpoint, preferably HTTPS. Translation requests reject redirects. Avoid query-string-based URLs in this version and follow the provider's documented base-path format.
- Connection testing checks basic reachability/authentication/model response; it does not prove that the model will produce valid JSON for every translation batch.
- A different provider is an alternative access route, not a guarantee of free usage, unlimited quota, or exemption from that provider's policies.

### Gemini options configured in the project

| Entry in the app | Configured identifier |
| --- | --- |
| Gemini 3.8 Flash, translation default | `gemini-3.8-flash` |
| Gemini 3.7 Flash | `gemini-3.7-flash` |
| Gemini 3.6 Flash | `gemini-3.6-flash` |
| Gemini 3.5 Flash | `gemini-3.5-flash` |
| Gemini 3.1 Flash Lite | `gemini-3.1-flash-lite` |
| Gemini 3.1 Pro Preview | `gemini-3.1-pro-preview` |
| Gemini Live Stream, application streaming mode | `gemini-live-stream` |
| Audio transcription configuration | `gemini-3.5-transcribe` |

Source of truth: [`src/modelRegistry.ts`](src/modelRegistry.ts). These are identifiers configured in this repository, **not confirmation that Google currently exposes every identifier to every account**. `gemini-live-stream` is an application mode, not a standalone Google API model ID. Verify actual availability with your provider before deployment; update the registry if needed. Fallback attempts do not guarantee uninterrupted service or bypass shared quotas.

### Local setup

Use a current Node.js 22 LTS release and npm.

```bash
git clone https://github.com/gguhfhu7-sketch/SubGame-Lab.git
cd SubGame-Lab
npm install
npm run dev
```

Open `http://localhost:3000`. Configure Gemini or Custom Provider in the app. For an optional server-side Gemini key, create `.env`:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
```

The current server calls `dotenv.config()`, so `.env` is the default file; `.env.local` is not explicitly loaded by that call. Never commit real credentials.

```bash
npm run lint    # TypeScript checking
npm run build   # Frontend + server bundle
npm start       # Production server
```

### Self-hosting, network access, and privacy

For Railway or another Node.js host, connect your repository, install dependencies, build with `npm run build`, and start with `npm start`. Configure environment variables and expose the host-assigned port. Configure a public domain using the hosting dashboard.

API calls are sent by the application server. For a hosted deployment, the server must reach the selected provider; for local development, your local Node.js process must reach it. Proxy/VPN requirements depend on routing and provider restrictions: the hosted demo does not guarantee access in every region. Use services available to you under their terms; multiple keys do not remove provider quotas.

BYOK credentials are stored in browser localStorage and sent to the application backend for provider requests. Workspace sessions are stored in IndexedDB. Use a trusted deployment, avoid saving keys on shared devices, and export important work regularly. Clearing browser site data can remove saved sessions and keys. Before public deployment, review authentication, rate/cost limits, network-egress controls, and privacy requirements; the included safeguards are not a complete security assessment.

**Current stack:** React 19, TypeScript, Vite 6, Tailwind CSS 4, Express, `@google/genai`, TanStack Virtual, Dexie/IndexedDB, ExcelJS, PapaParse, and jschardet. Rendering performance depends on the document and device; no fixed 50,000-row/60-FPS guarantee is claimed.

---

<a id="persian"></a>
## 🇮🇷 فارسی

### در این به‌روزرسانی چه تغییر کرده؟

**انتخاب آزادتر سرویس هوش مصنوعی، محیط مستقل سینما و بازی، و بهبود پایداری ترجمه.**

- **اضافه‌شدن Custom Provider و کلید شخصی (BYOK):** ترجمهٔ متن دیگر فقط به Gemini محدود نیست. با واردکردن آدرس پایه، کلید API و شناسهٔ مدل می‌توانید از سرویس‌های سازگار با compatible text-generation API استفاده کنید. اگر به Gemini دسترسی ندارید، Custom Provider را انتخاب کنید و ترجمه را با سرویس سازگارِ در دسترس خود ادامه دهید.
- **گسترش فهرست مدل‌های Gemini:** گزینه‌های بیشتر Flash در کنار Pro و ترجمهٔ جریانی، همراه با راهنمای مدل‌ها در برنامه قرار گرفته‌اند. پیش‌فرض ترجمه در کد فعلی `gemini-3.8-flash` است؛ فهرست کامل پایین آمده است.
- **استقلال Cinema Mode و Game Mode:** هر مود فایل، فرمت، ترجمه‌ها و تنظیمات خودش را دارد. هنگام جابه‌جایی، وضعیت مود فعلی ذخیره و وضعیت مود مقصد بازیابی می‌شود؛ فایل سینما دیگر صرفاً با تعویض مود به فایل بازی تغییر هویت نمی‌دهد.
- **ذخیرهٔ خودکار محلی:** وضعیت هر مود با IndexedDB و Dexie در مرورگر ذخیره و هنگام بازشدن برنامه بازیابی می‌شود. این قابلیت همگام‌سازی ابری نیست و جای نسخهٔ پشتیبان خروجی را نمی‌گیرد.
- **بهبود رابط و تجربهٔ کاربری:** فاصله‌گذاری هدر، شکستن ردیف کنترل‌ها و نمایش نشان فایل برای کاهش تداخل عناصر تنظیم شده‌اند. نوار پیشرفت نیز نام واقعی سرویس‌دهنده و مدل سفارشی را به‌جای برچسب اشتباه Gemini نمایش می‌دهد.
- **بهبود مدیریت درخواست‌های Custom Provider:** محدودیت زمانی ترجمه، سقف اندازهٔ پاسخ، کنترل درخواست‌های هم‌زمان، اعتبارسنجی پاسخ، شناسهٔ درخواست/عملیات و ثبت زمان مراحل اضافه شده‌اند. خطاهای دائمی مانند تنظیمات نامعتبر یا کلید غیرمجاز، دیگر مثل خطای موقت وارد همان مسیر تکرار نمی‌شوند.
- **کنترل لغو و پاسخ‌های قدیمی:** ترجمهٔ دسته‌ای از AbortController و شناسهٔ عملیات برای کنترل پاسخ‌ها استفاده می‌کند؛ بک‌اند ترجمهٔ سفارشی هم به قطع اتصال کاربر واکنش نشان می‌دهد.
- **اصلاح پردازش فایل‌ها:** گردکردن میلی‌ثانیه در SRT/VTT، مدیریت تایم‌کد، اطلاعات و تنظیمات cue در WebVTT، خواندن رویدادهای ASS، تشخیص هدر FPS در ورودی MicroDVD، مسیرهای تو‌در‌توی JSON و انتخاب فیلد مقصد JSON بهبود یافته‌اند.
- **کنترل دقیق‌تر متغیرهای بازی:** ادیتور تعداد تکرار متغیرهای شناخته‌شده را هم بررسی می‌کند و برای موارد حذف‌شده یا اضافه‌شده هشدار می‌دهد؛ صرفاً وجود یک نمونه از متغیر کافی نیست.
- **بررسی کیفیت با ارائه‌دهندهٔ انتخابی:** ارزیابی کیفیت علاوه بر Gemini از Custom Provider پشتیبانی می‌کند و ورودی را به گروه‌های کوچک‌تر تقسیم می‌کند.

این موارد تغییرات موجود در سورس ارسالی‌اند، نه ادعای رفع تمام باگ‌ها یا تست همهٔ دستگاه‌ها و سرویس‌ها. دسترسی به مدل و سرعت واقعی به ارائه‌دهنده، حساب، شبکه و حجم کار وابسته است.

### امکانات اصلی

**مود سینما**

ورود زیرنویس‌های `.srt`، `.vtt`، `.ass`، `.ssa` و `.sub`؛ ویرایش متن اصلی، ترجمه و زمان‌ها؛ ترجمهٔ دسته‌ای؛ ساخت خروجی دوزبانه و پیش‌نمایش زیرنویس روی ویدیوی محلی. استخراج صوت با Gemini می‌تواند از فایل‌هایی که مرورگر قادر به رمزگشایی آنهاست زیرنویس SRT تولید کند؛ پشتیبانی از ظرف فایل و کدک در مرورگرها یکسان نیست.

**مود بازی**

ورود فایل‌های `.csv`، `.json`، `.xlsx` و `.txt`؛ نگاشت ستون‌های مبدأ، مقصد، شناسه و زمینه در موارد پشتیبانی‌شده؛ ترجمهٔ دیالوگ و متن رابط بازی؛ نمایش هشدار متغیرها و خروجی در فرمت‌های پشتیبانی‌شده. قبل از استفاده در بازی، خروجی را با ساختار موردانتظار موتور بازی تطبیق دهید، مخصوصاً برای اکسل پیچیده و داده‌های تو‌در‌تو.

**ابزارهای مشترک**

زبان‌های مقصد متعدد، لحن ترجمه، دستورالعمل سفارشی، اندازهٔ دسته و فاصلهٔ درخواست قابل‌تنظیم، چند کلید Gemini، جستجو و فیلتر، یافتن و جایگزینی، ترجمهٔ دوبارهٔ تک‌سطر، فهرست مجازی‌سازی‌شده و رابط فارسی، عربی و انگلیسی. برای نام شخصیت‌ها و واژگان ثابت، قواعد اصطلاحات را در پرامپت سفارشی وارد کنید؛ رعایت آنها توسط مدل همچنان نیازمند بازبینی است.

### اگر Gemini در دسترس نبود، چطور از Custom Provider استفاده کنیم؟

1. بخش **کلید API** را باز کنید و **Custom Provider / سرویس‌دهنده سفارشی** را انتخاب کنید.
2. در صورت تمایل نامی برای سرویس‌دهنده بنویسید.
3. **Base API URL** را دقیقاً مطابق مستندات سرویس وارد کنید؛ مسیر نسخهٔ API هم باید درست باشد. نمونه: `https://api.example.com/v1`.
4. **API Key** و **Model ID** واقعی همان سرویس را وارد کنید.
5. **Test Connection / تست اتصال** را بزنید و خطاهای آدرس، احراز هویت، مدل یا سهمیه را برطرف کنید.
6. فایل، زبان مقصد و لحن را انتخاب کنید و ترجمه را شروع کنید.

برنامه از `POST /chat/completions`، آرایهٔ `messages` و احراز هویت `Authorization: Bearer ...` استفاده می‌کند. مدل باید بتواند ساختار JSON درخواست‌شده برای ترجمه را برگرداند. اگر آدرس به `/chat/completions` ختم نشود، این پسوند خودکار اضافه می‌شود.

**محدود به یک فروشنده نیستید:** APIهای سازگار از سرویس‌هایی مثل OpenRouter، Groq، DeepSeek، Together یا فروشندهٔ دیگر، در صورت رعایت این قرارداد قابل استفاده‌اند. این نام‌ها نمونه‌اند، نه فهرست سرویس‌های تست‌شده. «کلید از هرجا» به‌تنهایی کافی نیست؛ آدرس، روش احراز هویت، endpoint و مدل باید با برنامه سازگار باشند.

**نکات مهم:**

- برای ترجمهٔ متن و بررسی کیفیت با Custom Provider تنظیم‌شده، به کلید Gemini نیاز ندارید. استخراج صوت و مسیر پخش جریانی Gemini قابلیت‌های جداگانه‌اند و خودکار به ارائه‌دهندهٔ سفارشی منتقل نمی‌شوند.
- ترجمهٔ استاندارد Custom Provider دسته‌ای است؛ انتخاب Gemini Live Stream همراه با ارائه‌دهندهٔ سفارشی به ترجمهٔ استاندارد سفارشی برمی‌گردد.
- نسخهٔ فعلی آدرس‌های localhost، شبکهٔ خصوصی و سرویس‌های metadata را در اعتبارسنجی مسدود می‌کند. بنابراین Ollama یا LM Studio محلی با همان آدرس localhost کار نمی‌کند، حتی اگر API سازگار داشته باشد. برای اتصال آن، محافظت شبکهٔ نسخهٔ عمومی را بی‌حساب غیرفعال نکنید.
- از آدرس مستقیم API، ترجیحاً HTTPS، استفاده کنید. مسیر ترجمه redirect را قبول نمی‌کند. در این نسخه از آدرس‌های وابسته به query string پرهیز و قالب مسیر پایهٔ اعلام‌شده توسط سرویس را رعایت کنید.
- موفقیت تست اتصال، پاسخ‌گویی اولیهٔ سرویس و مدل را می‌سنجد؛ تضمین نمی‌کند مدل برای هر دسته ترجمه JSON صحیح تولید کند.
- ارائه‌دهندهٔ جایگزین به معنی استفادهٔ رایگان، سهمیهٔ نامحدود یا حذف قوانین آن سرویس نیست.

### مدل‌ها و گزینه‌های Gemini ثبت‌شده در پروژه

| گزینهٔ برنامه | شناسهٔ تنظیم‌شده |
| --- | --- |
| Gemini 3.8 Flash، پیش‌فرض ترجمه | `gemini-3.8-flash` |
| Gemini 3.7 Flash | `gemini-3.7-flash` |
| Gemini 3.6 Flash | `gemini-3.6-flash` |
| Gemini 3.5 Flash | `gemini-3.5-flash` |
| Gemini 3.1 Flash Lite | `gemini-3.1-flash-lite` |
| Gemini 3.1 Pro Preview | `gemini-3.1-pro-preview` |
| Gemini Live Stream، حالت جریانی برنامه | `gemini-live-stream` |
| تنظیم مدل استخراج صوت | `gemini-3.5-transcribe` |

مرجع فهرست: [`src/modelRegistry.ts`](src/modelRegistry.ts). اینها **شناسه‌های ثبت‌شده در سورس‌اند، نه تأیید عرضهٔ فعلی تمام مدل‌ها از طرف گوگل یا دسترسی همهٔ حساب‌ها**. `gemini-live-stream` نام یک حالت داخلی برنامه است، نه شناسهٔ مستقل مدل API گوگل. پیش از استقرار، دسترس‌پذیری واقعی را بررسی و در صورت نیاز registry را اصلاح کنید. Fallback تلاش برای جایگزینی مدل است و ادامهٔ بی‌وقفه یا عبور از سهمیهٔ مشترک را تضمین نمی‌کند.

### راه‌اندازی محلی

از نسخهٔ به‌روز Node.js 22 LTS و npm استفاده کنید:

```bash
git clone https://github.com/gguhfhu7-sketch/SubGame-Lab.git
cd SubGame-Lab
npm install
npm run dev
```

برنامه را در `http://localhost:3000` باز کنید و Gemini یا Custom Provider را از رابط تنظیم کنید. برای کلید اختیاری Gemini در سمت سرور، فایل `.env` بسازید:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
```

سرور فعلی از `dotenv.config()` استفاده می‌کند؛ فایل پیش‌فرض `.env` است و این فراخوانی `.env.local` را صریحاً بارگذاری نمی‌کند. کلید واقعی را داخل مخزن قرار ندهید.

```bash
npm run lint
npm run build
npm start
```

دستور اول بررسی TypeScript، دستور دوم ساخت فرانت‌اند و سرور، و دستور سوم اجرای نسخهٔ ساخته‌شده است.

### میزبانی، شبکه و حریم خصوصی

برای Railway یا میزبان Node.js دیگر، مخزن را متصل کنید، وابستگی‌ها را نصب کنید، دستور ساخت را `npm run build` و اجرای برنامه را `npm start` قرار دهید. متغیرهای محیطی، پورت میزبان و دامنهٔ عمومی را از داشبورد میزبانی تنظیم کنید.

درخواست API از سمت سرور برنامه ارسال می‌شود. در نسخهٔ آنلاین، سرور میزبان باید به سرویس دسترسی داشته باشد؛ در نسخهٔ محلی، پردازش Node.js روی سیستم شما باید به آن برسد. نیاز به پراکسی یا ابزار مسیریابی به محدودیت‌های سرویس و شبکه بستگی دارد؛ دمو آنلاین تضمین دسترسی در همهٔ کشورها نیست. از سرویس‌های در دسترس و مطابق شرایط استفادهٔ آنها بهره ببرید؛ چند کلید، سهمیه‌های سرویس را حذف نمی‌کند.

کلیدهای BYOK در localStorage مرورگر ذخیره و برای درخواست‌ها به بک‌اند برنامه ارسال می‌شوند. نشست‌ها در IndexedDB نگه‌داری می‌شوند. از نسخهٔ میزبانی‌شدهٔ مورداعتماد استفاده کنید، روی دستگاه مشترک کلید ذخیره نکنید و مرتب خروجی پشتیبان بگیرید. پاک‌کردن داده‌های سایت می‌تواند نشست‌ها و کلیدها را حذف کند. پیش از انتشار عمومی، احراز هویت، سقف هزینه/درخواست، دسترسی خروجی شبکه و الزامات حریم خصوصی را بررسی کنید؛ حفاظت‌های فعلی جای ممیزی امنیتی کامل را نمی‌گیرند.

**فناوری‌های فعلی:** React 19، TypeScript، Vite 6، Tailwind CSS 4، Express، `@google/genai`، TanStack Virtual، Dexie/IndexedDB، ExcelJS، PapaParse و jschardet. کارایی به فایل و دستگاه وابسته است و تضمین ثابت ۵۰هزار ردیف با ۶۰ فریم ارائه نمی‌شود.

---

<a id="arabic"></a>
## 🇸🇦 العربية

### ما الجديد في هذا التحديث؟

**خيارات أوسع لمزودي الذكاء الاصطناعي، ومساحات عمل منفصلة للسينما والألعاب، وتحسينات في موثوقية الترجمة.**

- **إضافة Custom Provider وBYOK:** لم تعد ترجمة النصوص مقتصرة على Gemini. أدخل عنوان API الأساسي ومفتاحك ومعرّف النموذج للاتصال بخدمة متوافقة مع compatible text-generation API. إذا تعذر الوصول إلى Gemini، اختر مزوداً مخصصاً متوافقاً ومتاحاً لك.
- **توسيع قائمة Gemini:** تتضمن الواجهة خيارات Flash إضافية إلى جانب Pro والترجمة المتدفقة، مع دليل داخل التطبيق. المعرّف الافتراضي للترجمة في الكود الحالي هو `gemini-3.8-flash`.
- **فصل جلسات السينما والألعاب:** يحتفظ كل وضع بملفه وتنسيقه وترجماته وإعداداته. التبديل يحفظ مساحة العمل الحالية ويستعيد الأخرى، بدلاً من إظهار ملف سينمائي وكأنه ملف لعبة.
- **حفظ محلي تلقائي:** تُحفظ الجلسات في المتصفح عبر IndexedDB وDexie وتُحمّل عند بدء التطبيق. هذه ليست مزامنة سحابية ولا تغني عن تصدير نسخ احتياطية.
- **تحسينات UI/UX:** تعديل المسافات والتفاف عناصر الترويسة وظهور شارة الملف لتقليل التداخل. يعرض مؤشر التقدم اسم المزود والنموذج المخصص بدلاً من استبداله باسم Gemini.
- **طلبات Custom Provider أكثر متانة:** إضافة مهلة للترجمة وحدود لحجم الرد وتزامن الطلبات والتحقق من المخرجات ومعرّفات الطلبات والعمليات وقياسات التوقيت. تُميّز الأخطاء الدائمة، مثل الإعدادات الخاطئة والمفاتيح غير المصرح بها، عن الأعطال المؤقتة عند إعادة المحاولة.
- **الإلغاء والتحقق من الردود القديمة:** تستخدم ترجمة الدفعات AbortController ومعرّف العملية؛ كما يستجيب خادم الترجمة المخصصة لانقطاع اتصال العميل.
- **إصلاحات معالجة الملفات:** تحسين تقريب أجزاء الثانية في SRT/VTT، ومعالجة التوقيت، وبيانات WebVTT وإعدادات المقاطع، وقراءة أحداث ASS، واكتشاف ترويسة FPS في ملفات MicroDVD عند الاستيراد، ومسارات JSON المتداخلة واختيار حقل الترجمة المستهدف.
- **فحص أدق لمتغيرات الألعاب:** يقارن المحرر عدد مرات ظهور المتغيرات المعروفة ويعرض المفقود والزائد، بما في ذلك المتغيرات المتكررة.
- **مراجعة جودة حسب المزود:** تدعم المراجعة Custom Provider وGemini، وتعالج المحتوى في مجموعات أصغر.

تعكس هذه النقاط التغييرات الموجودة في المصدر المرفق، ولا تعني إصلاح جميع المشكلات أو اختبار جميع الأجهزة والخدمات. يعتمد توفر النماذج والأداء على المزود والحساب والشبكة وحجم العمل.

### القدرات الأساسية

**وضع السينما:** استيراد `.srt` و`.vtt` و`.ass` و`.ssa` و`.sub`؛ تحرير النص الأصلي والترجمة والتوقيت؛ الترجمة على دفعات؛ تصدير ترجمة ثنائية اللغة؛ ومعاينتها فوق فيديو محلي. يمكن لتفريغ الصوت عبر Gemini إنتاج SRT من الوسائط التي يستطيع المتصفح فك ترميزها؛ يختلف دعم الحاويات والترميزات بين المتصفحات.

**وضع الألعاب:** استيراد `.csv` و`.json` و`.xlsx` و`.txt`؛ تعيين أعمدة المصدر والهدف والمفتاح والسياق حيثما كان ذلك مدعوماً؛ ترجمة الحوارات ونصوص الواجهة؛ فحص تحذيرات المتغيرات؛ وتصدير التنسيقات المدعومة. راجع تطابق المخرجات مع مخطط لعبتك، خصوصاً للمصنفات المعقدة والبيانات المتداخلة.

**أدوات مشتركة:** لغات مستهدفة متعددة، نبرات ترجمة وتعليمات مخصصة، حجم دفعة وفواصل طلبات قابلة للتعديل، مفاتيح Gemini متعددة، بحث وتصفية واستبدال، إعادة ترجمة السطر، قوائم افتراضية، وواجهة عربية وفارسية وإنجليزية. ضع قواعد المصطلحات في التعليمات المخصصة عند الحاجة إلى توحيد الأسماء؛ تبقى مراجعة التزام النموذج ضرورية.

### استخدام Custom Provider بدلاً من Gemini

1. افتح إعدادات **API Key** واختر **Custom Provider**.
2. أدخل اسماً اختيارياً للمزود.
3. أدخل **Base API URL** مع مسار إصدار API وفق وثائق المزود، مثل `https://api.example.com/v1`.
4. أدخل **API Key** و**Model ID** الصحيحين للخدمة نفسها.
5. اضغط **Test Connection** وعالج أخطاء العنوان أو المصادقة أو النموذج أو الحصة.
6. اختر الملف واللغة والنبرة وابدأ الترجمة.

يستخدم التطبيق `POST /chat/completions` ومصفوفة `messages` وترويسة `Authorization: Bearer ...`. يجب أن يستطيع النموذج إرجاع بنية JSON المطلوبة للترجمة. يُضاف لاحق المسار تلقائياً إذا لم ينتهِ العنوان بـ`/chat/completions`.

**لا ارتباط بمورد واحد:** قد تعمل خدمات مثل وOpenRouter وGroq وDeepSeek وTogether أو أي مورد آخر عندما توفر endpoint متوافقاً. هذه أمثلة وليست قائمة توافق مختبرة. المفتاح وحده لا يكفي؛ يجب أن يتطابق العنوان والمصادقة والمسار والنموذج مع هذا العقد.

**حدود مهمة:**

- لا تحتاج إلى مفتاح Gemini لترجمة النصوص أو مراجعة الجودة باستخدام مزود مخصص مضبوط. تفريغ الصوت ومسار Gemini المتدفق ميزتان منفصلتان ولا تنتقلان تلقائياً إلى المزود المخصص.
- الترجمة المخصصة القياسية تتم على دفعات؛ اختيار Gemini Live Stream مع مزود مخصص يعيد العملية إلى الترجمة المخصصة القياسية.
- تمنع هذه النسخة عناوين localhost والشبكات الخاصة وخدمات metadata. لن يعمل عنوان Ollama أو LM Studio المحلي كما هو؛ لا تعطّل حماية شبكة النسخة العامة لمجرد توصيله.
- استخدم عنوان API مباشراً، ويفضل HTTPS. ترفض طلبات الترجمة إعادة التوجيه. تجنب العناوين المعتمدة على query string في هذه النسخة واتبع صيغة المسار الأساسي التي يحددها المزود.
- نجاح اختبار الاتصال لا يضمن إنتاج JSON صحيح لكل دفعة ترجمة.
- المزود البديل لا يعني استخداماً مجانياً أو حصة غير محدودة أو تجاوز سياسات الخدمة.

### خيارات Gemini المسجلة في المشروع

| الخيار | المعرّف المضبوط |
| --- | --- |
| Gemini 3.8 Flash، افتراضي الترجمة | `gemini-3.8-flash` |
| Gemini 3.7 Flash | `gemini-3.7-flash` |
| Gemini 3.6 Flash | `gemini-3.6-flash` |
| Gemini 3.5 Flash | `gemini-3.5-flash` |
| Gemini 3.1 Flash Lite | `gemini-3.1-flash-lite` |
| Gemini 3.1 Pro Preview | `gemini-3.1-pro-preview` |
| Gemini Live Stream، وضع تدفق داخل التطبيق | `gemini-live-stream` |
| إعداد تفريغ الصوت | `gemini-3.5-transcribe` |

المرجع: [`src/modelRegistry.ts`](src/modelRegistry.ts). هذه **معرّفات مسجلة في المستودع، وليست تأكيداً لإتاحة Google جميعها حالياً لكل الحسابات**. `gemini-live-stream` وضع داخلي للتطبيق وليس معرّف نموذج مستقل لدى Google. تحقق من الإتاحة الفعلية وحدّث السجل عند الحاجة. الرجوع الاحتياطي لا يضمن استمرار الخدمة ولا يتجاوز الحصص المشتركة.

### التشغيل المحلي

استخدم إصداراً حديثاً من Node.js 22 LTS وnpm:

```bash
git clone https://github.com/gguhfhu7-sketch/SubGame-Lab.git
cd SubGame-Lab
npm install
npm run dev
```

افتح `http://localhost:3000` واضبط Gemini أو Custom Provider من الواجهة. لإضافة مفتاح Gemini اختياري على الخادم، أنشئ `.env`:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
```

يستخدم الخادم `dotenv.config()`؛ الملف الافتراضي هو `.env` ولا يحمّل هذا الاستدعاء `.env.local` صراحةً. لا تضع مفاتيح حقيقية في المستودع.

```bash
npm run lint
npm run build
npm start
```

الأول لفحص TypeScript، والثاني لبناء الواجهة والخادم، والثالث لتشغيل نسخة الإنتاج.

### الاستضافة والشبكة والخصوصية

على Railway أو مضيف Node.js آخر، اربط المستودع وثبّت الاعتماديات واضبط أمر البناء على `npm run build` وأمر التشغيل على `npm start`. أضف متغيرات البيئة واضبط المنفذ والنطاق من لوحة الاستضافة.

تخرج طلبات API من خادم التطبيق. يجب أن يصل المضيف إلى المزود في النسخة المنشورة، أو أن تصل عملية Node.js المحلية إليه عند التشغيل محلياً. تعتمد الحاجة إلى بروكسي أو توجيه خاص على الشبكة وقيود المزود؛ العرض المباشر ليس ضماناً للوصول من كل المناطق. استخدم الخدمات المتاحة لك وفق شروطها؛ المفاتيح المتعددة لا تلغي الحصص.

تُحفظ مفاتيح BYOK في localStorage وتُرسل إلى خلفية التطبيق لتنفيذ الطلبات. تُحفظ الجلسات في IndexedDB. استخدم استضافة موثوقة، ولا تحفظ المفاتيح على أجهزة مشتركة، وصدّر العمل المهم بانتظام. قد يؤدي مسح بيانات الموقع إلى حذف الجلسات والمفاتيح. قبل النشر العام، راجع المصادقة وحدود التكلفة والطلبات وضوابط اتصالات الشبكة الصادرة ومتطلبات الخصوصية؛ الحماية المضمنة ليست تدقيقاً أمنياً شاملاً.

**التقنيات الحالية:** React 19، TypeScript، Vite 6، Tailwind CSS 4، Express، `@google/genai`، TanStack Virtual، Dexie/IndexedDB، ExcelJS، PapaParse وjschardet. يعتمد الأداء على الملف والجهاز؛ لا يوجد وعد ثابت بعرض 50,000 صف بسرعة 60 إطاراً في الثانية.

---

### Project links · لینک‌های پروژه · روابط المشروع

- **Repository:** https://github.com/gguhfhu7-sketch/SubGame-Lab
- **Live demo:** https://subgame-lab-production-5e1a.up.railway.app/
- **Telegram community and announcements:** https://t.me/MySaeedLab

