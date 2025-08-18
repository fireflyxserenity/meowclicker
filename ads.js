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
        // For Google AdSense (banner ads only)
        this.initializeAdSense();
        
        // For AdInPlay (rewarded videos)
        this.initializeAdInPlay();
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
    
    // AdInPlay Integration (EXCELLENT for browser games)
    initializeAdInPlay() {
        // AdInPlay is specifically designed for browser games
        // 1. Go to https://www.adinplay.com/
        // 2. Sign up as publisher
        // 3. Add your website and get Publisher ID
        // 4. Replace 'YOUR_PUBLISHER_ID' with actual ID
        
        if (typeof aiptag !== 'undefined') {
            aiptag.cmd = aiptag.cmd || [];
            aiptag.cmd.display = aiptag.cmd.display || [];
            aiptag.cmd.player = aiptag.cmd.player || [];
            
            // Initialize with your publisher ID
            aiptag.cmd.player.push(function() {
                aiptag.adplayer = new aiptag.AdPlayer({
                    AD_FULLSCREEN: true,
                    AD_CENTERPLAYER: false,
                    LOADING_TEXT: 'Loading ad...',
                    PREROLL_ELEM: function(){return document.getElementById('preroll')},
                    AIP_COMPLETE: () => {
                        console.log('🎮 AdInPlay ad completed');
                        this.adInPlayReady = true;
                    },
                    AIP_REMOVE: () => {
                        console.log('🎮 AdInPlay ad removed');
                    }
                });
            });
            
            console.log('🎮 AdInPlay SDK loaded');
        } else {
            console.log('❌ AdInPlay SDK not loaded');
        }
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
            // AdInPlay integration pending approval - show coming soon message
            return await this.showComingSoonAd();
            
            // Will be enabled once AdInPlay approves:
            // if (this.adInPlayReady && typeof aiptag !== 'undefined') {
            //     return await this.showAdInPlayAd();
            // }
            
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
    
    // AdInPlay Rewarded Ad (EXCELLENT REVENUE)
    async showAdInPlayAd() {
        return new Promise((resolve, reject) => {
            if (typeof aiptag === 'undefined' || !aiptag.adplayer) {
                reject(new Error('AdInPlay SDK not loaded'));
                return;
            }
            
            // Show rewarded video ad
            aiptag.cmd.player.push(function() {
                aiptag.adplayer.startPreRoll({
                    onComplete: () => {
                        console.log('🎮 AdInPlay Ad completed - REWARD GIVEN!');
                        this.onAdComplete();
                        resolve({ success: true, revenue: this.calculateRevenue() });
                    },
                    onSkip: () => {
                        console.log('⏭️ AdInPlay Ad skipped');
                        reject(new Error('Ad was skipped - no reward given'));
                    },
                    onError: (error) => {
                        console.error('❌ AdInPlay Ad error:', error);
                        reject(new Error('Ad failed to load: ' + error));
                    }
                });
            });
        });
    }

    // Coming Soon Ad (while waiting for AdInPlay approval)
    async showComingSoonAd() {
        return new Promise((resolve) => {
            // Create coming soon overlay
            const adOverlay = document.createElement('div');
            adOverlay.className = 'coming-soon-ad-overlay';
            adOverlay.innerHTML = `
                <div class="coming-soon-ad-container">
                    <div class="coming-soon-header">
                        <h3>🚀 Ad Rewards Coming Soon!</h3>
                        <p>We're setting up real video ads for awesome rewards</p>
                    </div>
                    <div class="coming-soon-content">
                        <div class="coming-soon-icon">📺</div>
                        <div class="coming-soon-text">
                            <h4>What's Coming:</h4>
                            <ul>
                                <li>🎬 Watch video ads</li>
                                <li>💰 Earn bonus meows</li>
                                <li>⚡ Get click multipliers</li>
                                <li>🎁 Unlock special rewards</li>
                            </ul>
                        </div>
                        <div class="coming-soon-eta">
                            <strong>Expected: Soon™</strong>
                        </div>
                    </div>
                    <button id="coming-soon-ok" class="coming-soon-btn">Got it! 😸</button>
                </div>
            `;
            
            // Add styles
            const styles = `
                .coming-soon-ad-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease;
                }
                
                .coming-soon-ad-container {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 30px;
                    border-radius: 20px;
                    text-align: center;
                    max-width: 400px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                    color: white;
                }
                
                .coming-soon-header h3 {
                    margin: 0 0 10px 0;
                    font-size: 24px;
                }
                
                .coming-soon-header p {
                    margin: 0 0 20px 0;
                    opacity: 0.9;
                }
                
                .coming-soon-icon {
                    font-size: 60px;
                    margin: 20px 0;
                }
                
                .coming-soon-text {
                    text-align: left;
                    margin: 20px 0;
                }
                
                .coming-soon-text ul {
                    list-style: none;
                    padding: 0;
                }
                
                .coming-soon-text li {
                    padding: 5px 0;
                    font-size: 14px;
                }
                
                .coming-soon-eta {
                    margin: 20px 0;
                    padding: 15px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                }
                
                .coming-soon-btn {
                    background: #ff6b6b;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .coming-soon-btn:hover {
                    background: #ff5252;
                    transform: translateY(-2px);
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
            `;
            
            // Add styles to page
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
            
            document.body.appendChild(adOverlay);
            
            // Handle close button
            document.getElementById('coming-soon-ok').addEventListener('click', () => {
                document.body.removeChild(adOverlay);
                document.head.removeChild(styleSheet);
                
                // Give a small consolation reward for their patience
                console.log('🎁 Thanks for your patience! Here\'s a small bonus.');
                resolve({ 
                    success: true, 
                    revenue: 0.1, // Small bonus
                    message: "Thanks for your patience! Small bonus awarded! 😸"
                });
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
