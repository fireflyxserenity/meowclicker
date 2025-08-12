window.onload = function() {
// --- Download/Upload Data ---
const downloadDataBtn = document.getElementById('downloadDataBtn');
const uploadDataInput = document.getElementById('uploadDataInput');

if (downloadDataBtn) {
    downloadDataBtn.onclick = () => {
        const dataStr = JSON.stringify(state, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'meow-clicker-save.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
}
if (uploadDataInput) {
    uploadDataInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const loaded = JSON.parse(evt.target.result);
                if (loaded && typeof loaded === 'object' && loaded.meowCount !== undefined) {
                    state = loaded;
                    updateStats();
                    renderUpgrades();
                    renderCatPicOptions();
                    renderLeaderboard();
                    setMainCatSrc(validatePhotoPath(state.profile.photo));
                    profileNameInput.value = state.profile.name;
                    saveState();
                    alert('Data loaded!');
                } else {
                    alert('Invalid save file.');
                }
            } catch {
                alert('Invalid save file.');
            }
        };
        reader.readAsText(file);
    };
}
// (Firebase and authentication logic removed)
// --- Meow Clicker: Cat Clicker with Profile, Leaderboard, Upgrades, and LocalStorage ---

// Cat photo options (use local images for now)
const catPhotos = [
    'cat.png',
    'https://cdn3.emoji.gg/emojis/7482-uwucat.png',
    'https://cdn3.emoji.gg/emojis/3301-kitty-blush.png',
    'https://emoji.gg/assets/emoji/5903-cute-cat.png',
    'https://cdn3.emoji.gg/emojis/8793-beluga.png',
    'https://cdn3.emoji.gg/emojis/5802-cat-wtf.png'
];

// Default state
let state = {
    meowCount: 0,
    totalClicks: 0,
    meowsPerClick: 1,
    upgrades: [0, 0, 0, 0, 0, 0, 0, 0], // owned for each upgrade
    achievements: {
        firstMeow: { unlocked: false, activated: false },
        hundredMeows: { unlocked: false, activated: false },
        firstUpgrade: { unlocked: false, activated: false },
        thousandMeows: { unlocked: false, activated: false },
        tenUpgrades: { unlocked: false, activated: false },
        hundredThousandMeows: { unlocked: false, activated: false },
        millionMeows: { unlocked: false, activated: false },
        fiftyUpgrades: { unlocked: false, activated: false },
        unemployed: { unlocked: false, activated: false },
        hiss: { unlocked: false, activated: false },
        iBelieveInYou: { unlocked: false, activated: false },
        realMeowster: { unlocked: false, activated: false }
    },
    profile: {
        name: 'Cat Lover',
        photo: 'cat.png'
    },
    lastActive: Date.now(),
    globalLeaderboardOptIn: false, // Track if user has joined global leaderboard
    // Golden Cat Paw system
    goldenPaw: {
        isActive: false,
        lastSpawn: 0,
        clickMultiplier: 1,
        productionMultiplier: 1,
        effectEndTime: 0,
        activeEffect: null
    },
    // Prestige system
    prestige: {
        level: 0,
        heavenlyTreats: 0,
        totalMeowsEver: 0,
        unlockedUpgrades: []
    },
    // Research system
    research: {
        unlockedUpgrades: [], // Array of purchased research upgrade IDs
        availableUpgrades: [] // Array of currently available research upgrade IDs
    }
};
let meowsPerSecond = 0;

// Golden Cat Paw effects
const goldenPawEffects = [
    {
        name: 'Lucky Meow',
        desc: 'Your clicks are 7x more powerful!',
        duration: 77000, // 77 seconds
        clickMultiplier: 7,
        productionMultiplier: 1,
        icon: '🍀'
    },
    {
        name: 'Meow Frenzy',
        desc: 'All production is 7x faster!',
        duration: 77000,
        clickMultiplier: 1,
        productionMultiplier: 7,
        icon: '🌪️'
    },
    {
        name: 'Golden Purr',
        desc: 'Instant meows equal to 10 minutes of production!',
        duration: 0, // Instant effect
        clickMultiplier: 1,
        productionMultiplier: 1,
        icon: '⚡',
        instant: true
    },
    {
        name: 'Cat Blessing',
        desc: 'Both clicks and production are 3x more powerful!',
        duration: 30000, // 30 seconds
        clickMultiplier: 3,
        productionMultiplier: 3,
        icon: '✨'
    }
];

// Prestige Tree System - Cookie Clicker Style
const prestigeTree = {
    // Row 1 - Starting upgrades (cheap, accessible)
    'kitten_angels': {
        name: 'Kitten Angels',
        desc: 'Heavenly kittens boost your production by 10% per level',
        icon: '👼',
        cost: 1,
        maxLevel: 25,
        position: { x: 2, y: 1 },
        prerequisites: [],
        effect: (level) => 1 + (level * 0.1),
        unlocks: ['heavenly_chips', 'lucky_paws']
    },
    
    // Row 2 - Mid-tier upgrades
    'heavenly_chips': {
        name: 'Heavenly Chips',
        desc: 'Boost clicking power by 25% per level',
        icon: '🍪',
        cost: 3,
        maxLevel: 20,
        position: { x: 1, y: 2 },
        prerequisites: ['kitten_angels'],
        effect: (level) => 1 + (level * 0.25),
        unlocks: ['eternal_meows', 'golden_whiskers']
    },
    
    'lucky_paws': {
        name: 'Lucky Paws',
        desc: 'Golden Cat Paws appear 20% more often per level',
        icon: '🐾',
        cost: 7,
        maxLevel: 10,
        position: { x: 3, y: 2 },
        prerequisites: ['kitten_angels'],
        effect: (level) => 1 - (level * 0.2 * 0.2),
        unlocks: ['cat_constellation', 'divine_purr']
    },
    
    // Row 3 - Advanced upgrades
    'eternal_meows': {
        name: 'Eternal Meows',
        desc: 'Start each prestige with bonus meows',
        icon: '♾️',
        cost: 10,
        maxLevel: 5,
        position: { x: 0, y: 3 },
        prerequisites: ['heavenly_chips'],
        effect: (level) => Math.pow(10, level + 2),
        unlocks: ['cosmic_cat']
    },
    
    'golden_whiskers': {
        name: 'Golden Whiskers',
        desc: 'All upgrades are 5% cheaper per level',
        icon: '✨',
        cost: 15,
        maxLevel: 10,
        position: { x: 1, y: 3 },
        prerequisites: ['heavenly_chips'],
        effect: (level) => Math.pow(0.95, level),
        unlocks: ['cosmic_cat']
    },
    
    'cat_constellation': {
        name: 'Cat Constellation',
        desc: 'Meows per second boost by 50% per level',
        icon: '⭐',
        cost: 20,
        maxLevel: 15,
        position: { x: 3, y: 3 },
        prerequisites: ['lucky_paws'],
        effect: (level) => 1 + (level * 0.5),
        unlocks: ['transcendent_cat']
    },
    
    'divine_purr': {
        name: 'Divine Purr',
        desc: 'Golden Cat effects last 25% longer per level',
        icon: '🔮',
        cost: 25,
        maxLevel: 8,
        position: { x: 4, y: 3 },
        prerequisites: ['lucky_paws'],
        effect: (level) => 1 + (level * 0.25),
        unlocks: ['transcendent_cat']
    },
    
    // Row 4 - Ultimate upgrades
    'cosmic_cat': {
        name: 'Cosmic Cat',
        desc: 'Unlock the power of the universe - massive production boost',
        icon: '🌌',
        cost: 100,
        maxLevel: 1,
        position: { x: 1, y: 4 },
        prerequisites: ['eternal_meows', 'golden_whiskers'],
        effect: (level) => level > 0 ? 10 : 1,
        unlocks: []
    },
    
    'transcendent_cat': {
        name: 'Transcendent Cat',
        desc: 'Beyond mortal comprehension - all bonuses increased by 100%',
        icon: '🌟',
        cost: 150,
        maxLevel: 1,
        position: { x: 3, y: 4 },
        prerequisites: ['cat_constellation', 'divine_purr'],
        effect: (level) => level > 0 ? 2 : 1,
        unlocks: []
    }
};

// Legacy prestige upgrades for compatibility (will be removed after tree implementation)
const prestigeUpgrades = [
    {
        id: 'kitten_angels',
        name: 'Kitten Angels',
        desc: 'Heavenly kittens boost your production by 10% per level',
        baseCost: 1,
        maxLevel: 25,
        effect: (level) => 1 + (level * 0.1) // 10% per level
    },
    {
        id: 'lucky_paws',
        name: 'Lucky Paws',
        desc: 'Golden Cat Paws appear 20% more often per level',
        baseCost: 7,
        maxLevel: 10,
        effect: (level) => 1 - (level * 0.2 * 0.2) // Reduce spawn time by 20% per level (max 40% reduction)
    },
    {
        id: 'heavenly_chips',
        name: 'Heavenly Chips',
        desc: 'Boost clicking power by 25% per level',
        baseCost: 3,
        maxLevel: 20,
        effect: (level) => 1 + (level * 0.25)
    },
    {
        id: 'eternal_meows',
        name: 'Eternal Meows',
        desc: 'Start each prestige with bonus meows',
        baseCost: 10,
        maxLevel: 5,
        effect: (level) => Math.pow(10, level + 2) // 1000, 10K, 100K, 1M, 10M starting meows
    }
];

// Upgrade definitions
const upgrades = [
    {
        name: 'Kitten Helper',
        baseCost: 50,
        mps: 0.2,
        desc: 'A kitten that meows for you!'
    },
    {
        name: 'Laser Pointer',
        baseCost: 200,
        mps: 1,
        desc: 'Cats go wild for lasers!'
    },
    {
        name: 'Catnip Farm',
        baseCost: 1000,
        mps: 5,
        desc: 'Grow catnip for endless meows.'
    },
    {
        name: 'Cat Tower',
        baseCost: 5000,
        mps: 20,
        desc: 'A tower for all your cats!'
    },
    {
        name: 'Cat Cafe',
        baseCost: 25000,
        mps: 100,
        desc: 'A cozy cafe where cats gather to meow!'
    },
    {
        name: 'Meowing Machine',
        baseCost: 100000,
        mps: 400,
        desc: 'An automated machine that produces meows!'
    },
    {
        name: 'Cat University',
        baseCost: 500000,
        mps: 1500,
        desc: 'Trains cats to meow more efficiently!'
    },
    {
        name: 'Interdimensional Cat Portal',
        baseCost: 2000000,
        mps: 6000,
        desc: 'Summons cats from other dimensions!'
    }
];

// Research/Time-based upgrades that make base upgrades more effective
const researchUpgrades = [
    {
        id: 'kitten_efficiency',
        name: 'Kitten Training',
        desc: 'Kitten Helpers produce 50% more meows',
        emoji: '🎓',
        baseCost: 500,
        unlockCondition: () => state.upgrades[0] >= 5, // Need 5 Kitten Helpers
        effect: () => 1.5, // 50% more effective
        targetUpgrade: 0, // Affects Kitten Helper
        category: 'efficiency'
    },
    {
        id: 'laser_focus',
        name: 'Laser Focus Technology',
        desc: 'Laser Pointers are twice as effective',
        emoji: '🔬',
        baseCost: 2000,
        unlockCondition: () => state.upgrades[1] >= 3, // Need 3 Laser Pointers
        effect: () => 2.0, // 100% more effective
        targetUpgrade: 1, // Affects Laser Pointer
        category: 'efficiency'
    },
    {
        id: 'catnip_genetics',
        name: 'Genetically Modified Catnip',
        desc: 'Catnip Farms produce 75% more meows',
        emoji: '🧬',
        baseCost: 10000,
        unlockCondition: () => state.upgrades[2] >= 2, // Need 2 Catnip Farms
        effect: () => 1.75, // 75% more effective
        targetUpgrade: 2, // Affects Catnip Farm
        category: 'efficiency'
    },
    {
        id: 'tower_architecture',
        name: 'Advanced Cat Architecture',
        desc: 'Cat Towers hold twice as many cats',
        emoji: '🏗️',
        baseCost: 50000,
        unlockCondition: () => state.upgrades[3] >= 2, // Need 2 Cat Towers
        effect: () => 2.0, // 100% more effective
        targetUpgrade: 3, // Affects Cat Tower
        category: 'efficiency'
    },
    {
        id: 'cafe_ambiance',
        name: 'Cozy Cafe Ambiance',
        desc: 'Cat Cafes attract 50% more customers',
        emoji: '☕',
        baseCost: 250000,
        unlockCondition: () => state.upgrades[4] >= 1, // Need 1 Cat Cafe
        effect: () => 1.5, // 50% more effective
        targetUpgrade: 4, // Affects Cat Cafe
        category: 'efficiency'
    },
    {
        id: 'machine_automation',
        name: 'AI-Powered Automation',
        desc: 'Meowing Machines work 3x faster',
        emoji: '🤖',
        baseCost: 1000000,
        unlockCondition: () => state.upgrades[5] >= 1, // Need 1 Meowing Machine
        effect: () => 3.0, // 200% more effective
        targetUpgrade: 5, // Affects Meowing Machine
        category: 'efficiency'
    },
    {
        id: 'university_curriculum',
        name: 'Advanced Meowing Curriculum',
        desc: 'Cat Universities teach advanced techniques (+100% efficiency)',
        emoji: '📚',
        baseCost: 5000000,
        unlockCondition: () => state.upgrades[6] >= 1, // Need 1 Cat University
        effect: () => 2.0, // 100% more effective
        targetUpgrade: 6, // Affects Cat University
        category: 'efficiency'
    },
    {
        id: 'portal_stabilization',
        name: 'Dimensional Portal Stabilization',
        desc: 'Portals summon cats 150% faster',
        emoji: '🌀',
        baseCost: 20000000,
        unlockCondition: () => state.upgrades[7] >= 1, // Need 1 Portal
        effect: () => 2.5, // 150% more effective
        targetUpgrade: 7, // Affects Portal
        category: 'efficiency'
    },
    // Global efficiency upgrades
    {
        id: 'meow_amplification',
        name: 'Meow Amplification System',
        desc: 'All buildings produce 25% more meows',
        emoji: '📢',
        baseCost: 1000000,
        unlockCondition: () => state.totalClicks >= 10000, // Need 10k clicks
        effect: () => 1.25, // 25% more for all
        targetUpgrade: -1, // Affects all upgrades
        category: 'global'
    },
    {
        id: 'quantum_meowing',
        name: 'Quantum Meowing Theory',
        desc: 'All buildings produce 50% more meows through quantum entanglement',
        emoji: '⚛️',
        baseCost: 100000000,
        unlockCondition: () => state.meowCount >= 1000000000, // Need 1B total meows
        effect: () => 1.5, // 50% more for all
        targetUpgrade: -1, // Affects all upgrades
        category: 'global'
    }
];

