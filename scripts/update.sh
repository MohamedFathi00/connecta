#!/bin/bash

# =================================
# سكريبت التحديث الآمن للمنصة
# =================================

set -e

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# المتغيرات
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="/backups/pre-update-$(date +%Y%m%d_%H%M%S)"
MAINTENANCE_FILE="maintenance.html"

# دوال مساعدة
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# التحقق من الصلاحيات
check_permissions() {
    if [ "$EUID" -eq 0 ]; then
        log_error "لا تشغل هذا السكريبت كـ root"
        exit 1
    fi
    
    if ! groups $USER | grep -q docker; then
        log_error "المستخدم $USER ليس في مجموعة docker"
        exit 1
    fi
}

# التحقق من حالة النظام
check_system_health() {
    log_info "التحقق من حالة النظام..."
    
    # التحقق من مساحة القرص
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        log_warning "مساحة القرص منخفضة: $DISK_USAGE%"
    fi
    
    # التحقق من الذاكرة
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ $MEMORY_USAGE -gt 80 ]; then
        log_warning "استخدام الذاكرة عالي: $MEMORY_USAGE%"
    fi
    
    # التحقق من حالة الخدمات
    if ! docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
        log_error "بعض الخدمات لا تعمل"
        exit 1
    fi
    
    log_success "النظام في حالة جيدة"
}

