#!/bin/bash

# =================================
# سكريپت إعداد GitHub للمنصة
# =================================

set -e

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# دوال مساعدة
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

# متغيرات
REPO_NAME="social-media-platform"
REPO_DESCRIPTION="🌟 منصة تواصل اجتماعي متقدمة مبنية بأحدث التقنيات"
GITHUB_USERNAME=""
GITHUB_TOKEN=""

# رسالة الترحيب
welcome_message() {
    echo -e "${PURPLE}"
    echo "================================================"
    echo "🚀 إعداد GitHub للمنصة الاجتماعية"
    echo "================================================"
    echo -e "${NC}"
    echo "هذا السكريپت سيساعدك في:"
    echo "✅ إنشاء repository جديد على GitHub"
    echo "✅ رفع الكود للـ repository"
    echo "✅ إعداد الـ branches والحماية"
    echo "✅ تفعيل GitHub Actions"
    echo "✅ إعداد GitHub Pages"
    echo ""
}

# جمع معلومات المستخدم
collect_user_info() {
    log_step "جمع معلومات GitHub..."
    
    if [ -z "$GITHUB_USERNAME" ]; then
        read -p "📝 اسم المستخدم على GitHub: " GITHUB_USERNAME
    fi
    
    if [ -z "$GITHUB_TOKEN" ]; then
        echo "🔑 تحتاج لـ Personal Access Token من GitHub"
        echo "   يمكنك إنشاؤه من: https://github.com/settings/tokens"
        echo "   الصلاحيات المطلوبة: repo, workflow, admin:org"
        read -s -p "🔐 GitHub Personal Access Token: " GITHUB_TOKEN
        echo ""
    fi
    
    read -p "📁 اسم الـ Repository [$REPO_NAME]: " input_repo_name
    REPO_NAME=${input_repo_name:-$REPO_NAME}
    
    read -p "📋 وصف الـ Repository [$REPO_DESCRIPTION]: " input_description
    REPO_DESCRIPTION=${input_description:-$REPO_DESCRIPTION}
    
    log_success "تم جمع المعلومات بنجاح"
}

# التحقق من Git
check_git() {
    log_step "التحقق من Git..."
    
    if ! command -v git &> /dev/null; then
        log_error "Git غير مثبت. يرجى تثبيت Git أولاً."
        exit 1
    fi
    
    # التحقق من إعدادات Git
    if [ -z "$(git config --global user.name)" ]; then
        read -p "📝 اسمك لـ Git commits: " git_name
        git config --global user.name "$git_name"
    fi
    
    if [ -z "$(git config --global user.email)" ]; then
        read -p "📧 بريدك الإلكتروني لـ Git: " git_email
        git config --global user.email "$git_email"
    fi
    
    log_success "إعدادات Git جاهزة"
}

# التحقق من GitHub CLI
check_github_cli() {
    log_step "التحقق من GitHub CLI..."
    
    if ! command -v gh &> /dev/null; then
        log_warning "GitHub CLI غير مثبت"
        log_info "تثبيت GitHub CLI..."
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            brew install gh
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
            sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
            sudo apt update
            sudo apt install gh
        else
            log_error "نظام التشغيل غير مدعوم لتثبيت GitHub CLI تلقائياً"
            log_info "يرجى تثبيت GitHub CLI يدوياً من: https://cli.github.com/"
            exit 1
        fi
    fi
    
    # تسجيل الدخول إلى GitHub CLI
    if ! gh auth status &> /dev/null; then
        log_info "تسجيل الدخول إلى GitHub CLI..."
        echo "$GITHUB_TOKEN" | gh auth login --with-token
    fi
    
    log_success "GitHub CLI جاهز"
}

# إعداد Git repository محلياً
setup_local_git() {
    log_step "إعداد Git repository محلياً..."
    
    if [ ! -d ".git" ]; then
        git init
        log_success "تم إنشاء Git repository"
    else
        log_info "Git repository موجود مسبقاً"
    fi
    
    # إضافة جميع الملفات
    git add .
    
    # Commit أولي
    if ! git rev-parse --verify HEAD &> /dev/null; then
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
        
        log_success "تم إنشاء commit أولي"
    else
        log_info "توجد commits مسبقاً"
    fi
}

