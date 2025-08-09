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
    'cat1.png',
    'cat2.png',
    'cat3.png',
    'cat4.png',
    'cat5.png',
    'cat6.png'
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
        fiftyUpgrades: { unlocked: false, activated: false }
    },
    profile: {
        name: 'Cat Lover',
        photo: 'cat.png'
    },
    lastActive: Date.now()
};
let meowsPerSecond = 0;

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

// Achievement definitions
const achievements = {
    firstMeow: {
        name: 'First Meow',
        desc: 'Click the cat for the first time',
        reward: 1,
        check: () => state.totalClicks >= 1
    },
    hundredMeows: {
        name: 'Meow Century',
        desc: 'Reach 100 total meows',
        reward: 2,
        check: () => state.meowCount >= 100
    },
    firstUpgrade: {
        name: 'First Upgrade',
        desc: 'Purchase your first upgrade',
        reward: 3,
        check: () => state.upgrades.some(count => count > 0)
    },
    thousandMeows: {
        name: 'Meow Thousand',
        desc: 'Reach 1,000 total meows',
        reward: 5,
        check: () => state.meowCount >= 1000
    },
    tenUpgrades: {
        name: 'Upgrade Master',
        desc: 'Own 10 total upgrades',
        reward: 10,
        check: () => state.upgrades.reduce((sum, count) => sum + count, 0) >= 10
    },
    hundredThousandMeows: {
        name: 'Meow Mogul',
        desc: 'Reach 100,000 total meows',
        reward: 25,
        check: () => state.meowCount >= 100000
    },
    millionMeows: {
        name: 'Meow Millionaire',
        desc: 'Reach 1,000,000 total meows',
        reward: 100,
        check: () => state.meowCount >= 1000000
    },
    fiftyUpgrades: {
        name: 'Upgrade Legend',
        desc: 'Own 50 total upgrades',
        reward: 50,
        check: () => state.upgrades.reduce((sum, count) => sum + count, 0) >= 50
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
const achievementBtns = {
    firstMeow: document.getElementById('firstMeow'),
    hundredMeows: document.getElementById('hundredMeows'),
    firstUpgrade: document.getElementById('firstUpgrade'),
    thousandMeows: document.getElementById('thousandMeows'),
    tenUpgrades: document.getElementById('tenUpgrades'),
    hundredThousandMeows: document.getElementById('hundredThousandMeows'),
    millionMeows: document.getElementById('millionMeows'),
    fiftyUpgrades: document.getElementById('fiftyUpgrades')
};
const profileBtn = document.getElementById('profileBtn');
const leaderboardBtn = document.getElementById('leaderboardBtn');
const profileModal = document.getElementById('profileModal');
const leaderboardModal = document.getElementById('leaderboardModal');
const closeProfile = document.getElementById('closeProfile');
const closeLeaderboard = document.getElementById('closeLeaderboard');
const profileNameInput = document.getElementById('profileName');
const saveProfileBtn = document.getElementById('saveProfile');
const catPhotosDiv = document.querySelector('.cat-photos');
const leaderboardList = document.getElementById('leaderboardList');
// Sections for responsive reordering
const achievementsSection = document.querySelector('.achievements');
const catClickerSection = document.querySelector('.cat-clicker');
const upgradesSection = document.querySelector('.upgrades');

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
        'cat.png', 'cat1.png', 'cat2.png', 'cat3.png', 'cat4.png', 'cat5.png', 'cat6.png'
    ];
    return allowed.includes(p) ? p : DEFAULT_CAT;
}

// --- LocalStorage helpers ---
function saveState() {
    state.lastActive = Date.now();
    localStorage.setItem('catClickerState', JSON.stringify(state));
    saveToLeaderboard();
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
                    fiftyUpgrades: { unlocked: false, activated: false }
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
            }
        } catch {}
    }
}

// --- Offline progress ---
function applyOfflineProgress() {
    const now = Date.now();
    const elapsed = (now - (state.lastActive || now)) / 1000; // seconds
    calcMeowsPerSecond();
    if (elapsed > 2) {
        const offlineMeows = meowsPerSecond * elapsed;
        state.meowCount += offlineMeows;
        setTimeout(() => {
            alert(`Welcome back! While you were away, your cats collected ${Math.floor(offlineMeows)} meows!`);
        }, 500);
    }
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
            saveState();
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
    saveState();
    renderLeaderboard();
    setMainCatSrc(validatePhotoPath(state.profile.photo));
};