# تفعيل وضع الصيانة
enable_maintenance_mode() {
    log_info "تفعيل وضع الصيانة..."
    
    # إنشاء صفحة الصيانة
    cat > /tmp/$MAINTENANCE_FILE << 'EOF'
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صيانة - منصة التواصل الاجتماعي</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .container {
            max-width: 500px;
            padding: 2rem;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .eta {
            margin-top: 2rem;
            font-size: 0.9rem;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔧</div>
        <h1>جاري التحديث</h1>
        <p>نعمل على تحسين منصتك المفضلة<br>سنعود قريباً بميزات جديدة ومحسنة!</p>
        <div class="spinner"></div>
        <div class="eta">
            <p>الوقت المتوقع للانتهاء: 5-10 دقائق</p>
            <p>تابعنا على وسائل التواصل الاجتماعي للحصول على التحديثات</p>
        </div>
    </div>
    <script>
        // تحديث الوقت كل دقيقة
        setInterval(() => {
            location.reload();
        }, 60000);
    </script>
</body>
</html>
EOF

    # نسخ صفحة الصيانة
    docker cp /tmp/$MAINTENANCE_FILE $(docker-compose -f $COMPOSE_FILE ps -q frontend):/usr/share/nginx/html/maintenance.html
    
    # إعادة توجيه كل الطلبات لصفحة الصيانة
    docker exec $(docker-compose -f $COMPOSE_FILE ps -q nginx) \
        sed -i 's|try_files $uri $uri/ /index.html;|return 503;|g' /etc/nginx/sites-available/social-media.conf
    
    docker exec $(docker-compose -f $COMPOSE_FILE ps -q nginx) \
        sed -i '/error_page 503/d' /etc/nginx/sites-available/social-media.conf
    
    docker exec $(docker-compose -f $COMPOSE_FILE ps -q nginx) \
        sed -i '/location = \/50x.html/i error_page 503 /maintenance.html;' /etc/nginx/sites-available/social-media.conf
    
    docker exec $(docker-compose -f $COMPOSE_FILE ps -q nginx) nginx -s reload
    
    log_success "تم تفعيل وضع الصيانة"
}

# إلغاء وضع الصيانة
disable_maintenance_mode() {
    log_info "إلغاء وضع الصيانة..."
    
    # استعادة إعدادات nginx الأصلية
    docker exec $(docker-compose -f $COMPOSE_FILE ps -q nginx) \
        sed -i 's|return 503;|try_files $uri $uri/ /index.html;|g' /etc/nginx/sites-available/social-media.conf
    
    docker exec $(docker-compose -f $COMPOSE_FILE ps -q nginx) \
        sed -i '/error_page 503 \/maintenance.html;/d' /etc/nginx/sites-available/social-media.conf
    
    docker exec $(docker-compose -f $COMPOSE_FILE ps -q nginx) nginx -s reload
    
    log_success "تم إلغاء وضع الصيانة"
}

# إنشاء نسخة احتياطية قبل التحديث
create_pre_update_backup() {
    log_info "إنشاء نسخة احتياطية قبل التحديث..."
    
    mkdir -p $BACKUP_DIR
    
    # نسخ احتياطي لقاعدة البيانات
    docker exec $(docker-compose -f $COMPOSE_FILE ps -q postgres) \
        pg_dump -U postgres social_media > $BACKUP_DIR/database_backup.sql
    
    # نسخ احتياطي للملفات
    cp -r uploads $BACKUP_DIR/ 2>/dev/null || true
    cp .env.production $BACKUP_DIR/ 2>/dev/null || true
    cp $COMPOSE_FILE $BACKUP_DIR/
    
    log_success "تم إنشاء نسخة احتياطية في: $BACKUP_DIR"
}

# تحديث الكود
update_code() {
    log_info "تحديث الكود من Git..."
    
    # حفظ التغييرات المحلية
    git stash push -m "Pre-update stash $(date)"
    
    # سحب آخر التحديثات
    git fetch origin
    git pull origin main
    
    log_success "تم تحديث الكود"
}

# تحديث الصور
update_images() {
    log_info "تحديث صور Docker..."
    
    # بناء الصور الجديدة
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    log_success "تم تحديث الصور"
}

# تشغيل migrations
run_migrations() {
    log_info "تشغيل migrations قاعدة البيانات..."
    
    # تشغيل migrations إذا كانت موجودة
    if [ -f "backend/migrations" ]; then
        docker-compose -f $COMPOSE_FILE exec backend npm run migrate
        log_success "تم تشغيل migrations"
    else
        log_info "لا توجد migrations للتشغيل"
    fi
}

# إعادة تشغيل الخدمات
restart_services() {
    log_info "إعادة تشغيل الخدمات..."
    
    # إعادة تشغيل الخدمات بالترتيب الصحيح
    docker-compose -f $COMPOSE_FILE up -d --force-recreate
    
    # انتظار جاهزية الخدمات
    log_info "انتظار جاهزية الخدمات..."
    sleep 30
    
    # التحقق من صحة الخدمات
    if docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
        log_success "تم إعادة تشغيل الخدمات بنجاح"
    else
        log_error "فشل في إعادة تشغيل بعض الخدمات"
        return 1
    fi
}

# اختبار صحة التطبيق
health_check() {
    log_info "فحص صحة التطبيق..."
    
    # اختبار الصحة العامة
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "فحص الصحة العامة: نجح"
    else
        log_error "فحص الصحة العامة: فشل"
        return 1
    fi
    
    # اختبار API
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        log_success "فحص API: نجح"
    else
        log_error "فحص API: فشل"
        return 1
    fi
    
    # اختبار قاعدة البيانات
    if docker-compose -f $COMPOSE_FILE exec postgres pg_isready > /dev/null 2>&1; then
        log_success "فحص قاعدة البيانات: نجح"
    else
        log_error "فحص قاعدة البيانات: فشل"
        return 1
    fi
}

# التراجع عن التحديث
rollback() {
    log_error "التراجع عن التحديث..."
    
    # التراجع في Git
    git reset --hard HEAD~1
    
    # استعادة النسخة الاحتياطية لقاعدة البيانات
    if [ -f "$BACKUP_DIR/database_backup.sql" ]; then
        docker exec -i $(docker-compose -f $COMPOSE_FILE ps -q postgres) \
            psql -U postgres social_media < $BACKUP_DIR/database_backup.sql
    fi
    
    # إعادة بناء وتشغيل الصور القديمة
    docker-compose -f $COMPOSE_FILE build --no-cache
    docker-compose -f $COMPOSE_FILE up -d --force-recreate
    
    disable_maintenance_mode
    
    log_success "تم التراجع عن التحديث"
}

# إرسال إشعار
send_update_notification() {
    local status=$1
    local message=$2
    
    # Slack notification
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🔄 تحديث المنصة - $status: $message\"}" \
            $SLACK_WEBHOOK_URL
    fi
}

# تنظيف الموارد
cleanup() {
    log_info "تنظيف الموارد..."
    
    # حذف الصور غير المستخدمة
    docker image prune -f
    
    # حذف الحاويات المتوقفة
    docker container prune -f
    
    # حذف الشبكات غير المستخدمة
    docker network prune -f
    
    log_success "تم تنظيف الموارد"
}

# الدالة الرئيسية
main() {
    log_info "🚀 بدء عملية التحديث..."
    
    START_TIME=$(date +%s)
    
    # التحقق من الصلاحيات والحالة
    check_permissions
    check_system_health
    
    # تفعيل وضع الصيانة
    enable_maintenance_mode
    send_update_notification "بدء" "تم بدء عملية التحديث"
    
    # إنشاء نسخة احتياطية
    create_pre_update_backup
    
    # تحديث النظام
    if update_code && update_images && run_migrations && restart_services; then
        # اختبار النظام
        if health_check; then
            disable_maintenance_mode
            cleanup
            
            END_TIME=$(date +%s)
            DURATION=$((END_TIME - START_TIME))
            
            log_success "✅ تم التحديث بنجاح في $DURATION ثانية"
            send_update_notification "نجح" "تم التحديث بنجاح في $DURATION ثانية"
        else
            log_error "فشل في اختبار صحة النظام - جاري التراجع"
            rollback
            send_update_notification "فشل" "فشل في اختبار صحة النظام - تم التراجع"
            exit 1
        fi
    else
        log_error "فشل في التحديث - جاري التراجع"
        rollback
        send_update_notification "فشل" "فشل في التحديث - تم التراجع"
        exit 1
    fi
}

# معالج الإشارات للتنظيف عند المقاطعة
trap 'log_error "تم مقاطعة التحديث"; disable_maintenance_mode; exit 1' INT TERM

# تشغيل الدالة الرئيسية
main "$@"