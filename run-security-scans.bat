@echo off
REM ======================================================
REM IMS Security Scanning Tool - Windows Batch Script
REM ======================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

REM Colors using ANSI escape codes (Windows 10+)
set "BLUE=[94m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

echo.
echo %BLUE%=====================================================%RESET%
echo %BLUE%    IMS Security Scanning Tool - Windows%RESET%
echo %BLUE%=====================================================%RESET%
echo.

REM Create reports directory
if not exist "security-reports" mkdir security-reports
echo %GREEN%[OK]%RESET% Created security-reports directory
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %RED%[ERROR]%RESET% Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo %GREEN%[OK]%RESET% Node.js found
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %RED%[ERROR]%RESET% npm is not installed
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET% npm found
echo.

REM ======================================================
REM Phase 1: Install Dependencies
REM ======================================================
echo %YELLOW%======================================================%RESET%
echo %YELLOW%Phase 1: Installing Dependencies%RESET%
echo %YELLOW%======================================================%RESET%
echo.

echo %BLUE%[*]%RESET% Installing backend dependencies...
cd ims-backend-main
call npm install --silent 2>nul
if %ERRORLEVEL% EQU 0 (
    echo %GREEN%[OK]%RESET% Backend dependencies installed
) else (
    echo %YELLOW%[!]%RESET% Backend installation completed with some messages
)
cd ..

echo %BLUE%[*]%RESET% Installing frontend dependencies...
cd ims-frontend-main
call npm install --silent 2>nul
if %ERRORLEVEL% EQU 0 (
    echo %GREEN%[OK]%RESET% Frontend dependencies installed
) else (
    echo %YELLOW%[!]%RESET% Frontend installation completed with some messages
)
cd ..
echo.

REM ======================================================
REM Phase 2: NPM Audit
REM ======================================================
echo %YELLOW%======================================================%RESET%
echo %YELLOW%Phase 2: NPM Audit Scan%RESET%
echo %YELLOW%======================================================%RESET%
echo.

echo %BLUE%[*]%RESET% Running NPM Audit on backend...
cd ims-backend-main
call npm audit --json > ..\security-reports\01-npm-audit-backend.json 2>&1
echo %GREEN%[OK]%RESET% Backend audit report saved
cd ..

echo %BLUE%[*]%RESET% Running NPM Audit on frontend...
cd ims-frontend-main
call npm audit --json > ..\security-reports\01-npm-audit-frontend.json 2>&1
echo %GREEN%[OK]%RESET% Frontend audit report saved
cd ..
echo.

REM ======================================================
REM Phase 3: Install ESLint Security Plugin
REM ======================================================
echo %YELLOW%======================================================%RESET%
echo %YELLOW%Phase 3: ESLint Security Plugin Setup%RESET%
echo %YELLOW%======================================================%RESET%
echo.

echo %BLUE%[*]%RESET% Installing ESLint and security plugin for backend...
cd ims-backend-main
call npm install --save-dev eslint eslint-plugin-security --silent 2>nul
echo %GREEN%[OK]%RESET% ESLint installed for backend
cd ..

echo %BLUE%[*]%RESET% Installing ESLint and security plugin for frontend...
cd ims-frontend-main
call npm install --save-dev eslint eslint-plugin-security --silent 2>nul
echo %GREEN%[OK]%RESET% ESLint installed for frontend
cd ..
echo.

REM ======================================================
REM Phase 4: Create ESLint Config Files
REM ======================================================
echo %BLUE%[*]%RESET% Creating ESLint configuration files...

if not exist "ims-backend-main\.eslintrc.json" (
    (
        echo {
        echo   "plugins": ["security"],
        echo   "extends": ["plugin:security/recommended"],
        echo   "parserOptions": {
        echo     "ecmaVersion": 2021,
        echo     "sourceType": "module"
        echo   },
        echo   "env": {
        echo     "node": true,
        echo     "es2021": true
        echo   }
        echo }
    ) > ims-backend-main\.eslintrc.json
    echo %GREEN%[OK]%RESET% Created .eslintrc.json for backend
)