// Achievement definitions
const achievements = {
    firstMeow: {
        name: 'First Meow',
        desc: 'Click the cat for the first time',
        reward: 2,
        check: () => state.totalClicks >= 1
    },
    hundredMeows: {
        name: 'Meow Century',
        desc: 'Reach 10,000 total meows',
        reward: 10,
        check: () => state.meowCount >= 10000
    },
    firstUpgrade: {
        name: 'First Upgrade',
        desc: 'Purchase your first upgrade',
        reward: 5,
        check: () => state.upgrades.some(count => count > 0)
    },
    thousandMeows: {
        name: 'Meow Thousand',
        desc: 'Reach 500,000 total meows',
        reward: 25,
        check: () => state.meowCount >= 500000
    },
    tenUpgrades: {
        name: 'Upgrade Master',
        desc: 'Own 50 total upgrades',
        reward: 50,
        check: () => state.upgrades.reduce((sum, count) => sum + count, 0) >= 50
    },
    hundredThousandMeows: {
        name: 'Meow Mogul',
        desc: 'Reach 25,000,000 total meows',
        reward: 100,
        check: () => state.meowCount >= 25000000
    },
    millionMeows: {
        name: 'Meow Billionaire',
        desc: 'Reach 1,000,000,000 total meows',
        reward: 500,
        check: () => state.meowCount >= 1000000000
    },
    fiftyUpgrades: {
        name: 'Upgrade Legend',
        desc: 'Own 100 total upgrades',
        reward: 250,
        check: () => state.upgrades.reduce((sum, count) => sum + count, 0) >= 100
    },
    unemployed: {
        name: 'Unemployed',
        desc: 'Get 100 of every building',
        reward: 1000,
        check: () => state.upgrades.every(count => count >= 100)
    },
    hiss: {
        name: 'Hiss',
        desc: 'Get to 10,000 meows without clicking the cat',
        reward: 150,
        check: () => state.meowCount >= 10000 && state.totalClicks === 0
    },
    iBelieveInYou: {
        name: 'I Believe in You',
        desc: 'Get to 10,000 meows with only one building',
        reward: 200,
        check: () => {
            const totalBuildings = state.upgrades.reduce((sum, count) => sum + count, 0);
            return state.meowCount >= 10000 && totalBuildings === 1;
        }
    },
    realMeowster: {
        name: "Now That's a Real Meowster",
        desc: 'Get to top 100 on leaderboards',
        reward: 300,
        check: () => {
            // This will need to be checked when leaderboard data is available
            // For now, return false - implement when leaderboard ranking is available
            return false;
        }
    }
};

// DOM elements
const totalMeowsSpan = document.getElementById('totalMeows');
const meowsPerSecondSpan = document.getElementById('meowsPerSecond');
const meowsPerClickSpan = document.getElementById('meowsPerClick');
const totalClicksSpan = document.getElementById('totalClicks');
const catBtn = document.getElementById('catButton');
const mainCatImg = document.getElementById('mainCatImg');
const upgradeBtns = [
    document.getElementById('kittenHelper'),
    document.getElementById('laserPointer'),
    document.getElementById('catnipFarm'),
    document.getElementById('catTower'),
    document.getElementById('catCafe'),
    document.getElementById('meowingMachine'),
    document.getElementById('catUniversity'),
    document.getElementById('interdimensionalCatPortal')
];
const profileBtn = document.getElementById('profileBtn');
const leaderboardBtn = document.getElementById('leaderboardBtn');
const achievementsBtn = document.getElementById('achievementsBtn');
const kittenLabBtn = document.getElementById('kittenLabBtn');
const prestigeBtn = document.getElementById('prestigeBtn');
const profileModal = document.getElementById('profileModal');
const leaderboardModal = document.getElementById('leaderboardModal');
const achievementsModal = document.getElementById('achievementsModal');
const kittenLabModal = document.getElementById('kittenLabModal');
const prestigeModal = document.getElementById('prestigeModal');
const achievementBanner = document.getElementById('achievementBanner');
const bannerText = document.getElementById('bannerText');
const closeBanner = document.getElementById('closeBanner');
const closeProfile = document.getElementById('closeProfile');
const closeLeaderboard = document.getElementById('closeLeaderboard');
const closeAchievements = document.getElementById('closeAchievements');
const closeKittenLab = document.getElementById('closeKittenLab');
const closePrestige = document.getElementById('closePrestige');
const achievementNotification = document.getElementById('achievementNotification');
const researchNotification = document.getElementById('researchNotification');
const profileNameInput = document.getElementById('profileName');
const saveProfileBtn = document.getElementById('saveProfile');
const catPhotosDiv = document.querySelector('.cat-photos');
const leaderboardList = document.getElementById('leaderboardList');
const achievementsModalList = document.getElementById('achievementsModalList');
const prestigeContent = document.getElementById('prestigeContent');
// Sections for responsive reordering
const upgradesSection = document.querySelector('.upgrades');
const catClickerSection = document.querySelector('.cat-clicker');

// Research/upgrade DOM elements
const kittenLabContent = document.getElementById('kittenLabContent');
const researchUpgradesDiv = document.getElementById('researchUpgrades'); // Keep for backward compatibility

// --- Twemoji Helper Function ---
function applyTwemoji(element) {
    if (typeof twemoji !== 'undefined') {
        twemoji.parse(element, {
            folder: 'svg',
            ext: '.svg'
        });
    }
}

// --- Achievement Banner Functions ---
function showAchievementBanner(message) {
    if (bannerText && achievementBanner) {
        bannerText.innerHTML = message; // Changed from textContent to innerHTML to support emojis
        applyTwemoji(bannerText); // Apply Twemoji to the banner text
        achievementBanner.classList.remove('hidden');
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (achievementBanner) {
                achievementBanner.classList.add('hidden');
            }
        }, 5000);
    }
}

// Close banner functionality
if (closeBanner) {
    closeBanner.onclick = () => {
        if (achievementBanner) {
            achievementBanner.classList.add('hidden');
        }
    };
}

// --- Number formatting helpers ---
function formatNumber(num) {
    // Handle extremely large numbers that might lose precision
    if (typeof num === 'string') {
        num = parseFloat(num);
    }
    
    // Handle special cases
    if (!isFinite(num) || isNaN(num)) {
        return '0';
    }
    
    // Check for potential precision issues and use scientific notation for extreme numbers
    if (num >= 1e21) { // Beyond sextillion, use scientific notation like Cookie Clicker
        return num.toExponential(2);
    }
    
    // Only format numbers trillion and above, use commas for smaller numbers
    if (num < 1e12) {
        // For small decimal numbers, show with proper precision
        if (num < 1 && num > 0) {
            return num.toFixed(1);
        }
        return Math.floor(num).toLocaleString();
    }
    
    // Cookie Clicker style named units (more readable than abbreviations)
    const units = [
        { value: 1e18, name: ' quintillion' },  // 1,000,000,000,000,000,000
        { value: 1e15, name: ' quadrillion' },  // 1,000,000,000,000,000
        { value: 1e12, name: ' trillion' }      // 1,000,000,000,000
    ];
    
    for (const unit of units) {
        if (num >= unit.value) {
            const formatted = (num / unit.value).toFixed(3);
            // Remove unnecessary trailing zeros
            const cleaned = parseFloat(formatted).toString();
            return cleaned + unit.name;
        }
    }
    
    return Math.floor(num).toLocaleString();
}

// --- Golden Cat Paw System ---
function spawnGoldenPaw() {
    const now = Date.now();
    
    // Don't spawn if one is already active or if not enough time has passed
    if (state.goldenPaw.isActive || now - state.goldenPaw.lastSpawn < 300000) { // Minimum 5 minutes between spawns
        return;
    }
    
    // Much lower spawn rate like Cookie Clicker (about 0.5% chance per check)
    if (Math.random() < 0.005) {
        state.goldenPaw.isActive = true;
        state.goldenPaw.lastSpawn = now;
        
        // Create golden paw element
        const goldenPaw = document.createElement('img');
        goldenPaw.id = 'goldenPaw';
        goldenPaw.src = 'paw.png';
        goldenPaw.alt = 'Golden Cat Paw';
        goldenPaw.style.cssText = `
            position: fixed;
            width: 60px;
            height: 60px;
            cursor: pointer;
            z-index: 9999;
            animation: goldenPawFloat 3s ease-in-out infinite;
            user-select: none;
            filter: drop-shadow(0 0 10px gold) drop-shadow(0 0 20px gold) drop-shadow(0 0 30px gold) brightness(1.3) saturate(1.5);
            transition: transform 0.1s ease;
        `;
        
        // Random position on screen (avoid edges, account for mobile)
        const isMobile = window.innerWidth <= 768;
        const pawSize = isMobile ? 80 : 60;
        const margin = pawSize + 20; // Extra margin for safety
        const x = Math.random() * (window.innerWidth - margin * 2) + margin;
        const y = Math.random() * (window.innerHeight - margin * 2) + margin;
        goldenPaw.style.left = x + 'px';
        goldenPaw.style.top = y + 'px';
        
        // Fallback if image fails to load
        goldenPaw.onerror = () => {
            goldenPaw.style.display = 'none';
            const fallbackPaw = document.createElement('div');
            fallbackPaw.id = 'goldenPaw';
            fallbackPaw.innerHTML = '🐾';
            fallbackPaw.style.cssText = goldenPaw.style.cssText.replace('width: 60px; height: 60px;', 'font-size: 3rem;');
            fallbackPaw.style.left = x + 'px';
            fallbackPaw.style.top = y + 'px';
            fallbackPaw.onclick = () => clickGoldenPaw();
            document.body.appendChild(fallbackPaw);
        };
        
        // Add CSS animation if it doesn't exist
        if (!document.getElementById('goldenPawStyles')) {
            const styles = document.createElement('style');
            styles.id = 'goldenPawStyles';
            styles.textContent = `
                @keyframes goldenPawFloat {
                    0%, 100% { 
                        transform: translateY(0px) rotate(-5deg); 
                        filter: drop-shadow(0 0 10px gold) drop-shadow(0 0 20px gold) drop-shadow(0 0 30px gold) brightness(1.3) saturate(1.5);
                    }
                    50% { 
                        transform: translateY(-15px) rotate(5deg); 
                        filter: drop-shadow(0 0 15px gold) drop-shadow(0 0 25px gold) drop-shadow(0 0 35px gold) brightness(1.5) saturate(1.8);
                    }
                }
                @keyframes goldenPawDisappear {
                    0% { opacity: 1; transform: scale(1) rotate(0deg); }
                    100% { opacity: 0; transform: scale(0.3) rotate(180deg); }
                }
                #goldenPaw:hover {
                    transform: scale(1.1) !important;
                    filter: drop-shadow(0 0 20px gold) drop-shadow(0 0 30px gold) drop-shadow(0 0 40px gold) brightness(1.6) saturate(2) !important;
                }
                #goldenPaw:active {
                    transform: scale(0.95) !important;
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Click handler
        goldenPaw.onclick = () => {
            clickGoldenPaw();
        };
        
        document.body.appendChild(goldenPaw);
        
        // Auto-disappear after 13 seconds
        setTimeout(() => {
            if (document.getElementById('goldenPaw')) {
                removeGoldenPaw();
            }
        }, 13000);
        
        // Show notification
        showAchievementBanner('✨ A shimmering Golden Cat Paw appeared! Click it quickly for a magical bonus!');
    }
}

function clickGoldenPaw() {
    const goldenPaw = document.getElementById('goldenPaw');
    if (!goldenPaw) return;
    
    // Choose random effect
    const effect = goldenPawEffects[Math.floor(Math.random() * goldenPawEffects.length)];
    
    if (effect.instant) {
        // Instant effect
        calcMeowsPerSecond();
        const instantMeows = meowsPerSecond * 600; // 10 minutes worth
        state.meowCount += instantMeows;
        showAchievementBanner(`${effect.icon} ${effect.name}! You gained ${formatNumber(instantMeows)} meows!`);
    } else {
        // Timed effect
        state.goldenPaw.clickMultiplier = effect.clickMultiplier;
        state.goldenPaw.productionMultiplier = effect.productionMultiplier;
        state.goldenPaw.effectEndTime = Date.now() + effect.duration;
        state.goldenPaw.activeEffect = effect.name;
        
        showAchievementBanner(`${effect.icon} ${effect.name} activated! ${effect.desc} (${effect.duration / 1000}s)`);
        updateEffectDisplay();
    }
    
    // Remove the golden paw
    removeGoldenPaw();
    updateStats();
}

function removeGoldenPaw() {
    const goldenPaw = document.getElementById('goldenPaw');
    if (goldenPaw) {
        goldenPaw.style.animation = 'goldenPawDisappear 0.3s ease-out';
        setTimeout(() => {
            if (goldenPaw.parentNode) {
                goldenPaw.parentNode.removeChild(goldenPaw);
            }
        }, 300);
    }
    state.goldenPaw.isActive = false;
}

function updateGoldenPawEffects() {
    const now = Date.now();
    
    // Check if effect has expired
    if (state.goldenPaw.effectEndTime > 0 && now > state.goldenPaw.effectEndTime) {
        state.goldenPaw.clickMultiplier = 1;
        state.goldenPaw.productionMultiplier = 1;
        state.goldenPaw.effectEndTime = 0;
        state.goldenPaw.activeEffect = null;
        updateEffectDisplay();
        showAchievementBanner('Golden Cat Paw effect has worn off.');
    }
}

function updateEffectDisplay() {
    // Create or update effect display
    let effectDisplay = document.getElementById('effectDisplay');
    
    if (state.goldenPaw.activeEffect) {
        if (!effectDisplay) {
            effectDisplay = document.createElement('div');
            effectDisplay.id = 'effectDisplay';
            effectDisplay.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: linear-gradient(45deg, #ffd700, #ffed4e);
                color: #8b4513;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                font-weight: bold;
                font-size: 0.9rem;
                box-shadow: 0 2px 10px rgba(255, 215, 0, 0.5);
                z-index: 1000;
                border: 2px solid #ffa500;
            `;
            document.body.appendChild(effectDisplay);
        }
        
        const timeLeft = Math.max(0, Math.ceil((state.goldenPaw.effectEndTime - Date.now()) / 1000));
        effectDisplay.innerHTML = `
            <div>${state.goldenPaw.activeEffect}</div>
            <div style="font-size: 0.7rem; opacity: 0.8;">${timeLeft}s remaining</div>
        `;
    } else if (effectDisplay) {
        effectDisplay.remove();
    }
}

