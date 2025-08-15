@echo off
echo Building Meow Clicker for mobile...

echo Step 1: Copying files to www directory...
if not exist www mkdir www

copy /Y *.html www\ >nul 2>&1
copy /Y *.css www\ >nul 2>&1  
copy /Y *.js www\ >nul 2>&1
copy /Y *.png www\ >nul 2>&1
copy /Y manifest.json www\ >nul 2>&1

echo Step 2: Files copied to www:
dir www\

echo Step 3: Syncing with Capacitor...
call npx cap sync

echo Step 4: Build complete! 
echo.
echo To open in Android Studio: npx cap open android
echo To open in Xcode: npx cap open ios
echo.
pause
