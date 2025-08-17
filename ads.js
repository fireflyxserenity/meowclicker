// Ad Integration System for Meow Clicker
// This handles real ad integration with revenue sharing

class AdManager {
    constructor() {
        this.adFrequency = {
            daily: 3, // Max daily ad bonuses
            cooldown: 300000, // 5 minutes between ads (in milliseconds)
        };
        
        this.adState = {
            dailyAdsWatched: 0,
            lastAdTime: 0,
            totalAdsWatched: 0
        };
        
        this.loadAdState();
        this.initializeAds();
    }
    
    // Initialize Ad Networks
    initializeAds() {
        // For Google AdSense
        this.initializeAdSense();
        
        // For Unity Ads (alternative)
        // this.initializeUnityAds();
    }
    
    // Google AdSense Integration
    initializeAdSense() {
        // Step 1: You need to apply for AdSense at https://www.google.com/adsense/
        // Step 2: Get approved (this can take days/weeks)
        // Step 3: Create ad units in your AdSense dashboard
        // Step 4: Replace 'YOUR_ADSENSE_CLIENT_ID' with your actual client ID
        
        if (!window.adsbygoogle) {
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ADSENSE_CLIENT_ID';
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
            
            script.onload = () => {
                console.log('📺 AdSense loaded successfully');
                this.adSenseReady = true;
            };
            
            script.onerror = () => {
                console.log('❌ AdSense failed to load');
                this.fallbackToTestAds();
            };
        }
    }
    
    // Unity Ads Integration (Alternative)
    initializeUnityAds() {
        // Unity Ads is good for games
        // You need to:
        // 1. Create Unity account
        // 2. Create project
        // 3. Enable Unity Ads
        // 4. Get Game ID
        
        const script = document.createElement('script');
        script.src = 'https://unityads.unity3d.com/webgl/ads.js';
        document.head.appendChild(script);
        
        script.onload = () => {
            if (window.UnityAds) {
                window.UnityAds.initialize('YOUR_UNITY_GAME_ID', {
                    testMode: true, // Set to false for production
                    enableLogging: true
                });
                console.log('🎮 Unity Ads initialized');
            }
        };
    }
    
    // Check if user can watch an ad
    canWatchAd() {
        const now = Date.now();
        const timeSinceLastAd = now - this.adState.lastAdTime;
        
        return {
            canWatch: this.adState.dailyAdsWatched < this.adFrequency.daily && 
                     timeSinceLastAd >= this.adFrequency.cooldown,
            dailyAdsLeft: this.adFrequency.daily - this.adState.dailyAdsWatched,
            cooldownTime: Math.max(0, this.adFrequency.cooldown - timeSinceLastAd)
        };
    }
    
    // Show rewarded ad
    async showRewardedAd() {
        const adCheck = this.canWatchAd();
        
        if (!adCheck.canWatch) {
            if (adCheck.dailyAdsLeft <= 0) {
                throw new Error('Daily ad limit reached! Come back tomorrow.');
            } else {
                const minutesLeft = Math.ceil(adCheck.cooldownTime / 60000);
                throw new Error(`Please wait ${minutesLeft} minutes before watching another ad.`);
            }
        }
        
        try {
            // Try AdSense first
            if (this.adSenseReady) {
                return await this.showAdSenseAd();
            }
            
            // Try Unity Ads as backup
            if (window.UnityAds) {
                return await this.showUnityAd();
            }
            
            // Fallback to test ad
            return await this.showTestAd();
            
        } catch (error) {
            console.error('❌ Ad failed to show:', error);
            throw error;
        }
    }
    