// --- Prestige System ---
function calculateHeavenlyTreats() {
    // Calculate how many heavenly treats the player would get
    // Use only current run meows, not cumulative across all time
    const currentRunMeows = state.meowCount;
    return Math.floor(Math.sqrt(currentRunMeows / 1000000)); // 1 treat per million meows (square root scaling)
}

function canPrestige() {
    return calculateHeavenlyTreats() > 0; // Can prestige if we'd get at least 1 treat from current run
}

// Make performPrestige globally accessible
window.performPrestige = function() {
    if (!canPrestige()) {
        showAchievementBanner('You need more total meows to prestige! Keep playing to unlock this feature.');
        return;
    }
    
    // Prevent rapid successive prestige attempts
    if (window.prestigeCooldown && Date.now() - window.prestigeCooldown < 2000) {
        showAchievementBanner('Please wait a moment before prestiging again.');
        return;
    }
    
    // Confirm prestige
    const newTreats = calculateHeavenlyTreats(); // Treats gained from this run only
    
    // Show custom prestige confirmation modal
    showPrestigeConfirmation(newTreats);
};

// Tree helper functions
function getTreeUpgradeLevel(upgradeId) {
    const upgrade = state.prestige.unlockedUpgrades.find(u => u.id === upgradeId);
    return upgrade ? upgrade.level : 0;
}

function isTreeUpgradeUnlocked(upgradeId) {
    const upgrade = prestigeTree[upgradeId];
    if (!upgrade) return false;
    
    // Check if all prerequisites are met
    return upgrade.prerequisites.every(prereqId => {
        return getTreeUpgradeLevel(prereqId) > 0;
    });
}

function canBuyTreeUpgrade(upgradeId) {
    const upgrade = prestigeTree[upgradeId];
    if (!upgrade) return false;
    
    const currentLevel = getTreeUpgradeLevel(upgradeId);
    if (currentLevel >= upgrade.maxLevel) return false;
    
    // Check prerequisites
    if (!isTreeUpgradeUnlocked(upgradeId)) return false;
    
    // Check cost (cost increases per level: baseCost * (level + 1))
    const cost = upgrade.cost * (currentLevel + 1);
    return state.prestige.heavenlyTreats >= cost;
}

function buyTreeUpgrade(upgradeId) {
    if (!canBuyTreeUpgrade(upgradeId)) return false;
    
    const upgrade = prestigeTree[upgradeId];
    const currentLevel = getTreeUpgradeLevel(upgradeId);
    const cost = upgrade.cost * (currentLevel + 1);
    
    state.prestige.heavenlyTreats -= cost;
    
    // Update or add upgrade
    const existingUpgrade = state.prestige.unlockedUpgrades.find(u => u.id === upgradeId);
    if (existingUpgrade) {
        existingUpgrade.level++;
    } else {
        state.prestige.unlockedUpgrades.push({ id: upgradeId, level: 1 });
    }
    
    // Mobile haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(50); // Short vibration for purchase
    }
    
    showAchievementBanner(`✨ Purchased ${upgrade.name} level ${currentLevel + 1}!`);
    
    // Update displays
    updateStats();
    renderUpgrades();
    renderPrestigeModal();
    saveStateWithGlobal();
    
    return true;
}

// Make tree functions globally accessible
window.buyTreeUpgrade = buyTreeUpgrade;

// Enhanced modal management with swipe support
function setupModalTouchHandlers() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        
        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) return;
        
        modalContent.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
        }, { passive: true });
        
        modalContent.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentY = e.touches[0].clientY;
            const diffY = currentY - startY;
            
            // Only allow closing with downward swipe from top of modal
            if (diffY > 0 && modalContent.scrollTop === 0) {
                const opacity = Math.max(0.3, 1 - (diffY / 200));
                modal.style.background = `rgba(0, 0, 0, ${opacity * 0.8})`;
                
                if (diffY > 100) {
                    // Add visual feedback for close threshold
                    modalContent.style.transform = `translateY(${Math.min(diffY, 150)}px)`;
                }
            }
        }, { passive: true });
        
        modalContent.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            
            const diffY = currentY - startY;
            
            if (diffY > 100 && modalContent.scrollTop === 0) {
                // Close modal with swipe
                modal.classList.add('hidden');
                if (navigator.vibrate) {
                    navigator.vibrate(30); // Light haptic feedback
                }
            }
            
            // Reset styles
            modal.style.background = '';
            modalContent.style.transform = '';
        }, { passive: true });
    });
}

function getPrestigeUpgradeLevel(upgradeId) {
    const upgrade = state.prestige.unlockedUpgrades.find(u => u.id === upgradeId);
    return upgrade ? upgrade.level : 0;
}

function getPrestigeUpgradeCost(upgradeId, currentLevel) {
    const upgrade = prestigeUpgrades.find(u => u.id === upgradeId);
    if (!upgrade) return Infinity;
    
    // Cost increases exponentially: baseCost * (level + 1)^2
    return upgrade.baseCost * Math.pow(currentLevel + 1, 2);
}

function canBuyPrestigeUpgrade(upgradeId) {
    const currentLevel = getPrestigeUpgradeLevel(upgradeId);
    const upgrade = prestigeUpgrades.find(u => u.id === upgradeId);
    
    if (!upgrade || currentLevel >= upgrade.maxLevel) return false;
    
    const cost = getPrestigeUpgradeCost(upgradeId, currentLevel);
    return state.prestige.heavenlyTreats >= cost;
}

function buyPrestigeUpgrade(upgradeId) {
    if (!canBuyPrestigeUpgrade(upgradeId)) return;
    
    const currentLevel = getPrestigeUpgradeLevel(upgradeId);
    const cost = getPrestigeUpgradeCost(upgradeId, currentLevel);
    
    state.prestige.heavenlyTreats -= cost;
    
    // Update or add upgrade
    const existingUpgrade = state.prestige.unlockedUpgrades.find(u => u.id === upgradeId);
    if (existingUpgrade) {
        existingUpgrade.level++;
    } else {
        state.prestige.unlockedUpgrades.push({ id: upgradeId, level: 1 });
    }
    
    const upgrade = prestigeUpgrades.find(u => u.id === upgradeId);
    showAchievementBanner(`✨ Purchased ${upgrade.name} level ${currentLevel + 1}!`);
    
    // Update displays but don't trigger prestige calculation yet
    updateStats();
    renderUpgrades();
    
    // Refresh prestige modal if it's open
    setTimeout(() => {
        renderPrestigeModal();
    }, 50);
    
    saveStateWithGlobal();
}

// Make buyPrestigeUpgrade globally accessible
window.buyPrestigeUpgrade = buyPrestigeUpgrade;

function applyPrestigeBonus(upgradeId) {
    // Use tree system first, fallback to legacy system
    const treeLevel = getTreeUpgradeLevel(upgradeId);
    if (treeLevel > 0 && prestigeTree[upgradeId]) {
        const upgrade = prestigeTree[upgradeId];
        const bonus = upgrade.effect(treeLevel);
        
        // Apply specific bonuses
        if (upgradeId === 'eternal_meows') {
            state.meowCount += bonus;
        }
        
        return bonus;
    }
    
    // Legacy system fallback
    const level = getPrestigeUpgradeLevel(upgradeId);
    if (level === 0) return 1;
    
    const upgrade = prestigeUpgrades.find(u => u.id === upgradeId);
    if (!upgrade) return 1;
    
    const bonus = upgrade.effect(level);
    
    // Apply specific bonuses
    if (upgradeId === 'eternal_meows') {
        state.meowCount += bonus;
    }
    
    return bonus;
}

function getTotalPrestigeMultiplier() {
    // Calculate bonuses from tree system
    const kittenAngels = applyPrestigeBonus('kitten_angels');
    const heavenlyChips = applyPrestigeBonus('heavenly_chips');
    const catConstellation = applyPrestigeBonus('cat_constellation');
    const cosmicCat = applyPrestigeBonus('cosmic_cat');
    const transcendentCat = applyPrestigeBonus('transcendent_cat');
    
    const productionMultiplier = kittenAngels * catConstellation * cosmicCat * transcendentCat;
    const clickingMultiplier = heavenlyChips * cosmicCat * transcendentCat;
    
    return { production: productionMultiplier, clicking: clickingMultiplier };
}

