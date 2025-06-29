#!/bin/bash

# =================================
# سكريبت النشر الآلي للمنصة
# =================================

set -e  # توقف عند أي خطأ

# الألوان للرسائل
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # بدون لون

# المتغيرات
APP_NAME="Social Media Platform"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# دوال مساعدة
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# التحقق من متطلبات النظام
check_requirements() {
    log_info "التحقق من متطلبات النظام..."
    
    # التحقق من Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker غير مثبت. يرجى تثبيت Docker أولاً."
        exit 1
    fi
    
    # التحقق من Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose غير مثبت. يرجى تثبيت Docker Compose أولاً."
        exit 1
    fi
    
    log_success "جميع المتطلبات متوفرة"
}

# التحقق من ملف البيئة
check_env_file() {
    log_info "التحقق من ملف البيئة..."
    
    if [ ! -f "$ENV_FILE" ]; then
        log_error "ملف البيئة $ENV_FILE غير موجود"
        log_info "يرجى نسخ .env.production.example إلى .env.production وتعديل القيم"
        exit 1
    fi
    
    # التحقق من المتغيرات المطلوبة
    required_vars=("DB_PASSWORD" "JWT_SECRET" "REDIS_PASSWORD")
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$ENV_FILE" || grep -q "^$var=$" "$ENV_FILE"; then
            log_error "المتغير $var غير محدد في ملف البيئة"
            exit 1
        fi
    done
    
    log_success "ملف البيئة صحيح"
}

# إعداد شهادات SSL
setup_ssl() {
    log_info "إعداد شهادات SSL..."
    
    if [ ! -d "nginx/ssl" ]; then
        mkdir -p nginx/ssl
    fi
    
    # إنشاء شهادة موقعة ذاتياً للتطوير (استبدلها بشهادة حقيقية للإنتاج)
    if [ ! -f "nginx/ssl/certificate.crt" ] || [ ! -f "nginx/ssl/private.key" ]; then
        log_warning "إنشاء شهادة SSL موقعة ذاتياً للتطوير..."
        log_warning "للإنتاج، استبدلها بشهادة حقيقية من Let's Encrypt أو مزود آخر"
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/private.key \
            -out nginx/ssl/certificate.crt \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=yourapp.com"
        
        log_success "تم إنشاء شهادة SSL"
    else
        log_success "شهادات SSL موجودة"
    fi
}

# بناء الصور
build_images() {
    log_info "بناء صور Docker..."
    
    # تحميل متغيرات البيئة
    export $(grep -v '^#' $ENV_FILE | xargs)
    
    # بناء الصور
    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
    
    log_success "تم بناء الصور بنجاح"
}

# تشغيل قاعدة البيانات أولاً
start_database() {
    log_info "تشغيل قاعدة البيانات..."
    
    docker-compose -f $DOCKER_COMPOSE_FILE up -d postgres redis
    
    # انتظار جاهزية قاعدة البيانات
    log_info "انتظار جاهزية قاعدة البيانات..."
    until docker-compose -f $DOCKER_COMPOSE_FILE exec postgres pg_isready; do
        sleep 2
    done
    
    log_success "قاعدة البيانات جاهزة"
}

# تشغيل التطبيق
start_application() {
    log_info "تشغيل التطبيق..."
    
    # تحميل متغيرات البيئة
    export $(grep -v '^#' $ENV_FILE | xargs)
    
    # تشغيل جميع الخدمات
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    # انتظار جاهزية الخدمات
    log_info "انتظار جاهزية الخدمات..."
    sleep 30
    
    # التحقق من حالة الخدمات
    if docker-compose -f $DOCKER_COMPOSE_FILE ps | grep -q "Up"; then
        log_success "تم تشغيل التطبيق بنجاح"
    else
        log_error "فشل في تشغيل التطبيق"
        docker-compose -f $DOCKER_COMPOSE_FILE logs
        exit 1
    fi
}

# عرض معلومات النشر
show_deployment_info() {
    log_success "تم نشر $APP_NAME بنجاح!"
    echo ""
    echo "معلومات النشر:"
    echo "==============="
    echo "🌐 الموقع الرئيسي: http://localhost:3000"
    echo "🔧 لوحة الإدارة: http://localhost:3000/admin"
    echo "📊 Grafana: http://localhost:3001 (admin/admin)"
    echo "📈 Prometheus: http://localhost:9090"
    echo ""
    echo "أوامر مفيدة:"
    echo "============="
    echo "عرض حالة الخدمات: docker-compose -f $DOCKER_COMPOSE_FILE ps"
    echo "عرض السجلات: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    echo "إيقاف التطبيق: docker-compose -f $DOCKER_COMPOSE_FILE down"
    echo "إعادة تشغيل: docker-compose -f $DOCKER_COMPOSE_FILE restart"
    echo ""
    log_warning "لا تنس:"
    echo "- تحديث النطاق في ملف البيئة"
    echo "- الحصول على شهادة SSL حقيقية للإنتاج"
    echo "- إعداد النسخ الاحتياطي"
    echo "- مراقبة السجلات والأداء"
}

# التنظيف في حالة الخطأ
cleanup_on_error() {
    log_error "حدث خطأ أثناء النشر"
    log_info "إيقاف الخدمات..."
    docker-compose -f $DOCKER_COMPOSE_FILE down
    exit 1
}

# إعداد معالج الأخطاء
trap cleanup_on_error ERR

# الدالة الرئيسية
main() {
    echo "================================================"
    echo "🚀 بدء نشر $APP_NAME"
    echo "================================================"
    
    check_requirements
    check_env_file
    setup_ssl
    build_images
    start_database
    start_application
    show_deployment_info
    
    echo "================================================"
    echo "✅ تم النشر بنجاح!"
    echo "================================================"
}

# تشغيل الدالة الرئيسية
main "$@"