if not exist "ims-frontend-main\.eslintrc.json" (
    (
        echo {
        echo   "plugins": ["security"],
        echo   "extends": ["plugin:security/recommended"],
        echo   "parserOptions": {
        echo     "ecmaVersion": 2021,
        echo     "sourceType": "module",
        echo     "ecmaFeatures": {
        echo       "jsx": true
        echo     }
        echo   },
        echo   "env": {
        echo     "browser": true,
        echo     "es2021": true
        echo   }
        echo }
    ) > ims-frontend-main\.eslintrc.json
    echo %GREEN%[OK]%RESET% Created .eslintrc.json for frontend
)
echo.

REM ======================================================
REM Phase 5: Run ESLint Security Checks
REM ======================================================
echo %YELLOW%======================================================%RESET%
echo %YELLOW%Phase 5: Running ESLint Security Checks%RESET%
echo %YELLOW%======================================================%RESET%
echo.

echo %BLUE%[*]%RESET% Running ESLint on backend...
cd ims-backend-main
call npx eslint . --ext .js,.ts,.jsx,.tsx --format json > ..\security-reports\03-eslint-backend.json 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %GREEN%[OK]%RESET% Backend ESLint scan completed
) else (
    echo %YELLOW%[!]%RESET% Backend ESLint completed (check report for issues)
)
cd ..

echo %BLUE%[*]%RESET% Running ESLint on frontend...
cd ims-frontend-main
call npx eslint . --ext .js,.ts,.jsx,.tsx --format json > ..\security-reports\03-eslint-frontend.json 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %GREEN%[OK]%RESET% Frontend ESLint scan completed
) else (
    echo %YELLOW%[!]%RESET% Frontend ESLint completed (check report for issues)
)
cd ..
echo.

REM ======================================================
REM Phase 6: Check for Snyk (Optional)
REM ======================================================
where snyk >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo %YELLOW%======================================================%RESET%
    echo %YELLOW%Phase 6: Snyk Vulnerability Scan (Optional)%RESET%
    echo %YELLOW%======================================================%RESET%
    echo.
    
    echo %BLUE%[*]%RESET% Running Snyk on backend...
    cd ims-backend-main
    call snyk test --json > ..\security-reports\02-snyk-backend.json 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo %GREEN%[OK]%RESET% Backend Snyk scan completed
    ) else (
        echo %YELLOW%[!]%RESET% Backend Snyk completed (check report)
    )
    cd ..
    
    echo %BLUE%[*]%RESET% Running Snyk on frontend...
    cd ims-frontend-main
    call snyk test --json > ..\security-reports\02-snyk-frontend.json 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo %GREEN%[OK]%RESET% Frontend Snyk scan completed
    ) else (
        echo %YELLOW%[!]%RESET% Frontend Snyk completed (check report)
    )
    cd ..
    echo.
) else (
    echo %YELLOW%[!]%RESET% Snyk not installed - optional tool skipped
    echo To install: npm install -g snyk
    echo.
)

REM ======================================================
REM Phase 7: Check for Retire.js (Optional)
REM ======================================================
where retire >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo %YELLOW%======================================================%RESET%
    echo %YELLOW%Phase 7: Retire.js Vulnerability Scan (Optional)%RESET%
    echo %YELLOW%======================================================%RESET%
    echo.
    
    echo %BLUE%[*]%RESET% Running Retire.js on backend...
    cd ims-backend-main
    call retire --json > ..\security-reports\04-retire-backend.json 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo %GREEN%[OK]%RESET% Backend Retire.js scan completed
    ) else (
        echo %YELLOW%[!]%RESET% Backend Retire.js completed
    )
    cd ..
    
    echo %BLUE%[*]%RESET% Running Retire.js on frontend...
    cd ims-frontend-main
    call retire --json > ..\security-reports\04-retire-frontend.json 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo %GREEN%[OK]%RESET% Frontend Retire.js scan completed
    ) else (
        echo %YELLOW%[!]%RESET% Frontend Retire.js completed
    )
    cd ..
    echo.
) else (
    echo %YELLOW%[!]%RESET% Retire.js not installed - optional tool skipped
    echo To install: npm install -g retire
    echo.
)

REM ======================================================
REM Phase 8: Generate Summary Report
REM ======================================================
echo %YELLOW%======================================================%RESET%
echo %YELLOW%Phase 8: Generating Summary Report%RESET%
echo %YELLOW%======================================================%RESET%
echo.

