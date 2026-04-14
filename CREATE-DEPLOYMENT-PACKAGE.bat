@echo off
echo ==========================================
echo  Create Deployment Package for Hosting
echo ==========================================
echo.
echo This creates a clean ZIP file ready for upload.
echo.
pause

REM Create deployment folder
set DEPLOY_FOLDER=deployment-ready
echo Creating deployment folder...
if exist %DEPLOY_FOLDER% rmdir /s /q %DEPLOY_FOLDER%
mkdir %DEPLOY_FOLDER%
mkdir %DEPLOY_FOLDER%\php-api
mkdir %DEPLOY_FOLDER%\uploads

echo.
echo [1/4] Copying built frontend files...
if exist public_html\index.html (
    xcopy public_html\* %DEPLOY_FOLDER%\ /E /I /Y /Q
    echo Frontend files copied.
) else (
    echo WARNING: public_html\index.html not found!
    echo Please run: npm run build
    echo Then copy dist files to public_html/
    pause
    exit /b 1
)

echo.
echo [2/4] Copying PHP backend...
xcopy php-api\* %DEPLOY_FOLDER%\php-api\ /E /I /Y /Q
echo PHP backend copied.

echo.
echo [3/4] Creating empty uploads folder...
echo (This is where user images will be stored)
mkdir %DEPLOY_FOLDER%\uploads 2>nul
echo Done.

echo.
echo [4/4] Creating deployment ZIP...
if exist bema-geetz-deployment.zip del bema-geetz-deployment.zip
powershell Compress-Archive -Path %DEPLOY_FOLDER%\* -DestinationPath bema-geetz-deployment.zip -Force
echo ZIP created: bema-geetz-deployment.zip

echo.
echo Cleaning up temporary folder...
rmdir /s /q %DEPLOY_FOLDER%

echo.
echo ==========================================
echo  Deployment Package Ready!
echo ==========================================
echo.
echo File: bema-geetz-deployment.zip
echo Size:
dir bema-geetz-deployment.zip /-c | findstr "bema-geetz-deployment.zip"
echo.
echo Contents:
echo - index.html (frontend)
echo - assets/ (JS, CSS, images)
echo - php-api/ (backend API)
echo - uploads/ (empty image folder)
echo - .htaccess (routing)
echo.
echo Next steps:
echo 1. Upload bema-geetz-deployment.zip to hosting
echo 2. Extract in public_html/ folder
echo 3. Import database/schema.sql via phpMyAdmin
echo 4. Configure payment settings
echo.
echo See DEPLOYMENT-CLEANUP-GUIDE.md for detailed instructions.
echo.
pause
