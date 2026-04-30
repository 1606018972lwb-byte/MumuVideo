@echo off

echo.
echo ============================================================
echo   VideoFly - Starting...
echo ============================================================
echo.

echo [CHECK] Node.js...

node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not installed
    echo Please install Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do echo [OK] Node.js %%v

echo.
echo [CHECK] pnpm...

where pnpm >nul 2>&1
if errorlevel 1 (
    echo [INSTALL] Installing pnpm...
    npm install -g pnpm >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] pnpm install failed
        pause
        exit /b 1
    )
)

for /f "tokens=*" %%p in ('pnpm --version') do echo [OK] pnpm %%p

echo.
echo [CHECK] node_modules...

set "PROJECT_DIR=%~dp0"

if exist "%PROJECT_DIR%node_modules" (
    echo [OK] node_modules exists
) else (
    echo [INSTALL] Installing dependencies...
    cd /d "%PROJECT_DIR%"
    pnpm install
    if errorlevel 1 (
        echo [ERROR] install failed
        pause
        exit /b 1
    )
    echo [OK] dependencies installed
)

echo.
echo [CHECK] .env.local...

if exist "%PROJECT_DIR%.env.local" (
    echo [OK] .env.local exists
) else (
    echo [CREATE] Creating .env.local...
    (
        echo DATABASE_URL=
        echo NEXT_PUBLIC_APP_URL='http://localhost:3000'
        echo NEXT_PUBLIC_BILLING_PROVIDER="creem"
        echo BETTER_AUTH_SECRET='dev_secret_please_change_in_production_min_32_chars'
        echo GOOGLE_CLIENT_ID='placeholder_google_client_id'
        echo GOOGLE_CLIENT_SECRET='placeholder_google_client_secret'
        echo RESEND_API_KEY='placeholder_resend_api_key'
        echo RESEND_FROM='noreply@localhost'
        echo CREEM_API_KEY='placeholder_creem_api_key'
        echo CREEM_WEBHOOK_SECRET=
        echo STORAGE_ENDPOINT=
        echo STORAGE_REGION='auto'
        echo STORAGE_ACCESS_KEY=
        echo STORAGE_SECRET_KEY=
        echo STORAGE_BUCKET=
        echo STORAGE_DOMAIN=
        echo EVOLINK_API_KEY=
        echo KIE_API_KEY=
        echo APIMART_API_KEY=
        echo YUNWU_API_KEY=
        echo DEFAULT_AI_PROVIDER='yunwu'
        echo AI_CALLBACK_URL='http://localhost:3000/api/v1/video/callback'
        echo CALLBACK_HMAC_SECRET='dev_callback_secret'
        echo NEXT_PUBLIC_POSTHOG_KEY=
        echo NEXT_PUBLIC_POSTHOG_HOST='https://app.posthog.com'
    ) > "%PROJECT_DIR%.env.local"
    echo [OK] .env.local created
)

echo.
echo ============================================================
echo   Starting dev server...
echo ============================================================
echo.

cd /d "%PROJECT_DIR%"
start cmd /k "title VideoFly Dev && cd /d \"%PROJECT_DIR%\" && pnpm dev"

echo.
echo ============================================================
echo   Done!
echo.
echo   Please open in browser: http://localhost:3000
echo ============================================================
echo.
echo Press any key to exit...
pause
