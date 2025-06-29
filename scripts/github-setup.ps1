# =================================
# سكريپت إعداد GitHub للمنصة - Windows PowerShell
# =================================

# إعدادات الأمان
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# الألوان والتنسيق
function Write-ColorOutput {
    param(
        [string]$Text,
        [ConsoleColor]$ForegroundColor = 'White'
    )
    Write-Host $Text -ForegroundColor $ForegroundColor
}

function Write-Info { Write-ColorOutput "ℹ️  [INFO] $args" -ForegroundColor Cyan }
function Write-Success { Write-ColorOutput "✅ [SUCCESS] $args" -ForegroundColor Green }
function Write-Warning { Write-ColorOutput "⚠️  [WARNING] $args" -ForegroundColor Yellow }
function Write-Error { Write-ColorOutput "❌ [ERROR] $args" -ForegroundColor Red }
function Write-Step { Write-ColorOutput "🔄 [STEP] $args" -ForegroundColor Magenta }

# متغيرات
$REPO_NAME = "social-media-platform"
$REPO_DESCRIPTION = "🌟 منصة تواصل اجتماعي متقدمة مبنية بأحدث التقنيات"
$GITHUB_USERNAME = ""
$GITHUB_TOKEN = ""

# رسالة الترحيب
function Show-Welcome {
    Write-ColorOutput @"
================================================
🚀 إعداد GitHub للمنصة الاجتماعية
================================================
"@ -ForegroundColor Magenta
    
    Write-Host ""
    Write-Info "هذا السكريپت سيساعدك في:"
    Write-Info "✅ إنشاء repository جديد على GitHub"
    Write-Info "✅ رفع الكود للـ repository"
    Write-Info "✅ إعداد الـ branches والحماية"
    Write-Info "✅ تفعيل GitHub Actions"
    Write-Host ""
}

# جمع معلومات المستخدم
function Get-UserInfo {
    Write-Step "جمع معلومات GitHub..."
    
    if (-not $global:GITHUB_USERNAME) {
        $global:GITHUB_USERNAME = Read-Host "📝 اسم المستخدم على GitHub"
    }
    
    if (-not $global:GITHUB_TOKEN) {
        Write-Info "🔑 تحتاج لـ Personal Access Token من GitHub"
        Write-Info "   يمكنك إنشاؤه من: https://github.com/settings/tokens"
        Write-Info "   الصلاحيات المطلوبة: repo, workflow, admin:org"
        $global:GITHUB_TOKEN = Read-Host -AsSecureString "🔐 GitHub Personal Access Token"
        $global:GITHUB_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($global:GITHUB_TOKEN))
    }
    
    $input_repo = Read-Host "📁 اسم الـ Repository [$REPO_NAME]"
    if ($input_repo) { $global:REPO_NAME = $input_repo }
    
    $input_desc = Read-Host "📋 وصف الـ Repository [$REPO_DESCRIPTION]"
    if ($input_desc) { $global:REPO_DESCRIPTION = $input_desc }
    
    Write-Success "تم جمع المعلومات بنجاح"
}

# التحقق من Git
function Test-Git {
    Write-Step "التحقق من Git..."
    
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Error "Git غير مثبت. يرجى تثبيت Git أولاً من: https://git-scm.com/"
        exit 1
    }
    
    # التحقق من إعدادات Git
    $gitName = git config --global user.name 2>$null
    if (-not $gitName) {
        $name = Read-Host "📝 اسمك لـ Git commits"
        git config --global user.name $name
    }
    
    $gitEmail = git config --global user.email 2>$null
    if (-not $gitEmail) {
        $email = Read-Host "📧 بريدك الإلكتروني لـ Git"
        git config --global user.email $email
    }
    
    Write-Success "إعدادات Git جاهزة"
}

# التحقق من GitHub CLI
function Test-GitHubCLI {
    Write-Step "التحقق من GitHub CLI..."
    
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        Write-Warning "GitHub CLI غير مثبت"
        Write-Info "تثبيت GitHub CLI..."
        
        # محاولة التثبيت عبر winget
        if (Get-Command winget -ErrorAction SilentlyContinue) {
            winget install --id GitHub.cli
        } else {
            Write-Error "يرجى تثبيت GitHub CLI يدوياً من: https://cli.github.com/"
            Write-Info "أو استخدم: winget install --id GitHub.cli"
            exit 1
        }
    }
    
    # تسجيل الدخول إلى GitHub CLI
    $authStatus = gh auth status 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Info "تسجيل الدخول إلى GitHub CLI..."
        Write-Output $global:GITHUB_TOKEN | gh auth login --with-token
    }
    
    Write-Success "GitHub CLI جاهز"
}

