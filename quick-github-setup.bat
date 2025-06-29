@echo off
chcp 65001 >nul
echo.
echo ================================================
echo 🚀 رفع المنصة على GitHub - السكريپت السريع
echo ================================================
echo.

cd /d "c:\Users\me403\Desktop\MEDIA"

echo 🔧 إعداد Git محلياً...
if not exist ".git" (
    git init
    echo ✅ تم إنشاء Git repository
)

echo 📁 إضافة جميع الملفات...
git add .

echo 💾 إنشاء Commit...
git commit -m "🎉 Initial commit: Social Media Platform - Ready for GitHub!"

echo.
echo 🌐 معلومات GitHub المطلوبة:
echo.
set /p GITHUB_USERNAME="📝 اسم المستخدم على GitHub: "

echo.
echo 🔗 الآن سنفتح GitHub في المتصفح لإنشاء Repository...
echo    1. انقر New Repository
echo    2. اسم Repository: social-media-platform  
echo    3. وصف: منصة تواصل اجتماعي متقدمة
echo    4. اختر Public
echo    5. لا تختر Add README (لدينا واحد)
echo    6. انقر Create Repository
echo.
start https://github.com/new
pause

echo.
echo 🔗 ربط Repository المحلي بـ GitHub...
git remote add origin https://github.com/%GITHUB_USERNAME%/social-media-platform.git

echo 🚀 رفع الكود إلى GitHub...
git branch -M main
git push -u origin main

echo.
echo ================================================
echo 🎉 تم رفع المنصة بنجاح!
echo ================================================
echo.
echo 🔗 رابط Repository:
echo https://github.com/%GITHUB_USERNAME%/social-media-platform
echo.
echo 📈 الخطوات التالية:
echo 1. راجع Repository على GitHub
echo 2. أضف Topics في About section
echo 3. فعّل GitHub Actions
echo 4. شارك المشروع!
echo.
start https://github.com/%GITHUB_USERNAME%/social-media-platform
pause