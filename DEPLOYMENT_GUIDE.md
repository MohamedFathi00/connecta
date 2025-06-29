# 🚀 دليل النشر الشامل - منصة التواصل الاجتماعي

## 📋 جدول المحتويات
- [متطلبات النظام](#متطلبات-النظام)
- [إعداد البيئة](#إعداد-البيئة)
- [النشر المحلي](#النشر-المحلي)
- [النشر السحابي](#النشر-السحابي)
- [إعداد النطاق وSSL](#إعداد-النطاق-وssl)
- [المراقبة والصيانة](#المراقبة-والصيانة)
- [الأمان والحماية](#الأمان-والحماية)
- [النسخ الاحتياطي](#النسخ-الاحتياطي)
- [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## 🔧 متطلبات النظام

### الحد الأدنى للمتطلبات:
- **المعالج**: 2 CPU cores
- **الذاكرة**: 4GB RAM
- **التخزين**: 20GB SSD
- **الشبكة**: 10 Mbps

### المتطلبات المُوصى بها:
- **المعالج**: 4+ CPU cores
- **الذاكرة**: 8GB+ RAM
- **التخزين**: 50GB+ SSD
- **الشبكة**: 100 Mbps+

### البرامج المطلوبة:
- Docker 20.10+
- Docker Compose 2.0+
- Git
- OpenSSL (لإنشاء شهادات SSL)

---

## ⚙️ إعداد البيئة

### 1. تحضير الخادم
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# تثبيت Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# إضافة المستخدم لمجموعة Docker
sudo usermod -aG docker $USER
```

### 2. تحميل المشروع
```bash
git clone https://github.com/yourusername/social-media-platform.git
cd social-media-platform
```

### 3. إعداد متغيرات البيئة
```bash
# نسخ ملف البيئة
cp .env.production.example .env.production

# تعديل المتغيرات (مهم جداً!)
nano .env.production
```

**⚠️ متغيرات مهمة يجب تغييرها:**
- `DB_PASSWORD`: كلمة مرور قاعدة البيانات
- `REDIS_PASSWORD`: كلمة مرور Redis
- `JWT_SECRET`: مفتاح JWT (32+ حرف)
- `JWT_REFRESH_SECRET`: مفتاح refresh token
- `EMAIL_USER` و `EMAIL_PASS`: بيانات البريد الإلكتروني

---

## 🏠 النشر المحلي

### النشر السريع:
```bash
# تشغيل سكريبت النشر الآلي
chmod +x deploy.sh
./deploy.sh
```

### النشر اليدوي:
```bash
# بناء الصور
docker-compose -f docker-compose.prod.yml build

# تشغيل الخدمات
docker-compose -f docker-compose.prod.yml up -d

# مراقبة السجلات
docker-compose -f docker-compose.prod.yml logs -f
```

### التحقق من النشر:
```bash
# التحقق من حالة الخدمات
docker-compose -f docker-compose.prod.yml ps

# اختبار الصحة
curl http://localhost/health
curl http://localhost/api/health
```

---

## ☁️ النشر السحابي

### AWS EC2

#### 1. إنشاء Instance:
- **نوع المثيل**: t3.medium أو أكبر
- **نظام التشغيل**: Ubuntu 22.04 LTS
- **مجموعة الأمان**: 
  - HTTP (80)
  - HTTPS (443)
  - SSH (22)
  - Custom TCP (3000) للتطوير

#### 2. إعداد Domain وELB:
```bash
# تثبيت AWS CLI
sudo apt install awscli -y

# إعداد Load Balancer (اختياري)
aws elbv2 create-load-balancer \
  --name social-media-lb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx
```

### DigitalOcean Droplet

#### 1. إنشاء Droplet:
```bash
# باستخدام doctl
doctl compute droplet create social-media-prod \
  --size s-2vcpu-4gb \
  --image ubuntu-22-04-x64 \
  --region nyc1 \
  --ssh-keys YOUR_SSH_KEY_ID
```

#### 2. إعداد Firewall:
```bash
# إعداد UFW
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### Google Cloud Platform

#### 1. إنشاء VM Instance:
```bash
gcloud compute instances create social-media-vm \
  --machine-type=e2-standard-2 \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB \
  --tags=http-server,https-server
```

### Microsoft Azure

#### 1. إنشاء Virtual Machine:
```bash
az vm create \
  --resource-group myResourceGroup \
  --name social-media-vm \
  --image UbuntuLTS \
  --admin-username azureuser \
  --generate-ssh-keys \
  --size Standard_B2s
```

---

## 🌐 إعداد النطاق وSSL

### 1. إعداد DNS:
```
# إعدادات DNS المطلوبة:
A     @           YOUR_SERVER_IP
A     www         YOUR_SERVER_IP
A     api         YOUR_SERVER_IP
CNAME cdn         YOUR_CDN_URL (اختياري)
```

### 2. الحصول على شهادة SSL (Let's Encrypt):
```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx -y

# الحصول على الشهادة
sudo certbot --nginx -d yourapp.com -d www.yourapp.com -d api.yourapp.com

# إعداد التجديد التلقائي
sudo crontab -e
# إضافة: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. إعداد Cloudflare (اختياري):
```bash
# تفعيل Proxy في Cloudflare
# إعداد SSL/TLS mode: Full (Strict)
# تفعيل HSTS
# إعداد Page Rules للكاش
```

---

## 📊 المراقبة والصيانة

### 1. Grafana Dashboards:
- **URL**: http://yourapp.com:3001
- **تسجيل الدخول**: admin/admin (غيّرها!)
- **Dashboards**: 
  - System Overview
  - Application Metrics
  - Database Performance
  - User Analytics

### 2. Prometheus Metrics:
- **URL**: http://yourapp.com:9090
- **Metrics المهمة**:
  - `http_requests_total`
  - `database_connections`
  - `memory_usage`
  - `response_time`

### 3. Log Management:
```bash
# عرض السجلات
docker-compose -f docker-compose.prod.yml logs -f [service_name]

# تنظيف السجلات القديمة
docker system prune -f --volumes
```

### 4. إعداد التنبيهات:
```yaml
# alerting/rules.yml
groups:
  - name: social_media_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        annotations:
          summary: "معدل أخطاء عالي"
```

---

## 🔒 الأمان والحماية

### 1. Firewall Configuration:
```bash
# إعداد UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. إعداد Fail2Ban:
```bash
# تثبيت Fail2Ban
sudo apt install fail2ban -y

# إعداد nginx jail
sudo tee /etc/fail2ban/jail.local << EOF
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
bantime = 600
EOF

sudo systemctl restart fail2ban
```

### 3. إعداد Log Monitoring:
```bash
# تثبيت Logwatch
sudo apt install logwatch -y

# إعداد التقارير اليومية
echo "Daily = yes" | sudo tee -a /etc/logwatch/conf/logwatch.conf
```

### 4. Database Security:
```sql
-- إنشاء مستخدم محدود الصلاحيات
CREATE USER 'app_user'@'%' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON social_media.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
```

---

## 💾 النسخ الاحتياطي

### 1. Database Backup:
```bash
#!/bin/bash
# backup_db.sh

BACKUP_DIR="/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="social_media"

mkdir -p $BACKUP_DIR

# PostgreSQL backup
docker exec social_media_db pg_dump -U postgres $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# ضغط الملف
gzip $BACKUP_DIR/db_backup_$DATE.sql

# حذف النسخ القديمة (أكثر من 30 يوم)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### 2. Files Backup:
```bash
#!/bin/bash
# backup_files.sh

BACKUP_DIR="/backups/files"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# نسخ ملفات الرفع
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz ./uploads

# نسخ إعدادات البيئة
cp .env.production $BACKUP_DIR/env_backup_$DATE

# رفع للتخزين السحابي (AWS S3)
aws s3 cp $BACKUP_DIR/uploads_backup_$DATE.tar.gz \
  s3://your-backup-bucket/backups/
```

### 3. Automated Backup:
```bash
# إضافة للـ crontab
sudo crontab -e

# نسخ احتياطي يومي في 2:00 AM
0 2 * * * /path/to/backup_db.sh
30 2 * * * /path/to/backup_files.sh

# نسخ احتياطي أسبوعي للنظام كامل
0 3 * * 0 /path/to/full_backup.sh
```

---

## 🔧 استكشاف الأخطاء

### مشاكل شائعة:

#### 1. الخدمة لا تبدأ:
```bash
# التحقق من السجلات
docker-compose -f docker-compose.prod.yml logs [service_name]

# التحقق من حالة الذاكرة
free -h
df -h

# إعادة تشغيل الخدمة
docker-compose -f docker-compose.prod.yml restart [service_name]
```

#### 2. بطء في الأداء:
```bash
# مراقبة استخدام الموارد
docker stats

# التحقق من قاعدة البيانات
docker exec -it social_media_db psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# تحسين فهارس قاعدة البيانات
docker exec -it social_media_db psql -U postgres -d social_media -c "REINDEX DATABASE social_media;"
```

#### 3. مشاكل SSL:
```bash
# اختبار الشهادة
openssl s_client -connect yourapp.com:443 -servername yourapp.com

# تجديد الشهادة
sudo certbot renew --dry-run
```

#### 4. مشاكل الذاكرة:
```bash
# تنظيف Docker
docker system prune -a -f --volumes

# إعادة تشغيل الخدمات
docker-compose -f docker-compose.prod.yml restart
```

### أوامر مفيدة:

```bash
# عرض استخدام الموارد
docker stats --no-stream

# عرض مساحة التخزين
docker system df

# تصدير قاعدة البيانات
docker exec social_media_db pg_dump -U postgres social_media > backup.sql

# استيراد قاعدة البيانات
docker exec -i social_media_db psql -U postgres social_media < backup.sql

# مراقبة السجلات المباشرة
tail -f /var/log/nginx/access.log

# اختبار الأداء
ab -n 1000 -c 10 http://yourapp.com/
```

---

## 📞 الدعم والمساعدة

### الحصول على المساعدة:
- **الوثائق**: `/docs`
- **السجلات**: `docker-compose logs`
- **المراقبة**: Grafana Dashboard
- **التواصل**: support@yourapp.com

### مجتمع المطورين:
- **GitHub Issues**: للأخطاء والطلبات
- **Discord**: للدردشة المباشرة
- **Forum**: للنقاشات التقنية

---

## ✅ قائمة مراجعة النشر

### قبل النشر:
- [ ] تحديث جميع المتغيرات في `.env.production`
- [ ] اختبار التطبيق محلياً
- [ ] إعداد النطاق وDNS
- [ ] الحصول على شهادات SSL
- [ ] إعداد النسخ الاحتياطي
- [ ] تكوين المراقبة

### بعد النشر:
- [ ] اختبار جميع الوظائف
- [ ] التحقق من شهادات SSL
- [ ] إعداد التنبيهات
- [ ] تدريب الفريق
- [ ] إعداد الصيانة الدورية
- [ ] توثيق العمليات

---

## 🎯 الخطوات التالية

### تحسينات الأداء:
1. **إعداد CDN** (Cloudflare/AWS CloudFront)
2. **تحسين قاعدة البيانات** (فهارس وتكوينات)
3. **إعداد Load Balancer** للتوسع الأفقي
4. **تحسين الصور** وضغطها تلقائياً

### ميزات إضافية:
1. **تطبيقات الجوال** (React Native)
2. **إشعارات push** متقدمة
3. **ذكاء اصطناعي** لتحليل المحتوى
4. **نظام دفع** متكامل

---

**🚀 تهانينا! منصتك الآن جاهزة للعالم!**

للمساعدة والدعم، تواصل معنا على: support@yourapp.com