function renderPrestigeTree() {
    const heavenlyTreats = state.prestige.heavenlyTreats;
    
    let treeHTML = `
        <div class="prestige-tree-mobile" style="
            max-height: 350px;
            overflow-y: auto;
            padding: 0 0.5rem;
            position: relative;
        ">
        
        <!-- Mobile scroll indicator -->
        <div style="
            position: sticky;
            top: 0;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            z-index: 10;
            padding: 0.5rem 0;
            margin-bottom: 0.5rem;
            border-radius: 8px;
            text-align: center;
            font-size: 0.7rem;
            color: #aaa;
            border: 1px solid rgba(255, 215, 0, 0.2);
        ">
            📱 Scroll to explore all upgrade tiers
        </div>
    `;
    
    // Group upgrades by tiers for better organization
    const tiers = [
        {
            name: "🌟 Foundation Tier",
            upgrades: ['kitten_angels'],
            description: "Essential starting upgrades"
        },
        {
            name: "⚡ Enhancement Tier", 
            upgrades: ['heavenly_chips', 'lucky_paws'],
            description: "Boost your power"
        },
        {
            name: "🚀 Advanced Tier",
            upgrades: ['eternal_meows', 'golden_whiskers', 'cat_constellation', 'divine_purr'],
            description: "Powerful late-game bonuses"
        },
        {
            name: "🌌 Transcendent Tier",
            upgrades: ['cosmic_cat', 'transcendent_cat'],
            description: "Ultimate power"
        }
    ];
    
    tiers.forEach(tier => {
        // Check if any upgrade in this tier is unlocked
        const tierUnlocked = tier.upgrades.some(upgradeId => isTreeUpgradeUnlocked(upgradeId));
        const tierOwned = tier.upgrades.some(upgradeId => getTreeUpgradeLevel(upgradeId) > 0);
        
        if (!tierUnlocked && tier.name !== "🌟 Foundation Tier") {
            // Show locked tier
            treeHTML += `
                <div class="tier-section locked" style="
                    margin-bottom: 1rem;
                    padding: 1rem;
                    border: 2px solid #444;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                    opacity: 0.6;
                ">
                    <div style="text-align: center; color: #666; font-weight: bold; margin-bottom: 0.5rem;">
                        ${tier.name} 🔒
                    </div>
                    <div style="text-align: center; color: #888; font-size: 0.8rem; font-style: italic;">
                        ${tier.description}
                    </div>
                </div>
            `;
            return;
        }
        
        // Show unlocked tier header
        treeHTML += `
            <div class="tier-section" style="
                margin-bottom: 1rem;
                padding: 1rem;
                border: 2px solid ${tierOwned ? '#ffd700' : '#00fff7'};
                border-radius: 10px;
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                box-shadow: 0 0 10px ${tierOwned ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 255, 255, 0.3)'};
            ">
                <div style="text-align: center; color: ${tierOwned ? '#ffd700' : '#00fff7'}; font-weight: bold; margin-bottom: 0.5rem;">
                    ${tier.name}
                </div>
                <div style="text-align: center; color: #aaa; font-size: 0.8rem; margin-bottom: 1rem; font-style: italic;">
                    ${tier.description}
                </div>
                
                <div class="tier-upgrades" style="display: grid; gap: 0.8rem;">
        `;
        
        // Render upgrades in this tier
        tier.upgrades.forEach(upgradeId => {
            const upgrade = prestigeTree[upgradeId];
            if (!upgrade) return;
            
            const currentLevel = getTreeUpgradeLevel(upgradeId);
            const isUnlocked = isTreeUpgradeUnlocked(upgradeId);
            const canBuy = canBuyTreeUpgrade(upgradeId);
            const cost = upgrade.cost * (currentLevel + 1);
            const maxedOut = currentLevel >= upgrade.maxLevel;
            
            let cardClass = '';
            let cardStyle = '';
            let statusText = '';
            let statusColor = '#aaa';
            
            if (maxedOut) {
                cardClass = 'maxed';
                cardStyle = 'border-left: 4px solid #90EE90; background: linear-gradient(135deg, #1a3a1a, #2a4a2a);';
                statusText = 'MAX LEVEL ✓';
                statusColor = '#90EE90';
            } else if (currentLevel > 0) {
                cardClass = 'owned';
                cardStyle = 'border-left: 4px solid #ffd700; background: linear-gradient(135deg, #3a2a1a, #4a3a2a);';
                statusText = `Level ${currentLevel}/${upgrade.maxLevel} - Upgrade for ${cost} treats`;
                statusColor = '#ffd700';
            } else if (canBuy) {
                cardClass = 'available';
                cardStyle = 'border-left: 4px solid #00fff7; background: linear-gradient(135deg, #1a2a3a, #2a3a4a);';
                statusText = `Buy for ${cost} treats`;
                statusColor = '#00fff7';
            } else if (isUnlocked) {
                cardClass = 'unlocked-expensive';
                cardStyle = 'border-left: 4px solid #ff6b6b; background: linear-gradient(135deg, #2a1a1a, #3a2a2a);';
                statusText = `Need ${cost} treats`;
                statusColor = '#ff6b6b';
            } else {
                cardClass = 'locked';
                cardStyle = 'border-left: 4px solid #666; background: linear-gradient(135deg, #1a1a1a, #2a2a2a);';
                const missingPrereqs = upgrade.prerequisites.filter(prereqId => getTreeUpgradeLevel(prereqId) === 0);
                statusText = `Requires: ${missingPrereqs.map(id => prestigeTree[id].name).join(', ')}`;
                statusColor = '#666';
            }
            
            treeHTML += `
                <div class="prestige-card ${cardClass}" 
                     onclick="${canBuy ? `buyTreeUpgrade('${upgradeId}')` : ''}"
                     style="
                         ${cardStyle}
                         padding: 1rem;
                         border-radius: 8px;
                         cursor: ${canBuy ? 'pointer' : 'default'};
                         transition: all 0.3s ease;
                         position: relative;
                         ${canBuy ? 'box-shadow: 0 2px 10px rgba(0, 255, 255, 0.3);' : ''}
                     ">
                    
                    <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                        <div style="
                            font-size: 2rem; 
                            margin-right: 1rem;
                            min-width: 3rem;
                            text-align: center;
                            ${currentLevel > 0 ? 'filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));' : ''}
                        ">
                            ${upgrade.icon}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; color: #fff; font-size: 1rem; margin-bottom: 0.2rem;">
                                ${upgrade.name}
                                ${currentLevel > 0 ? `<span style="color: ${statusColor}; font-size: 0.8rem; margin-left: 0.5rem;">Lv.${currentLevel}</span>` : ''}
                            </div>
                            <div style="color: #ccc; font-size: 0.8rem; line-height: 1.3;">
                                ${upgrade.desc}
                            </div>
                        </div>
                    </div>
                    
                    <div style="
                        color: ${statusColor}; 
                        font-size: 0.8rem; 
                        font-weight: bold;
                        text-align: center;
                        padding: 0.3rem;
                        background: rgba(0, 0, 0, 0.3);
                        border-radius: 4px;
                    ">
                        ${statusText}
                    </div>
                    
                    ${canBuy ? `
                        <div style="
                            position: absolute;
                            top: 0.5rem;
                            right: 0.5rem;
                            background: rgba(0, 255, 255, 0.2);
                            color: #00fff7;
                            padding: 0.2rem 0.5rem;
                            border-radius: 12px;
                            font-size: 0.7rem;
                            font-weight: bold;
                        ">
                            READY
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        treeHTML += '</div></div>'; // Close tier-upgrades and tier-section
    });
    
    treeHTML += '</div>'; // Close prestige-tree-mobile
    
    return treeHTML;
}

// Tree tooltip functions
function showTreeTooltip(event, upgradeId) {
    const tooltip = document.getElementById('prestigeTooltip');
    const upgrade = prestigeTree[upgradeId];
    if (!tooltip || !upgrade) return;
    
    const currentLevel = getTreeUpgradeLevel(upgradeId);
    const isUnlocked = isTreeUpgradeUnlocked(upgradeId);
    const canBuy = canBuyTreeUpgrade(upgradeId);
    const cost = upgrade.cost * (currentLevel + 1);
    const maxedOut = currentLevel >= upgrade.maxLevel;
    
    let statusText = '';
    let statusColor = '#aaa';
    
    if (maxedOut) {
        statusText = 'MAX LEVEL';
        statusColor = '#90EE90';
    } else if (canBuy) {
        statusText = `Click to buy for ${cost} treats`;
        statusColor = '#00fff7';
    } else if (isUnlocked) {
        statusText = `Need ${cost} treats`;
        statusColor = '#ff6b6b';
    } else {
        const missingPrereqs = upgrade.prerequisites.filter(prereqId => getTreeUpgradeLevel(prereqId) === 0);
        statusText = `Requires: ${missingPrereqs.map(id => prestigeTree[id].name).join(', ')}`;
        statusColor = '#666';
    }
    
    tooltip.innerHTML = `
        <div style="font-weight: bold; color: #ffd700; margin-bottom: 0.3rem;">
            ${upgrade.icon} ${upgrade.name}
        </div>
        <div style="margin-bottom: 0.3rem; line-height: 1.3;">
            ${upgrade.desc}
        </div>
        <div style="font-size: 0.7rem; margin-bottom: 0.3rem;">
            Level: ${currentLevel}/${upgrade.maxLevel}
        </div>
        <div style="font-size: 0.7rem; color: ${statusColor}; font-weight: bold;">
            ${statusText}
        </div>
    `;
    
    tooltip.style.display = 'block';
    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY - 10) + 'px';
}

function hideTreeTooltip() {
    const tooltip = document.getElementById('prestigeTooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// Make tooltip functions globally accessible
window.showTreeTooltip = showTreeTooltip;
window.hideTreeTooltip = hideTreeTooltip;

// --- Image helpers & fallbacks ---
const DEFAULT_CAT = 'cat.png';

function setMainCatSrc(src) {
    const fallback = document.getElementById('catFallback');
    if (fallback) fallback.style.display = 'none';
    // One-time error handler to fallback to default
    mainCatImg.onerror = () => {
        // Avoid infinite loop if default also fails
        const srcLower = (mainCatImg.getAttribute('src') || '').toLowerCase();
        if (srcLower.endsWith('/' + DEFAULT_CAT) || srcLower.endsWith('\\' + DEFAULT_CAT) || srcLower === DEFAULT_CAT) {
            if (fallback) fallback.style.display = 'flex';
            mainCatImg.style.display = 'none';
        } else {
            mainCatImg.style.display = 'block';
            mainCatImg.src = DEFAULT_CAT;
        }
    };
    mainCatImg.style.display = 'block';
    mainCatImg.src = src || DEFAULT_CAT;
}

function validatePhotoPath(p) {
    // Accept only known filenames; actual file existence will be handled by onerror
    const allowed = [
        'cat.png', 
        'https://cdn3.emoji.gg/emojis/7482-uwucat.png',
        'https://cdn3.emoji.gg/emojis/3301-kitty-blush.png',
        'https://emoji.gg/assets/emoji/5903-cute-cat.png',
        'https://cdn3.emoji.gg/emojis/8793-beluga.png',
        'https://cdn3.emoji.gg/emojis/5802-cat-wtf.png'
    ];
    return allowed.includes(p) ? p : DEFAULT_CAT;
}

// --- LocalStorage helpers ---
function saveState() {
    state.lastActive = Date.now();
    localStorage.setItem('catClickerState', JSON.stringify(state));
    // Only call global leaderboard on significant events (not every save)
    // The global saving is now handled by rate-limited intervals and specific events
}

function saveStateWithGlobal() {
    state.lastActive = Date.now();
    localStorage.setItem('catClickerState', JSON.stringify(state));
    saveToGlobalLeaderboard();
}
function loadState() {
    const s = localStorage.getItem('catClickerState');
    if (s) {
        try {
            state = JSON.parse(s);
            // Migration: ensure upgrades array has all 8 slots
            if (!state.upgrades || state.upgrades.length < 8) {
                const oldUpgrades = state.upgrades || [0, 0, 0, 0];
                state.upgrades = [0, 0, 0, 0, 0, 0, 0, 0];
                // Copy over existing upgrade values
                for (let i = 0; i < oldUpgrades.length && i < 8; i++) {
                    state.upgrades[i] = oldUpgrades[i] || 0;
                }
            }
            // Migration: ensure achievements exist
            if (!state.achievements) {
                state.achievements = {
                    firstMeow: { unlocked: false, activated: false },
                    hundredMeows: { unlocked: false, activated: false },
                    firstUpgrade: { unlocked: false, activated: false },
                    thousandMeows: { unlocked: false, activated: false },
                    tenUpgrades: { unlocked: false, activated: false },
                    hundredThousandMeows: { unlocked: false, activated: false },
                    millionMeows: { unlocked: false, activated: false },
                    fiftyUpgrades: { unlocked: false, activated: false },
                    unemployed: { unlocked: false, activated: false },
                    hiss: { unlocked: false, activated: false },
                    iBelieveInYou: { unlocked: false, activated: false },
                    realMeowster: { unlocked: false, activated: false }
                };
            } else {
                // Add new achievements if they don't exist
                if (!state.achievements.hundredThousandMeows) {
                    state.achievements.hundredThousandMeows = { unlocked: false, activated: false };
                }
                if (!state.achievements.millionMeows) {
                    state.achievements.millionMeows = { unlocked: false, activated: false };
                }
                if (!state.achievements.fiftyUpgrades) {
                    state.achievements.fiftyUpgrades = { unlocked: false, activated: false };
                }
                if (!state.achievements.unemployed) {
                    state.achievements.unemployed = { unlocked: false, activated: false };
                }
                if (!state.achievements.hiss) {
                    state.achievements.hiss = { unlocked: false, activated: false };
                }
                if (!state.achievements.iBelieveInYou) {
                    state.achievements.iBelieveInYou = { unlocked: false, activated: false };
                }
                if (!state.achievements.realMeowster) {
                    state.achievements.realMeowster = { unlocked: false, activated: false };
                }
            }
            
            // Migration: ensure golden paw system exists
            if (!state.goldenPaw) {
                state.goldenPaw = {
                    isActive: false,
                    lastSpawn: 0,
                    clickMultiplier: 1,
                    productionMultiplier: 1,
                    effectEndTime: 0,
                    activeEffect: null
                };
            }
            
            // Migration: ensure prestige system exists
            if (!state.prestige) {
                state.prestige = {
                    level: 0,
                    heavenlyTreats: 0,
                    totalMeowsEver: state.meowCount || 0, // Start with current meows
                    unlockedUpgrades: []
                };
            }
            
            // Ensure totalMeowsEver is at least current meows
            if (state.prestige.totalMeowsEver < state.meowCount) {
                state.prestige.totalMeowsEver = state.meowCount;
            }
            
            // Migration: ensure research system exists
            if (!state.research) {
                state.research = {
                    unlockedUpgrades: [], // Array of purchased research upgrade IDs
                    availableUpgrades: [] // Array of currently available research upgrade IDs
                };
            }
            
        } catch {}
    }
}

// --- Offline progress ---
function applyOfflineProgress() {
    const now = Date.now();
    const elapsed = (now - (state.lastActive || now)) / 1000; // seconds
    calcMeowsPerSecond();
    
    // Only give offline progress if away for more than 30 seconds
    if (elapsed > 30) {
        // Cap offline time at 2 hours (7200 seconds) for balance
        const cappedElapsed = Math.min(elapsed, 7200);
        
        // Apply significant offline penalty - only 15% efficiency while away
        const offlineEfficiency = 0.15;
        const offlineMeows = meowsPerSecond * cappedElapsed * offlineEfficiency;
        
        state.meowCount += offlineMeows;
        
        // Format time away message
        const timeAway = formatTime(elapsed);
        const efficiencyNote = elapsed > 7200 ? " (capped at 2 hours)" : "";
        
        setTimeout(() => {
            showAchievementBanner(`Welcome back! You were away for ${timeAway}. Your cats lazily collected ${formatNumber(offlineMeows)} meows at 15% efficiency${efficiencyNote}.`);
        }, 500);
    }
}

// Helper function to format time for offline message
function formatTime(seconds) {
    if (seconds < 60) return `${Math.floor(seconds)} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
}

// --- Profile ---
function renderCatPicOptions() {
    catPhotosDiv.querySelectorAll('img').forEach((img, i) => {
        img.classList.toggle('selected', validatePhotoPath(state.profile.photo) === catPhotos[i]);
        img.onerror = () => { img.style.opacity = '0.4'; img.title = 'Image not found'; };
        img.onclick = () => {
            state.profile.photo = catPhotos[i];
            renderCatPicOptions();
            setMainCatSrc(catPhotos[i]);
            saveStateWithGlobal(); // Photo change - update global
            renderLeaderboard();
        };
    });
}
profileNameInput.value = state.profile.name;
setMainCatSrc(validatePhotoPath(state.profile.photo));
renderCatPicOptions();
let previousProfileName = state.profile.name;
saveProfileBtn.onclick = () => {
    const newName = profileNameInput.value.trim() || 'Cat Lover';
    // Remove old leaderboard entry by previous name
    let board = [];
    try {
        board = JSON.parse(localStorage.getItem('catClickerLeaderboard') || '[]');
    } catch {}
    board = board.filter(u => u.name !== previousProfileName);
    localStorage.setItem('catClickerLeaderboard', JSON.stringify(board));
    state.profile.name = newName;
    previousProfileName = newName;
    // Close the modal
    profileModal.classList.add('hidden');
    saveStateWithGlobal(); // Important profile change - update global
    renderLeaderboard();
    setMainCatSrc(validatePhotoPath(state.profile.photo));
};

// --- Research System ---
function checkAvailableResearch() {
    // Check which research upgrades should be available but aren't purchased yet
    researchUpgrades.forEach(upgrade => {
        const isAlreadyPurchased = state.research.unlockedUpgrades.includes(upgrade.id);
        const isAlreadyAvailable = state.research.availableUpgrades.includes(upgrade.id);
        
        if (!isAlreadyPurchased && !isAlreadyAvailable && upgrade.unlockCondition()) {
            state.research.availableUpgrades.push(upgrade.id);
            showAchievementBanner(` New Kitten Lab Research Available: ${upgrade.name}!`);
        }
    });
}

function getResearchUpgradeCost(upgradeId) {
    const upgrade = researchUpgrades.find(u => u.id === upgradeId);
    return upgrade ? upgrade.baseCost : Infinity;
}

function canBuyResearchUpgrade(upgradeId) {
    const upgrade = researchUpgrades.find(u => u.id === upgradeId);
    if (!upgrade) return false;
    
    const isAvailable = state.research.availableUpgrades.includes(upgradeId);
    const isNotPurchased = !state.research.unlockedUpgrades.includes(upgradeId);
    const canAfford = state.meowCount >= upgrade.baseCost;
    
    return isAvailable && isNotPurchased && canAfford;
}

function buyResearchUpgrade(upgradeId) {
    console.log(`Attempting to buy research upgrade: ${upgradeId}`);
    console.log(`Can buy check:`, canBuyResearchUpgrade(upgradeId));
    
    if (!canBuyResearchUpgrade(upgradeId)) {
        console.log('Failed canBuyResearchUpgrade check');
        return;
    }
    
    const upgrade = researchUpgrades.find(u => u.id === upgradeId);
    console.log(`Found upgrade:`, upgrade);
    
    // Deduct cost
    state.meowCount -= upgrade.baseCost;
    console.log(`Deducted ${upgrade.baseCost} meows. New total: ${state.meowCount}`);
    
    // Add to purchased upgrades
    state.research.unlockedUpgrades.push(upgradeId);
    
    // Remove from available (since it's now purchased)
    state.research.availableUpgrades = state.research.availableUpgrades.filter(id => id !== upgradeId);
    
    showAchievementBanner(` Kitten Lab Research Complete: ${upgrade.name}! ${upgrade.desc}`);
    
    updateStats();
    renderUpgrades();
    renderResearchUpgrades();
    saveStateWithGlobal();
}

// Make buyResearchUpgrade globally accessible
window.buyResearchUpgrade = buyResearchUpgrade;

// Debug function for testing research
window.testResearch = function() {
    console.log('Current upgrades:', state.upgrades);
    console.log('Available research:', state.research.availableUpgrades);
    console.log('Purchased research:', state.research.unlockedUpgrades);
    
    // Add some upgrades for testing
    state.upgrades[0] = 5; // 5 Kitten Helpers - should unlock first research
    state.upgrades[1] = 3; // 3 Laser Pointers - should unlock second research
    updateStats();
    renderUpgrades();
    console.log('After adding upgrades - Available research:', state.research.availableUpgrades);
};

// Quick function to add meows for testing
window.addMeows = function(amount = 10000) {
    state.meowCount += amount;
    updateStats();
    console.log(`Added ${amount} meows. Total: ${state.meowCount}`);
};

// Function to manually unlock first research for testing
window.unlockFirstResearch = function() {
    state.research.availableUpgrades.push('kitten_efficiency');
    renderResearchUpgrades();
    console.log('Manually unlocked first research');
};

// Test function to manually trigger button click
window.testButtonClick = function() {
    const btn = document.getElementById('research-kitten_efficiency');
    if (btn) {
        console.log('Found research button, attempting to click...');
        btn.click();
    } else {
        console.log('Research button not found');
    }
};

function getUnlockMessage(upgrade) {
    // Get human readable unlock condition
    switch(upgrade.id) {
        case 'kitten_efficiency':
            return `Buy ${5 - state.upgrades[0]} more Kitten Helper${5 - state.upgrades[0] !== 1 ? 's' : ''} (${state.upgrades[0]}/5)`;
        case 'laser_focus':
            return `Buy ${3 - state.upgrades[1]} more Laser Pointer${3 - state.upgrades[1] !== 1 ? 's' : ''} (${state.upgrades[1]}/3)`;
        case 'catnip_genetics':
            return `Buy ${2 - state.upgrades[2]} more Catnip Farm${2 - state.upgrades[2] !== 1 ? 's' : ''} (${state.upgrades[2]}/2)`;
        case 'tower_architecture':
            return `Buy ${2 - state.upgrades[3]} more Cat Tower${2 - state.upgrades[3] !== 1 ? 's' : ''} (${state.upgrades[3]}/2)`;
        case 'cafe_ambiance':
            return `Buy ${1 - state.upgrades[4]} more Cat Cafe (${state.upgrades[4]}/1)`;
        case 'machine_automation':
            return `Buy ${1 - state.upgrades[5]} more Meowing Machine (${state.upgrades[5]}/1)`;
        default:
            return 'Continue playing to unlock';
    }
}

function getResearchMultiplier(upgradeIndex) {
    let multiplier = 1;
    
    // Check for specific upgrade bonuses
    const specificUpgrade = researchUpgrades.find(u => 
        u.targetUpgrade === upgradeIndex && 
        state.research.unlockedUpgrades.includes(u.id)
    );
    if (specificUpgrade) {
        multiplier *= specificUpgrade.effect();
    }
    
    // Check for global bonuses (targetUpgrade === -1)
    const globalUpgrades = researchUpgrades.filter(u => 
        u.targetUpgrade === -1 && 
        state.research.unlockedUpgrades.includes(u.id)
    );
    globalUpgrades.forEach(upgrade => {
        multiplier *= upgrade.effect();
    });
    
    return multiplier;
}

function renderResearchUpgrades() {
    // Use the modal content div, fall back to old div for compatibility
    const targetDiv = kittenLabContent || researchUpgradesDiv;
    if (!targetDiv) return;
    
    // Check for new available research
    checkAvailableResearch();
    
    const availableUpgrades = state.research.availableUpgrades;
    
    if (availableUpgrades.length === 0) {
        // Show what's needed to unlock research
        const nextResearch = researchUpgrades.find(upgrade => 
            !state.research.unlockedUpgrades.includes(upgrade.id) && 
            !state.research.availableUpgrades.includes(upgrade.id)
        );
        
        if (nextResearch) {
            const nextResearchMessage = getUnlockMessage(nextResearch);
            targetDiv.innerHTML = `<p style="color: #aaa; font-style: italic; text-align: center; grid-column: 1 / -1;">No kitten research available yet.<br><br>🔬 Next unlock: ${nextResearchMessage}</p>`;
        } else {
            targetDiv.innerHTML = '<p style="color: #aaa; font-style: italic; text-align: center; grid-column: 1 / -1;">No kitten research available yet. Keep playing to unlock new discoveries!</p>';
        }
        updateResearchNotification(); // Update notification badge
        return;
    }
    
    targetDiv.innerHTML = '';
    
    console.log(`Creating ${availableUpgrades.length} research upgrade buttons:`, availableUpgrades);
    
    // Sort research upgrades by affordability (affordable first, then by cost)
    const sortedUpgrades = availableUpgrades.slice().sort((a, b) => {
        const upgradeA = researchUpgrades.find(u => u.id === a);
        const upgradeB = researchUpgrades.find(u => u.id === b);
        
        if (!upgradeA || !upgradeB) return 0;
        
        const canAffordA = state.meowCount >= upgradeA.baseCost;
        const canAffordB = state.meowCount >= upgradeB.baseCost;
        
        // Affordable items first
        if (canAffordA && !canAffordB) return -1;
        if (!canAffordA && canAffordB) return 1;
        
        // If both affordable or both unaffordable, sort by cost (cheaper first)
        return upgradeA.baseCost - upgradeB.baseCost;
    });
    
    sortedUpgrades.forEach(upgradeId => {
        const upgrade = researchUpgrades.find(u => u.id === upgradeId);
        if (!upgrade) return;
        
        const cost = upgrade.baseCost;
        const canAfford = state.meowCount >= cost;
        
        console.log(`Creating button for ${upgradeId}: cost=${cost}, canAfford=${canAfford}, meowCount=${state.meowCount}`);
        
        const btn = document.createElement('button');
        btn.className = 'research-upgrade-btn';
        btn.id = `research-${upgradeId}`; // Add ID for easier debugging
        
        // Use CSS classes instead of inline styles for better performance and to avoid conflicts
        if (canAfford) {
            btn.classList.add('affordable');
            btn.classList.remove('disabled');
        } else {
            btn.classList.add('disabled');
            btn.classList.remove('affordable');
        }
        
        btn.innerHTML = `
            <div style="font-weight: bold; color: #00fff7; margin-bottom: 0.3rem;">
                ${upgrade.emoji} ${upgrade.name}
            </div>
            <div style="color: #ccc; margin-bottom: 0.5rem; font-size: 0.85rem;">
                ${upgrade.desc}
            </div>
            <div style="color: ${canAfford ? '#ffd700' : '#999'}; font-weight: bold;">
                Cost: ${formatNumber(cost)} meows
            </div>
        `;
        
        // Apply buffered clicks immediately before affordability check
        const flushClickBuffer = () => {
            if (typeof clickBuffer !== 'undefined' && clickBuffer > 0) {
                state.meowCount += clickBuffer * state.meowsPerClick;
                clickBuffer = 0;
                updateStats();
            }
        };
        
        // Create robust click handler function
        function handleResearchClick(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log(`Research button clicked: ${upgradeId}`);
            
            // Flush any pending clicks to ensure accurate meow count
            flushClickBuffer();
            
            // Re-check affordability with current state
            const currentCanAfford = state.meowCount >= cost;
            const canBuy = canBuyResearchUpgrade(upgradeId);
            
            console.log(`Can afford: ${currentCanAfford}, Can buy: ${canBuy}, Meows: ${state.meowCount}, Cost: ${cost}`);
            
            if (currentCanAfford && canBuy) {
                console.log(`Purchasing research upgrade: ${upgradeId}`);
                buyResearchUpgrade(upgradeId);
            } else {
                console.log('Cannot purchase research upgrade');
            }
        }
        
        // Remove old event handlers first
        btn.onclick = null;
        
        // Add multiple event handlers for maximum reliability (like regular upgrades)
        btn.addEventListener('click', handleResearchClick);
        btn.addEventListener('mousedown', handleResearchClick);
        
        // Also add touch event for mobile
        btn.addEventListener('touchstart', handleResearchClick);
        
        // Fallback onclick handler
        btn.onclick = handleResearchClick;
        
        targetDiv.appendChild(btn);
        
        // Apply Twemoji to render emojis as images
        applyTwemoji(btn);
        
        console.log(`Appended button for ${upgradeId} to DOM. Button element:`, btn);
        console.log(`Button onclick handler:`, btn.onclick);
    });
    
    console.log(`Total buttons created: ${targetDiv.children.length}`);
    
    // Update notification badge
    updateResearchNotification();
}

// --- Upgrades ---
function renderUpgrades() {
    upgradeBtns.forEach((btn, i) => {
        const upg = upgrades[i];
        const cost = Math.floor(upg.baseCost * Math.pow(1.15, state.upgrades[i]));
        const researchMultiplier = getResearchMultiplier(i);
        const effectiveMPS = upg.mps * researchMultiplier;
        
        // Check for overflow/precision issues
        if (cost > Number.MAX_SAFE_INTEGER) {
            console.warn(`Upgrade ${i} cost exceeds safe integer limit:`, cost);
        }
        
        btn.innerHTML = `
            <div class="upgrade-line1">
                <span class="upgrade-title">${upg.name}:</span>
                <span class="upgrade-desc">${upg.desc}</span>
            </div>
            ${researchMultiplier > 1 ? `<div class="upgrade-lab-bonus" style="color: #00fff7; font-size: 0.8rem; margin-top: 2px; margin-bottom: 4px;">(${formatNumber((researchMultiplier - 1) * 100)}% lab bonus)</div>` : ''}
            <div class="upgrade-line2">
                <span class="upgrade-mps">+${formatNumber(effectiveMPS)}/sec</span>
                <span class="upgrade-owned">Owned: ${state.upgrades[i]}</span>
                <span class="upgrade-cost">Cost: ${formatNumber(cost)}</span>
            </div>
        `;
    // Use floored meows to match the displayed Total Meows and avoid confusion
    const canAfford = Math.floor(state.meowCount) >= cost;
    btn.classList.toggle('upgrade-available', canAfford);
    btn.classList.toggle('is-disabled', !canAfford);
    btn.setAttribute('aria-disabled', canAfford ? 'false' : 'true');
    });
}

    // Apply buffered clicks immediately when needed (e.g., before a purchase)
    function flushClickBuffer() {
        if (clickBuffer > 0) {
            state.meowCount += clickBuffer * state.meowsPerClick;
            clickBuffer = 0;
            lastUpdateTime = Date.now();
            updateStats();
        }
    }

// Attach direct click handlers to each upgrade button for maximum reliability
upgradeBtns.forEach((btn, i) => {
    if (!btn) return;
    btn.dataset.upgradeIndex = String(i);
    
    function handleUpgradeClick(e) {
        // Evaluate disabled state at click time using aria-disabled/class
        if (btn.classList.contains('is-disabled') || btn.getAttribute('aria-disabled') === 'true') return;
        e.preventDefault();
        e.stopPropagation();
        
        // Ensure most recent clicks are counted before affordability check
        flushClickBuffer();
        const idx = Number(btn.dataset.upgradeIndex || i);
        const upg = upgrades[idx];
        const cost = Math.floor(upg.baseCost * Math.pow(1.15, state.upgrades[idx]));
        
        // Match the UI: allow purchase when displayed (floored) meows meet cost
        if (Math.floor(state.meowCount) >= cost) {
            btn.classList.add('clicked');
            state.meowCount -= cost;
            state.upgrades[idx]++;
            updateStats();
            setTimeout(() => {
                renderUpgrades();
                saveStateWithGlobal(); // Upgrade purchase - important event for global leaderboard
                renderLeaderboard();
                btn.classList.remove('clicked');
            }, 50);
        }
    }
    
    // Add both click and mousedown events for better reliability
    btn.addEventListener('click', handleUpgradeClick);
    btn.addEventListener('mousedown', handleUpgradeClick);
    
    // Prevent context menu on right click
    btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // Add touch events for devices that support both mouse and touch
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleUpgradeClick(e);
    });
});

function calcMeowsPerSecond() {
    // Base production with research multipliers
    let baseMPS = upgrades.reduce((sum, upg, i) => {
        const baseProduction = state.upgrades[i] * upg.mps;
        const researchMultiplier = getResearchMultiplier(i);
        return sum + (baseProduction * researchMultiplier);
    }, 0);
    
    // Apply prestige bonuses
    const prestigeMultiplier = getTotalPrestigeMultiplier().production;
    baseMPS *= prestigeMultiplier;
    
    // Apply golden paw production multiplier
    baseMPS *= state.goldenPaw.productionMultiplier;
    
    meowsPerSecond = baseMPS;
    
    // Check for potential overflow
    if (meowsPerSecond > Number.MAX_SAFE_INTEGER) {
        console.warn('Meows per second exceeds safe integer limit:', meowsPerSecond);
    }
}

// --- Achievements ---
function checkAchievements() {
    Object.keys(achievements).forEach(id => {
        const achievement = achievements[id];
        const stateAchievement = state.achievements[id];
        
        if (!stateAchievement.unlocked && achievement.check()) {
            stateAchievement.unlocked = true;
            renderAchievements();
            // Show banner notification instead of alert
            showAchievementBanner(`Achievement Unlocked: ${achievement.name}! Click to activate for +${achievement.reward} meows per click!`);
        }
    });
}

function renderAchievements() {
    // Apply glow effects based on activated achievements
    Object.keys(achievements).forEach(id => {
        const stateAchievement = state.achievements[id];
        
        if (stateAchievement.activated) {
            if (id === 'fiftyUpgrades') {
                // Only show silver if gold isn't active
                const goldActive = !!(state.achievements.millionMeows && state.achievements.millionMeows.activated);
                if (!goldActive) catBtn.classList.add('legend-glow');
            }
            if (id === 'millionMeows') {
                catBtn.classList.add('millionaire-glow'); // gold
                catBtn.classList.remove('legend-glow'); // override silver
            }
        } else {
            // Remove glows if deactivated (safety)
            if (id === 'fiftyUpgrades') catBtn.classList.remove('legend-glow');
            if (id === 'millionMeows') catBtn.classList.remove('millionaire-glow');
        }
    });
    
    // Update achievement notification badge
    updateAchievementNotification();
}

function updateAchievementNotification() {
    if (!achievementNotification) return;
    
    // Check if there are any unlocked but not activated achievements
    const hasUnclaimedAchievements = Object.keys(achievements).some(id => {
        const stateAchievement = state.achievements[id];
        return stateAchievement.unlocked && !stateAchievement.activated;
    });
    
    if (hasUnclaimedAchievements) {
        achievementNotification.classList.remove('hidden');
    } else {
        achievementNotification.classList.add('hidden');
    }
}

function updateResearchNotification() {
    if (!researchNotification) return;
    
    // Check if there are any available research upgrades the player can afford
    const hasAffordableResearch = state.research.availableUpgrades.some(upgradeId => {
        const upgrade = researchUpgrades.find(u => u.id === upgradeId);
        if (!upgrade) return false;
        return state.meowCount >= upgrade.baseCost;
    });
    
    if (hasAffordableResearch) {
        researchNotification.classList.remove('hidden');
    } else {
        researchNotification.classList.add('hidden');
    }
}

function renderAchievementsModal() {
    if (!achievementsModalList) return;
    
    achievementsModalList.innerHTML = '';
    
    // Sort achievements by priority: unlocked (not activated) first, then activated, then locked
    const sortedAchievements = Object.keys(achievements).sort((a, b) => {
        const stateA = state.achievements[a];
        const stateB = state.achievements[b];
        
        // Priority: unlocked but not activated (2), activated (1), locked (0)
        const getPriority = (stateAchievement) => {
            if (stateAchievement.unlocked && !stateAchievement.activated) return 2;
            if (stateAchievement.activated) return 1;
            return 0;
        };
        
        return getPriority(stateB) - getPriority(stateA);
    });
    
    sortedAchievements.forEach(id => {
        const achievement = achievements[id];
        const stateAchievement = state.achievements[id];
        
        const item = document.createElement('div');
        item.className = 'achievement-modal-item';
        
        let statusClass = 'locked';
        let statusText = 'Locked';
        
        if (stateAchievement.activated) {
            item.classList.add('activated');
            statusClass = 'activated';
            statusText = 'Activated ✓';
        } else if (stateAchievement.unlocked) {
            item.classList.add('unlocked');
            statusClass = 'unlocked';
            statusText = 'Click to Activate!';
        } else {
            item.classList.add('locked');
        }
        
        item.innerHTML = `
            <div class="achievement-modal-title">${achievement.name}</div>
            <div class="achievement-modal-desc">${achievement.desc}</div>
            <div class="achievement-modal-reward">Reward: +${formatNumber(achievement.reward)} meows per click</div>
            <div class="achievement-modal-status status-${statusClass}">${statusText}</div>
        `;
        
        // Add click handler for unlocked but not activated achievements
        if (stateAchievement.unlocked && !stateAchievement.activated) {
            item.addEventListener('click', () => {
                stateAchievement.activated = true;
                state.meowsPerClick += achievement.reward;
                updateStats();
                renderAchievements();
                renderAchievementsModal(); // Refresh the modal
                saveStateWithGlobal();
                showAchievementBanner(`${achievement.name} activated! +${achievement.reward} meows per click!`);
                
                // Apply glow effects if needed
                if (id === 'fiftyUpgrades') {
                    const goldActive = !!(state.achievements.millionMeows && state.achievements.millionMeows.activated);
                    if (!goldActive) catBtn.classList.add('legend-glow');
                }
                if (id === 'millionMeows') {
                    catBtn.classList.add('millionaire-glow');
                    catBtn.classList.remove('legend-glow');
                }
            });
        }
        
        achievementsModalList.appendChild(item);
    });
}

function renderPrestigeModal() {
    if (!prestigeContent) return;
    
    // Clear any existing content first to prevent duplicates
    prestigeContent.innerHTML = '';
    
    const heavenlyTreats = state.prestige.heavenlyTreats;
    const availableTreats = calculateHeavenlyTreats(); // Treats from current run
    const canPrestigeNow = canPrestige();
    
    let content = `
        <div style="text-align: center; margin-bottom: 1rem;">
            <div style="font-size: 1.1rem; font-weight: bold; color: #ffd700; margin-bottom: 0.3rem;">
                ✨ Prestige Level: ${state.prestige.level} ✨
            </div>
            <div style="font-size: 0.9rem; color: #fff; margin-bottom: 0.3rem;">
                💫 Heavenly Treats: ${heavenlyTreats} 💫
            </div>
            <div style="font-size: 0.8rem; color: #aaa; margin-bottom: 0.3rem;">
                This Run: ${formatNumber(state.meowCount)} meows | Available: ${availableTreats} treats
            </div>
            <div style="font-size: 0.75rem; color: #aaa; font-style: italic;">
                Heavenly Treats unlock permanent bonuses for all future runs!
            </div>
        </div>
    `;
    
    if (canPrestigeNow) {
        const newTreats = availableTreats; // Treats from this run
        content += `
            <div style="text-align: center; margin-bottom: 1rem;">
                <button onclick="performPrestige()" style="
                    background: linear-gradient(45deg, #ffd700, #ffed4e, #ffa500); 
                    border: 2px solid #fff;
                    padding: 1rem 2rem; 
                    border-radius: 12px; 
                    cursor: pointer; 
                    font-weight: bold; 
                    color: #8b4513;
                    font-size: 1.1rem;
                    min-height: 50px;
                    width: 100%;
                    max-width: 300px;
                    touch-action: manipulation;
                    -webkit-tap-highlight-color: transparent;
                    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.6);
                    transition: all 0.2s ease;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    🌟 Ascend to Prestige ${state.prestige.level + 1} (+${newTreats} treats) 🌟
                </button>
            </div>
        `;
    } else {
        // Calculate what we need for the next heavenly treat from current run only
        const currentRunMeows = state.meowCount;
        const needed = 1000000; // Need 1 million meows this run for first treat
        const remaining = Math.max(0, needed - currentRunMeows);
        
        content += `
            <div style="text-align: center; margin-bottom: 1rem; color: #aaa;">
                <div style="margin-bottom: 0.3rem; font-size: 0.9rem;">Need more meows this run to prestige!</div>
                <div style="font-size: 0.8rem;">
                    This run: ${formatNumber(currentRunMeows)} | Need: ${formatNumber(needed)}<br>
                    <span style="color: #ff6b6b;">Missing: ${formatNumber(remaining)} meows</span>
                </div>
                <div style="font-size: 0.7rem; margin-top: 0.3rem; font-style: italic;">
                    (Each prestige counts only meows from the current run)
                </div>
            </div>
        `;
    }
    
    // Show prestige tree
    if (state.prestige.level > 0 || heavenlyTreats > 0) {
        content += renderPrestigeTree();
    } else {
        content += `
            <div style="text-align: center; margin-top: 1rem; color: #aaa; font-style: italic;">
                Complete your first prestige to unlock the Heavenly Tree!
            </div>
        `;
    }
    
    prestigeContent.innerHTML = content;
}

function updateStats() {
    calcMeowsPerSecond();
    
    // Update total meows counter (also track for prestige)
    if (state.meowCount > 0) {
        // This ensures we track the highest meow count achieved
        const previousTotal = state.prestige.totalMeowsEver;
        state.prestige.totalMeowsEver = Math.max(previousTotal, previousTotal + state.meowCount - (state.lastMeowCountForPrestige || 0));
        state.lastMeowCountForPrestige = state.meowCount;
    }
    
    totalMeowsSpan.textContent = formatNumber(state.meowCount);
    meowsPerSecondSpan.textContent = formatNumber(meowsPerSecond);
    
    // Calculate and display effective meows per click
    let effectiveMeowsPerClick = state.meowsPerClick;
    const prestigeMultiplier = getTotalPrestigeMultiplier().clicking;
    effectiveMeowsPerClick *= prestigeMultiplier * state.goldenPaw.clickMultiplier;
    
    meowsPerClickSpan.textContent = formatNumber(effectiveMeowsPerClick);
    totalClicksSpan.textContent = formatNumber(state.totalClicks);
    
    checkAchievements();
    renderResearchUpgrades(); // Check for new research upgrades
}

function updatePrestigeDisplay() {
    // Add prestige info to the achievements section
    let prestigeInfo = document.getElementById('prestigeInfo');
    if (!prestigeInfo) {
        prestigeInfo = document.createElement('div');
        prestigeInfo.id = 'prestigeInfo';
        prestigeInfo.style.cssText = `
            margin-top: 1rem;
            padding: 1rem;
            background: linear-gradient(135deg, #2d1b69, #ffd700, #4b0082, #ffa500);
            background-size: 300% 300%;
            animation: prestigeGlow 12s ease-in-out infinite alternate;
            border-radius: 15px;
            font-size: 0.95rem;
            color: #ffffff;
            border: 3px solid #ffd700;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(147, 112, 219, 0.4);
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
            position: relative;
            overflow: hidden;
        `;
        
        // Add the glowing animation
        if (!document.getElementById('prestigeStyles')) {
            const styles = document.createElement('style');
            styles.id = 'prestigeStyles';
            styles.textContent = `
                @keyframes prestigeGlow {
                    0% { 
                        background-position: 0% 50%;
                        box-shadow: 0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(147, 112, 219, 0.4);
                    }
                    50% { 
                        background-position: 100% 50%;
                        box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(147, 112, 219, 0.6);
                    }
                    100% { 
                        background-position: 0% 50%;
                        box-shadow: 0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(147, 112, 219, 0.4);
                    }
                }
                
                #prestigeInfo::before {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    background: linear-gradient(45deg, #ffd700, #4b0082, #ffa500, #2d1b69);
                    border-radius: 15px;
                    z-index: -1;
                    animation: prestigeBorderGlow 8s linear infinite;
                }
                
                @keyframes prestigeBorderGlow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .prestige-upgrade-btn {
                    background: linear-gradient(45deg, #4a0e4e, #2d1b69);
                    border: 2px solid #ffd700;
                    color: #ffd700;
                    padding: 0.5rem;
                    margin: 0.2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: bold;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                    transition: all 0.2s ease;
                    display: block;
                    width: 100%;
                    text-align: left;
                }
                
                .prestige-upgrade-btn:hover {
                    background: linear-gradient(45deg, #5a1e5e, #3d2b79);
                    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
                    transform: translateY(-1px);
                }
                
                .prestige-upgrade-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background: linear-gradient(45deg, #2a0a2e, #1d1359);
                }
                
                .prestige-upgrade-btn:disabled:hover {
                    transform: none;
                    box-shadow: none;
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Insert after the cat clicker button
        if (catClickerSection) {
            catClickerSection.appendChild(prestigeInfo);
        }
    }
    
    // OLD PRESTIGE SYSTEM REMOVED - Now using header button + modal
    // The prestige functionality is handled by the header button and modal system
}

// Custom Prestige Confirmation Modal
function showPrestigeConfirmation(newTreats) {
    const modal = document.getElementById('prestigeConfirmModal');
    const rewardText = document.getElementById('prestigeRewardText');
    const yesBtn = document.getElementById('prestigeConfirmYes');
    const noBtn = document.getElementById('prestigeConfirmNo');
    
    // Update the reward text
    rewardText.textContent = `You will gain ${newTreats} Heavenly Treats from this run`;
    
    // Show the modal
    modal.classList.remove('hidden');
    
    // Handle Yes button
    yesBtn.onclick = () => {
        modal.classList.add('hidden');
        executePrestige(newTreats);
    };
    
    // Handle No button
    noBtn.onclick = () => {
        modal.classList.add('hidden');
    };
    
    // Close modal when clicking outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    };
}

function executePrestige(newTreats) {
    // Set cooldown timestamp
    window.prestigeCooldown = Date.now();
    
    // Update prestige stats
    state.prestige.totalMeowsEver += state.meowCount;
    state.prestige.heavenlyTreats += newTreats; // Add new treats to existing total
    state.prestige.level++;
    
    // Reset game progress
    state.meowCount = 0;
    state.totalClicks = 0;
    state.meowsPerClick = 1;
    state.upgrades = [0, 0, 0, 0, 0, 0, 0, 0];
    
    // Reset achievements but keep activated ones for next run
    Object.keys(state.achievements).forEach(id => {
        if (!state.achievements[id].activated) {
            state.achievements[id].unlocked = false;
        }
    });
    
    // Reset research upgrades
    if (state.research) {
        Object.keys(state.research).forEach(id => {
            state.research[id].purchased = false;
        });
    }
    
    // Reset golden paw effects
    state.goldenPaw = {
        isActive: false,
        lastSpawn: 0,
        clickMultiplier: 1,
        productionMultiplier: 1,
        effectEndTime: 0,
        activeEffect: null
    };
    
    // Apply starting bonuses from prestige upgrades
    applyPrestigeBonus('eternal_meows');
    
    // Show achievement banner
    showAchievementBanner(`🌟 Prestige ${state.prestige.level}! You gained ${newTreats} Heavenly Treats! Your journey begins anew with heavenly power!`);
    
    // Update displays
    updateStats();
    renderUpgrades();
    renderAchievements();
    renderPrestigeModal();
    renderKittenLabModal();
    updateEffectDisplay();
    
    // Close the prestige modal and refresh its content for next time
    const prestigeModal = document.getElementById('prestigeModal');
    if (prestigeModal) {
        prestigeModal.classList.add('hidden');
    }
    
    // Save state
    saveStateWithGlobal();
}

// Optimized cat button handler for rapid clicking
let clickBuffer = 0;
let lastUpdateTime = 0;

function handleCatClick() {
    // Debug: Add console log for testing
    console.log('Cat clicked!', Date.now());
    
    // Increment click buffer immediately for responsiveness
    clickBuffer++;
    state.totalClicks++;
    
    // Process clicks in batches for better performance during rapid clicking
    const now = Date.now();
    if (now - lastUpdateTime > 50) { // Update every 50ms max during rapid clicking
        // Calculate effective meows per click with all bonuses
        let effectiveMeowsPerClick = state.meowsPerClick;
        
        // Apply prestige clicking bonus
        const prestigeMultiplier = getTotalPrestigeMultiplier().clicking;
        effectiveMeowsPerClick *= prestigeMultiplier;
        
        // Apply golden paw click multiplier
        effectiveMeowsPerClick *= state.goldenPaw.clickMultiplier;
        
        state.meowCount += clickBuffer * effectiveMeowsPerClick;
        clickBuffer = 0;
        lastUpdateTime = now;
        
        updateStats();
        renderUpgrades();
    }
    
    // Always animate the cat for immediate feedback
    catBtn.classList.add('clicked');
    setTimeout(() => catBtn.classList.remove('clicked'), 150);
}

// Add both click and touch event handlers for better mobile support
// Desktop click support
catBtn.addEventListener('click', handleCatClick);

// Mobile touch support - multiple approaches for maximum compatibility
let touchStarted = false;

catBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent zoom and scrolling
    touchStarted = true;
    console.log('Touch started');
    handleCatClick();
}, { passive: false });

catBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchStarted = false;
    console.log('Touch ended');
}, { passive: false });

// Prevent context menu on long press (mobile)
catBtn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Mouse events for desktop (but not if touch was used)
catBtn.addEventListener('mousedown', (e) => {
    if (!touchStarted) {
        console.log('Mouse down (desktop)');
    }
});

// Fallback for older browsers/devices
catBtn.onclick = function(e) {
    if (!touchStarted) {
        console.log('Fallback onclick triggered');
        handleCatClick();
    }
};

// Fallback update to ensure any remaining clicks are processed
setInterval(() => {
    if (clickBuffer > 0) {
        // Calculate effective meows per click with all bonuses
        let effectiveMeowsPerClick = state.meowsPerClick;
        const prestigeMultiplier = getTotalPrestigeMultiplier().clicking;
        effectiveMeowsPerClick *= prestigeMultiplier * state.goldenPaw.clickMultiplier;
        
        state.meowCount += clickBuffer * effectiveMeowsPerClick;
        clickBuffer = 0;
        updateStats();
        renderUpgrades();
        // Only save to local storage here, not global (to avoid rate limits)
        state.lastActive = Date.now();
        localStorage.setItem('catClickerState', JSON.stringify(state));
    }
}, 100);

// Passive meows per second
setInterval(() => {
    state.meowCount += meowsPerSecond / 10;
    updateStats();
    renderUpgrades();
    // Only save to local storage here, not global (to avoid rate limits)
    state.lastActive = Date.now();
    localStorage.setItem('catClickerState', JSON.stringify(state));
}, 100);

// Golden Cat Paw spawning and effect updates
setInterval(() => {
    spawnGoldenPaw();
    updateGoldenPawEffects();
    updateEffectDisplay();
}, 2000); // Check every 2 seconds

// Less frequent global leaderboard updates (every 2 minutes when idle)
setInterval(() => {
    saveToGlobalLeaderboard();
}, 120000);

// --- Leaderboard (Firebase Global) ---
// Real Firebase global leaderboard - syncs across all devices
let globalLeaderboardData = [];

// Rate limiting for API calls
let lastGlobalSave = 0;
let lastGlobalLoad = 0;
const GLOBAL_SAVE_COOLDOWN = 5000; // 5 seconds between saves
const GLOBAL_LOAD_COOLDOWN = 2000; // 2 seconds between loads

async function saveToGlobalLeaderboard() {
    // Only save to global if user has opted in by viewing leaderboard
    if (!state.globalLeaderboardOptIn) {
        console.log('User not opted into global leaderboard yet - waiting for first leaderboard view');
        return;
    }
    
    const now = Date.now();
    
    // Rate limit: don't save more than once every 5 seconds
    if (now - lastGlobalSave < GLOBAL_SAVE_COOLDOWN) {
        console.log('Global leaderboard save rate limited');
        return;
    }
    
    // Check if Firebase is available
    if (!window.firebase) {
        console.log('Firebase not loaded yet, falling back to local storage');
        saveToLocalBackup();
        return;
    }
    
    try {
        const { database, ref, set } = window.firebase;
        console.log('Updating Firebase global leaderboard...');
        
        // Create unique player ID from name + timestamp for collision prevention
        const playerId = btoa(state.profile.name).replace(/[^a-zA-Z0-9]/g, '');
        
        // Save player data to Firebase
        const playerData = {
            name: state.profile.name,
            photo: state.profile.photo,
            meows: Math.floor(state.meowCount),
            prestige: state.prestige.level, // Add prestige level
            timestamp: Date.now(),
            lastUpdated: Date.now()
        };
        
        await set(ref(database, `leaderboard/${playerId}`), playerData);
        
        lastGlobalSave = now;
        console.log('Successfully saved to Firebase global leaderboard');
        
        // Also save to localStorage as backup
        saveToLocalBackup();
        
    } catch (error) {
        console.log('Failed to update Firebase leaderboard:', error);
        // Fallback to local storage
        saveToLocalBackup();
    }
}

function saveToLocalBackup() {
    try {
        // Load existing backup data
        let backupData = [];
        const saved = localStorage.getItem('globalLeaderboardBackup');
        if (saved) {
            backupData = JSON.parse(saved);
        }
        
        // Remove existing entry for this player
        backupData = backupData.filter(u => u.name !== state.profile.name);
        
        // Add current player
        backupData.push({
            name: state.profile.name,
            photo: state.profile.photo,
            meows: Math.floor(state.meowCount),
            prestige: state.prestige.level, // Add prestige level
            timestamp: Date.now()
        });
        
        // Sort and keep top 50
        backupData.sort((a, b) => b.meows - a.meows);
        backupData = backupData.slice(0, 50);
        
        localStorage.setItem('globalLeaderboardBackup', JSON.stringify(backupData));
    } catch (error) {
        console.log('Failed to save backup data:', error);
    }
}

// Global leaderboard is the only leaderboard system now

async function renderLeaderboard() {
    const now = Date.now();
    
    // If user hasn't opted in, show invitation to join global leaderboard
    if (!state.globalLeaderboardOptIn) {
        renderGlobalLeaderboardInvite();
        return;
    }
    
    // Rate limit: don't load more than once every 2 seconds
    if (now - lastGlobalLoad < GLOBAL_LOAD_COOLDOWN) {
        console.log('Global leaderboard load rate limited, using cached data');
        return;
    }
    
    // Check if Firebase is available
    if (!window.firebase) {
        console.log('Firebase not loaded yet, using backup data');
        renderBackupLeaderboard();
        return;
    }
    
    try {
        const { database, ref, get } = window.firebase;
        console.log('Loading Firebase global leaderboard...');
        
        // Get all leaderboard data from Firebase
        const snapshot = await get(ref(database, 'leaderboard'));
        
        if (snapshot.exists()) {
            // Convert Firebase data to array
            const firebaseData = snapshot.val();
            globalLeaderboardData = Object.values(firebaseData);
        } else {
            globalLeaderboardData = [];
        }
        
        // Update player's current score in global leaderboard
        saveToGlobalLeaderboard();
        
        // Sort by meows (highest first) and get top 50
        globalLeaderboardData.sort((a, b) => b.meows - a.meows);
        const board = globalLeaderboardData.slice(0, 50);
        
        lastGlobalLoad = now;
        
        // Display global leaderboard
        leaderboardList.innerHTML = '';
        
        if (board.length === 0) {
            leaderboardList.innerHTML += '<p style="color: #aaa; font-style: italic;">No global players yet - you will be the first!</p>';
            return;
        }
        
        board.forEach((u, i) => {
            const li = document.createElement('li');
            
            // Add ranking with medals/numbers
            const rank = document.createElement('span');
            rank.style.fontWeight = 'bold';
            rank.style.marginRight = '0.5rem';
            rank.style.minWidth = '2rem';
            rank.style.display = 'inline-block';
            rank.style.textAlign = 'center';
            
            if (i === 0) {
                rank.textContent = '🥇';
                rank.style.fontSize = '1.2rem';
                rank.title = '1st Place - World Champion!';
            } else if (i === 1) {
                rank.textContent = '🥈';
                rank.style.fontSize = '1.1rem';
                rank.title = '2nd Place - Global Runner-up!';
            } else if (i === 2) {
                rank.textContent = '🥉';
                rank.style.fontSize = '1.1rem';
                rank.title = '3rd Place - World Bronze!';
            } else {
                rank.textContent = `${i + 1}.`;
                rank.style.color = '#00fff7';
                rank.style.fontSize = '0.9rem';
            }
            
            const img = document.createElement('img');
            img.alt = 'cat';
            img.src = validatePhotoPath(u.photo);
            img.onerror = () => { img.src = DEFAULT_CAT; };
            
            const name = document.createElement('b');
            name.textContent = u.name;
            
            const span = document.createElement('span');
            span.textContent = formatNumber(u.meows);
            
            // Special styling for top 3
            if (i < 3) {
                li.style.background = i === 0 ? 'rgba(255, 215, 0, 0.1)' : i === 1 ? 'rgba(192, 192, 192, 0.1)' : 'rgba(205, 127, 50, 0.1)';
                li.style.border = i === 0 ? '1px solid gold' : i === 1 ? '1px solid silver' : '1px solid #cd7f32';
                li.style.borderRadius = '8px';
                li.style.padding = '0.4rem';
                li.style.margin = '0.3rem 0';
                name.style.color = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : '#cd7f32';
            }
            
            // Highlight current player (override top 3 styling if needed)
            if (u.name === state.profile.name) {
                li.style.background = 'rgba(0, 255, 255, 0.2)';
                li.style.border = '2px solid #00fff7';
                li.style.borderRadius = '8px';
                li.style.padding = '0.4rem';
                li.style.margin = '0.3rem 0';
                li.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.3)';
                name.style.color = '#00fff7';
                name.textContent += ' (You)';
            }
            
            li.appendChild(rank);
            li.appendChild(img);
            li.appendChild(document.createTextNode(' '));
            li.appendChild(name);
            
            // Add prestige level if it exists
            if (u.prestige > 0) {
                const prestigeSpan = document.createElement('span');
                prestigeSpan.textContent = ` (P${u.prestige})`;
                prestigeSpan.style.color = '#ffd700';
                prestigeSpan.style.fontSize = '0.85em';
                prestigeSpan.style.fontWeight = 'bold';
                li.appendChild(prestigeSpan);
            }
            
            li.appendChild(document.createTextNode(': '));
            li.appendChild(span);
            li.appendChild(document.createTextNode(' meows'));
            leaderboardList.appendChild(li);
        });
        
    } catch (error) {
        console.log('Failed to load Firebase leaderboard:', error.message);
        // Fallback to backup data
        renderBackupLeaderboard();
    }
}

