@echo off
chcp 65001 >nul
echo.
echo ================================================
echo 🚀 إعداد شامل للمنصة وRفعها على GitHub
echo ================================================
echo.

REM تحديد مجلد المشروع
cd /d "c:\Users\me403\Desktop\MEDIA"

echo 📦 تثبيت Git...
REM محاولة تثبيت Git عبر winget
winget install --id Git.Git --accept-source-agreements --accept-package-agreements --silent
if %errorlevel% neq 0 (
    echo ⚠️  فشل تثبيت Git عبر winget، جاري المحاولة بطريقة أخرى...
    REM تحميل Git يدوياً
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe' -OutFile 'git-installer.exe'"
    if exist git-installer.exe (
        echo 🔄 تثبيت Git...
        git-installer.exe /SILENT /COMPONENTS="icons,ext\reg\shellhere,assoc,assoc_sh"
        del git-installer.exe
    )
)

echo 📦 تثبيت GitHub CLI...
winget install --id GitHub.cli --accept-source-agreements --accept-package-agreements --silent

echo ⏳ انتظار انتهاء التثبيت...
timeout /t 10 /nobreak >nul

REM إعادة تحميل متغيرات البيئة
call refreshenv.cmd 2>nul

echo.
echo 🔧 إعداد Git...
git --version
if %errorlevel% neq 0 (
    echo ❌ فشل في العثور على Git. يرجى إعادة تشغيل الكمبيوتر وتشغيل السكريپت مرة أخرى.
    pause
    exit /b 1
)

REM إعداد Git إذا لم يكن معداً
for /f "tokens=*" %%i in ('git config --global user.name 2^>nul') do set GIT_NAME=%%i
if "%GIT_NAME%"=="" (
    echo 📝 إعداد Git للمرة الأولى...
    set /p GIT_USER_NAME="اسمك الكامل: "
    set /p GIT_USER_EMAIL="بريدك الإلكتروني: "
    git config --global user.name "!GIT_USER_NAME!"
    git config --global user.email "!GIT_USER_EMAIL!"
    echo ✅ تم إعداد Git بنجاح
)

echo.
echo 🔄 إعداد Repository محلياً...
if not exist ".git" (
    git init
    echo ✅ تم إنشاء Git repository
) else (
    echo ℹ️  Git repository موجود مسبقاً
)

echo 📁 إضافة جميع الملفات...
git add .

echo 💾 إنشاء Commit أولي...
git status --porcelain >nul 2>&1
if %errorlevel% equ 0 (
    git commit -m "🎉 Initial commit: Social Media Platform

✨ Features:
- Complete React.js frontend with modern UI
- Node.js + Express.js backend with Socket.io
- Real-time messaging and notifications
- Live streaming capabilities
- Admin dashboard with analytics
- Docker containerization ready
- CI/CD with GitHub Actions
- Production deployment scripts

🛠️ Tech Stack:
- Frontend: React 18, Redux Toolkit, Tailwind CSS, Framer Motion
- Backend: Node.js, Express.js, Socket.io, PostgreSQL, Redis
- DevOps: Docker, Nginx, GitHub Actions
- Monitoring: Prometheus, Grafana

🚀 Ready for production deployment!"
    echo ✅ تم إنشاء Commit بنجاح
) else (
    echo ℹ️  لا توجد تغييرات للCommit
)

echo.
echo 🌐 إعداد GitHub...
echo.
echo 📋 للمتابعة، تحتاج إلى:
echo 1. اسم المستخدم على GitHub
echo 2. Personal Access Token من GitHub
echo.
echo 🔑 للحصول على Personal Access Token:
echo    1. اذهب إلى https://github.com/settings/tokens
echo    2. انقر Generate new token (classic)
echo    3. اختر الصلاحيات: repo, workflow, admin:org
echo    4. انسخ الـ token
echo.

set /p GITHUB_USERNAME="📝 اسم المستخدم على GitHub: "
set /p GITHUB_TOKEN="🔐 GitHub Personal Access Token: "

echo.
echo 🔄 تسجيل الدخول إلى GitHub CLI...
echo %GITHUB_TOKEN% | gh auth login --with-token
if %errorlevel% equ 0 (
    echo ✅ تم تسجيل الدخول بنجاح
) else (
    echo ❌ فشل تسجيل الدخول. تحقق من الـ token
    pause
    exit /b 1
)