# إعداد Git repository محلياً
function Initialize-LocalGit {
    Write-Step "إعداد Git repository محلياً..."
    
    if (-not (Test-Path ".git")) {
        git init
        Write-Success "تم إنشاء Git repository"
    } else {
        Write-Info "Git repository موجود مسبقاً"
    }
    
    # إضافة جميع الملفات
    git add .
    
    # التحقق من وجود commits
    $hasCommits = git rev-parse --verify HEAD 2>$null
    if ($LASTEXITCODE -ne 0) {
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
        Write-Success "تم إنشاء commit أولي"
    } else {
        Write-Info "توجد commits مسبقاً"
    }
}

# إنشاء repository على GitHub
function New-GitHubRepo {
    Write-Step "إنشاء repository على GitHub..."
    
    # التحقق من وجود repository
    $repoExists = gh repo view "$global:GITHUB_USERNAME/$global:REPO_NAME" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Warning "Repository موجود مسبقاً"
        $continue = Read-Host "هل تريد الاستمرار؟ (y/N)"
        if ($continue -notmatch "^[Yy]$") {
            Write-Info "تم إلغاء العملية"
            exit 0
        }
    } else {
        # إنشاء repository جديد
        gh repo create $global:REPO_NAME --description $global:REPO_DESCRIPTION --public --clone=false --add-readme=false
        Write-Success "تم إنشاء repository على GitHub"
    }
    
    # إضافة remote origin
    $remoteExists = git remote get-url origin 2>$null
    if ($LASTEXITCODE -ne 0) {
        git remote add origin "https://github.com/$global:GITHUB_USERNAME/$global:REPO_NAME.git"
        Write-Success "تم إضافة remote origin"
    } else {
        Write-Info "Remote origin موجود مسبقاً"
    }
}

# رفع الكود إلى GitHub
function Push-ToGitHub {
    Write-Step "رفع الكود إلى GitHub..."
    
    # Push إلى main branch
    git branch -M main
    git push -u origin main
    
    Write-Success "تم رفع الكود بنجاح"
}

# إعداد Labels
function Set-GitHubLabels {
    Write-Step "إعداد Labels..."
    
    # حذف labels الافتراضية
    gh label delete "bug" --yes 2>$null
    gh label delete "enhancement" --yes 2>$null
    gh label delete "good first issue" --yes 2>$null
    
    # إضافة labels مخصصة
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
    
    foreach ($label in $labels) {
        gh label create $label.name --color $label.color --description $label.description 2>$null
    }
    
    Write-Success "تم إعداد Labels"
}

# عرض ملخص النتائج
function Show-Summary {
    Write-Host ""
    Write-ColorOutput @"
================================================
🎉 تم إعداد GitHub بنجاح!
================================================
"@ -ForegroundColor Green
    
    Write-Host ""
    Write-Info "📁 Repository: https://github.com/$global:GITHUB_USERNAME/$global:REPO_NAME"
    Write-Info "⚙️ Actions: https://github.com/$global:GITHUB_USERNAME/$global:REPO_NAME/actions"
    Write-Info "📊 Issues: https://github.com/$global:GITHUB_USERNAME/$global:REPO_NAME/issues"
    Write-Info "🔄 Pull Requests: https://github.com/$global:GITHUB_USERNAME/$global:REPO_NAME/pulls"
    Write-Host ""
    Write-ColorOutput "الخطوات التالية:" -ForegroundColor Yellow
    Write-Info "1. راجع الـ repository على GitHub"
    Write-Info "2. أضف collaborators إذا لزم الأمر"
    Write-Info "3. اضبط إعدادات الـ repository"
    Write-Info "4. ابدأ في استقبال المساهمات!"
}

# الدالة الرئيسية
function Main {
    try {
        Show-Welcome
        Get-UserInfo
        Test-Git
        Test-GitHubCLI
        Initialize-LocalGit
        New-GitHubRepo
        Push-ToGitHub
        Set-GitHubLabels
        Show-Summary
        
        Write-Success "🚀 تم إعداد GitHub بنجاح!"
    }
    catch {
        Write-Error "حدث خطأ: $($_.Exception.Message)"
        exit 1
    }
}

# تشغيل الدالة الرئيسية
Main