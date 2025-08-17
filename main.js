// Simplified Debug Version - No Firebase
// FIREBASE STATUS: Currently disabled due to import errors
// Data is stored locally in browser's localStorage only
// For cloud sync, Firebase needs proper configuration with credentials
console.log('🐱 MEOW CLICKER SCRIPT LOADING...');

class MeowClickerGame {
    constructor() {
        this.gameState = {
            totalMeows: 0,
            meowsPerClick: 1,
            totalClicks: 0,
            meowsPerSec: 0,
            playerName: null,
            startTime: Date.now()
        };
        
        // All-time stats (persist through prestige)
        this.allTimeStats = {
            totalClicks: 0,
            totalMeowsEarned: 0,
            totalUpgradesPurchased: 0,
            totalPrestigeCount: 0,
            totalTimePlayed: 0,
            firstPlayDate: Date.now(),
            achievements: [],
            maxMeowsReached: 0,
            fastestClickSession: 0,
            longestSession: 0
        };
        
        // Prestige system
        this.prestigeLevel = 0;
        this.prestigePoints = 0;
        this.prestigeMultiplier = 1;
        
        // Ad multiplier system
        this.adMultiplier = 1;
        
        // Daily bonus system
        this.dailyBonus = {
            lastClaimed: 0,
            streak: 0,
            available: true,
            multiplier: 1
        };
        
        // Lab research
        this.research = {
            clickEfficiency: 0,
            autoClickerSpeed: 0,
            bonusMultiplier: 0,
            catBreeds: 0,
            fishTechnology: 0,
            meowAmplifier: 0
        };
        
        // Goals/Achievements
        this.goals = {
            firstClick: { completed: false, reward: 10, description: "Click your first meow!" },
            hundred: { completed: false, reward: 100, description: "Reach 100 total meows" },
            thousand: { completed: false, reward: 500, description: "Reach 1,000 total meows" },
            tenThousand: { completed: false, reward: 2000, description: "Reach 10,000 total meows" },
            hundredThousand: { completed: false, reward: 10000, description: "Reach 100,000 total meows" },
            million: { completed: false, reward: 50000, description: "Reach 1,000,000 total meows" },
            firstUpgrade: { completed: false, reward: 50, description: "Buy your first upgrade" },
            firstAutoClicker: { completed: false, reward: 200, description: "Buy a Kitten Helper" },
            firstPrestige: { completed: false, reward: 1000, description: "Prestige for the first time" },
            speedClicker: { completed: false, reward: 500, description: "Click 100 times in 10 seconds" },
            collector: { completed: false, reward: 1000, description: "Own 10 total upgrades" },
            researcher: { completed: false, reward: 2000, description: "Unlock all lab research" }
        };
        
        this.upgrades = [
            { 
                id: 'kitten-helper',
                name: 'Kitten Helper', 
                baseCost: 50, 
                cost: 50, 
                owned: 0, 
                effect: 1,
                type: 'passive',
                description: '+1 meow per second',
                emoji: '🐱'
            },
            { 
                id: 'laser-pointer',
                name: 'Laser Pointer', 
                baseCost: 200, 
                cost: 200, 
                owned: 0, 
                effect: 1,
                type: 'click',
                description: '+1 meow per click',
                emoji: '🔴'
            },
            { 
                id: 'catnip-farm',
                name: 'Catnip Farm', 
                baseCost: 1000, 
                cost: 1000, 
                owned: 0, 
                effect: 10,
                type: 'passive',
                description: '+10 meows per second',
                emoji: '🌿'
            },
            { 
                id: 'cat-tower',
                name: 'Cat Tower', 
                baseCost: 5000, 
                cost: 5000, 
                owned: 0, 
                effect: 10,
                type: 'click',
                description: '+10 meows per click',
                emoji: '🏰'
            },
            { 
                id: 'cat-cafe',
                name: 'Cat Cafe', 
                baseCost: 20000, 
                cost: 20000, 
                owned: 0, 
                effect: 100,
                type: 'passive',
                description: '+100 meows per second',
                emoji: '☕'
            }
        ];
        
        this.clickTracker = [];
        
        // Notification system for new features
        this.notifications = {
            bonus: false,
            lab: false,
            goals: false,
            prestige: false
        };
        
        this.loadGameData();
        this.init();
    }
    
    init() {
        console.log('🐱 MeowClickerGame.init() started!');
        this.setupEventListeners();
        this.setupModals();
        this.renderUpgrades();
        this.startGameLoop();
        this.updateDisplay();
        this.loadGameData();
        
        // Debug: Check if modal elements exist
        console.log('🔍 Checking modal elements:');
        console.log('profileModal:', document.getElementById('profileModal'));
        console.log('ranksModal:', document.getElementById('ranksModal'));
        console.log('playerName input:', document.getElementById('playerName'));
        console.log('leaderboard div:', document.getElementById('leaderboard'));
        
        // Check if modals exist by different methods
        console.log('🔍 Alternative checks:');
        console.log('querySelector profileModal:', document.querySelector('#profileModal'));
        console.log('querySelector ranksModal:', document.querySelector('#ranksModal'));
        
        // Check total number of modal elements
        const allModals = document.querySelectorAll('.modal');
        console.log('🔍 Found', allModals.length, 'modal elements:', allModals);
        
        console.log('🐱 MeowClickerGame.init() completed!');
        
        // EMERGENCY DEBUG: Check what's actually in the DOM
        setTimeout(() => {
            console.log('🚨 DELAYED CHECK - Full DOM structure:');
            console.log('All divs with modal class:', document.querySelectorAll('.modal'));
            console.log('All elements with profileModal ID:', document.querySelectorAll('#profileModal'));
            console.log('All elements with ranksModal ID:', document.querySelectorAll('#ranksModal'));
            console.log('Document ready state:', document.readyState);
            console.log('Body innerHTML length:', document.body.innerHTML.length);
        }, 1000);
    }
    
    setupEventListeners() {
        // Cat clicking
        const cat = document.getElementById('cat');
        if (cat) {
            cat.addEventListener('click', (e) => this.clickCat(e));
        }
        
        // Header buttons
        document.getElementById('btn-bonus')?.addEventListener('click', () => {
            this.notifications.bonus = false;
            this.showBonusModal();
        });
        
        document.getElementById('btn-lab')?.addEventListener('click', () => {
            this.notifications.lab = false;
            this.showLabModal();
        });
        
        document.getElementById('btn-goals')?.addEventListener('click', () => {
            this.notifications.goals = false;
            this.showGoalsModal();
        });
        
        document.getElementById('btn-prestige')?.addEventListener('click', () => {
            this.notifications.prestige = false;
            this.showPrestigeModal();
        });
        
        document.getElementById('btn-profile')?.addEventListener('click', () => {
            console.log('Profile button clicked - calling showProfileModal()');
            this.showProfileModal();
        });
        
        document.getElementById('btn-ranks')?.addEventListener('click', () => {
            console.log('Ranks button clicked - calling showRanksModal()');
            this.showRanksModal();
        });
    }
    