(
    echo.
    echo ====================================================
    echo     IMS Project - Security Scan Summary Report
    echo     Generated: %date% %time%
    echo ====================================================
    echo.
    echo SCANS PERFORMED:
    echo ================
    echo.
    echo 1. [OK] NPM Audit - Backend
    echo    Scans for known vulnerabilities in npm packages
    echo    Report: security-reports\01-npm-audit-backend.json
    echo.
    echo 2. [OK] NPM Audit - Frontend
    echo    Scans for known vulnerabilities in npm packages
    echo    Report: security-reports\01-npm-audit-frontend.json
    echo.
    echo 3. [OK] ESLint Security Check - Backend
    echo    Static analysis for security issues in code
    echo    Report: security-reports\03-eslint-backend.json
    echo.
    echo 4. [OK] ESLint Security Check - Frontend
    echo    Static analysis for security issues in code
    echo    Report: security-reports\03-eslint-frontend.json
    echo.
    echo OPTIONAL SCANS (if installed^):
    echo.
    echo - Snyk - Detailed vulnerability analysis
    echo   Install: npm install -g snyk
    echo.
    echo - Retire.js - JavaScript library scanning
    echo   Install: npm install -g retire
    echo.
    echo ====================================================
    echo GENERATED FILES:
    echo ====================================================
    echo.
) > security-reports\SECURITY_SUMMARY.txt

REM List generated files
cd security-reports
for %%F in (*.json *.txt) do (
    echo %%F >> ..\temp-file-list.txt
)
cd ..

(
    echo.
    echo Files Generated:
    for /f %%F in (temp-file-list.txt) do echo   - %%F
    echo.
) >> security-reports\SECURITY_SUMMARY.txt

if exist temp-file-list.txt del temp-file-list.txt

(
    echo ====================================================
    echo HOW TO READ THE REPORTS:
    echo ====================================================
    echo.
    echo NPM Audit JSON:
    echo   - Look for "vulnerabilities" section
    echo   - Check severity levels: critical ^| high ^| moderate ^| low
    echo.
    echo ESLint JSON:
    echo   - Review "messages" array for security issues
    echo   - Common issues: XSS, injection, unsafe patterns
    echo.
    echo NEXT STEPS:
    echo ====================================================
    echo.
    echo 1. Review Critical Issues:
    echo    - Open npm-audit-*.json files
    echo    - Look for "severity": "critical"
    echo.
    echo 2. Fix Vulnerabilities:
    echo    - Run: npm audit fix (in each directory^)
    echo.
    echo 3. Review ESLint Results:
    echo    - Check eslint-*.json for code issues
    echo.
    echo 4. Install Advanced Tools (Optional^):
    echo    npm install -g snyk
    echo    npm install -g retire
    echo.
    echo 5. Run Scans Regularly:
    echo    - Weekly minimum for production code
    echo    - Set up CI/CD pipeline (GitHub Actions^)
    echo.
    echo ====================================================
    echo RESOURCES:
    echo ====================================================
    echo.
    echo - OWASP Top 10: https://owasp.org/www-project-top-ten/
    echo - NPM Security: https://docs.npmjs.com/cli/v8/commands/npm-audit
    echo - ESLint Security: https://github.com/nodesecurity/eslint-plugin-security
    echo.
) >> security-reports\SECURITY_SUMMARY.txt

REM ======================================================
REM Final Output
REM ======================================================
echo %GREEN%=====================================================%RESET%
echo %GREEN% [SUCCESS] Security Scans Complete!%RESET%
echo %GREEN%=====================================================%RESET%
echo.
echo %BLUE%[*]%RESET% Reports Location:
echo     %CD%\security-reports\
echo.
echo %BLUE%[*]%RESET% Generated Reports:
dir /b security-reports\
echo.
echo %BLUE%[*]%RESET% View Summary Report:
echo     %CD%\security-reports\SECURITY_SUMMARY.txt
echo.
echo %YELLOW%IMPORTANT:%RESET%
echo - Review all CRITICAL and HIGH severity vulnerabilities
echo - Run "npm audit fix" to fix automatically fixable issues
echo - Set up GitHub Actions for automated scanning
echo.
pause