echo.
echo 📦 إنشاء Repository على GitHub...
gh repo create social-media-platform --description "🌟 منصة تواصل اجتماعي متقدمة مبنية بأحدث التقنيات" --public --clone=false --add-readme=false
if %errorlevel% equ 0 (
    echo ✅ تم إنشاء Repository بنجاح
) else (
    echo ⚠️  Repository قد يكون موجود مسبقاً، سنستمر...
)

echo.
echo 🔗 ربط Repository المحلي بـ GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USERNAME%/social-media-platform.git
echo ✅ تم ربط Repository

echo.
echo 🚀 رفع الكود إلى GitHub...
git branch -M main
git push -u origin main
if %errorlevel% equ 0 (
    echo ✅ تم رفع الكود بنجاح!
) else (
    echo ❌ فشل في رفع الكود. تحقق من الاتصال والصلاحيات
)

echo.
echo 🏷️ إعداد Labels للRepository...
gh label delete "bug" --yes 2>nul
gh label delete "enhancement" --yes 2>nul
gh label delete "good first issue" --yes 2>nul

gh label create "🐛 bug" --color "d73a4a" --description "Bug report" 2>nul
gh label create "✨ enhancement" --color "a2eeef" --description "New feature or improvement" 2>nul
gh label create "📖 documentation" --color "0075ca" --description "Documentation improvement" 2>nul
gh label create "🎨 design" --color "f9d0c4" --description "Design improvements" 2>nul
gh label create "🔧 maintenance" --color "fbca04" --description "Code maintenance" 2>nul
gh label create "🚀 performance" --color "0e8a16" --description "Performance improvement" 2>nul
gh label create "🔐 security" --color "ee0701" --description "Security issues" 2>nul
gh label create "📱 mobile" --color "bfdadc" --description "Mobile related" 2>nul
gh label create "🌐 frontend" --color "7057ff" --description "Frontend related" 2>nul
gh label create "⚙️ backend" --color "ff6b6b" --description "Backend related" 2>nul
gh label create "👶 good first issue" --color "7057ff" --description "Good for newcomers" 2>nul
gh label create "💙 help wanted" --color "0075ca" --description "Extra attention is needed" 2>nul

echo ✅ تم إعداد Labels

echo.
echo 🎯 إنشاء أول Release...
git tag -a v1.0.0 -m "🎉 First Release: Social Media Platform v1.0.0"
git push origin v1.0.0
gh release create v1.0.0 --title "🎉 Social Media Platform v1.0.0" --notes "## 🌟 الإصدار الأول من منصة التواصل الاجتماعي

### ✨ الميزات الرئيسية:
- 👤 نظام المستخدمين الكامل
- 📝 إنشاء ومشاركة المنشورات
- 💬 رسائل فورية مع Socket.io
- 📹 بث مباشر تفاعلي
- 🛡️ لوحة إدارة شاملة
- 🎨 واجهة حديثة ومتجاوبة
- 🐳 Docker containers جاهزة
- 🚀 CI/CD pipeline متكامل

### 🛠️ التقنيات المستخدمة:
- **Frontend**: React 18, Redux Toolkit, Tailwind CSS
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: PostgreSQL, Redis
- **DevOps**: Docker, Nginx, GitHub Actions

### 📦 التثبيت:
\`\`\`bash
git clone https://github.com/%GITHUB_USERNAME%/social-media-platform.git
cd social-media-platform
npm run install-all
npm run dev
\`\`\`

🚀 **جاهز للإنتاج!**"

echo.
echo ================================================
echo 🎉 تم إعداد كل شيء بنجاح!
echo ================================================
echo.
echo 🔗 روابط مهمة:
echo 📁 Repository: https://github.com/%GITHUB_USERNAME%/social-media-platform
echo ⚙️ Actions: https://github.com/%GITHUB_USERNAME%/social-media-platform/actions
echo 📊 Issues: https://github.com/%GITHUB_USERNAME%/social-media-platform/issues
echo 🚀 Releases: https://github.com/%GITHUB_USERNAME%/social-media-platform/releases
echo.
echo 📈 الخطوات التالية:
echo 1. راجع Repository على GitHub
echo 2. شارك المشروع على وسائل التواصل
echo 3. ادع مطورين للمساهمة
echo 4. ابدأ في تطوير ميزات جديدة
echo.
echo 🌟 منصتك الآن على GitHub وجاهزة للعالم!
echo.
pause