# Setup Instructions for StealTheDeck

## Quick Start

1. **Download/Clone** all project files to a local directory
2. **Open `index.html`** in a modern web browser (Chrome, Firefox, Edge, Safari)
3. **Click "Play as Guest"** to start immediately without setup

## Firebase Setup (Required for Registered Users)

For full functionality (ranked matches, shop, collection management), you need to configure Firebase:

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow setup wizard

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable these providers:
   - ✅ **Anonymous** (for guest mode)
   - ✅ **Email/Password** (for email registration)
   - ✅ **Google** (for Google login)

### 3. Create Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Start in **Production mode** (we'll add rules)
3. Choose a location (recommended: `us-central` or nearest)
4. Add these **Security Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data - users can only access their own
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Matches - authenticated users can read/write
    match /matches/{matchId} {
      allow read, write: if request.auth != null;
    }
    
    // Block all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Create Realtime Database

1. Go to **Realtime Database** > **Create database**
2. Choose **United States (us-central1)** or preferred location
3. Enable it
4. Add these **Security Rules**:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "online": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 5. Get Your Firebase Config

1. Go to **Project Settings** > **General**
2. Scroll to "Your apps" section
3. If no web app exists, click "Add app" > Web (</> icon)
4. Copy your config object

### 6. Update firebase-config.js

Replace the existing config in `firebase-config.js` with your own:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};
```

## Deployment Options

### Local Testing
- Just open `index.html` in browser
- Guest mode works without Firebase setup
- For full features, use a local server (see below)

### Local Server (Recommended for Development)

#### Option 1: Python HTTP Server
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Then open: http://localhost:8000

#### Option 2: Node.js HTTP Server
```bash
npx http-server
```
Then open the URL shown in terminal

#### Option 3: VS Code Live Server
1. Install "Live Server" extension
2. Right-click `index.html` > "Open with Live Server"

### Deploy to Hosting

#### Firebase Hosting (Recommended)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Deploy
firebase deploy
```

#### GitHub Pages
1. Push project to GitHub repository
2. Go to Settings > Pages
3. Select source branch (usually `main`)
4. Your site: `https://YOUR_USERNAME.github.io/Card-game/`

#### Netlify
1. Drag and drop project folder to Netlify
2. Or connect GitHub repository
3. Site auto-deploys on push

#### Vercel
```bash
npm install -g vercel
vercel
```

## Testing

### Test Guest Mode
1. Click "Play as Guest"
2. Verify menu shows
3. Try Casual match (wait for opponent or test solo logic)

### Test Registered Mode
1. Click "Login with Email"
2. Enter email and password
3. Click "Sign Up" for new account
4. Verify profile loads with deck builder

### Test Match Flow
1. Go to "Card Deck" - verify 16 basic cards loaded
2. Save deck
3. Start Casual match
4. Test first draw
5. Play cards and end turns

### Test Shop (Registered Only)
1. Go to Shop
2. Try opening a loot case
3. Verify cards added to collection
4. Check gold deducted

## Troubleshooting

### "Firebase not initialized" Error
- Check `firebase-config.js` has correct config
- Verify Firebase services enabled in console

### "Permission denied" Error
- Check Firestore/Realtime Database security rules
- Verify you're authenticated

### Cards not saving
- Check browser console for errors
- Verify Firestore rules allow writes
- Check internet connection

### Matches not working
- Ensure Firestore has read/write access
- Check match documents in Firestore console
- Verify both players authenticated

### CORS Errors
- Use local server instead of file:// protocol
- Check browser supports ES6 modules

## Browser Requirements

### Minimum Supported
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Features Requiring Modern JS
- ES6 modules (import/export)
- Async/await
- Arrow functions
- Template literals

### Mobile Support
- iOS Safari 13+
- Chrome Mobile 80+
- Works on tablets and phones
- Touch/click interactions supported

## Next Steps After Setup

1. ✅ Test guest login
2. ✅ Try casual match
3. ✅ Register account
4. ✅ Build custom deck
5. ✅ Open loot cases
6. ✅ Play ranked match
7. ✅ Check collection management
8. ✅ Adjust settings

Enjoy StealTheDeck! 🎮

