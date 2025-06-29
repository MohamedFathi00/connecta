@echo off
chcp 65001 >nul
echo ================================
echo 🚀 Connecta Final Push to GitHub
echo ================================
echo.

cd /d "c:\Users\me403\Desktop\MEDIA"

echo 🔗 Setting up remote connection...
git remote remove origin 2>nul
git remote add origin https://github.com/MohamedFathi00/connecta.git

echo.
echo 🚀 Pushing Connecta to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ================================
    echo 🎉 SUCCESS! Connecta is LIVE! 🎉
    echo ================================
    echo.
    echo 🌟 Connecta is now available at:
    echo https://github.com/MohamedFathi00/connecta
    echo.
    echo 📈 Next steps:
    echo 1. Add topics: social-media, react, nodejs, socket-io
    echo 2. Enable GitHub Actions
    echo 3. Share with the world!
    echo.
    start https://github.com/MohamedFathi00/connecta
) else (
    echo.
    echo ❌ Push failed. Make sure:
    echo 1. Repository exists: https://github.com/MohamedFathi00/connecta
    echo 2. You have push permissions
    echo 3. Internet connection is stable
    echo.
    echo Try again after creating the repository!
)

echo.
pause