function renderBackupLeaderboard() {
    try {
        // Load backup data from localStorage
        const saved = localStorage.getItem('globalLeaderboardBackup');
        let board = [];
        if (saved) {
            board = JSON.parse(saved);
        }
        
        // Display backup leaderboard
        leaderboardList.innerHTML = '<p style="color: #ffa500; font-size: 0.9rem; margin-bottom: 1rem;">📱 Local Backup Leaderboard (Firebase unavailable)</p>';
        
        if (board.length === 0) {
            leaderboardList.innerHTML += '<p style="color: #aaa; font-style: italic;">No backup data available</p>';
            return;
        }
        
        board.slice(0, 50).forEach((u, i) => {
            const li = document.createElement('li');
            
            const rank = document.createElement('span');
            rank.style.fontWeight = 'bold';
            rank.style.marginRight = '0.5rem';
            rank.style.minWidth = '2rem';
            rank.style.display = 'inline-block';
            rank.style.textAlign = 'center';
            
            if (i === 0) {
                rank.textContent = '🥇';
                rank.style.fontSize = '1.2rem';
            } else if (i === 1) {
                rank.textContent = '🥈';
                rank.style.fontSize = '1.1rem';
            } else if (i === 2) {
                rank.textContent = '🥉';
                rank.style.fontSize = '1.1rem';
            } else {
                rank.textContent = `${i + 1}.`;
                rank.style.color = '#00fff7';
                rank.style.fontSize = '0.9rem';
            }
            
            const img = document.createElement('img');
            img.alt = 'cat';
            img.src = validatePhotoPath(u.photo);
            img.onerror = () => { img.src = DEFAULT_CAT; };
            
            const name = document.createElement('b');
            name.textContent = u.name;
            
            const span = document.createElement('span');
            span.textContent = formatNumber(u.meows);
            
            // Highlight current player
            if (u.name === state.profile.name) {
                li.style.background = 'rgba(0, 255, 255, 0.2)';
                li.style.border = '2px solid #00fff7';
                li.style.borderRadius = '8px';
                li.style.padding = '0.4rem';
                li.style.margin = '0.3rem 0';
                li.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.3)';
                name.style.color = '#00fff7';
                name.textContent += ' (You)';
            }
            
            li.appendChild(rank);
            li.appendChild(img);
            li.appendChild(document.createTextNode(' '));
            li.appendChild(name);
            
            // Add prestige level if it exists
            if (u.prestige > 0) {
                const prestigeSpan = document.createElement('span');
                prestigeSpan.textContent = ` (P${u.prestige})`;
                prestigeSpan.style.color = '#ffd700';
                prestigeSpan.style.fontSize = '0.85em';
                prestigeSpan.style.fontWeight = 'bold';
                li.appendChild(prestigeSpan);
            }
            
            li.appendChild(document.createTextNode(': '));
            li.appendChild(span);
            li.appendChild(document.createTextNode(' meows'));
            leaderboardList.appendChild(li);
        });
        
    } catch (error) {
        console.log('Failed to render backup leaderboard:', error);
        leaderboardList.innerHTML = '<p style="color: #ff6666; font-size: 0.9rem;">⚠️ Leaderboard temporarily unavailable</p>';
    }
}

