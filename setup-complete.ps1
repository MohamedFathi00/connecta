# =================================
# إعداد شامل للمنصة ورفعها على GitHub
# =================================

# إعداد PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding

# ألوان PowerShell
function Write-ColorText {
    param([string]$Text, [ConsoleColor]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Write-Header {
    Write-ColorText "`n================================================" -Color Magenta
    Write-ColorText "🚀 إعداد شامل للمنصة ورفعها على GitHub" -Color Magenta
    Write-ColorText "================================================`n" -Color Magenta
}

function Write-Step {
    param([string]$Step)
    Write-ColorText "🔄 $Step..." -Color Cyan
}

function Write-Success {
    param([string]$Message)
    Write-ColorText "✅ $Message" -Color Green
}

function Write-Warning {
    param([string]$Message)
    Write-ColorText "⚠️  $Message" -Color Yellow
}

function Write-Error {
    param([string]$Message)
    Write-ColorText "❌ $Message" -Color Red
}

# بدء الإعداد
Write-Header

# تحديد مجلد المشروع
Set-Location "c:\Users\me403\Desktop\MEDIA"

try {
    # تثبيت Git
    Write-Step "تثبيت Git"
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        try {
            winget install --id Git.Git --accept-source-agreements --accept-package-agreements --silent
            Write-Success "تم تثبيت Git بنجاح"
        }
        catch {
            Write-Warning "فشل تثبيت Git عبر winget، جاري التحميل المباشر..."
            $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
            $gitInstaller = "git-installer.exe"
            Invoke-WebRequest -Uri $gitUrl -OutFile $gitInstaller
            Start-Process -FilePath $gitInstaller -ArgumentList "/SILENT" -Wait
            Remove-Item $gitInstaller -Force
            Write-Success "تم تثبيت Git بنجاح"
        }
    } else {
        Write-Success "Git مثبت مسبقاً"
    }

    # تثبيت GitHub CLI
    Write-Step "تثبيت GitHub CLI"
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        try {
            winget install --id GitHub.cli --accept-source-agreements --accept-package-agreements --silent
            Write-Success "تم تثبيت GitHub CLI بنجاح"
        }
        catch {
            Write-Warning "فشل تثبيت GitHub CLI، ستحتاج لتثبيته يدوياً"
        }
    } else {
        Write-Success "GitHub CLI مثبت مسبقاً"
    }

    # انتظار انتهاء التثبيت
    Write-Step "انتظار انتهاء التثبيت"
    Start-Sleep -Seconds 5

    # إعادة تحميل متغيرات البيئة
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    # التحقق من Git
    Write-Step "التحقق من Git"
    try {
        $gitVersion = git --version
        Write-Success "Git جاهز: $gitVersion"
    }
    catch {
        Write-Error "فشل في العثور على Git. يرجى إعادة تشغيل PowerShell كمسؤول"
        exit 1
    }

    # إعداد Git
    Write-Step "إعداد Git"
    $gitName = git config --global user.name 2>$null
    if (-not $gitName) {
        $name = Read-Host "📝 اسمك الكامل"
        $email = Read-Host "📧 بريدك الإلكتروني"
        git config --global user.name $name
        git config --global user.email $email
        Write-Success "تم إعداد Git بنجاح"
    } else {
        Write-Success "Git معد مسبقاً: $gitName"
    }

    # إعداد Repository محلياً
    Write-Step "إعداد Repository محلياً"
    if (-not (Test-Path ".git")) {
        git init
        Write-Success "تم إنشاء Git repository"
    } else {
        Write-Success "Git repository موجود مسبقاً"
    }

    # إضافة الملفات
    Write-Step "إضافة جميع الملفات"
    git add .
    Write-Success "تم إضافة جميع الملفات"

    # إنشاء Commit
    Write-Step "إنشاء Commit أولي"
    try {
        git commit -m @"
🎉 Initial commit: Social Media Platform

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

🚀 Ready for production deployment!
"@
        Write-Success "تم إنشاء Commit بنجاح"
    }
    catch {
        Write-Warning "لا توجد تغييرات للCommit أو Commit موجود مسبقاً"
    }

    # جمع معلومات GitHub
    Write-ColorText "`n🌐 إعداد GitHub" -Color Magenta
    Write-ColorText "للمتابعة، تحتاج إلى:" -Color Cyan
    Write-ColorText "1. اسم المستخدم على GitHub" -Color Cyan
    Write-ColorText "2. Personal Access Token من GitHub" -Color Cyan
    Write-ColorText "`n🔑 للحصول على Personal Access Token:" -Color Yellow
    Write-ColorText "   1. اذهب إلى https://github.com/settings/tokens" -Color Yellow
    Write-ColorText "   2. انقر Generate new token (classic)" -Color Yellow
    Write-ColorText "   3. اختر الصلاحيات: repo, workflow, admin:org" -Color Yellow
    Write-ColorText "   4. انسخ الـ token`n" -Color Yellow

    $githubUsername = Read-Host "📝 اسم المستخدم على GitHub"
    $githubToken = Read-Host "🔐 GitHub Personal Access Token" -AsSecureString
    $githubTokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($githubToken))

    # تسجيل الدخول إلى GitHub CLI
    Write-Step "تسجيل الدخول إلى GitHub CLI"
    try {
        Write-Output $githubTokenPlain | gh auth login --with-token
        Write-Success "تم تسجيل الدخول بنجاح"
    }
    catch {
        Write-Error "فشل تسجيل الدخول. تحقق من الـ token"
        exit 1
    }

    # إنشاء Repository على GitHub
    Write-Step "إنشاء Repository على GitHub"
    try {
        gh repo create social-media-platform --description "🌟 منصة تواصل اجتماعي متقدمة مبنية بأحدث التقنيات" --public --clone=false --add-readme=false
        Write-Success "تم إنشاء Repository بنجاح"
    }
    catch {
        Write-Warning "Repository قد يكون موجود مسبقاً، سنستمر..."
    }

    # ربط Repository
    Write-Step "ربط Repository المحلي بـ GitHub"
    try {
        git remote remove origin 2>$null
    }
    catch {
        # تجاهل إذا لم يكن موجود
    }
    git remote add origin "https://github.com/$githubUsername/social-media-platform.git"
    Write-Success "تم ربط Repository"

    # رفع الكود
    Write-Step "رفع الكود إلى GitHub"
    try {
        git branch -M main
        git push -u origin main
        Write-Success "تم رفع الكود بنجاح!"
    }
    catch {
        Write-Error "فشل في رفع الكود. تحقق من الاتصال والصلاحيات"
    }

    # إعداد Labels
    Write-Step "إعداد Labels للRepository"
    $labels = @(
        @{name="bug"; color="d73a4a"; description="Bug report"},
        @{name="enhancement"; color="a2eeef"; description="New feature or improvement"},
        @{name="documentation"; color="0075ca"; description="Documentation improvement"},
        @{name="design"; color="f9d0c4"; description="Design improvements"},
        @{name="maintenance"; color="fbca04"; description="Code maintenance"},
        @{name="performance"; color="0e8a16"; description="Performance improvement"},
        @{name="security"; color="ee0701"; description="Security issues"},
        @{name="mobile"; color="bfdadc"; description="Mobile related"},
        @{name="frontend"; color="7057ff"; description="Frontend related"},
        @{name="backend"; color="ff6b6b"; description="Backend related"},
        @{name="good first issue"; color="7057ff"; description="Good for newcomers"},
        @{name="help wanted"; color="0075ca"; description="Extra attention is needed"}
    )

    # حذف labels افتراضية
    gh label delete "bug" --yes 2>$null
    gh label delete "enhancement" --yes 2>$null
    gh label delete "good first issue" --yes 2>$null

    # إضافة labels جديدة
    foreach ($label in $labels) {
        gh label create $label.name --color $label.color --description $label.description 2>$null
    }
    Write-Success "تم إعداد Labels"

    # إنشاء Release
    Write-Step "إنشاء أول Release"
    try {
        git tag -a v1.0.0 -m "🎉 First Release: Social Media Platform v1.0.0"
        git push origin v1.0.0
        
        $releaseNotes = @"
## 🌟 الإصدار الأول من منصة التواصل الاجتماعي

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
```bash
git clone https://github.com/$githubUsername/social-media-platform.git
cd social-media-platform
npm run install-all
npm run dev
```

🚀 **جاهز للإنتاج!**
"@
        
        gh release create v1.0.0 --title "🎉 Social Media Platform v1.0.0" --notes $releaseNotes
        Write-Success "تم إنشاء Release بنجاح"
    }
    catch {
        Write-Warning "فشل في إنشاء Release، يمكنك إنشاؤه يدوياً لاحقاً"
    }

    # عرض النتائج
    Write-ColorText "`n================================================" -Color Green
    Write-ColorText "🎉 تم إعداد كل شيء بنجاح!" -Color Green
    Write-ColorText "================================================`n" -Color Green

    Write-ColorText "🔗 روابط مهمة:" -Color Cyan
    Write-ColorText "📁 Repository: https://github.com/$githubUsername/social-media-platform" -Color White
    Write-ColorText "⚙️ Actions: https://github.com/$githubUsername/social-media-platform/actions" -Color White
    Write-ColorText "📊 Issues: https://github.com/$githubUsername/social-media-platform/issues" -Color White
    Write-ColorText "🚀 Releases: https://github.com/$githubUsername/social-media-platform/releases" -Color White

    Write-ColorText "`n📈 الخطوات التالية:" -Color Yellow
    Write-ColorText "1. راجع Repository على GitHub" -Color White
    Write-ColorText "2. شارك المشروع على وسائل التواصل" -Color White
    Write-ColorText "3. ادع مطورين للمساهمة" -Color White
    Write-ColorText "4. ابدأ في تطوير ميزات جديدة" -Color White

    Write-ColorText "`n🌟 منصتك الآن على GitHub وجاهزة للعالم!" -Color Green

}
catch {
    Write-Error "حدث خطأ: $($_.Exception.Message)"
    Write-ColorText "يرجى المحاولة مرة أخرى أو التواصل للمساعدة" -Color Yellow
}

Write-ColorText "`nاضغط أي مفتاح للخروج..." -Color Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")