# إنشاء repository على GitHub
create_github_repo() {
    log_step "إنشاء repository على GitHub..."
    
    # التحقق من وجود repository
    if gh repo view "$GITHUB_USERNAME/$REPO_NAME" &> /dev/null; then
        log_warning "Repository موجود مسبقاً"
        read -p "هل تريد الاستمرار؟ (y/N): " continue_choice
        if [[ ! "$continue_choice" =~ ^[Yy]$ ]]; then
            log_info "تم إلغاء العملية"
            exit 0
        fi
    else
        # إنشاء repository جديد
        gh repo create "$REPO_NAME" \
            --description "$REPO_DESCRIPTION" \
            --public \
            --clone=false \
            --add-readme=false
        
        log_success "تم إنشاء repository على GitHub"
    fi
    
    # إضافة remote origin
    if ! git remote get-url origin &> /dev/null; then
        git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
        log_success "تم إضافة remote origin"
    else
        log_info "Remote origin موجود مسبقاً"
    fi
}

# رفع الكود إلى GitHub
push_to_github() {
    log_step "رفع الكود إلى GitHub..."
    
    # Push إلى main branch
    git branch -M main
    git push -u origin main
    
    log_success "تم رفع الكود بنجاح"
}

# إعداد branches الحماية
setup_branch_protection() {
    log_step "إعداد حماية الـ branches..."
    
    # حماية main branch
    gh api repos/$GITHUB_USERNAME/$REPO_NAME/branches/main/protection \
        --method PUT \
        --field required_status_checks='{"strict":true,"contexts":["build","test"]}' \
        --field enforce_admins=true \
        --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
        --field restrictions=null 2>/dev/null || log_warning "فشل في إعداد حماية الـ branch"
    
    log_success "تم إعداد حماية الـ branches"
}

# إعداد Labels
setup_labels() {
    log_step "إعداد Labels..."
    
    # حذف labels الافتراضية
    gh label delete "bug" --yes 2>/dev/null || true
    gh label delete "enhancement" --yes 2>/dev/null || true
    gh label delete "good first issue" --yes 2>/dev/null || true
    
    # إضافة labels مخصصة
    gh label create "🐛 bug" --color "d73a4a" --description "خطأ في الكود" || true
    gh label create "✨ enhancement" --color "a2eeef" --description "ميزة جديدة أو تحسين" || true
    gh label create "📖 documentation" --color "0075ca" --description "تحسين أو إضافة للوثائق" || true
    gh label create "🎨 design" --color "f9d0c4" --description "تحسينات في التصميم" || true
    gh label create "🔧 maintenance" --color "fbca04" --description "صيانة الكود" || true
    gh label create "🚀 performance" --color "0e8a16" --description "تحسين الأداء" || true
    gh label create "🔐 security" --color "ee0701" --description "مسائل أمنية" || true
    gh label create "📱 mobile" --color "bfdadc" --description "متعلق بالجوال" || true
    gh label create "🌐 frontend" --color "7057ff" --description "متعلق بالـ Frontend" || true
    gh label create "⚙️ backend" --color "ff6b6b" --description "متعلق بالـ Backend" || true
    gh label create "🎯 priority: high" --color "b60205" --description "أولوية عالية" || true
    gh label create "📌 priority: medium" --color "fbca04" --description "أولوية متوسطة" || true
    gh label create "⬇️ priority: low" --color "0e8a16" --description "أولوية منخفضة" || true
    gh label create "👶 good first issue" --color "7057ff" --description "مناسب للمبتدئين" || true
    gh label create "💙 help wanted" --color "0075ca" --description "نحتاج مساعدة" || true
    
    log_success "تم إعداد Labels"
}

# إعداد Milestones
setup_milestones() {
    log_step "إعداد Milestones..."
    
    # v1.1.0 Milestone
    gh api repos/$GITHUB_USERNAME/$REPO_NAME/milestones \
        --method POST \
        --field title="v1.1.0 - Mobile Apps" \
        --field description="إضافة تطبيقات الجوال وإشعارات Push" \
        --field due_on="$(date -d '+3 months' '+%Y-%m-%dT%H:%M:%SZ')" 2>/dev/null || true
    
    # v1.2.0 Milestone
    gh api repos/$GITHUB_USERNAME/$REPO_NAME/milestones \
        --method POST \
        --field title="v1.2.0 - AI Features" \
        --field description="إضافة ميزات الذكاء الاصطناعي والبحث المتقدم" \
        --field due_on="$(date -d '+6 months' '+%Y-%m-%dT%H:%M:%SZ')" 2>/dev/null || true
    
    # v2.0.0 Milestone
    gh api repos/$GITHUB_USERNAME/$REPO_NAME/milestones \
        --method POST \
        --field title="v2.0.0 - Web3 Integration" \
        --field description="دمج Blockchain وNFT ومزايا Web3" \
        --field due_on="$(date -d '+12 months' '+%Y-%m-%dT%H:%M:%SZ')" 2>/dev/null || true
    
    log_success "تم إعداد Milestones"
}