    // Google AdSense Rewarded Ad
    async showAdSenseAd() {
        return new Promise((resolve, reject) => {
            // Create rewarded ad unit
            const adContainer = document.createElement('div');
            adContainer.innerHTML = `
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="ca-pub-YOUR_ADSENSE_CLIENT_ID"
                     data-ad-slot="YOUR_REWARDED_AD_SLOT_ID"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
            `;
            
            document.body.appendChild(adContainer);
            
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                
                // AdSense doesn't have direct rewarded ad callbacks
                // So we'll simulate completion after a reasonable time
                setTimeout(() => {
                    document.body.removeChild(adContainer);
                    this.onAdComplete();
                    resolve({ success: true, revenue: this.calculateRevenue() });
                }, 30000); // 30 second ad
                
            } catch (error) {
                document.body.removeChild(adContainer);
                reject(error);
            }
        });
    }
    
    // Unity Ads Rewarded Ad
    async showUnityAd() {
        return new Promise((resolve, reject) => {
            window.UnityAds.showAd('rewardedVideo', {
                onComplete: () => {
                    this.onAdComplete();
                    resolve({ success: true, revenue: this.calculateRevenue() });
                },
                onError: (error) => {
                    reject(new Error('Ad failed to load: ' + error));
                },
                onSkipped: () => {
                    reject(new Error('Ad was skipped - no reward given'));
                }
            });
        });
    }
    
    // Test/Demo Ad (for development)
    async showTestAd() {
        return new Promise((resolve) => {
            // Create fake ad overlay
            const adOverlay = document.createElement('div');
            adOverlay.className = 'test-ad-overlay';
            adOverlay.innerHTML = `
                <div class="test-ad-container">
                    <div class="test-ad-header">
                        <h3>🎬 Demo Advertisement</h3>
                        <p>This is a test ad for development</p>
                    </div>
                    <div class="test-ad-content">
                        <div class="test-ad-video">
                            <div class="fake-video">📺 Playing Ad...</div>
                            <div class="ad-timer">Time: <span id="ad-timer">30</span>s</div>
                        </div>
                    </div>
                    <button id="skip-ad" class="skip-ad-btn" disabled>Skip (30s)</button>
                </div>
            `;
            
            document.body.appendChild(adOverlay);
            
            let timeLeft = 30;
            const timer = setInterval(() => {
                timeLeft--;
                const timerEl = document.getElementById('ad-timer');
                const skipBtn = document.getElementById('skip-ad');
                
                if (timerEl) timerEl.textContent = timeLeft;
                
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    if (skipBtn) {
                        skipBtn.disabled = false;
                        skipBtn.textContent = 'Claim Reward!';
                        skipBtn.onclick = () => {
                            document.body.removeChild(adOverlay);
                            this.onAdComplete();
                            resolve({ success: true, revenue: this.calculateRevenue() });
                        };
                    }
                } else if (skipBtn) {
                    skipBtn.textContent = `Skip (${timeLeft}s)`;
                }
            }, 1000);
        });
    }
    
    // Called when ad completes successfully
    onAdComplete() {
        this.adState.dailyAdsWatched++;
        this.adState.lastAdTime = Date.now();
        this.adState.totalAdsWatched++;
        this.saveAdState();
        
        console.log('📺 Ad completed! Stats:', this.adState);
    }
    
    // Calculate revenue per ad (this is your cut)
    calculateRevenue() {
        // AdSense typically pays $1-5 per 1000 views
        // Unity Ads pays around $2-10 per 1000 views
        // This varies greatly by country, game quality, etc.
        
        const revenuePerAd = 0.005; // $0.005 per ad (rough estimate)
        return {
            estimatedRevenue: revenuePerAd,
            currency: 'USD',
            timestamp: Date.now()
        };
    }
    
    // Get bonus amount for watching ad
    getAdBonus() {
        // Give significant bonus to encourage ad watching
        return {
            meows: Math.floor(Math.random() * 5000) + 10000, // 10k-15k meows
            multiplier: 2.0, // 2x multiplier for 10 minutes
            duration: 600000 // 10 minutes
        };
    }
    
    // Save/Load ad state
    saveAdState() {
        localStorage.setItem('meowClicker_adState', JSON.stringify(this.adState));
    }
    
    loadAdState() {
        const saved = localStorage.getItem('meowClicker_adState');
        if (saved) {
            this.adState = { ...this.adState, ...JSON.parse(saved) };
            
            // Reset daily count if it's a new day
            const lastAdDate = new Date(this.adState.lastAdTime).toDateString();
            const today = new Date().toDateString();
            
            if (lastAdDate !== today) {
                this.adState.dailyAdsWatched = 0;
            }
        }
    }
    
    // Get ad statistics for analytics
    getAdStats() {
        return {
            totalAds: this.adState.totalAdsWatched,
            dailyAds: this.adState.dailyAdsWatched,
            estimatedTotalRevenue: this.adState.totalAdsWatched * 0.005,
            canWatchAd: this.canWatchAd()
        };
    }
}

// Export for use in main game
window.AdManager = AdManager;