// --- Upgrades ---
function renderUpgrades() {
    upgradeBtns.forEach((btn, i) => {
        const upg = upgrades[i];
        const cost = Math.floor(upg.baseCost * Math.pow(1.15, state.upgrades[i]));
        btn.innerHTML = `
            <div class="upgrade-line1">
                <span class="upgrade-title">${upg.name}:</span>
                <span class="upgrade-desc">${upg.desc}</span>
            </div>
            <div class="upgrade-line2">
                <span class="upgrade-mps">+${upg.mps}/sec</span>
                <span class="upgrade-owned">Owned: ${state.upgrades[i]}</span>
                <span class="upgrade-cost">Cost: ${cost}</span>
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
                saveState();
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
    meowsPerSecond = upgrades.reduce((sum, upg, i) => sum + state.upgrades[i] * upg.mps, 0);
}

// --- Achievements ---
function checkAchievements() {
    Object.keys(achievements).forEach(id => {
        const achievement = achievements[id];
        const stateAchievement = state.achievements[id];
        
        if (!stateAchievement.unlocked && achievement.check()) {
            stateAchievement.unlocked = true;
            renderAchievements();
            // Show notification
            setTimeout(() => {
                alert(`Achievement Unlocked: ${achievement.name}!\n${achievement.desc}\nClick to activate for +${achievement.reward} meows per click!`);
            }, 100);
        }
    });
}

function renderAchievements() {
    Object.keys(achievements).forEach(id => {
        const btn = achievementBtns[id];
        const achievement = achievements[id];
        const stateAchievement = state.achievements[id];
        
        if (!btn) return;
        
        // Create the achievement content
        btn.innerHTML = `
            <div class="achievement-title">${achievement.name}</div>
            <div class="achievement-desc">${achievement.desc}</div>
            <div class="achievement-reward">+${achievement.reward} meows/click</div>
        `;
        
        // Reset classes
        btn.className = 'achievement-btn';
        
        if (stateAchievement.activated) {
            btn.classList.add('activated');
            btn.disabled = true;
            // Add checkmark to activated achievements
            btn.innerHTML = `
                <div class="achievement-title">${achievement.name} ✓</div>
                <div class="achievement-desc">${achievement.desc}</div>
                <div class="achievement-reward">+${achievement.reward} meows/click</div>
            `;
            // Apply glow styles based on activated achievements
            if (id === 'fiftyUpgrades') {
                // Only show silver if gold isn't active
                const goldActive = !!(state.achievements.millionMeows && state.achievements.millionMeows.activated);
                if (!goldActive) catBtn.classList.add('legend-glow');
            }
            if (id === 'millionMeows') {
                catBtn.classList.add('millionaire-glow'); // gold
                catBtn.classList.remove('legend-glow'); // override silver
            }
        } else if (stateAchievement.unlocked) {
            btn.classList.add('unlocked');
            btn.disabled = false;
        } else {
            btn.disabled = true;
            // Gray out locked achievements
            btn.style.opacity = '0.6';
            // Remove glows if deactivated (safety)
            if (id === 'fiftyUpgrades') catBtn.classList.remove('legend-glow');
            if (id === 'millionMeows') catBtn.classList.remove('millionaire-glow');
        }
    });
}

// Achievement click handlers
Object.keys(achievementBtns).forEach(id => {
    const btn = achievementBtns[id];
    if (btn) {
        btn.onclick = () => {
            const achievement = achievements[id];
            const stateAchievement = state.achievements[id];
            
            if (stateAchievement.unlocked && !stateAchievement.activated) {
                stateAchievement.activated = true;
                state.meowsPerClick += achievement.reward;
                updateStats();
                renderAchievements();
                saveState();
                alert(`${achievement.name} activated!\n+${achievement.reward} meows per click!`);
                // Extra safety: apply glow immediately on activation
                if (id === 'fiftyUpgrades') {
                    const goldActive = !!(state.achievements.millionMeows && state.achievements.millionMeows.activated);
                    if (!goldActive) catBtn.classList.add('legend-glow');
                }
                if (id === 'millionMeows') {
                    catBtn.classList.add('millionaire-glow');
                    catBtn.classList.remove('legend-glow'); // gold overrides silver
                }
            }
        };
    }
});

function updateStats() {
    calcMeowsPerSecond();
    totalMeowsSpan.textContent = Math.floor(state.meowCount);
    meowsPerSecondSpan.textContent = meowsPerSecond.toFixed(1);
    meowsPerClickSpan.textContent = state.meowsPerClick;
    totalClicksSpan.textContent = state.totalClicks;
    checkAchievements();
}

// Optimized cat button handler for rapid clicking
let clickBuffer = 0;
let lastUpdateTime = 0;

function handleCatClick() {
    // Increment click buffer immediately for responsiveness
    clickBuffer++;
    state.totalClicks++;
    
    // Process clicks in batches for better performance during rapid clicking
    const now = Date.now();
    if (now - lastUpdateTime > 50) { // Update every 50ms max during rapid clicking
        state.meowCount += clickBuffer * state.meowsPerClick;
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
catBtn.addEventListener('click', handleCatClick);
catBtn.addEventListener('touchend', (e) => {
    e.preventDefault(); // Prevent double-tap zoom and click event
    handleCatClick();
});

// Prevent context menu on long press (mobile)
catBtn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Prevent double-tap zoom on the cat button
catBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
});

// Fallback update to ensure any remaining clicks are processed
setInterval(() => {
    if (clickBuffer > 0) {
        state.meowCount += clickBuffer * state.meowsPerClick;
        clickBuffer = 0;
        updateStats();
        renderUpgrades();
        saveState();
        renderLeaderboard();
    }
}, 100);

// Passive meows per second
setInterval(() => {
    state.meowCount += meowsPerSecond / 10;
    updateStats();
    renderUpgrades();
    saveState();
}, 100);

// --- Leaderboard (local, per device) ---
function saveToLeaderboard() {
    let board = [];
    try {
        board = JSON.parse(localStorage.getItem('catClickerLeaderboard') || '[]');
    } catch {}
    // Remove old entry for this name
    board = board.filter(u => u.name !== state.profile.name);
    // Add current
    board.push({
        name: state.profile.name,
        photo: state.profile.photo,
        meows: Math.floor(state.meowCount)
    });
    // Sort and keep top 10
    board.sort((a, b) => b.meows - a.meows);
    board = board.slice(0, 10);
    localStorage.setItem('catClickerLeaderboard', JSON.stringify(board));
}
function renderLeaderboard() {
    let board = [];
    try {
        board = JSON.parse(localStorage.getItem('catClickerLeaderboard') || '[]');
    } catch {}
    leaderboardList.innerHTML = '';
    board.forEach((u, i) => {
    const li = document.createElement('li');
    const img = document.createElement('img');
    img.alt = 'cat';
    img.src = validatePhotoPath(u.photo);
    img.onerror = () => { img.src = DEFAULT_CAT; };
    const name = document.createElement('b');
    name.textContent = u.name;
    const span = document.createElement('span');
    span.textContent = u.meows;
    li.appendChild(img);
    li.appendChild(document.createTextNode(' '));
    li.appendChild(name);
    li.appendChild(document.createTextNode(': '));
    li.appendChild(span);
    li.appendChild(document.createTextNode(' meows'));
    leaderboardList.appendChild(li);
    });
}

// --- Modal logic ---
if (profileBtn && profileModal && closeProfile) {
    profileBtn.onclick = () => profileModal.classList.remove('hidden');
    closeProfile.onclick = () => profileModal.classList.add('hidden');
}
if (leaderboardBtn && leaderboardModal && closeLeaderboard) {
    leaderboardBtn.onclick = () => {
        renderLeaderboard();
        leaderboardModal.classList.remove('hidden');
    };
    closeLeaderboard.onclick = () => leaderboardModal.classList.add('hidden');
}
window.onclick = function(event) {
    if (profileModal && event.target === profileModal) profileModal.classList.add('hidden');
    if (leaderboardModal && event.target === leaderboardModal) leaderboardModal.classList.add('hidden');
};

// --- Initialization ---
loadState();
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
        fiftyUpgrades: { unlocked: false, activated: false }
    };
}
if (typeof state.meowCount !== 'number') state.meowCount = 0;
if (typeof state.totalClicks !== 'number') state.totalClicks = 0;
if (typeof state.meowsPerClick !== 'number') state.meowsPerClick = 1;
// Normalize saved photo path
if (!state.profile) state.profile = { name: 'Cat Lover', photo: DEFAULT_CAT };
state.profile.photo = validatePhotoPath(state.profile.photo);
applyOfflineProgress();
updateStats();
renderUpgrades();
renderAchievements();
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

window.addEventListener('beforeunload', saveState);
// --- Responsive: place Achievements under Upgrades on mobile, under Cat on desktop ---
function rearrangeForViewport() {
    if (!achievementsSection || !catClickerSection || !upgradesSection) return;
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        // Move Achievements to be after Upgrades (Upgrades above Achievements)
        if (achievementsSection.previousElementSibling !== upgradesSection && achievementsSection.parentElement !== upgradesSection.parentElement) {
            upgradesSection.insertAdjacentElement('afterend', achievementsSection);
        } else if (achievementsSection.previousElementSibling !== upgradesSection) {
            upgradesSection.insertAdjacentElement('afterend', achievementsSection);
        }
    } else {
        // Restore Achievements back under the Cat Clicker
        if (achievementsSection.parentElement !== catClickerSection) {
            catClickerSection.appendChild(achievementsSection);
        }
    }
}
// Run once on load and on resize (debounced)
rearrangeForViewport();
let _rzT;
window.addEventListener('resize', () => {
    clearTimeout(_rzT);
    _rzT = setTimeout(rearrangeForViewport, 100);
});
}; // End of window.onload

// Early, no-flash mobile reorder (runs immediately when script loads at end of body)
(function earlyReorder() {
    try {
        const achievementsSection = document.querySelector('.achievements');
        const catClickerSection = document.querySelector('.cat-clicker');
        const upgradesSection = document.querySelector('.upgrades');
        if (!achievementsSection || !catClickerSection || !upgradesSection) return;
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            if (achievementsSection.previousElementSibling !== upgradesSection) {
                upgradesSection.insertAdjacentElement('afterend', achievementsSection);
            }
        } else {
            if (achievementsSection.parentElement !== catClickerSection) {
                catClickerSection.appendChild(achievementsSection);
            }
        }
    } catch {}
})();
