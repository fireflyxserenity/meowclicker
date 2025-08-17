// Firebase Configuration (Compat API)
console.log('🔥 Firebase compat module loading...');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAy3ebbhkexhmNKm5FaSuX-_yPxRDctHag",
  authDomain: "meow-clicker.firebaseapp.com",
  databaseURL: "https://meow-clicker-default-rtdb.firebaseio.com",
  projectId: "meow-clicker",
  storageBucket: "meow-clicker.firebasestorage.app",
  messagingSenderId: "38484030075",
  appId: "1:38484030075:web:d68da3a9fbd15c151968de",
  measurementId: "G-RYD8P41B6B"
};

// Initialize Firebase
console.log('🔥 Initializing Firebase with compat API...');
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
console.log('🔥 Firebase initialized successfully!');

// Firebase Database Functions
class FirebaseManager {
    constructor() {
        this.database = database;
        this.currentPlayer = null;
    }

    // Save player profile and score
    async savePlayerScore(playerName, totalMeows, meowsPerSec, totalClicks, prestige = 0) {
        try {
            const playerId = this.generatePlayerId(playerName);
            
            // Ensure all values are numbers
            const numericMeows = Number(totalMeows) || 0;
            const numericClicks = Number(totalClicks) || 0;
            const numericPrestige = Number(prestige) || 0;
            const numericMeowsPerSec = Number(meowsPerSec) || 0;
            
            const playerData = {
                name: playerName,
                meows: numericMeows,
                meowsPerSec: numericMeowsPerSec,
                clicks: numericClicks,
                prestige: numericPrestige,
                lastUpdated: Date.now(),
                timestamp: Date.now(),
                photo: "cat.png"
            };

            console.log('🔥 Saving player data:', playerData);
            console.log(`🔥 Clicks being saved: ${numericClicks} (original: ${totalClicks})`);
            
            await this.database.ref(`leaderboard/${playerId}`).set(playerData);
            this.currentPlayer = { id: playerId, ...playerData };
            console.log('✅ Player data saved to Firebase leaderboard successfully');
            return true;
        } catch (error) {
            console.error('❌ Error saving player score:', error);
            return false;
        }
    }

    // Get top 100 players for leaderboard
    async getTop100Players() {
        try {
            const playersRef = ref(this.database, 'players');
            const topPlayersQuery = query(playersRef, orderByChild('totalMeows'), limitToLast(100));
            
            const snapshot = await get(topPlayersQuery);
            if (snapshot.exists()) {
                const players = [];
                snapshot.forEach((childSnapshot) => {
                    const playerData = childSnapshot.val();
                    players.push({
                        id: childSnapshot.key,
                        ...playerData
                    });
                });
                
                // Sort by totalMeows descending (Firebase returns ascending)
                return players.reverse();
            }
            return [];
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    }

    // Check if player name exists
    async checkPlayerExists(playerName) {
        try {
            const playerId = this.generatePlayerId(playerName);
            const snapshot = await this.database.ref(`leaderboard/${playerId}`).once('value');
            return snapshot.exists();
        } catch (error) {
            console.error('Error checking player:', error);
            return false;
        }
    }

    // Load player data
    async loadPlayerData(playerName) {
        try {
            const playerId = this.generatePlayerId(playerName);
            const snapshot = await this.database.ref(`leaderboard/${playerId}`).once('value');
            
            if (snapshot.exists()) {
                const playerData = snapshot.val();
                this.currentPlayer = { id: playerId, ...playerData };
                console.log('✅ Player data loaded from Firebase:', playerData);
                return playerData;
            }
            return null;
        } catch (error) {
            console.error('❌ Error loading player data:', error);
            return null;
        }
    }

    // Generate consistent player ID from name
    generatePlayerId(playerName) {
        return playerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    // Get current player
    getCurrentPlayer() {
        return this.currentPlayer;
    }

    // Set up real-time leaderboard updates
    onLeaderboardUpdate(callback) {
        const leaderboardRef = this.database.ref('leaderboard');
        
        // Simple query without ordering to avoid index requirement
        // We'll sort on the client side instead
        return leaderboardRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const players = [];
                snapshot.forEach((childSnapshot) => {
                    const playerData = childSnapshot.val();
                    players.push({
                        id: childSnapshot.key,
                        ...playerData
                    });
                });
                
                // Sort by meows on client side (descending order)
                players.sort((a, b) => (b.meows || 0) - (a.meows || 0));
                
                // Take top 100 players
                const topPlayers = players.slice(0, 100);
                
                console.log('📊 Leaderboard updated:', topPlayers.length, 'players (client-side sorted)');
                callback(topPlayers);
            } else {
                console.log('📊 No leaderboard data found');
                callback([]);
            }
        });
    }

    // Secure profile management
    async saveProfile(playerName, gameData, profileCode) {
        try {
            const profileId = this.generatePlayerId(playerName);
            const profileData = {
                name: playerName,
                profileCode: profileCode, // 6-digit secure code
                gameData: gameData,
                lastSaved: new Date().toISOString(),
                meows: gameData.totalMeows,
                clicks: gameData.totalClicks,
                prestige: gameData.prestige || 0
            };

            await this.database.ref(`profiles/${profileId}`).set(profileData);
            console.log('✅ Profile saved with code:', profileCode);
            return true;
        } catch (error) {
            console.error('❌ Error saving profile:', error);
            return false;
        }
    }

    async loadProfile(playerName, profileCode) {
        try {
            const profileId = this.generatePlayerId(playerName);
            const snapshot = await this.database.ref(`profiles/${profileId}`).once('value');
            
            if (snapshot.exists()) {
                const profileData = snapshot.val();
                if (profileData.profileCode === profileCode) {
                    console.log('✅ Profile loaded successfully');
                    return profileData.gameData;
                } else {
                    console.log('❌ Invalid profile code');
                    return null;
                }
            } else {
                console.log('❌ Profile not found');
                return null;
            }
        } catch (error) {
            console.error('❌ Error loading profile:', error);
            return null;
        }
    }

    generateProfileCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}

// Create global instance
console.log('🔥 Creating FirebaseManager instance...');
const firebaseManager = new FirebaseManager();

// Make it globally accessible
window.firebaseManager = firebaseManager;
console.log('🔥 FirebaseManager attached to window:', window.firebaseManager);
