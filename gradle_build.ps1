$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\sapta\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;" + $env:PATH

Set-Location "C:\Users\sapta\.gemini\antigravity\scratch\manzil-ai\frontend\android"

Write-Host "============================================================"
Write-Host "  Building Manzil AI Debug APK..."
Write-Host "  JAVA_HOME : $env:JAVA_HOME"
Write-Host "  ANDROID_HOME: $env:ANDROID_HOME"
Write-Host "============================================================"

& ".\gradlew.bat" assembleDebug --no-daemon

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================"
    Write-Host "  SUCCESS! APK built at:"
    Write-Host "  frontend\android\app\build\outputs\apk\debug\app-debug.apk"
    Write-Host "============================================================"
    # Open the folder in Explorer
    Start-Process explorer "C:\Users\sapta\.gemini\antigravity\scratch\manzil-ai\frontend\android\app\build\outputs\apk\debug"
} else {
    Write-Host ""
    Write-Host "BUILD FAILED. Exit code: $LASTEXITCODE"
}
