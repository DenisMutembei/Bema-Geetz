@echo off
echo ==========================================
echo  Bema Geetz - Deployment Cleanup Script
echo ==========================================
echo.
echo This will clean your local files for hosting upload.
echo Only NECESSARY files will remain.
echo.
pause

echo.
echo [1/8] Removing frontend node_modules (dev dependencies)...
rmdir /s /q frontend\node_modules 2>nul
echo Done.

echo.
echo [2/8] Removing old backend folder (Node.js - replaced by PHP)...
rmdir /s /q backend 2>nul
echo Done.

echo.
echo [3/8] Removing Docker files (not for shared hosting)...
del Dockerfile 2>nul
del Dockerfile.dev 2>nul
del docker-compose.yml 2>nul
del docker-compose.dev.yml 2>nul
del .dockerignore 2>nul
echo Done.

echo.
echo [4/8] Removing IDE/editor files...
rmdir /s /q .vscode 2>nul
rmdir /s /q .idea 2>nul
del .editorconfig 2>nul
echo Done.

echo.
echo [5/8] Removing log files...
del *.log 2>nul
del npm-debug.log 2>nul
del yarn-error.log 2>nul
echo Done.

echo.
echo [6/8] Removing temporary files...
del *.tmp 2>nul
del *.cache 2>nul
del Thumbs.db /s 2>nul
echo Done.

echo.
echo [7/8] IMPORTANT: Deleting install.php for security...
echo (This file should be deleted after database setup)
del php-api\install.php 2>nul
echo Done.

echo.
echo [8/8] Note: Documentation files (.md) can be kept locally
echo but should NOT be uploaded to hosting.
echo.

echo ==========================================
echo  Cleanup Complete!
echo ==========================================
echo.
echo Remaining files to upload:
echo - public_html/ (built frontend)
echo - php-api/ (PHP backend)
echo - uploads/ (empty folder for images)
echo.
echo Next steps:
echo 1. Build frontend: npm run build
echo 2. Copy dist files to public_html/
echo 3. Create deployment package
echo 4. Upload to hosting
echo 5. Import database via phpMyAdmin
echo.
echo See DEPLOYMENT-CLEANUP-GUIDE.md for details.
echo.
pause
