#!/bin/bash

# =================================
# سكريبت النسخ الاحتياطي الذكي
# =================================

set -e

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# المتغيرات
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30
DB_CONTAINER="social_media_db"
REDIS_CONTAINER="social_media_redis"

# دوال مساعدة
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# إنشاء مجلدات النسخ الاحتياطي
create_backup_dirs() {
    log_info "إنشاء مجلدات النسخ الاحتياطي..."
    mkdir -p $BACKUP_DIR/{database,redis,uploads,configs}
    log_success "تم إنشاء المجلدات"
}

# نسخ احتياطي لقاعدة البيانات
backup_database() {
    log_info "إنشاء نسخة احتياطية لقاعدة البيانات..."
    
    if docker ps | grep -q $DB_CONTAINER; then
        docker exec $DB_CONTAINER pg_dump -U postgres social_media > $BACKUP_DIR/database/db_backup_$DATE.sql
        gzip $BACKUP_DIR/database/db_backup_$DATE.sql
        log_success "تم إنشاء نسخة احتياطية لقاعدة البيانات"
    else
        log_error "حاوية قاعدة البيانات غير متاحة"
        return 1
    fi
}

# نسخ احتياطي لـ Redis
backup_redis() {
    log_info "إنشاء نسخة احتياطية لـ Redis..."
    
    if docker ps | grep -q $REDIS_CONTAINER; then
        docker exec $REDIS_CONTAINER redis-cli BGSAVE
        sleep 5
        docker cp $REDIS_CONTAINER:/data/dump.rdb $BACKUP_DIR/redis/redis_backup_$DATE.rdb
        gzip $BACKUP_DIR/redis/redis_backup_$DATE.rdb
        log_success "تم إنشاء نسخة احتياطية لـ Redis"
    else
        log_warning "حاوية Redis غير متاحة"
    fi
}

# نسخ احتياطي للملفات المرفوعة
backup_uploads() {
    log_info "إنشاء نسخة احتياطية للملفات المرفوعة..."
    
    if [ -d "./uploads" ]; then
        tar -czf $BACKUP_DIR/uploads/uploads_backup_$DATE.tar.gz ./uploads
        log_success "تم إنشاء نسخة احتياطية للملفات المرفوعة"
    else
        log_warning "مجلد الملفات المرفوعة غير موجود"
    fi
}

# نسخ احتياطي للإعدادات
backup_configs() {
    log_info "إنشاء نسخة احتياطية للإعدادات..."
    
    cp .env.production $BACKUP_DIR/configs/env_backup_$DATE 2>/dev/null || log_warning "ملف .env.production غير موجود"
    cp docker-compose.prod.yml $BACKUP_DIR/configs/docker-compose_backup_$DATE.yml 2>/dev/null || log_warning "ملف docker-compose.prod.yml غير موجود"
    cp -r nginx/ $BACKUP_DIR/configs/nginx_backup_$DATE/ 2>/dev/null || log_warning "مجلد nginx غير موجود"
    
    log_success "تم إنشاء نسخة احتياطية للإعدادات"
}

# رفع للتخزين السحابي (اختياري)
upload_to_cloud() {
    log_info "رفع النسخ الاحتياطية للتخزين السحابي..."
    
    # AWS S3
    if command -v aws &> /dev/null && [ ! -z "$AWS_S3_BACKUP_BUCKET" ]; then
        aws s3 sync $BACKUP_DIR s3://$AWS_S3_BACKUP_BUCKET/backups/$(date +%Y/%m/%d)/ --delete
        log_success "تم رفع النسخ الاحتياطية إلى AWS S3"
    fi
    
    # Google Cloud Storage
    if command -v gsutil &> /dev/null && [ ! -z "$GCS_BACKUP_BUCKET" ]; then
        gsutil -m rsync -r -d $BACKUP_DIR gs://$GCS_BACKUP_BUCKET/backups/$(date +%Y/%m/%d)/
        log_success "تم رفع النسخ الاحتياطية إلى Google Cloud Storage"
    fi
}

# حذف النسخ القديمة
cleanup_old_backups() {
    log_info "حذف النسخ الاحتياطية القديمة (أكثر من $KEEP_DAYS يوم)..."
    
    find $BACKUP_DIR -type f -mtime +$KEEP_DAYS -delete
    find $BACKUP_DIR -type d -empty -delete
    
    log_success "تم حذف النسخ الاحتياطية القديمة"
}

# إنشاء تقرير النسخ الاحتياطي
create_backup_report() {
    log_info "إنشاء تقرير النسخ الاحتياطي..."
    
    REPORT_FILE="$BACKUP_DIR/backup_report_$DATE.txt"
    
    cat > $REPORT_FILE << EOF
=================================
تقرير النسخ الاحتياطي
=================================
التاريخ: $(date)
الخادم: $(hostname)
المستخدم: $(whoami)

أحجام النسخ الاحتياطية:
$(du -sh $BACKUP_DIR/*/*)

مساحة القرص المتاحة:
$(df -h)

حالة الخدمات:
$(docker-compose -f docker-compose.prod.yml ps)

سجل النسخ الاحتياطي:
- تم إنشاء نسخة احتياطية لقاعدة البيانات
- تم إنشاء نسخة احتياطية لـ Redis
- تم إنشاء نسخة احتياطية للملفات المرفوعة
- تم إنشاء نسخة احتياطية للإعدادات

=================================
EOF

    log_success "تم إنشاء تقرير النسخ الاحتياطي: $REPORT_FILE"
}

# إرسال إشعار
send_notification() {
    local status=$1
    local message=$2
    
    # Slack notification
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            $SLACK_WEBHOOK_URL
    fi
    
    # Email notification
    if command -v mail &> /dev/null && [ ! -z "$NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "تقرير النسخ الاحتياطي - $status" $NOTIFICATION_EMAIL
    fi
}

# الدالة الرئيسية
main() {
    log_info "🔄 بدء عملية النسخ الاحتياطي..."
    
    START_TIME=$(date +%s)
    
    create_backup_dirs
    
    # تنفيذ النسخ الاحتياطي
    if backup_database && backup_redis && backup_uploads && backup_configs; then
        upload_to_cloud
        cleanup_old_backups
        create_backup_report
        
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        
        log_success "✅ تم إنجاز النسخ الاحتياطي بنجاح في $DURATION ثانية"
        send_notification "نجح" "تم إنجاز النسخ الاحتياطي بنجاح في $DURATION ثانية"
    else
        log_error "❌ فشل في إنجاز النسخ الاحتياطي"
        send_notification "فشل" "فشل في إنجاز النسخ الاحتياطي - يرجى التحقق من السجلات"
        exit 1
    fi
}

# تشغيل الدالة الرئيسية
main "$@"