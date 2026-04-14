@echo off
echo ==========================================
echo  Bema Geetz - Local PHP Server Starter
echo ==========================================
echo.
echo This will start PHP's built-in server on port 8000
echo.
echo Prerequisites:
echo 1. PHP must be installed and in PATH
echo 2. MySQL/XAMPP must be running
echo 3. Database 'bemageetz_db' must exist
echo.
echo To setup database, run: php php-api/install.php
echo (after starting this server, visit http://localhost:8000/php-api/install.php)
echo.
pause
echo.
echo Starting PHP server on http://localhost:8000
echo.
echo Frontend will be at: http://localhost:8000
echo API will be at: http://localhost:8000/api/
echo.
php -S localhost:8000 -t public_html
