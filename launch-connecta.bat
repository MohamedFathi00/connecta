@echo off
chcp 65001 >nul
color 0B
echo.
echo ================================
echo ✨ Connecta Launch Sequence! ✨
echo ================================
echo.
echo 🚀 Launching Connecta to GitHub...
echo.

cd /d "c:\Users\me403\Desktop\MEDIA"

echo 📝 What's your GitHub username?
set /p GITHUB_USERNAME="GitHub Username: "

echo.
echo 🔗 Creating remote connection...
git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USERNAME%/connecta.git

echo.
echo 🚀 Launching Connecta to the world...
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ================================
    echo 🎉 Connecta Successfully Launched!
    echo ================================
    echo.
    echo 🌟 Your Connecta is now live at:
    echo https://github.com/%GITHUB_USERNAME%/connecta
    echo.
    echo 📈 Next steps:
    echo 1. Add description and topics
    echo 2. Enable GitHub Actions
    echo 3. Create your first release
    echo 4. Share with the world!
    echo.
    start https://github.com/%GITHUB_USERNAME%/connecta
    echo 🎯 Connecta repository opened in browser!
) else (
    echo.
    echo ❌ Launch failed. Please check:
    echo 1. Repository exists on GitHub
    echo 2. Username is correct
    echo 3. Internet connection is stable
)

echo.
pause