    setupModals() {
        // Profile modal
        document.getElementById('closeProfile')?.addEventListener('click', () => {
            this.hideModal('profileModal');
        });
        
        document.getElementById('saveProfile')?.addEventListener('click', () => {
            this.showSaveSection();
        });
        
        document.getElementById('loadProfile')?.addEventListener('click', () => {
            this.showLoadSection();
        });

        document.getElementById('confirmSave')?.addEventListener('click', () => {
            this.saveProfileSecure();
        });
        
        document.getElementById('confirmLoad')?.addEventListener('click', () => {
            const loadNameInput = document.getElementById('loadPlayerName');
            const codeInput = document.getElementById('profileCode');
            const profileCode = codeInput ? codeInput.value.trim() : null;
            
            if (profileCode) {
                this.loadProfileSecure(profileCode);
            } else {
                this.showStatus('Please enter your security code!', 'error');
            }
        });
        
        // Ranks modal
        document.getElementById('closeRanks')?.addEventListener('click', () => {
            this.hideModal('ranksModal');
        });
        
        document.getElementById('refreshRanks')?.addEventListener('click', () => {
            this.loadLeaderboard();
        });
        
        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target.id);
            }
        });
    }
    
    clickCat(event) {
        const clickValue = this.gameState.meowsPerClick * this.prestigeMultiplier * this.dailyBonus.multiplier * (this.adMultiplier || 1);
        this.gameState.totalMeows += clickValue;
        this.gameState.totalClicks++;
        this.allTimeStats.totalClicks++;
        this.allTimeStats.totalMeowsEarned += clickValue;
        
        // Create click popup animation
        this.createClickPopup(event, clickValue);
        
        // Track clicks for speed achievement
        this.clickTracker.push(Date.now());
        this.clickTracker = this.clickTracker.filter(time => Date.now() - time < 10000);
        
        // Check achievements
        this.checkAchievements();
        this.updateDisplay();
        
        // Auto-save if player is logged in
        if (this.gameState.playerName) {
            this.autoSave();
        }
    }

    createClickPopup(event, value) {
        const popup = document.createElement('div');
        popup.className = 'click-popup';
        popup.textContent = `+${this.formatNumber(value)}`;
        
        // Position relative to viewport instead of cat element
        if (!event) return;
        
        popup.style.position = 'fixed';
        popup.style.left = event.clientX + 'px';
        popup.style.top = event.clientY + 'px';
        popup.style.pointerEvents = 'none';
        popup.style.zIndex = '1000';
        
        // Add to body instead of cat to avoid overflow issues
        document.body.appendChild(popup);
        
        // Remove popup after animation
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 1000);
    }
    
    buyUpgrade(upgradeId, isFreeFromAd = false) {
        const upgrade = this.upgrades.find(u => u.id === upgradeId);
        if (!upgrade) {
            return false;
        }
        
        // Check if player can afford it (skip check if it's free from ad)
        if (!isFreeFromAd && this.gameState.totalMeows < upgrade.cost) {
            return false;
        }
        
        // Only deduct cost if not free from ad
        if (!isFreeFromAd) {
            this.gameState.totalMeows -= upgrade.cost;
        }
        
        upgrade.owned++;
        this.allTimeStats.totalUpgradesPurchased++;
        
        if (upgrade.type === 'passive') {
            this.gameState.meowsPerSec += upgrade.effect * this.prestigeMultiplier;
        } else if (upgrade.type === 'click') {
            this.gameState.meowsPerClick += upgrade.effect;
        }
        
        // Increase cost for next purchase
        upgrade.cost = Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.owned));
        
        this.checkAchievements();
        this.updateDisplay();
        this.renderUpgrades();
        
        // Auto-save if player is logged in
        if (this.gameState.playerName) {
            this.autoSave();
        }
        
        return true;
    }
    
    // Bonus System
    showBonusModal() {
        this.createModal('bonusModal', 'Daily Bonus & Multipliers', this.getBonusContent());
    }
    
    getBonusContent() {
        const timeUntilNextBonus = this.getTimeUntilNextBonus();
        const canClaim = this.canClaimDailyBonus();
        
        // Get ad status if ad manager exists
        let adSection = '';
        if (window.adManager) {
            const adStatus = window.adManager.canWatchAd();
            const adStats = window.adManager.getAdStats();
            
            adSection = `
                <h3>🎬 Watch Ads for Rewards</h3>
                <div class="ad-rewards">
                    <h4>Ad Rewards:</h4>
                    <ul>
                        <li>10,000-15,000 bonus meows</li>
                        <li>2x multiplier for 10 minutes</li>
                        <li>Support the game development!</li>
                    </ul>
                </div>
                
                ${adStatus.canWatch ? 
                    '<button class="watch-ad-btn" onclick="game.watchAd()">🎬 Watch Ad for Bonus!</button>' :
                    `<div class="ad-status ad-cooldown">
                        ${adStatus.dailyAdsLeft <= 0 ? 
                            'Daily ad limit reached! Come back tomorrow.' :
                            `Next ad available in: ${Math.ceil(adStatus.cooldownTime / 60000)} minutes`
                        }
                    </div>`
                }
                
                <div class="ad-status">
                    Daily ads watched: ${adStats.dailyAds}/${window.adManager?.adFrequency?.daily || 3} | 
                    Total lifetime: ${adStats.totalAds}
                </div>
            `;
        } else {
            adSection = `
                <h3>🎬 Ad System</h3>
                <div class="ad-status">
                    <p>⚠️ Ad system not loaded. Refresh page to enable ad rewards.</p>
                </div>
            `;
        }
        
        return `
            <div class="bonus-content">
                <h3>Daily Bonus</h3>
                <div class="bonus-streak">
                    <span>Current Streak: ${this.dailyBonus.streak} days</span>
                    <span>Multiplier: ${this.dailyBonus.multiplier.toFixed(1)}x</span>
                </div>
                ${canClaim ? 
                    '<button class="claim-bonus-btn" onclick="game.claimDailyBonus()">Claim Daily Bonus!</button>' :
                    `<div class="next-bonus">Next bonus in: ${timeUntilNextBonus}</div>`
                }
                
                ${adSection}
                
                <h3>Active Multipliers</h3>
                <div class="multipliers">
                    <div>Prestige Multiplier: ${this.prestigeMultiplier.toFixed(1)}x</div>
                    <div>Daily Bonus: ${this.dailyBonus.multiplier.toFixed(1)}x</div>
                    <div>Research Bonus: ${(1 + this.research.bonusMultiplier * 0.1).toFixed(1)}x</div>
                </div>
                
                <h3>Special Events</h3>
                <div class="events">
                    <button onclick="game.activateDoubleClick()">Double Click (Cost: 1000 meows)</button>
                    <button onclick="game.activateAutoBoost()">Auto Boost (Cost: 5000 meows)</button>
                </div>
                
                <h3>🎁 Premium Ad Rewards</h3>
                <div class="premium-ad-rewards">
                    ${window.adManager && window.adManager.canWatchAd().canWatch ? `
                        <button class="premium-ad-btn" onclick="game.watchAdForUpgrade()">
                            🎬 Watch Ad for Random Upgrade
                        </button>
                        <button class="premium-ad-btn" onclick="game.watchAdForPrestigeBoost()">
                            🎬 Watch Ad for Prestige Points
                        </button>
                        <button class="premium-ad-btn" onclick="game.watchAdForTimeSkip()">
                            🎬 Watch Ad to Skip 30 Minutes
                        </button>
                        <button class="premium-ad-btn" onclick="game.watchAdForMegaBonus()">
                            🎬 Watch Ad for MEGA Bonus (5x for 5 min)
                        </button>
                    ` : `
                        <div class="ad-status ad-cooldown">
                            Premium ad rewards available after cooldown
                        </div>
                    `}
                </div>
            </div>
        `;
    }
    
    canClaimDailyBonus() {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        return now - this.dailyBonus.lastClaimed > oneDay;
    }
    
    getTimeUntilNextBonus() {
        const oneDay = 24 * 60 * 60 * 1000;
        const timeLeft = oneDay - (Date.now() - this.dailyBonus.lastClaimed);
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        return `${hours}h ${minutes}m`;
    }
    
    claimDailyBonus() {
        if (!this.canClaimDailyBonus()) return;
        
        this.dailyBonus.lastClaimed = Date.now();
        this.dailyBonus.streak++;
        this.dailyBonus.multiplier = 1 + (this.dailyBonus.streak * 0.1);
        
        const bonusAmount = this.gameState.totalMeows * 0.1 * this.dailyBonus.streak;
        this.gameState.totalMeows += bonusAmount;
        
        this.saveGameData();
        this.showBonusModal(); // Refresh modal
        this.showNotification(`Daily bonus claimed! +${this.formatNumber(bonusAmount)} meows!`);
    }
    
    activateDoubleClick() {
        if (this.gameState.totalMeows < 1000) return;
        this.gameState.totalMeows -= 1000;
        
        const originalClick = this.gameState.meowsPerClick;
        this.gameState.meowsPerClick *= 2;
        
        setTimeout(() => {
            this.gameState.meowsPerClick = originalClick;
            this.showNotification('Double click boost ended!');
        }, 60000);
        
        this.showNotification('Double click activated for 1 minute!');
    }
    
    activateAutoBoost() {
        if (this.gameState.totalMeows < 5000) return;
        this.gameState.totalMeows -= 5000;
        
        const originalMPS = this.gameState.meowsPerSec;
        this.gameState.meowsPerSec *= 3;
        
        setTimeout(() => {
            this.gameState.meowsPerSec = originalMPS;
            this.showNotification('Auto boost ended!');
        }, 120000);
        
        this.showNotification('Auto boost activated for 2 minutes!');
    }
    
    // Ad System Integration
    async watchAd() {
        if (!window.adManager) {
            this.showStatus('Ad system not available. Please refresh the page.', 'error');
            return;
        }
        
        try {
            this.showStatus('Loading advertisement...', 'info');
            
            // Show the ad
            const adResult = await window.adManager.showRewardedAd();
            
            if (adResult.success) {
                // Give player rewards
                const bonus = window.adManager.getAdBonus();
                
                // Add meows
                this.gameState.totalMeows += bonus.meows;
                
                // Apply temporary multiplier
                const originalMultiplier = this.adMultiplier || 1;
                this.adMultiplier = bonus.multiplier;
                
                // Remove multiplier after duration
                setTimeout(() => {
                    this.adMultiplier = originalMultiplier;
                    this.showNotification('Ad bonus multiplier expired!');
                    this.updateDisplay();
                }, bonus.duration);
                
                this.updateDisplay();
                this.saveGameData();
                
                // Success message
                this.showStatus(
                    `🎬 Ad completed! Rewards: +${this.formatNumber(bonus.meows)} meows + ${bonus.multiplier}x multiplier for ${Math.floor(bonus.duration / 60000)} minutes!`, 
                    'success'
                );
                
                // Log revenue (for your analytics)
                console.log('💰 Ad Revenue:', adResult.revenue);
                
                // Update the modal content
                setTimeout(() => {
                    const modal = document.getElementById('bonusModal');
                    if (modal) {
                        const modalBody = modal.querySelector('.modal-body');
                        if (modalBody) {
                            modalBody.innerHTML = this.getBonusContent();
                        }
                    }
                }, 1000);
                
            } else {
                this.showStatus('Ad viewing was interrupted. Please try again.', 'error');
            }
            
        } catch (error) {
            console.error('Ad Error:', error);
            this.showStatus(error.message, 'error');
        }
    }

    // Premium Ad Rewards - Additional bonus types
    async watchAdForUpgrade() {
        if (!await this.validateAdWatch()) return;
        
        try {
            const adResult = await window.adManager.showRewardedAd();
            if (adResult.success) {
                // Give a random upgrade for free
                const availableUpgrades = this.upgrades.filter(u => u.cost <= this.gameState.totalMeows * 2);
                if (availableUpgrades.length > 0) {
                    const randomUpgrade = availableUpgrades[Math.floor(Math.random() * availableUpgrades.length)];
                    this.buyUpgrade(randomUpgrade.id, true); // true = free from ad
                    this.showStatus(`🎁 Free upgrade from ad: ${randomUpgrade.name}!`, 'success');
                } else {
                    // If no upgrades available, give meows instead
                    const bonus = this.gameState.totalMeows * 0.5;
                    this.gameState.totalMeows += bonus;
                    this.showStatus(`🎁 No upgrades available, got ${this.formatNumber(bonus)} bonus meows!`, 'success');
                }
                this.updateDisplay();
                this.saveGameData();
            }
        } catch (error) {
            this.showStatus(error.message, 'error');
        }
    }

    async watchAdForPrestigeBoost() {
        if (!await this.validateAdWatch()) return;
        
        try {
            const adResult = await window.adManager.showRewardedAd();
            if (adResult.success) {
                const bonus = Math.floor(Math.random() * 5) + 3; // 3-7 prestige points
                this.prestigePoints += bonus;
                this.showStatus(`🌟 Earned ${bonus} bonus prestige points from ad!`, 'success');
                this.updateDisplay();
                this.saveGameData();
            }
        } catch (error) {
            this.showStatus(error.message, 'error');
        }
    }

    async watchAdForTimeSkip() {
        if (!await this.validateAdWatch()) return;
        
        try {
            const adResult = await window.adManager.showRewardedAd();
            if (adResult.success) {
                // Simulate 30 minutes of passive income
                const passiveIncome = this.gameState.meowsPerSec * 30 * 60; // 30 minutes
                this.gameState.totalMeows += passiveIncome;
                this.showStatus(`⏰ Time skip! Earned ${this.formatNumber(passiveIncome)} meows (30 min worth)!`, 'success');
                this.updateDisplay();
                this.saveGameData();
            }
        } catch (error) {
            this.showStatus(error.message, 'error');
        }
    }

    async watchAdForMegaBonus() {
        if (!await this.validateAdWatch()) return;
        
        try {
            const adResult = await window.adManager.showRewardedAd();
            if (adResult.success) {
                // 5x multiplier for 5 minutes
                const originalMultiplier = this.adMultiplier || 1;
                this.adMultiplier = 5;
                
                setTimeout(() => {
                    this.adMultiplier = originalMultiplier;
                    this.showNotification('MEGA bonus multiplier expired!');
                    this.updateDisplay();
                }, 5 * 60 * 1000); // 5 minutes
                
                this.showStatus('🚀 MEGA BONUS: 5x multiplier for 5 minutes!', 'success');
                this.updateDisplay();
                this.saveGameData();
            }
        } catch (error) {
            this.showStatus(error.message, 'error');
        }
    }

    async validateAdWatch() {
        if (!window.adManager) {
            this.showStatus('Ad system not available. Please refresh the page.', 'error');
            return false;
        }
        
        const adStatus = window.adManager.canWatchAd();
        if (!adStatus.canWatch) {
            if (adStatus.dailyAdsLeft <= 0) {
                this.showStatus('Daily ad limit reached! Come back tomorrow.', 'error');
            } else {
                this.showStatus(`Next ad available in ${Math.ceil(adStatus.cooldownTime / 60000)} minutes.`, 'error');
            }
            return false;
        }
        
        this.showStatus('Loading advertisement...', 'info');
        return true;
    }

    // Lab System
    showLabModal() {
        this.createModal('labModal', 'Research Lab', this.getLabContent());
    }
    
    getLabContent() {
        return `
            <div class="lab-content">
                <h3>Research Projects</h3>
                <div class="research-grid">
                    <div class="research-item ${this.gameState.totalMeows >= this.getResearchCost('clickEfficiency') && this.research.clickEfficiency < 10 ? 'available' : ''}">
                        <h4>Click Efficiency</h4>
                        <p>Level ${this.research.clickEfficiency}/10</p>
                        <p>+${this.research.clickEfficiency * 10}% click power</p>
                        <button onclick="game.buyResearch('clickEfficiency', ${this.getResearchCost('clickEfficiency')})" 
                                ${this.research.clickEfficiency >= 10 ? 'disabled' : ''}>
                            Upgrade (${this.formatNumber(this.getResearchCost('clickEfficiency'))} meows)
                        </button>
                    </div>
                    
                    <div class="research-item ${this.gameState.totalMeows >= this.getResearchCost('autoClickerSpeed') && this.research.autoClickerSpeed < 10 ? 'available' : ''}">
                        <h4>Auto-Clicker Speed</h4>
                        <p>Level ${this.research.autoClickerSpeed}/10</p>
                        <p>+${this.research.autoClickerSpeed * 15}% passive income</p>
                        <button onclick="game.buyResearch('autoClickerSpeed', ${this.getResearchCost('autoClickerSpeed')})"
                                ${this.research.autoClickerSpeed >= 10 ? 'disabled' : ''}>
                            Upgrade (${this.formatNumber(this.getResearchCost('autoClickerSpeed'))} meows)
                        </button>
                    </div>
                    
                    <div class="research-item ${this.gameState.totalMeows >= this.getResearchCost('bonusMultiplier') && this.research.bonusMultiplier < 5 ? 'available' : ''}">
                        <h4>Bonus Multiplier</h4>
                        <p>Level ${this.research.bonusMultiplier}/5</p>
                        <p>+${this.research.bonusMultiplier * 10}% all bonuses</p>
                        <button onclick="game.buyResearch('bonusMultiplier', ${this.getResearchCost('bonusMultiplier')})"
                                ${this.research.bonusMultiplier >= 5 ? 'disabled' : ''}>
                            Upgrade (${this.formatNumber(this.getResearchCost('bonusMultiplier'))} meows)
                        </button>
                    </div>
                    
                    <div class="research-item ${this.gameState.totalMeows >= this.getResearchCost('catBreeds') && this.research.catBreeds < 8 ? 'available' : ''}">
                        <h4>Cat Breeds</h4>
                        <p>Level ${this.research.catBreeds}/8</p>
                        <p>Unlock new cat varieties</p>
                        <button onclick="game.buyResearch('catBreeds', ${this.getResearchCost('catBreeds')})"
                                ${this.research.catBreeds >= 8 ? 'disabled' : ''}>
                            Upgrade (${this.formatNumber(this.getResearchCost('catBreeds'))} meows)
                        </button>
                    </div>
                    
                    <div class="research-item ${this.gameState.totalMeows >= this.getResearchCost('fishTechnology') && this.research.fishTechnology < 5 ? 'available' : ''}">
                        <h4>Fish Technology</h4>
                        <p>Level ${this.research.fishTechnology}/5</p>
                        <p>+${this.research.fishTechnology * 25}% bonus income</p>
                        <button onclick="game.buyResearch('fishTechnology', ${this.getResearchCost('fishTechnology')})"
                                ${this.research.fishTechnology >= 5 ? 'disabled' : ''}>
                            Upgrade (${this.formatNumber(this.getResearchCost('fishTechnology'))} meows)
                        </button>
                    </div>
                    
                    <div class="research-item ${this.gameState.totalMeows >= this.getResearchCost('meowAmplifier') && this.research.meowAmplifier < 3 ? 'available' : ''}">
                        <h4>Meow Amplifier</h4>
                        <p>Level ${this.research.meowAmplifier}/3</p>
                        <p>+${this.research.meowAmplifier * 50}% click power</p>
                        <button onclick="game.buyResearch('meowAmplifier', ${this.getResearchCost('meowAmplifier')})"
                                ${this.research.meowAmplifier >= 3 ? 'disabled' : ''}>
                            Upgrade (${this.formatNumber(this.getResearchCost('meowAmplifier'))} meows)
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    getResearchCost(type) {
        const costs = {
            clickEfficiency: 1000 * Math.pow(2, this.research.clickEfficiency || 0),
            autoClickerSpeed: 2000 * Math.pow(2, this.research.autoClickerSpeed || 0),
            bonusMultiplier: 5000 * Math.pow(3, this.research.bonusMultiplier || 0),
            catBreeds: 10000 * Math.pow(4, this.research.catBreeds || 0),
            fishTechnology: 15000 * Math.pow(5, this.research.fishTechnology || 0),
            meowAmplifier: 25000 * Math.pow(6, this.research.meowAmplifier || 0)
        };
        return costs[type] || 1000;
    }
    
    buyResearch(type, cost) {
        if (this.gameState.totalMeows < cost) return;
        
        this.gameState.totalMeows -= cost;
        this.research[type]++;
        
        // Research name mapping for better notifications
        const researchNames = {
            'clickEfficiency': 'Click Efficiency',
            'autoClickerSpeed': 'Auto-Clicker Speed',
            'bonusMultiplier': 'Bonus Multiplier',
            'catBreeds': 'Cat Breeds',
            'fishTechnology': 'Fish Technology',
            'meowAmplifier': 'Meow Amplifier'
        };
        
        const friendlyName = researchNames[type] || type;
        
        this.checkAchievements();
        this.saveGameData();
        this.showLabModal(); // Refresh modal
        this.showNotification(`🧪 Research Activated: ${friendlyName} Level ${this.research[type]}!`);
    }
    
    // Goals/Achievements System
    showGoalsModal() {
        this.createModal('goalsModal', 'Goals & Achievements', this.getGoalsContent());
    }
    
    getGoalsContent() {
        const completedCount = Object.values(this.goals).filter(g => g.completed).length;
        const totalCount = Object.keys(this.goals).length;
        
        let content = `
            <div class="goals-content">
                <h3>Progress: ${completedCount}/${totalCount} achievements</h3>
                <div class="achievements-grid">
        `;
        
        Object.entries(this.goals).forEach(([key, goal]) => {
            content += `
                <div class="achievement ${goal.completed ? 'completed' : ''}">
                    <h4>${this.getAchievementTitle(key)}</h4>
                    <p>${goal.description}</p>
                    <span class="reward">Reward: ${this.formatNumber(goal.reward)} meows</span>
                    ${goal.completed ? '<span class="status">✓ Completed</span>' : '<span class="status">⏳ In Progress</span>'}
                </div>
            `;
        });
        
        content += `
                </div>
            </div>
        `;
        
        return content;
    }
    
    getAchievementTitle(key) {
        const titles = {
            firstClick: "First Meow",
            hundred: "Hundred Club",
            thousand: "Thousand Master",
            tenThousand: "Ten Thousand Elite",
            hundredThousand: "Hundred Thousand Legend",
            million: "Meow Millionaire",
            firstUpgrade: "Upgrade Beginner",
            firstAutoClicker: "Automation Start",
            firstPrestige: "Prestige Pioneer",
            speedClicker: "Speed Demon",
            collector: "Upgrade Collector",
            researcher: "Mad Scientist"
        };
        return titles[key] || key;
    }
    
    checkAchievements() {
        const totalOwnedUpgrades = this.upgrades.reduce((sum, u) => sum + u.owned, 0);
        const allResearchMaxed = Object.values(this.research).every((level, i) => {
            const maxLevels = [10, 10, 5, 8];
            return level >= maxLevels[i];
        });
        
        const achievements = {
            firstClick: this.gameState.totalClicks > 0,
            hundred: this.gameState.totalMeows >= 100,
            thousand: this.gameState.totalMeows >= 1000,
            tenThousand: this.gameState.totalMeows >= 10000,
            hundredThousand: this.gameState.totalMeows >= 100000,
            million: this.gameState.totalMeows >= 1000000,
            firstUpgrade: this.allTimeStats.totalUpgradesPurchased > 0,
            firstAutoClicker: this.upgrades.find(u => u.id === 'kitten-helper')?.owned > 0,
            firstPrestige: this.prestigeLevel > 0,
            speedClicker: this.clickTracker.length >= 100,
            collector: totalOwnedUpgrades >= 10,
            researcher: allResearchMaxed
        };
        
        Object.entries(achievements).forEach(([key, achieved]) => {
            if (achieved && !this.goals[key].completed) {
                this.goals[key].completed = true;
                this.gameState.totalMeows += this.goals[key].reward;
                this.showNotification(`Achievement unlocked: ${this.getAchievementTitle(key)}! +${this.formatNumber(this.goals[key].reward)} meows!`);
            }
        });
    }
    
    // Prestige System
    showPrestigeModal() {
        this.createModal('prestigeModal', 'Prestige System', this.getPrestigeContent());
    }
    
    getPrestigeContent() {
        const canPrestige = this.gameState.totalMeows >= 1000000;
        const prestigePointsGain = Math.floor(Math.sqrt(this.gameState.totalMeows / 1000000));
        
        return `
            <div class="prestige-content">
                <h3>Prestige Level: ${this.prestigeLevel}</h3>
                <p>Prestige Points: ${this.prestigePoints}</p>
                <p>Current Multiplier: ${this.prestigeMultiplier.toFixed(2)}x</p>
                
                <div class="prestige-requirements">
                    <h4>Prestige Requirements</h4>
                    <p>Need: 1,000,000 total meows</p>
                    <p>Current: ${this.formatNumber(this.gameState.totalMeows)} meows</p>
                    ${canPrestige ? 
                        `<p class="gain">Will gain: ${prestigePointsGain} prestige points</p>` :
                        '<p class="requirement">Not enough meows to prestige</p>'
                    }
                </div>
                
                <div class="prestige-benefits">
                    <h4>Prestige Benefits</h4>
                    <ul>
                        <li>Keep all research progress</li>
                        <li>Keep achievements and all-time stats</li>
                        <li>Gain permanent multiplier boost</li>
                        <li>Unlock new upgrade tiers</li>
                    </ul>
                </div>
                
                ${canPrestige ? 
                    '<button class="prestige-btn" onclick="game.doPrestige()">PRESTIGE NOW</button>' :
                    '<button class="prestige-btn" disabled>Cannot Prestige Yet</button>'
                }
            </div>
        `;
    }
    
    doPrestige() {
        if (this.gameState.totalMeows < 1000000) return;
        
        const prestigePointsGain = Math.floor(Math.sqrt(this.gameState.totalMeows / 1000000));
        
        // Update prestige stats
        this.prestigeLevel++;
        this.prestigePoints += prestigePointsGain;
        this.prestigeMultiplier = 1 + (this.prestigePoints * 0.1);
        this.allTimeStats.totalPrestigeCount++;
        
        // Reset current progress but keep research and achievements
        this.gameState.totalMeows = 0;
        this.gameState.totalClicks = 0;
        this.gameState.meowsPerClick = 1;
        this.gameState.meowsPerSec = 0;
        
        // Reset upgrades
        this.upgrades.forEach(upgrade => {
            upgrade.owned = 0;
            upgrade.cost = upgrade.baseCost;
        });
        
        this.checkAchievements();
        this.saveGameData();
        this.updateDisplay();
        this.renderUpgrades();
        this.hideModal('prestigeModal');
        this.showNotification(`Prestige completed! Gained ${prestigePointsGain} prestige points!`);
    }
    
    // Profile with All-Time Stats
    showProfileModal() {
        console.log('showProfileModal() called');
        
        // Check if modal exists, if not create it
        let profileModal = document.getElementById('profileModal');
        console.log('profileModal element:', profileModal);
        
        if (!profileModal) {
            console.log('profileModal not found, creating it...');
            this.createProfileModal();
            profileModal = document.getElementById('profileModal');
        }
        
        const nameInput = document.getElementById('playerName');
        console.log('playerName input:', nameInput);
        
        if (nameInput && this.gameState.playerName) {
            nameInput.value = this.gameState.playerName;
        }
        
        // Update profile stats display
        this.updateProfileStats();
        
        // Show the modal
        console.log('About to call showModal for profileModal');
        this.showModal('profileModal');
    }
    
    createProfileModal() {
        const modal = document.createElement('div');
        modal.id = 'profileModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">👤 Player Profile</h2>
                    <button class="modal-close" onclick="game.hideModal('profileModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="profile-form">
                        <label for="playerName">Player Name:</label>
                        <input type="text" id="playerName" placeholder="Enter your name" maxlength="20">
                        
                        <div class="profile-actions">
                            <button id="saveProfile" class="btn btn-primary">💾 Save Profile</button>
                            <button id="loadProfile" class="btn btn-secondary">📥 Load Profile</button>
                        </div>
                        
                        <div id="saveSection" class="profile-section" style="display: none;">
                            <h4>Save Your Profile</h4>
                            <p>Your profile will be saved with a 6-digit security code.</p>
                            <div id="profileCodeDisplay" class="profile-code"></div>
                            <button id="confirmSave" class="btn btn-success">Confirm Save</button>
                        </div>
                        
                        <div id="loadSection" class="profile-section" style="display: none;">
                            <h4>Load Existing Profile</h4>
                            <label for="loadPlayerName">Player Name:</label>
                            <input type="text" id="loadPlayerName" placeholder="Enter player name" maxlength="20">
                            <label for="profileCode">Security Code:</label>
                            <input type="text" id="profileCode" placeholder="Enter 6-digit code" maxlength="6" pattern="[0-9]{6}">
                            <button id="confirmLoad" class="btn btn-success">Load Profile</button>
                        </div>
                    </div>
                    <div id="profileStatus" class="profile-status"></div>
                    
                    <!-- All-Time Stats Section -->
                    <div id="allTimeStats" class="all-time-stats">
                        <!-- All-time stats will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        console.log('Created profileModal:', modal);
    }
    
    updateProfileStats() {
        const statsContainer = document.getElementById('allTimeStats');
        if (!statsContainer) return;
        
        const timePlayed = this.allTimeStats.totalTimePlayed + (Date.now() - this.gameState.startTime);
        const playTime = this.formatTime(timePlayed);
        
        statsContainer.innerHTML = `
            <h3>All-Time Statistics</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Total Clicks:</span>
                    <span class="stat-value">${this.formatNumber(this.allTimeStats.totalClicks)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Meows Earned:</span>
                    <span class="stat-value">${this.formatNumber(this.allTimeStats.totalMeowsEarned)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Upgrades Purchased:</span>
                    <span class="stat-value">${this.allTimeStats.totalUpgradesPurchased}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Prestige Count:</span>
                    <span class="stat-value">${this.allTimeStats.totalPrestigeCount}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Current Prestige Level:</span>
                    <span class="stat-value">${this.prestigeLevel}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Prestige Points:</span>
                    <span class="stat-value">${this.prestigePoints}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Prestige Multiplier:</span>
                    <span class="stat-value">${this.prestigeMultiplier.toFixed(2)}x</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Time Played:</span>
                    <span class="stat-value">${playTime}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Max Meows Reached:</span>
                    <span class="stat-value">${this.formatNumber(Math.max(this.allTimeStats.maxMeowsReached, this.gameState.totalMeows))}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Achievements:</span>
                    <span class="stat-value">${Object.values(this.goals).filter(g => g.completed).length}/${Object.keys(this.goals).length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">First Play Date:</span>
                    <span class="stat-value">${new Date(this.allTimeStats.firstPlayDate).toLocaleDateString()}</span>
                </div>
            </div>
        `;
    }
    
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
    
    // Utility Functions
    createModal(id, title, content) {
        let modal = document.getElementById(id);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = id;
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">${title}</h2>
                    <button class="modal-close" onclick="game.hideModal('${id}')">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        this.showModal(id);
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Save/Load System
    saveGameData() {
        const saveData = {
            gameState: this.gameState,
            allTimeStats: this.allTimeStats,
            prestigeLevel: this.prestigeLevel,
            prestigePoints: this.prestigePoints,
            prestigeMultiplier: this.prestigeMultiplier,
            dailyBonus: this.dailyBonus,
            research: this.research,
            goals: this.goals,
            upgrades: this.upgrades
        };
        
        localStorage.setItem('meowClickerSave', JSON.stringify(saveData));
    }
    
    loadGameData() {
        const saveData = localStorage.getItem('meowClickerSave');
        if (saveData) {
            try {
                const data = JSON.parse(saveData);
                
                // Merge saved data with defaults
                this.gameState = { ...this.gameState, ...data.gameState };
                this.allTimeStats = { ...this.allTimeStats, ...data.allTimeStats };
                this.prestigeLevel = data.prestigeLevel || 0;
                this.prestigePoints = data.prestigePoints || 0;
                this.prestigeMultiplier = data.prestigeMultiplier || 1;
                this.dailyBonus = { ...this.dailyBonus, ...data.dailyBonus };
                this.research = { ...this.research, ...data.research };
                this.goals = { ...this.goals, ...data.goals };
                
                if (data.upgrades) {
                    this.upgrades = data.upgrades;
                }
            } catch (e) {
                console.error('Failed to load save data:', e);
            }
        }
    }
    
    checkDailyBonus() {
        if (this.canClaimDailyBonus() && this.dailyBonus.lastClaimed > 0) {
            this.showNotification('Daily bonus available!');
        }
    }
    
    // Keep existing Firebase and render methods from original
    renderUpgrades() {
        const container = document.getElementById('upgrades-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.upgrades.forEach(upgrade => {
            const upgradeElement = document.createElement('div');
            upgradeElement.className = `upgrade ${this.gameState.totalMeows >= upgrade.cost ? 'affordable' : ''}`;
            upgradeElement.onclick = () => this.buyUpgrade(upgrade.id);
            
            upgradeElement.innerHTML = `
                <div class="upgrade-header">
                    <div class="upgrade-name-section">
                        <div class="upgrade-icon">${upgrade.emoji}</div>
                        <h3 class="upgrade-name">${upgrade.name}</h3>
                    </div>
                    <div class="upgrade-costs">
                        <span class="upgrade-cost">Cost: ${this.formatNumber(upgrade.cost)}</span>
                        <span class="upgrade-owned">Owned: ${upgrade.owned}</span>
                    </div>
                </div>
                <p class="upgrade-description">${upgrade.description}</p>
            `;
            
            container.appendChild(upgradeElement);
        });
    }
    
    updateDisplay() {
        // Update all-time max
        // Ensure all values are numbers before updating display
        this.gameState.totalMeows = Number(this.gameState.totalMeows) || 0;
        this.gameState.meowsPerSec = Number(this.gameState.meowsPerSec) || 0;
        this.gameState.meowsPerClick = Number(this.gameState.meowsPerClick) || 1;
        this.gameState.totalClicks = Number(this.gameState.totalClicks) || 0;
        
        this.allTimeStats.maxMeowsReached = Math.max(this.allTimeStats.maxMeowsReached || 0, this.gameState.totalMeows);
        
        // Update stats
        document.getElementById('total-meows').textContent = this.formatNumber(this.gameState.totalMeows);
        document.getElementById('meows-per-sec').textContent = this.formatNumber(this.gameState.meowsPerSec);
        document.getElementById('meows-per-click').textContent = this.formatNumber(this.gameState.meowsPerClick);
        document.getElementById('total-clicks').textContent = this.formatNumber(this.gameState.totalClicks);
        
        // Update upgrade affordability
        this.upgrades.forEach(upgrade => {
            const upgradeElement = document.querySelector(`[onclick*="${upgrade.id}"]`);
            if (upgradeElement) {
                if (this.gameState.totalMeows >= upgrade.cost) {
                    upgradeElement.classList.add('affordable');
                } else {
                    upgradeElement.classList.remove('affordable');
                }
            }
        });
        
        // Check for new features and update notifications
        this.checkForNotifications();
        this.updateNotificationIndicators();
    }
    
    checkForNotifications() {
        // Check for available daily bonus
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        this.notifications.bonus = (now - this.dailyBonus.lastClaimed) >= oneDayMs;
        
        // Check for affordable research
        const hasAffordableResearch = Object.keys(this.research).some(key => {
            const level = this.research[key];
            const cost = this.getResearchCost(key);
            return this.gameState.totalMeows >= cost && level < 10; // Max level 10
        });
        this.notifications.lab = hasAffordableResearch;
        
        // Check for incomplete goals
        const hasIncompleteGoals = Object.values(this.goals).some(goal => !goal.completed && this.checkGoalProgress(goal));
        this.notifications.goals = hasIncompleteGoals;
        
        // Check for prestige availability (can prestige if total clicks > 1000)
        this.notifications.prestige = this.gameState.totalClicks >= 1000 && this.prestigeLevel === 0;
    }
    
    updateNotificationIndicators() {
        // Update button indicators
        this.setNotificationIndicator('btn-bonus', this.notifications.bonus);
        this.setNotificationIndicator('btn-lab', this.notifications.lab);
        this.setNotificationIndicator('btn-goals', this.notifications.goals);
        this.setNotificationIndicator('btn-prestige', this.notifications.prestige);
    }
    
    setNotificationIndicator(buttonId, hasNotification) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        // Remove existing notification
        const existingNotification = button.querySelector('.notification-indicator');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Add new notification if needed
        if (hasNotification) {
            const indicator = document.createElement('div');
            indicator.className = 'notification-indicator';
            button.appendChild(indicator);
        }
    }
    
    // Helper method to check goal progress
    checkGoalProgress(goal) {
        switch (goal.type) {
            case 'clicks':
                return this.gameState.totalClicks >= goal.target;
            case 'meows':
                return this.gameState.totalMeows >= goal.target;
            case 'upgrades':
                return this.upgrades.reduce((sum, u) => sum + u.owned, 0) >= goal.target;
            case 'meowsPerSec':
                return this.gameState.meowsPerSec >= goal.target;
            default:
                return false;
        }
    }
    
    formatNumber(num) {
        // Handle NaN, undefined, null, or non-numeric values
        if (num === null || num === undefined || isNaN(num) || typeof num !== 'number') {
            return '0';
        }
        
        if (num >= 1e12) return (num / 1e12).toFixed(3) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(3) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(3) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(3) + 'K';
        return Math.floor(num).toString();
    }
    
    startGameLoop() {
        setInterval(() => {
            if (this.gameState.meowsPerSec > 0) {
                const passiveGain = (this.gameState.meowsPerSec / 10) * this.prestigeMultiplier * this.dailyBonus.multiplier;
                this.gameState.totalMeows += passiveGain;
                this.allTimeStats.totalMeowsEarned += passiveGain;
                this.updateDisplay();
            }
        }, 100);
        
        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveGameData();
            if (this.gameState.playerName) {
                this.autoSave();
            }
        }, 30000);
        
        // Update time played every second
        setInterval(() => {
            this.allTimeStats.totalTimePlayed += 1000;
        }, 1000);
    }
    
    // Modal functions
    showModal(modalId) {
        console.log(`showModal called with ID: ${modalId}`);
        const modal = document.getElementById(modalId);
        console.log(`Modal element found:`, modal);
        if (modal) {
            modal.classList.add('show');
            console.log(`Added 'show' class to ${modalId}`);
        } else {
            console.error(`Modal with ID '${modalId}' not found!`);
        }
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    showRanksModal() {
        console.log('showRanksModal() called');
        
        // Check if modal exists, if not create it
        let ranksModal = document.getElementById('ranksModal');
        console.log('ranksModal element:', ranksModal);
        
        if (!ranksModal) {
            console.log('ranksModal not found, creating it...');
            this.createRanksModal();
            ranksModal = document.getElementById('ranksModal');
        }
        
        console.log('About to call showModal for ranksModal');
        this.showModal('ranksModal');
        this.loadLeaderboard();
    }
    
    createRanksModal() {
        const modal = document.createElement('div');
        modal.id = 'ranksModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">📊 Global Leaderboard</h2>
                    <button class="modal-close" onclick="game.hideModal('ranksModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="leaderboard-header">
                        <h3>🏆 Top 100 Players Worldwide</h3>
                        <button id="refreshRanks" class="btn btn-secondary">🔄 Refresh</button>
                    </div>
                    <div id="leaderboard" class="leaderboard">
                        <div class="loading">Loading leaderboard...</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        console.log('Created ranksModal:', modal);
    }
    
    getFirebaseStatus() {
        const firebaseAvailable = typeof window.firebaseManager !== 'undefined';
        
        if (firebaseAvailable) {
            return {
                enabled: true,
                reason: 'Firebase is connected and ready!',
                dataLocation: 'Firebase Realtime Database (Cloud)',
                persistent: 'Data syncs across all devices and browsers',
                recommendation: 'Your progress is automatically saved to the cloud. Create a player profile to compete on the global leaderboard!'
            };
        } else {
            return {
                enabled: false,
                reason: 'Firebase is loading or import failed. Using local storage as fallback.',
                dataLocation: 'Browser localStorage (Local)',
                persistent: 'Data persists locally but not across devices',
                recommendation: 'Refresh the page to retry Firebase connection, or continue with local play.'
            };
        }
    }
    
    showSaveSection() {
        const nameInput = document.getElementById('playerName');
        const playerName = nameInput.value.trim();
        
        if (!playerName) {
            this.showStatus('Please enter a player name!', 'error');
            return;
        }
        
        if (playerName.length < 3) {
            this.showStatus('Name must be at least 3 characters!', 'error');
            return;
        }
        
        // Generate profile code
        const profileCode = window.firebaseManager ? window.firebaseManager.generateProfileCode() : Math.floor(100000 + Math.random() * 900000).toString();
        
        // Show the profile code to the user
        this.showStatus(`Your profile code is: ${profileCode}. Save this code to load your profile later!`, 'success');
        
        // Store the code temporarily for the save operation
        this.tempProfileCode = profileCode;
        
        // Automatically proceed to save
        setTimeout(() => {
            this.saveProfileSecure();
        }, 1000);
    }
    
    showLoadSection() {
        // Show prompt for loading profile
        const profileCode = prompt('Enter your 6-digit profile code:');
        
        if (!profileCode) {
            return;
        }
        
        if (profileCode.length !== 6 || isNaN(profileCode)) {
            this.showStatus('Please enter a valid 6-digit code!', 'error');
            return;
        }
        
        // Automatically proceed to load
        this.loadProfileSecure(profileCode);
    }
    
    async saveProfileSecure() {
        const nameInput = document.getElementById('playerName');
        const playerName = nameInput.value.trim();
        const profileCode = this.tempProfileCode;
        
        if (!window.firebaseManager) {
            this.showStatus('Cloud save not available. Check Firebase connection.', 'error');
            return;
        }
        
        if (!profileCode) {
            this.showStatus('No profile code generated. Please try again.', 'error');
            return;
        }
        
        this.showStatus('Saving profile to cloud...', 'info');
        
        try {
            const gameData = {
                ...this.gameState,
                allTimeStats: this.allTimeStats,
                research: this.research,
                goals: this.goals,
                upgrades: this.upgrades,
                prestigeLevel: this.prestigeLevel,
                prestigePoints: this.prestigePoints,
                prestigeMultiplier: this.prestigeMultiplier
            };
            
            const success = await window.firebaseManager.saveProfile(playerName, gameData, profileCode);
            
            if (success) {
                this.gameState.playerName = playerName;
                this.saveGameData();
                this.showStatus(`🌐 Profile saved! Your security code is: ${profileCode}. Keep it safe!`, 'success');
                
                console.log('🔍 Debug - Saving to Firebase:');
                console.log('  Player name:', playerName);
                console.log('  Total meows:', this.gameState.totalMeows);
                console.log('  All-time clicks:', this.allTimeStats.totalClicks);
                console.log('  Game state clicks:', this.gameState.totalClicks);
                console.log('  Prestige:', this.gameState.prestige || 0);
                
                // Also save to leaderboard
                await window.firebaseManager.savePlayerScore(
                    playerName,
                    this.gameState.totalMeows,
                    this.gameState.meowsPerSec,
                    this.allTimeStats.totalClicks,
                    this.gameState.prestige || 0
                );
            } else {
                throw new Error('Profile save failed');
            }
        } catch (error) {
            console.error('Profile save error:', error);
            this.showStatus('❌ Failed to save profile. Please try again.', 'error');
        }
    }
    
    async loadProfileSecure(profileCode) {
        // Try to get the name from the load section first, then from main input
        const loadNameInput = document.getElementById('loadPlayerName');
        const nameInput = document.getElementById('playerName');
        
        let playerName = '';
        if (loadNameInput && loadNameInput.value.trim()) {
            playerName = loadNameInput.value.trim();
        } else if (nameInput && nameInput.value.trim()) {
            playerName = nameInput.value.trim();
        }
        
        if (!playerName) {
            // If no name entered, prompt for it
            const enteredName = prompt('Enter the player name for this profile:');
            if (!enteredName) {
                return;
            }
            playerName = enteredName.trim();
        }
        
        if (!playerName || !profileCode) {
            this.showStatus('Please enter both player name and security code!', 'error');
            return;
        }
        
        if (profileCode.length !== 6 || !/^\d{6}$/.test(profileCode)) {
            this.showStatus('Security code must be exactly 6 digits!', 'error');
            return;
        }
        
        if (!window.firebaseManager) {
            this.showStatus('Cloud load not available. Check Firebase connection.', 'error');
            return;
        }
        
        this.showStatus('Loading profile from cloud...', 'info');
        
        try {
            const gameData = await window.firebaseManager.loadProfile(playerName, profileCode);
            
            if (gameData) {
                // Ensure all numbers are properly initialized
                this.gameState.totalMeows = gameData.totalMeows || 0;
                this.gameState.meowsPerSec = gameData.meowsPerSec || 0;
                this.gameState.meowsPerClick = gameData.meowsPerClick || 1;
                this.gameState.totalClicks = gameData.totalClicks || 0;
                this.gameState.prestige = gameData.prestige || 0;
                this.gameState.playerName = playerName;
                
                // Load other data safely
                this.allTimeStats = {
                    ...this.allTimeStats,
                    ...gameData.allTimeStats,
                    totalClicks: gameData.allTimeStats?.totalClicks || 0,
                    totalMeowsEarned: gameData.allTimeStats?.totalMeowsEarned || 0,
                    totalUpgradesPurchased: gameData.allTimeStats?.totalUpgradesPurchased || 0,
                    totalPrestigeCount: gameData.allTimeStats?.totalPrestigeCount || 0,
                    maxMeowsReached: gameData.allTimeStats?.maxMeowsReached || 0,
                    totalTimePlayed: gameData.allTimeStats?.totalTimePlayed || 0
                };
                
                this.research = gameData.research || this.research;
                this.goals = gameData.goals || this.goals;
                
                // Load prestige data
                this.prestigeLevel = gameData.prestigeLevel || 0;
                this.prestigePoints = gameData.prestigePoints || 0;
                this.prestigeMultiplier = gameData.prestigeMultiplier || 1;
                
                // Update upgrades if they exist in saved data
                if (gameData.upgrades) {
                    gameData.upgrades.forEach(savedUpgrade => {
                        const upgrade = this.upgrades.find(u => u.id === savedUpgrade.id);
                        if (upgrade) {
                            upgrade.owned = savedUpgrade.owned;
                        }
                    });
                }
                
                this.saveGameData();
                this.updateDisplay();
                
                // Update the player name input field to show the loaded profile
                const playerNameInput = document.getElementById('playerName');
                const loadPlayerNameInput = document.getElementById('loadPlayerName');
                if (playerNameInput) playerNameInput.value = playerName;
                if (loadPlayerNameInput) loadPlayerNameInput.value = '';
                
                this.showStatus(`✅ Welcome back, ${playerName}! Profile loaded successfully.`, 'success');
                
                setTimeout(() => this.hideModal('profileModal'), 3000);
            } else {
                this.showStatus('❌ Invalid player name or security code!', 'error');
            }
        } catch (error) {
            console.error('Profile load error:', error);
            this.showStatus('❌ Failed to load profile. Please check your details.', 'error');
        }
    }
    
    loadLeaderboard() {
        const leaderboard = document.getElementById('leaderboard');
        if (!leaderboard) return;
        
        const status = this.getFirebaseStatus();
        
        if (status.enabled && window.firebaseManager) {
            // Show loading first
            leaderboard.innerHTML = '<div class="loading">Loading global leaderboard...</div>';
            
            // Load real leaderboard from Firebase
            try {
                window.firebaseManager.onLeaderboardUpdate((players) => {
                    console.log('Leaderboard data received:', players);
                    
                    if (players.length === 0) {
                        leaderboard.innerHTML = `
                            <div class="firebase-status">
                                <h3>🏆 Global Leaderboard</h3>
                                <p>No players have been recorded yet.</p>
                                <p>Be the first to create a profile and appear on the leaderboard!</p>
                            </div>
                        `;
                        return;
                    }
                    
                    let leaderboardHTML = '<div class="leaderboard-list">';
                    players.forEach((player, index) => {
                        const rank = index + 1;
                        const isCurrentPlayer = this.gameState.playerName === player.name;
                        
                        leaderboardHTML += `
                            <div class="leaderboard-item ${rank <= 3 ? 'top-3' : ''} ${isCurrentPlayer ? 'current-player' : ''}">
                                <div class="rank">#${rank}</div>
                                <div class="player-info">
                                    <div class="player-name">${player.name}</div>
                                    <div class="player-stats">
                                        ${this.formatNumber(player.meows || player.totalMeows || 0)} meows | 
                                        ${this.formatNumber(player.clicks || player.totalClicks || player.click || 0)} clicks
                                    </div>
                                </div>
                                <div class="player-score">Prestige: ${player.prestige || 0}</div>
                            </div>
                        `;
                    });
                    leaderboardHTML += '</div>';
                    
                    leaderboard.innerHTML = leaderboardHTML;
                });
            } catch (error) {
                console.error('Error loading leaderboard:', error);
                leaderboard.innerHTML = `
                    <div class="firebase-status">
                        <h3>⚠️ Leaderboard Error</h3>
                        <p>Failed to load global leaderboard.</p>
                        <p>Error: ${error.message}</p>
                    </div>
                `;
            }
        } else {
            // Show Firebase status
            leaderboard.innerHTML = `
                <div class="firebase-status">
                    <h3>🔧 Firebase Status</h3>
                    <p><strong>Status:</strong> ${status.enabled ? '✅ Connected' : '❌ Disabled'}</p>
                    <p><strong>Data Storage:</strong> ${status.dataLocation}</p>
                    <p><strong>Persistence:</strong> ${status.persistent}</p>
                    <p><strong>Reason:</strong> ${status.reason}</p>
                    <hr>
                    <p><strong>Recommendation:</strong> ${status.recommendation}</p>
                </div>
            `;
        }
    }
    
    showStatus(message, type) {
        const statusDiv = document.getElementById('profileStatus');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = `profile-status ${type}`;
        }
    }
    
    autoSave() {
        // Save locally
        this.saveGameData();
        
        // Auto-sync to Firebase if available and player has a name
        if (window.firebaseManager && this.gameState.playerName) {
            try {
                console.log('🔍 Auto-save debug:');
                console.log('  All-time clicks:', this.allTimeStats.totalClicks);
                console.log('  Game state clicks:', this.gameState.totalClicks);
                
                window.firebaseManager.savePlayerScore(
                    this.gameState.playerName,
                    this.gameState.totalMeows,
                    this.gameState.meowsPerSec,
                    this.allTimeStats.totalClicks,
                    this.gameState.prestige || 0
                ).catch(error => {
                    console.log('Auto-sync to Firebase failed (this is normal):', error.message);
                });
            } catch (error) {
                // Silent fail for auto-sync
                console.log('Auto-sync error (this is normal):', error.message);
            }
        }
    }
}

// Make game instance globally accessible for onclick handlers
let game;

// Start the game when the page loads
console.log('🎮 Setting up DOM content loaded listener...');
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 DOM loaded, creating game...');
    game = new MeowClickerGame();
    console.log('🎮 Game created and assigned to global variable:', game);
});
