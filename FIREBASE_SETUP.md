# 🔥 Firebase Setup Instructions

## Quick Setup (5 minutes)

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" 
3. Name it "meow-clicker-[yourname]" (or any name you like)
4. Disable Google Analytics (not needed)
5. Click "Create project"

### 2. Setup Realtime Database
1. In your project dashboard, click "Realtime Database" from the left menu
2. Click "Create Database"
3. Choose "Start in **test mode**" (this allows read/write access)
4. Select your preferred location (closest to you)
5. Click "Done"

### 3. Get Configuration Keys
1. Click the gear icon ⚙️ in the top left
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the `</>` icon to add a web app
5. Give it a name like "Meow Clicker Web"
6. **Don't** check "Firebase Hosting"
7. Click "Register app"
8. Copy the `firebaseConfig` object

### 4. Update Your Code
Replace the dummy config in `index.html` (around line 110) with your real config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project.firebaseapp.com", 
    databaseURL: "https://your-project-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

### 5. Test It!
1. Open your game in a browser
2. Click the cat a few times
3. Click "Leaderboard" to join global competition
4. Open the same URL on another device/browser
5. You should see each other's scores! 🎉

## Security Note
The current setup uses "test mode" which allows anyone to read/write. For production, you'd want to add security rules, but this is perfect for testing with friends!

## Troubleshooting
- **"Firebase not loaded"**: Check console for errors, make sure your config is correct
- **Can't save data**: Verify your database URL is correct and includes `-default-rtdb`
- **Empty leaderboard**: Make sure you clicked "Leaderboard" to opt-in to global competition

## Free Tier Limits
Firebase free tier includes:
- 1GB stored data
- 10GB/month bandwidth
- More than enough for your cat clicker game! 🐱