function renderGlobalLeaderboardInvite() {
    // Show invitation to join global leaderboard
    leaderboardList.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem;">
            <h3 style="color: #00fff7; margin-bottom: 1rem;">🌍 Join Global Competition!</h3>
            <p style="color: #fff; margin-bottom: 1.5rem; line-height: 1.4;">
                Ready to compete with players worldwide?<br>
                Your current progress: <strong>${formatNumber(state.meowCount)} meows</strong>
            </p>
            <p style="color: #ffd700; font-size: 0.9rem; margin-bottom: 1.5rem;">
                🏆 By viewing this leaderboard, you'll be added to the global rankings!
            </p>
            <p style="color: #aaa; font-size: 0.8rem;">
                Click anywhere outside this message to join the worldwide competition.
            </p>
        </div>
    `;
}

// Remove local leaderboard functions - no longer needed

// --- Modal logic ---
if (profileBtn && profileModal && closeProfile) {
    profileBtn.onclick = () => profileModal.classList.remove('hidden');
    closeProfile.onclick = () => profileModal.classList.add('hidden');
}
if (leaderboardBtn && leaderboardModal && closeLeaderboard) {
    leaderboardBtn.onclick = () => {
        // First time clicking leaderboard - opt into global system
        if (!state.globalLeaderboardOptIn) {
            state.globalLeaderboardOptIn = true;
            saveState(); // Save the opt-in preference
            showAchievementBanner('🌍 Welcome to Global Competition! You are now competing worldwide!');
            
            // Immediately update global leaderboard with current progress
            saveToGlobalLeaderboard();
        }
        
        renderLeaderboard();
        leaderboardModal.classList.remove('hidden');
    };
    closeLeaderboard.onclick = () => leaderboardModal.classList.add('hidden');
}
if (achievementsBtn && achievementsModal && closeAchievements) {
    achievementsBtn.onclick = () => {
        renderAchievementsModal();
        achievementsModal.classList.remove('hidden');
    };
    closeAchievements.onclick = () => achievementsModal.classList.add('hidden');
}
if (kittenLabBtn && kittenLabModal && closeKittenLab) {
    kittenLabBtn.onclick = () => {
        renderResearchUpgrades(); // Refresh the research content
        kittenLabModal.classList.remove('hidden');
    };
    closeKittenLab.onclick = () => kittenLabModal.classList.add('hidden');
}
if (prestigeBtn && prestigeModal && closePrestige) {
    prestigeBtn.onclick = () => {
        renderPrestigeModal(); // Refresh the prestige content
        prestigeModal.classList.remove('hidden');
    };
    closePrestige.onclick = () => {
        prestigeModal.classList.add('hidden');
        // Clear the content to force refresh next time
        if (prestigeContent) {
            prestigeContent.innerHTML = '';
        }
    };
}
window.onclick = function(event) {
    if (profileModal && event.target === profileModal) profileModal.classList.add('hidden');
    if (leaderboardModal && event.target === leaderboardModal) leaderboardModal.classList.add('hidden');
    if (achievementsModal && event.target === achievementsModal) achievementsModal.classList.add('hidden');
    if (kittenLabModal && event.target === kittenLabModal) kittenLabModal.classList.add('hidden');
    if (prestigeModal && event.target === prestigeModal) prestigeModal.classList.add('hidden');
};

// --- Initialization ---
loadState();
// Initialize Firebase connection status
if (window.firebase) {
    console.log('Firebase SDK loaded successfully');
} else {
    console.log('Firebase SDK not yet loaded, will retry when needed');
}
// Ensure state is properly initialized with all required fields
if (!state.upgrades || state.upgrades.length < 8) {
    state.upgrades = [0, 0, 0, 0, 0, 0, 0, 0];
}
if (!state.achievements) {
    state.achievements = {
        firstMeow: { unlocked: false, activated: false },
        hundredMeows: { unlocked: false, activated: false },
        firstUpgrade: { unlocked: false, activated: false },
        thousandMeows: { unlocked: false, activated: false },
        tenUpgrades: { unlocked: false, activated: false },
        hundredThousandMeows: { unlocked: false, activated: false },
        millionMeows: { unlocked: false, activated: false },
        fiftyUpgrades: { unlocked: false, activated: false },
        unemployed: { unlocked: false, activated: false },
        hiss: { unlocked: false, activated: false },
        iBelieveInYou: { unlocked: false, activated: false },
        realMeowster: { unlocked: false, activated: false }
    };
}
if (typeof state.meowCount !== 'number') state.meowCount = 0;
if (typeof state.totalClicks !== 'number') state.totalClicks = 0;
if (typeof state.meowsPerClick !== 'number') state.meowsPerClick = 1;
// Normalize saved photo path
if (!state.profile) state.profile = { name: 'Cat Lover', photo: DEFAULT_CAT };
state.profile.photo = validatePhotoPath(state.profile.photo);

// Apply prestige bonuses on startup
const prestigeMultipliers = getTotalPrestigeMultiplier();
// Update clicking power with prestige bonus
state.meowsPerClick = Math.max(1, state.meowsPerClick); // Ensure at least 1

applyOfflineProgress();
updateStats();
renderUpgrades();
renderAchievements();
renderResearchUpgrades(); // Initialize research upgrades
renderCatPicOptions();
renderLeaderboard();
setMainCatSrc(validatePhotoPath(state.profile.photo));
profileNameInput.value = state.profile.name;

// Ensure gold glow reflects current state on init
const hasLegend = !!(state.achievements && state.achievements.fiftyUpgrades && state.achievements.fiftyUpgrades.activated);
const hasMillion = !!(state.achievements && state.achievements.millionMeows && state.achievements.millionMeows.activated);
// Enforce precedence: gold overrides silver
catBtn.classList.toggle('legend-glow', hasLegend && !hasMillion);
catBtn.classList.toggle('millionaire-glow', hasMillion);

// Initialize golden paw effects display
updateEffectDisplay();

window.addEventListener('beforeunload', saveState);
// --- Responsive layout management ---
// (Achievements section removed - no longer needed)
}; // End of window.onload

// Create footer with user credit
const footer = document.createElement('footer');
footer.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(45deg, #2d1b69, #4b0082);
    color: #ffd700;
    text-align: center;
    padding: 0.5rem;
    font-size: 0.8rem;
    border-top: 2px solid #ffd700;
    z-index: 1000;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

footer.innerHTML = `
    Made by fireflyxserenity - please visit <a href="https://fireflydesigns.me/" target="_blank" rel="noopener" style="color: #ffed4e; text-decoration: underline; font-weight: bold;">https://fireflydesigns.me/</a>
`;

document.body.appendChild(footer);

// Apply Twemoji to the entire document for initial load
applyTwemoji(document.body);

// Initialize mobile touch handlers
setupModalTouchHandlers();