# إعداد GitHub Pages
setup_github_pages() {
    log_step "إعداد GitHub Pages..."
    
    # إنشاء فرع gh-pages
    git checkout --orphan gh-pages
    git rm -rf .
    
    # إنشاء صفحة index.html
    cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>منصة التواصل الاجتماعي</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
            text-align: center;
        }
        .container { max-width: 800px; padding: 2rem; }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; }
        .buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .btn {
            padding: 1rem 2rem; border: none; border-radius: 10px;
            font-size: 1rem; font-weight: bold; text-decoration: none;
            display: inline-block; transition: all 0.3s;
        }
        .btn-primary { background: #4F46E5; color: white; }
        .btn-secondary { background: rgba(255,255,255,0.2); color: white; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
        .features {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem; margin-top: 3rem;
        }
        .feature {
            background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        .feature h3 { margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌟 منصة التواصل الاجتماعي</h1>
        <p>منصة تواصل اجتماعي متقدمة مبنية بأحدث التقنيات</p>
        
        <div class="buttons">
            <a href="https://github.com/GITHUB_USERNAME/REPO_NAME" class="btn btn-primary">
                📦 عرض الكود
            </a>
            <a href="https://github.com/GITHUB_USERNAME/REPO_NAME/releases" class="btn btn-secondary">
                📥 تحميل
            </a>
            <a href="https://github.com/GITHUB_USERNAME/REPO_NAME/blob/main/DEPLOYMENT_GUIDE.md" class="btn btn-secondary">
                📖 دليل النشر
            </a>
        </div>

        <div class="features">
            <div class="feature">
                <h3>💬 رسائل فورية</h3>
                <p>دردشة مباشرة مع Socket.io</p>
            </div>
            <div class="feature">
                <h3>📹 بث مباشر</h3>
                <p>بث فيديو تفاعلي</p>
            </div>
            <div class="feature">
                <h3>🛡️ أمان متقدم</h3>
                <p>حماية وخصوصية عالية</p>
            </div>
            <div class="feature">
                <h3>📱 تصميم متجاوب</h3>
                <p>يعمل على جميع الأجهزة</p>
            </div>
        </div>
    </div>
</body>
</html>
EOF

    # استبدال placeholders
    sed -i "s/GITHUB_USERNAME/$GITHUB_USERNAME/g" index.html
    sed -i "s/REPO_NAME/$REPO_NAME/g" index.html
    
    git add index.html
    git commit -m "🌐 Add GitHub Pages"
    git push origin gh-pages
    
    # العودة إلى main
    git checkout main
    
    # تفعيل GitHub Pages
    gh api repos/$GITHUB_USERNAME/$REPO_NAME/pages \
        --method POST \
        --field source='{"branch":"gh-pages","path":"/"}' 2>/dev/null || log_warning "فشل في تفعيل GitHub Pages"
    
    log_success "تم إعداد GitHub Pages"
}

# عرض ملخص النتائج
show_summary() {
    echo -e "\n${GREEN}================================================"
    echo "🎉 تم إعداد GitHub بنجاح!"
    echo "================================================${NC}"
    echo ""
    echo "📁 Repository: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo "🌐 GitHub Pages: https://$GITHUB_USERNAME.github.io/$REPO_NAME"
    echo "⚙️ Actions: https://github.com/$GITHUB_USERNAME/$REPO_NAME/actions"
    echo "📊 Issues: https://github.com/$GITHUB_USERNAME/$REPO_NAME/issues"
    echo "🔄 Pull Requests: https://github.com/$GITHUB_USERNAME/$REPO_NAME/pulls"
    echo ""
    echo -e "${YELLOW}الخطوات التالية:${NC}"
    echo "1. راجع الـ repository على GitHub"
    echo "2. أضف collaborators إذا لزم الأمر"
    echo "3. اضبط إعدادات الـ repository"
    echo "4. ابدأ في استقبال المساهمات!"
    echo ""
    echo -e "${BLUE}نصائح:${NC}"
    echo "• استخدم Issues لتتبع المهام"
    echo "• أنشئ Pull Requests للتغييرات"
    echo "• فعّل Discussions للمجتمع"
    echo "• أضف فريق مطورين للمراجعة"
}

# الدالة الرئيسية
main() {
    welcome_message
    collect_user_info
    check_git
    check_github_cli
    setup_local_git
    create_github_repo
    push_to_github
    setup_branch_protection
    setup_labels
    setup_milestones
    setup_github_pages
    show_summary
    
    log_success "🚀 تم إعداد GitHub بنجاح!"
}

# تشغيل الدالة الرئيسية
main "$@"