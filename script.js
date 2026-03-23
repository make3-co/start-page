// Initialize data
let appData = defaultData; // Set initial default, init() will try to load from API
let renderedGroupIds = new Set(); // Track rendered groups to control animation

// Ensure googleApps property exists
if (!appData.enabledGoogleApps) {
    appData.enabledGoogleApps = [
        "Account", "Maps", "YouTube", "Gmail", "Meet", "Drive", 
        "Calendar", "Translate", "Docs", "Sheets", "Slides", 
        "Analytics", "Google Ads", "Gemini", "Travel"
    ];
}

// Ensure layoutMode exists
if (!appData.layoutMode) {
    appData.layoutMode = 'masonry'; // Default to masonry
}

// Ensure privacy flag exists
if (typeof appData.hideWhenLoggedOut === 'undefined') {
    appData.hideWhenLoggedOut = true; // default to hiding when logged out for privacy
}

// Ensure link open behavior exists
if (typeof appData.openLinksInNewTab === 'undefined') {
    appData.openLinksInNewTab = true; // default to opening links in a new tab
}

function ensurePrivacyDefaults() {
    if (typeof appData.hideWhenLoggedOut === 'undefined') {
        appData.hideWhenLoggedOut = true;
    }
}

// Ensure authConfig exists
if (!appData.authConfig) {
    appData.authConfig = { configured: false };
}

// Preset wallpapers
const PRESET_WALLPAPERS = [
    { id: 'warm-nature', name: 'Warm Nature', url: 'https://images.unsplash.com/photo-1460500063983-994d4c27756c?w=1920&q=80' },
    { id: 'dark-ocean', name: 'Dark Ocean', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=80' },
    { id: 'mountains', name: 'Mountains', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80' },
    { id: 'twilight', name: 'Twilight', url: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1920&q=80' },
    { id: 'forest', name: 'Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80' },
];

// Track selected wallpaper in settings
let selectedWallpaperUrl = null;

// Track whether server has OAuth configured (set by initAuth)
let serverAuthEnabled = false;

// Remove deprecated apps from enabledGoogleApps
const APPS_TO_REMOVE = ["Search", "News", "Chat", "Contacts", "Photos", "Voice", "Shopping", "Keep", "Forms"];
function cleanupApps() {
    if (appData.enabledGoogleApps) {
        appData.enabledGoogleApps = appData.enabledGoogleApps.filter(app => !APPS_TO_REMOVE.includes(app));
    }
}
cleanupApps();

// Master list of Google Apps
const googleAppsConfig = [
    { name: "Account", url: "https://myaccount.google.com", iconStyle: "background-image: url('https://lh3.googleusercontent.com/a/default-user=s128'); background-size: cover; background-position: center; border-radius: 50%;" },
    { name: "Search", url: "https://www.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/symbol.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Maps", url: "https://maps.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idNQ5aWWN-.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "YouTube", url: "https://www.youtube.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/youtube.com/icon/theme/dark/icon.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "News", url: "https://news.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idMbJg9Po3.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Gmail", url: "https://mail.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idBP5ltu-a.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Meet", url: "https://meet.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/ide81vGBGA.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Chat", url: "https://chat.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idlJx_D1re.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Contacts", url: "https://contacts.google.com", iconStyle: "background-position: 0 -464px;" },
    { name: "Drive", url: "https://drive.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idncaAgFGT.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Calendar", url: "https://calendar.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idMX2_OMSc.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Translate", url: "https://translate.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idOA5j5-it.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Photos", url: "https://photos.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idXdVMQg1G.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Voice", url: "https://voice.google.com", iconStyle: "background-position: 0 -348px;" },
    { name: "Shopping", url: "https://shopping.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/id7WOXk600.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Docs", url: "https://docs.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/id9yxSb4R3.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Sheets", url: "https://sheets.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idKa2XnbFY.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Slides", url: "https://slides.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idY7x55JLN.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Keep", url: "https://keep.google.com", iconStyle: "background-position: 0 -116px;" },
    { name: "Analytics", url: "https://analytics.google.com", iconStyle: "background-position: 0 -2668px;" },
    { name: "Google Ads", url: "https://ads.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idxtfw96uG.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Gemini", url: "https://gemini.google.com", iconStyle: "background-position: 0 -1914px;" },
    { name: "Travel", url: "https://travel.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idxy2tVjQB.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Forms", url: "https://forms.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idkfvuesuQ.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" }
];

// Elements
const gridContainer = document.getElementById('grid-container');
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date-display');
const weatherEl = document.getElementById('weather');
const editModeBtn = document.getElementById('edit-mode-btn');
const settingsBtn = document.getElementById('settings-btn');
const body = document.body;

// Modals
const addGroupModal = document.getElementById('add-group-modal');
const editGroupModal = document.getElementById('edit-group-modal');
const moveGroupModal = document.getElementById('move-group-modal'); // New
const settingsModal = document.getElementById('settings-modal');

// State
let isEditMode = false;
let currentEditGroupId = null;
// Brandfetch config is loaded from backend to avoid hardcoding secrets.
let BRANDFETCH_API_KEY = '';
let BRANDFETCH_CLIENT_ID = '';

// Auth state (cookie-based, no token stored client-side)
let isAuthenticated = false;
let currentUserEmail = null;
let currentUserName = null;
let currentUserPicture = null;

// Check auth session via cookie-based /api/auth/me
async function checkAuthSession() {
    try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
            const user = await res.json();
            isAuthenticated = true;
            currentUserEmail = user.email ? user.email.toLowerCase() : null;
            currentUserName = user.name || null;
            currentUserPicture = user.picture || null;
            updateAuthUI(true);
            if (currentUserPicture) updateAccountIcon(currentUserPicture);
            applyLoggedOutPrivacy(true);
            return true;
        }
    } catch (e) {
        console.log('Auth check failed', e);
    }
    isAuthenticated = false;
    currentUserEmail = null;
    currentUserName = null;
    currentUserPicture = null;
    return false;
}

// Toast utility
function ensureToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

function showToast(message, type = 'error', duration = 3500) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => toast.remove());
        // Fallback removal after animation
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

// --- Initialization ---
async function init() {
    await loadConfig();
    await loadData();
    applyBackground();
    startClock();
    fetchWeather();
    setupEventListeners();

    // Initialize cookie-based auth
    await initAuth();
}

function applyBackground() {
    if (appData.backgroundUrl) {
        document.body.style.backgroundImage = `url('${appData.backgroundUrl}')`;
    }
}

// Fetch config on init
async function loadConfig() {
    try {
        const res = await fetch('/api/brandfetch_config');
        if (res.ok) {
            const data = await res.json();
            BRANDFETCH_API_KEY = data.apiKey;
            BRANDFETCH_CLIENT_ID = data.clientId;
        }
    } catch (e) {
        console.error("Failed to load config", e);
    }
}

// Append Brandfetch client cache param if available
function withBrandfetchCache(url) {
    if (!url || !BRANDFETCH_CLIENT_ID) return url;
    return url.includes('?') ? `${url}&c=${BRANDFETCH_CLIENT_ID}` : `${url}?c=${BRANDFETCH_CLIENT_ID}`;
}

async function initAuth() {
    const signInBtn = document.getElementById('google-signin-btn');
    const editBtn = document.getElementById('edit-mode-btn');

    // Check if server has OAuth configured
    try {
        const cfgRes = await fetch('/api/auth/config');
        if (cfgRes.ok) {
            const cfg = await cfgRes.json();
            serverAuthEnabled = !!cfg.googleOAuthEnabled;
        }
    } catch (e) {
        console.log('Auth config check failed', e);
    }

    const authed = await checkAuthSession();
    if (authed) {
        // Signed in — hide sign-in, show edit/settings, refresh data
        if (signInBtn) signInBtn.classList.add('hidden');
        await refreshDataWithAuth();
    } else if (serverAuthEnabled) {
        // Auth is configured but user is not signed in — show only sign-in button
        if (signInBtn) signInBtn.classList.remove('hidden');
        if (editBtn) editBtn.classList.add('hidden');
        if (settingsBtn) settingsBtn.classList.add('hidden');
        // Re-apply privacy to hide controls
        applyLoggedOutPrivacy(false);
    } else {
        // No auth configured at all — open access mode
        if (editBtn) editBtn.classList.remove('hidden');
        if (settingsBtn) settingsBtn.classList.remove('hidden');
        if (signInBtn) signInBtn.classList.add('hidden');
    }
}


function updateAccountIcon(pictureUrl) {
    // Update config
    const accountApp = googleAppsConfig.find(app => app.name === "Account");
    if (accountApp) {
        accountApp.iconStyle = `background-image: url('${pictureUrl}'); background-size: cover; background-position: center; border-radius: 50%;`;
        renderGoogleApps();
    }
}

function updateAuthUI(isSignedIn) {
    const editBtn = document.getElementById('edit-mode-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const signInBtnContainer = document.getElementById('google-signin-btn');
    
    const canEdit = computeCanEdit(isSignedIn);

    if (isSignedIn) {
        if (canEdit) {
            editBtn.classList.remove('hidden');
        } else {
            editBtn.classList.add('hidden');
            if (isEditMode) toggleEditMode();
        }
        logoutBtn.classList.remove('hidden');
        if(signInBtnContainer) signInBtnContainer.style.display = 'none';
    } else {
        editBtn.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        // Exit edit mode if active
        if (isEditMode) toggleEditMode();
        
        if(signInBtnContainer) {
            signInBtnContainer.style.display = '';
            signInBtnContainer.classList.remove('hidden');
        }
    }
    updateSettingsVisibility(isSignedIn, canEdit);
    applyLoggedOutPrivacy(isSignedIn);
}

async function logout() {
    // Clear server-side session cookie
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
        console.warn('Logout request failed', e);
    }

    isAuthenticated = false;
    currentUserEmail = null;
    currentUserName = null;
    currentUserPicture = null;

    updateAuthUI(false);

    // Reset Account Icon to default
    const accountApp = googleAppsConfig.find(app => app.name === "Account");
    if (accountApp) {
        accountApp.iconStyle = "background-image: url('https://lh3.googleusercontent.com/a/default-user=s128'); background-size: cover; background-position: center; border-radius: 50%;";
        renderGoogleApps();
    }

    // Show sign-in button again
    const signInBtn = document.getElementById('google-signin-btn');
    if (signInBtn) signInBtn.classList.remove('hidden');

    updateSettingsVisibility(false);
    applyLoggedOutPrivacy(false);

    // For privacy, clear in-memory data and DOM when hiding on logout
    if (appData.hideWhenLoggedOut) {
        appData.groups = [];
        renderedGroupIds.clear();
        renderGrid();
    }
}

function updateSettingsVisibility(isSignedIn, canEditOverride = null) {
    if (!settingsBtn) return;
    const authConfigured = serverAuthEnabled || !!(appData && appData.authConfig && appData.authConfig.configured);
    const canEdit = (canEditOverride !== null) ? canEditOverride : computeCanEdit(isSignedIn);
    const canAccessSettings = !authConfigured || (isSignedIn && canEdit);
    settingsBtn.classList.toggle('hidden', !canAccessSettings);
}

function forceShowContentIfVisibleState() {
    // If we are signed in or privacy is off, ensure main UI elements are visible
    const shouldHide = appData.hideWhenLoggedOut && !isAuthenticated;
    if (shouldHide) return;
    const elements = [
        document.querySelector('.header-left'),
        document.querySelector('.search-container'),
        gridContainer
    ];
    elements.forEach(el => {
        if (!el) return;
        el.classList.remove('hidden');
        el.style.display = '';
        if (el === gridContainer) {
            el.style.display = 'grid';
        }
    });
}

function applyLoggedOutPrivacy(isSignedIn) {
    const shouldHide = appData.hideWhenLoggedOut && !isSignedIn;
    const elementsToHide = [
        document.querySelector('.header-left'),
        document.querySelector('.search-container'),
        gridContainer
    ];
    // Hide/show settings controls (edit, settings, logout) — but keep sign-in button visible
    const settingsControls = document.querySelector('.settings-controls');
    if (settingsControls) {
        // Hide all children except the sign-in button
        Array.from(settingsControls.children).forEach(child => {
            if (child.id !== 'google-signin-btn') {
                child.classList.toggle('hidden', shouldHide);
            }
        });
    }
    elementsToHide.forEach(el => {
        if (!el) return;
        el.classList.toggle('hidden', shouldHide);
        // Safety: ensure display is restored when visible
        if (!shouldHide) {
            el.style.display = '';
            if (el === gridContainer) {
                el.style.display = 'grid';
            }
        }
        if (shouldHide && el === gridContainer) {
            // When hiding, collapse the grid to zero height/width via display none
            el.style.display = 'none';
        }
    });
}

function computeCanEdit(isSignedInOverride = null) {
    const isSignedIn = (isSignedInOverride !== null) ? isSignedInOverride : isAuthenticated;
    if (!isSignedIn) return false;

    // If no auth configured, open editing
    const authConfigured = !!(appData && appData.authConfig && appData.authConfig.configured);
    if (!authConfigured) return true;

    // If allow list present, check email
    const allowList = (appData.authConfig && appData.authConfig.allowedEmails)
        ? appData.authConfig.allowedEmails.map(e => e.toLowerCase())
        : [];

    // If allow list is empty, any signed-in user is allowed
    if (!allowList.length) return true;

    const email = currentUserEmail || '';
    return allowList.includes(email);
}

async function loadData() {
    try {
        const res = await fetch('/api/data');
        if (res.ok) {
            const data = await res.json();
            if (data) {
                appData = data;
                ensurePrivacyDefaults();
                if (!Array.isArray(appData.groups)) appData.groups = [];
                console.log('Loaded data from Cloudflare KV');
            } else {
                console.log('No data in KV, checking localStorage');
                loadFromLocalStorage();
            }
        } else {
            console.log('API unavailable (local?), fallback to localStorage');
            loadFromLocalStorage();
        }
    } catch (e) {
        console.log('Fetch failed, fallback to localStorage', e);
        loadFromLocalStorage();
    }
    
    // Don't show settings/edit yet — initAuth will handle visibility after checking server config
    applyLoggedOutPrivacy(isAuthenticated);
    
    cleanupApps();
    renderGrid();
    renderGoogleApps();
}

// After login (or restored session), refresh data with auth cookie
async function refreshDataWithAuth() {
    if (!isAuthenticated) return;
    try {
        const res = await fetch('/api/data');
        if (res.status === 403) {
            showToast("Unauthorized: Please sign in with an allowed account.");
            updateAuthUI(false);
            isAuthenticated = false;
            currentUserEmail = null;
            return;
        }

        if (res.ok) {
            const data = await res.json();
            if (data) {
                appData = data;
                ensurePrivacyDefaults();
                if (!Array.isArray(appData.groups)) appData.groups = [];
                cleanupApps();
                renderGrid();
                renderGoogleApps();
                forceShowContentIfVisibleState();
            }
        }
    } catch (e) {
        console.log('Refresh with auth failed', e);
    }
}

function loadFromLocalStorage() {
    const local = localStorage.getItem('startPageData');
    if (local) {
        appData = JSON.parse(local);
    }
}

function renderGoogleApps() {
    const appsGrid = document.querySelector('.apps-grid');
    if (!appsGrid) return;
    
    appsGrid.innerHTML = '';
    
    // Filter config based on enabled apps and preserve config order (or could preserve saved order)
    // For now, we'll iterate config and check if it's in enabled list to maintain a standard order
    // Or we can iterate enabled list to allow reordering in future
    
    const enabledApps = appData.enabledGoogleApps || [];
    
    // We'll use the order from googleAppsConfig to keep the grid consistent regardless of saved array order
    // unless we want drag/drop there too. Let's stick to config order for now but filtered.
    
    googleAppsConfig.forEach(app => {
        if (enabledApps.includes(app.name)) {
            const a = document.createElement('a');
            a.href = app.url;
            a.target = getLinkTarget();
            a.className = 'app-item';
            
            const iconStyle = withBrandfetchCache(app.iconStyle);

            a.innerHTML = `
                <span class="google-icon-sprite" style="${iconStyle}"></span>
                <span class="app-text">${app.name}</span>
            `;
            
            appsGrid.appendChild(a);
        }
    });
}

// Helper to ensure protocol
function ensureProtocol(url) {
    if (!url) return url;
    
    // If it already has a protocol
    if (url.includes('://') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('about:')) {
        return url;
    }

    // Relative links
    if (url.startsWith('/') || url.startsWith('#')) {
        return url;
    }

    // Local network addresses default to HTTP
    // IPs: 10.x.x.x, 192.168.x.x, 172.16.x.x-172.31.x.x, 127.x.x.x
    // Domains ending in .local, .lan, .test, .home
    const isLocal = /^(?:localhost|127\.|192\.168\.|10\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(url) || 
                    /\.(?:local|lan|test|home)(?::\d+)?(?:\/|$)/.test(url);

    if (isLocal) {
        return 'http://' + url;
    }

    return 'https://' + url;
}

// Helper to determine target for links based on settings
function getLinkTarget() {
    // Default behavior is to open in a new tab; explicit false means same tab
    return appData && appData.openLinksInNewTab === false ? '_self' : '_blank';
}

// Helper to apply brand styling
function applyBrandStyling(headerElement, brandData) {
    // 1. Banner Image
    const banner = brandData.images ? brandData.images.find(img => img.type === 'banner') : null;
    
    if (banner && banner.formats && banner.formats.length > 0) {
        headerElement.style.backgroundImage = `url('${banner.formats[0].src}')`;
        headerElement.style.backgroundSize = 'cover';
        headerElement.style.backgroundPosition = 'center top';
        headerElement.style.color = '#fff'; // Assume dark banner
        headerElement.classList.add('branded'); // Add branded class
    } else {
        // 2. Brand Color (Accent)
        const accent = brandData.colors ? brandData.colors.find(c => c.type === 'accent') : null;
        if (accent) {
            headerElement.style.backgroundColor = accent.hex;
            headerElement.classList.add('branded'); // Add branded class
            
            if (accent.brightness < 150) {
                headerElement.style.color = '#fff';
            } else {
                headerElement.style.color = '#000';
            }
        }
    }
}

// Helper to extract domain for Brandfetch
function getDomain(url) {
    try {
        return new URL(ensureProtocol(url)).hostname;
    } catch (e) {
        return null;
    }
}

// Helper to create link icon (Brandfetch -> Favicon -> Generic Fallback)
function createLinkIcon(url, useFavicon = false) {
    const domain = getDomain(url);
    if (!domain) return createGenericIcon();

    // Check for local IP/domain
    const isLocal = /^(?:localhost|127\.|192\.168\.|10\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(domain) || 
                    /\.(?:local|lan|test|home)$/.test(domain);

    const img = document.createElement('img');
    img.className = 'link-icon';
    img.alt = '';
    
    // Logic: 
    // 1. If useFavicon is true, try favicon first (works for local and public if favicon.ico exists)
    // 2. If isLocal is true, force favicon (since Brandfetch won't work)
    // 3. Else default to Brandfetch

    if (useFavicon || isLocal) {
        try {
            const urlObj = new URL(ensureProtocol(url));
            let checkDomain = urlObj.hostname;

            // Fix for Data Studio -> Looker Studio redirect & Icon
            if (checkDomain === 'datastudio.google.com' || checkDomain === 'lookerstudio.google.com') {
                // Return specific high-quality SVG for Looker Studio
                img.src = 'https://www.gstatic.com/analytics-lego/svg/ic_looker_studio.svg';
                return img;
            }

            // Google Search Console
            if (checkDomain === 'search.google.com') {
                img.src = 'https://www.gstatic.com/search-console/scfe/favicon.png';
                return img;
            }

            // Google Analytics
            if (checkDomain === 'analytics.google.com') {
                img.src = 'https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg';
                return img;
            }

            // Google Tag Manager
            if (checkDomain === 'tagmanager.google.com') {
                img.src = 'https://www.gstatic.com/analytics-suite/header/suite/v2/ic_tag_manager.svg';
                return img;
            }

            // Try Google Favicon Service first as it's more reliable than direct favicon.ico for public sites
            if (!isLocal) {
                img.src = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
            } else {
                img.src = `${urlObj.origin}/favicon.ico`;
            }
        } catch (e) {
             // Fallback to Brandfetch if NOT local and favicon failed? 
             // Or just generic if local failed.
             if (!isLocal && !useFavicon) {
                 const brandfetchUrl = `https://cdn.brandfetch.io/${domain}/fallback/lettermark/icon.svg`;
                 img.src = withBrandfetchCache(brandfetchUrl);
             } else {
                 return createGenericIcon();
             }
        }
    } else {
        // Use Brandfetch for public domains by default
        const brandfetchUrl = `https://cdn.brandfetch.io/${domain}/fallback/lettermark/icon.svg`;
        img.src = withBrandfetchCache(brandfetchUrl);
    }

    img.onerror = () => {
        // If first attempt fails
        if (!useFavicon && !isLocal) {
            // If we tried Brandfetch and it failed, maybe try favicon?
            // Or just generic. Let's keep it simple: generic fallback.
             const icon = createGenericIcon();
             img.replaceWith(icon);
        } else if (useFavicon && !isLocal) {
            // If user wanted favicon but it failed, try Brandfetch?
            // "I want option to use favicon if I think its better" -> implies override.
            // If override fails, falling back to brandfetch seems helpful.
            const brandfetchUrl = `https://cdn.brandfetch.io/${domain}/fallback/lettermark/icon.svg`;
            img.src = withBrandfetchCache(brandfetchUrl);
            // If THAT fails, the onerror will fire again? No, event listeners don't chain automatically like that on the same element unless we re-bind or use a new element.
            // Simplest is to replace with generic if the user-chosen preferred method failed.
            const icon = createGenericIcon();
            img.replaceWith(icon);
        } else {
             const icon = createGenericIcon();
             img.replaceWith(icon);
        }
    };

    return img;
}

function createGenericIcon() {
    const i = document.createElement('i');
    i.className = 'fas fa-globe link-icon generic-icon';
    return i;
}

// Masonry Layout Logic
function resizeGridItem(item) {
    // Safety check: Only run in masonry mode
    if (appData.layoutMode !== 'masonry') {
        item.style.gridRowEnd = "";
        return;
    }

    // We hardcode these to match the "gap: 0" (row-gap) strategy in CSS for stability.
    // In CSS we set row-gap: 0 and grid-auto-rows: 1px for .masonry-mode
    const rowHeight = 1; 
    const desiredGap = 20; // The visual gap we want

    // We use offsetHeight instead of getBoundingClientRect().height to avoid transform scaling issues.
    // Formula: span * rowHeight >= contentHeight + desiredGap
    // We add a buffer (+5px) for safety.
    const rowSpan = Math.ceil((item.offsetHeight + desiredGap + 5) / rowHeight);
    
    item.style.gridRowEnd = "span " + rowSpan;
}

function resizeAllGridItems() {
    const allItems = document.getElementsByClassName("card");
    for (let x = 0; x < allItems.length; x++) {
        resizeGridItem(allItems[x]);
    }
}

// Observer for content changes (e.g. images loading, dropdowns opening)
const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
        resizeGridItem(entry.target);
    }
});

// --- Rendering ---
function renderGrid() {
    // Clear observer
    resizeObserver.disconnect();
    
    gridContainer.innerHTML = '';
    
    // Apply Layout Mode Class
    gridContainer.classList.remove('masonry-mode', 'grid-mode');
    const currentMode = appData.layoutMode || 'masonry';
    gridContainer.classList.add(currentMode === 'grid' ? 'grid-mode' : 'masonry-mode');

    // Get currently known groups to determine animation
    // const knownGroups = getKnownGroups(); // Removed localStorage
    const currentRenderIds = new Set(); // Start fresh tracking for next time (or reuse global if we want strictly add-only)
    
    // We want to reuse renderedGroupIds so we know what was ALREADY rendered.
    // We will update renderedGroupIds at the end or in place.
    
    appData.groups.forEach((group) => {
        const card = document.createElement('div');
        
        // Only animate if the group ID is NOT in our known history
        // This ensures it animates once per "session" (page load)
        if (!renderedGroupIds.has(group.id)) {
            card.className = 'card animate-in';
            // Cleanup animation class after it finishes to ensure clean layout
            card.addEventListener('animationend', () => {
                card.classList.remove('animate-in');
                resizeGridItem(card); // Ensure final layout is correct
            }, { once: true });
        } else {
            card.className = 'card';
        }
        
        // Track for next state
        currentRenderIds.add(group.id);

        card.dataset.groupId = group.id;
        card.draggable = false; // Default false

    const header = document.createElement('div');
        header.className = 'card-header';
        
        // Brand Styling
        if (group.branded && group.brandData) {
            applyBrandStyling(header, group.brandData);
        } else if (group.headerColor) {
            header.style.background = group.headerColor;
            // Use white text on dark backgrounds, dark on light
            const r = parseInt(group.headerColor.slice(1,3), 16);
            const g = parseInt(group.headerColor.slice(3,5), 16);
            const b = parseInt(group.headerColor.slice(5,7), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            header.style.color = luminance > 0.5 ? '#1d1d1f' : '#ffffff';
        }

        // Header HTML
        let titleContent = `<span class="group-title">${group.title}</span>`;
        let brandIconHtml = '';
        let additionalCardClass = '';

        if (group.branded && group.brandData) {
            additionalCardClass = 'has-branded-header';
            
            // 1. Find suitable icon for the circular overlapping avatar (Icon type preferably)
            let iconObj = group.brandData.logos ? group.brandData.logos.find(l => l.type === 'icon') : null;
            // Fallback to any logo if icon not found
            if (!iconObj && group.brandData.logos) iconObj = group.brandData.logos[0];
            
            if (iconObj && iconObj.formats && iconObj.formats.length > 0) {
                brandIconHtml = `
                    <div class="branded-icon-wrapper">
                        <img src="${iconObj.formats[0].src}" alt="${group.title}">
                    </div>
                `;
            }
            
            // 2. For the title text inside the banner/header
            // If we have a banner, maybe we hide the title text or make it white?
            // applyBrandStyling handles text color.
            // The user's screenshot shows "Business Manager Kworq" (List items) below.
            // The header itself (Banner) seems to have NO text in the Playground screenshot 1 & 2?
            // Actually, Playground Image 1 & 2 has "Google" / "Facebook" text BELOW the banner, next to the icon.
            
            // Let's keep the title in the header for now but maybe hide it if it clashes?
            // Or if we want to strictly follow playground: 
            // The title should be in the card body or below header.
            // But we need the handle and edit button in the header.
            
            // Let's just remove the text from the header if branded, assuming the Icon is enough?
            // Or keep it? In the screenshot 3 (User's result?), there is no text in the header, just the icon.
            // But wait, the user said "the icon needs work".
            
            // Decision: Hide title text in header if branded, as the Icon + Banner is the "Title".
            titleContent = ''; 
        }

        if (additionalCardClass) card.classList.add(additionalCardClass);

        header.innerHTML = `
            <div class="header-content">
                <i class="fas fa-grip-horizontal handle group-handle" title="Drag to reorder group"></i>
                ${titleContent}
            </div>
            <div class="header-actions">
                <i class="fas fa-pen header-btn edit-group-btn" title="Edit Group"></i>
            </div>
            ${brandIconHtml}
        `;
        
        // Setup Card Dragging (Only in Edit Mode via Handle)
        if (isEditMode) {
            setupCardDragEvents(card, header.querySelector('.group-handle'));
        }
        
        // Edit Group Handler
        header.querySelector('.edit-group-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openEditGroupModal(group.id);
        });

        const body = document.createElement('div');
        body.className = 'card-body';

        if (group.links) {
            group.links.forEach(link => {
                if (link.type === 'list') {
                    // Render a list (dropdown)
                    const listContainer = document.createElement('div');
                    listContainer.className = 'list-container';
                    
                    const listHeader = document.createElement('div');
                    listHeader.className = 'list-header';
                    listHeader.innerHTML = `
                        <span>${link.name}</span>
                        <i class="fas fa-chevron-down"></i>
                    `;
                    
                    const listItems = document.createElement('div');
                    listItems.className = 'list-items';
                    
                    if (link.links) {
                        link.links.forEach(subLink => {
                            const a = document.createElement('a');
                            a.className = 'link-item';
                            a.href = isEditMode ? '#' : ensureProtocol(subLink.url);
                            a.target = getLinkTarget();
                            if (isEditMode) a.addEventListener('click', (e) => e.preventDefault());

                            // Icon logic
                            const iconElement = createLinkIcon(subLink.url, subLink.useFavicon);
                            if (iconElement) a.appendChild(iconElement);

                            const span = document.createElement('span');
                            span.textContent = subLink.name;
                            a.appendChild(span);

                            listItems.appendChild(a);
                        });
                    }
                    
                    listHeader.addEventListener('click', () => {
                        const isOpen = listItems.classList.toggle('open');
                        listHeader.classList.toggle('open');
                        
                        // Handle stacking context for popup
                        if (isOpen) {
                            card.style.zIndex = '100';
                        } else {
                            // Check if any other list in this card is open
                            const openLists = card.querySelectorAll('.list-items.open');
                            if (openLists.length === 0) {
                                card.style.zIndex = '';
                            }
                        }
                    });
                    
                    listContainer.appendChild(listHeader);
                    listContainer.appendChild(listItems);
                    body.appendChild(listContainer);
                    
                } else {
                    // Render a normal link
                    const a = document.createElement('a');
                    a.className = 'link-item';
                    a.href = isEditMode ? '#' : ensureProtocol(link.url);
                    a.target = getLinkTarget(); 
                    
                    if (isEditMode) {
                        a.addEventListener('click', (e) => e.preventDefault());
                    }

                    // Icon logic
                    const iconElement = createLinkIcon(link.url, link.useFavicon);
                    if (iconElement) a.appendChild(iconElement);

                    const span = document.createElement('span');
                    span.textContent = link.name;
                    a.appendChild(span);

                    body.appendChild(a);
                }
            });
        }

        card.appendChild(header);
        card.appendChild(body);
        gridContainer.appendChild(card);
        
        // Observe for resize
        resizeObserver.observe(card);
    });

    // Add Group Card (Visible in Edit Mode)
    const addGroupCard = document.createElement('div');
    addGroupCard.className = 'card add-group-card';
    addGroupCard.innerHTML = '<i class="fas fa-plus"></i>';
    addGroupCard.addEventListener('click', () => {
        document.getElementById('new-group-name').value = '';
        document.getElementById('add-group-modal').classList.remove('hidden');
    });
    gridContainer.appendChild(addGroupCard);
    resizeObserver.observe(addGroupCard);
    
    // Update global set for next render
    renderedGroupIds = currentRenderIds;

    // Initial masonry calculation after render
    // Use setTimeout to allow DOM reflow and font loading
    if (appData.layoutMode === 'masonry') {
        resizeAllGridItems(); // Immediate
        setTimeout(resizeAllGridItems, 50);  // Quick reflow
        setTimeout(resizeAllGridItems, 500); // Catch slower font/image loads
    } else {
        // Force clear any stuck styles if switching to grid
        const allItems = document.getElementsByClassName("card");
        for (let x = 0; x < allItems.length; x++) {
            allItems[x].style.gridRowEnd = "";
        }
    }
}

function setupCardDragEvents(card, handle) {
    if (!handle) return;

    let isHandleClicked = false;

    handle.addEventListener('mousedown', () => {
        isHandleClicked = true;
        card.draggable = true;
    });

    handle.addEventListener('mouseup', () => {
        isHandleClicked = false;
        card.draggable = false;
    });

    handle.addEventListener('mouseleave', () => {
        if (!card.classList.contains('dragging')) {
            isHandleClicked = false;
            card.draggable = false;
        }
    });

    card.addEventListener('dragstart', (e) => {
        if (!isHandleClicked) {
            e.preventDefault();
            return;
        }
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.groupId);
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        card.draggable = false; // Reset
        // Force save explicitly after a short timeout to ensure DOM has settled
        setTimeout(saveGroupOrder, 50);
    });
}

function saveGroupOrder() {
    const newGroupOrder = [];
    const cards = gridContainer.querySelectorAll('.card:not(.add-group-card)');
    
    cards.forEach(card => {
        const groupId = card.dataset.groupId;
        const group = appData.groups.find(g => g.id === groupId);
        if (group) {
            newGroupOrder.push(group);
        }
    });

    if (newGroupOrder.length === appData.groups.length) {
        appData.groups = newGroupOrder;
        saveData();
    }
}

// --- Logic ---

async function saveData() {
    // Client-side guard: if auth is configured and user isn't allowed, block saves early
    const authConfigured = !!(appData && appData.authConfig && appData.authConfig.configured);
    if (authConfigured && !computeCanEdit()) {
        showToast("Unauthorized: Please sign in with an allowed account.");
        updateAuthUI(false);
        return;
    }

    // Save to LocalStorage as backup/fast access
    // Only cache in localStorage if privacy mode is off
    if (!appData.hideWhenLoggedOut) {
        localStorage.setItem('startPageData', JSON.stringify(appData));
    }

    // Save to Cloudflare KV via Function
    try {
        const res = await fetch('/api/data', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appData)
        });

        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                showToast("Save blocked: please sign in with an allowed account.", 'error');
                isAuthenticated = false;
                currentUserEmail = null;
                updateAuthUI(false);
                applyLoggedOutPrivacy(false);
                return;
            }
            console.error('Failed to save to Cloudflare KV', res.status);
        } else {
            console.log('Saved to Cloudflare KV');
        }
    } catch (e) {
        console.error('Error saving to Cloudflare KV', e);
    }
}

function toggleEditMode() {
    if (!computeCanEdit()) {
        alert("Unauthorized: Please sign in with an allowed account.");
        return;
    }
    isEditMode = !isEditMode;
    body.classList.toggle('edit-mode', isEditMode);
    renderGrid();
    editModeBtn.classList.toggle('active', isEditMode);
    editModeBtn.innerHTML = isEditMode ? '<i class="fas fa-check"></i>' : '<i class="fas fa-edit"></i>';
}

// Clock
function startClock() {
    function update() {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
        if (dateEl) dateEl.textContent = dateStr;
    }
    update();
    setInterval(update, 1000);
}

// Weather
async function fetchWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            getWeather(position.coords.latitude, position.coords.longitude);
        }, (error) => {
            console.log("Geolocation error, defaulting to NYC", error);
            getWeather(40.7128, -74.0060); 
        });
    } else {
        getWeather(40.7128, -74.0060);
    }
}

async function getWeather(lat, lon) {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`);
        const data = await res.json();
        weatherEl.innerHTML = `<i class="fas fa-cloud-sun"></i> <span>${Math.round(data.current_weather.temperature)}°F</span>`;
    } catch (e) {
        weatherEl.textContent = "Weather Unavailable";
    }
}

// --- CRUD Operations ---

function deleteGroup(groupId) {
    appData.groups = appData.groups.filter(g => g.id !== groupId);
    saveData();
    renderGrid(); // Explicit re-render
}

function addGroup(title) {
    const newGroup = {
        id: 'g' + Date.now(),
        title: title,
        links: []
    };
    appData.groups.push(newGroup);
    saveData();
    renderGrid();
}

// --- Modal Handlers ---

// Add Group Modal
function closeAddGroupModal() {
    document.getElementById('add-group-modal').classList.add('hidden');
}

// Edit Group Modal
function openEditGroupModal(groupId) {
    currentEditGroupId = groupId;
    const group = appData.groups.find(g => g.id === groupId);
    if (!group) return;

    document.getElementById('edit-group-title').value = group.title;
    
    // Brand settings
    const brandedCb = document.getElementById('edit-group-branded');
    const brandUrlInput = document.getElementById('edit-group-brand-url');
    
    const colorPicker = document.getElementById('header-color-picker');
    const colorInput = document.getElementById('edit-group-color');
    const clearColorBtn = document.getElementById('clear-header-color');

    brandedCb.checked = !!group.branded;
    brandUrlInput.value = group.brandUrl || '';
    colorInput.value = group.headerColor || '#333333';

    // Show brand URL when branded, show color picker when not branded
    brandUrlInput.style.display = group.branded ? '' : 'none';
    colorPicker.style.display = group.branded ? 'none' : 'flex';

    brandedCb.onchange = () => {
        brandUrlInput.style.display = brandedCb.checked ? '' : 'none';
        colorPicker.style.display = brandedCb.checked ? 'none' : 'flex';
    };

    clearColorBtn.onclick = () => {
        colorInput.value = '#333333';
    };

    const container = document.getElementById('group-links-container');
    container.innerHTML = '';

    // Render existing links
    group.links.forEach(link => {
        if (link.type === 'list') {
            // Add List Parent
            addLinkRow(link.name, '', 'list');
            
            // Add List Children
            if (link.links) {
                link.links.forEach(sub => {
                    addLinkRow(sub.name, sub.url, 'sub-link', sub.useFavicon);
                });
            }
        } else {
            addLinkRow(link.name, link.url, 'link', link.useFavicon);
        }
    });

    editGroupModal.classList.remove('hidden');
}

function addLinkRow(name = '', url = '', type = 'link', useFavicon = false) {
    const container = document.getElementById('group-links-container');
    const div = document.createElement('div');
    div.className = 'link-edit-row';

    div.dataset.type = type;

    if (type === 'list') {
        div.classList.add('list-row');
        div.dataset.isList = 'true';
    }
    if (type === 'sub-link') {
        div.classList.add('sub-link-row');
    }

    div.draggable = false;

    const placeholder = type === 'list' ? 'List Name' : 'URL';
    const namePlaceholder = type === 'list' ? 'List Name' : 'Name';
    const nameStyle = type === 'list' ? 'flex: 3;' : '';

    const faviconActive = useFavicon ? ' favicon-active' : '';
    const faviconPressed = useFavicon ? 'true' : 'false';
    const faviconBtn = type !== 'list'
        ? `<button type="button" class="icon-btn use-favicon-btn${faviconActive}" title="Use favicon" aria-pressed="${faviconPressed}"><i class="fas fa-image"></i></button>`
        : '';

    const urlInput = type !== 'list'
        ? `<input type="text" class="link-url" placeholder="${placeholder}" value="${url}">`
        : '';

    const convertBtnHtml = type === 'list'
        ? `<button type="button" class="icon-btn convert-list-btn" title="Convert to Group"><i class="fas fa-external-link-alt"></i></button>`
        : '';

    div.innerHTML = `
        <i class="fas fa-grip-vertical handle" title="Drag to reorder"></i>
        <input type="text" class="link-name" placeholder="${namePlaceholder}" value="${name}" style="${nameStyle}">
        ${urlInput}
        <div class="row-actions">
            ${faviconBtn}
            ${convertBtnHtml}
            <button type="button" class="icon-btn delete-btn remove-link-btn" title="Remove"><i class="fas fa-trash"></i></button>
        </div>
    `;

    const favBtn = div.querySelector('.use-favicon-btn');
    if (favBtn) {
        favBtn.addEventListener('click', () => {
            favBtn.classList.toggle('favicon-active');
            favBtn.setAttribute('aria-pressed', favBtn.classList.contains('favicon-active'));
        });
    }
    
    // Drag Events
    let isHandleClicked = false;
    const handle = div.querySelector('.handle');

    // Convert List to Group Button
    const convertBtn = div.querySelector('.convert-list-btn');
    if (convertBtn) {
        convertBtn.addEventListener('click', () => {
            if (confirm('Convert this list to a new group? This will save all current changes.')) {
                // 1. Gather data from current row
                const listName = div.querySelector('.link-name').value;
                const links = [];
                
                // Identify children rows
                let next = div.nextElementSibling;
                while (next && next.classList.contains('sub-link-row')) {
                    links.push({
                        name: next.querySelector('.link-name').value,
                        url: next.querySelector('.link-url').value
                    });
                    next = next.nextElementSibling;
                }
                
                // 2. Create new group
                const newGroup = {
                    id: 'g' + Date.now(),
                    title: listName || 'New Group',
                    links: links.map(l => ({
                        id: 'l' + Math.random().toString(36).substr(2, 9),
                        name: l.name,
                        url: ensureProtocol(l.url) // ensure protocol on conversion
                    }))
                };
                appData.groups.push(newGroup);
                
                // 3. Remove list and sublinks from DOM (so saveGroupEdit doesn't see them)
                let toRemove = div.nextElementSibling;
                while (toRemove && toRemove.classList.contains('sub-link-row')) {
                    const nextToRemove = toRemove.nextElementSibling;
                    toRemove.remove();
                    toRemove = nextToRemove;
                }
                div.remove();
                
                // 4. Save current group edits (which effectively removes the list from the old group)
                saveGroupEdit();
            }
        });
    }
    
    handle.addEventListener('mousedown', () => {
        isHandleClicked = true;
        div.draggable = true;
    });

    handle.addEventListener('mouseup', () => {
        isHandleClicked = false;
        div.draggable = false;
    });

    div.addEventListener('dragstart', (e) => {
        if (!isHandleClicked) {
            e.preventDefault();
            return;
        }
        
        div.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        // Set data to identify if it's a list or link
        e.dataTransfer.setData('text/plain', type);
        e.dataTransfer.setData('application/json', JSON.stringify({ type, name }));

        // NEW: If dragging a list, also mark its children as "being dragged" (visually or logically)
        if (type === 'list') {
            // Identify all subsequent sub-links
            let next = div.nextElementSibling;
            while (next && next.classList.contains('sub-link-row')) {
                next.classList.add('dragging-child'); // Helper class we can style or query
                next = next.nextElementSibling;
            }
        }
    });

    div.addEventListener('dragend', () => {
        div.classList.remove('dragging');
        div.draggable = false;
        
        // Cleanup visual markers
        document.querySelectorAll('.link-edit-row').forEach(row => {
            row.classList.remove('drag-over-list', 'drag-over-top', 'drag-over-bottom', 'dragging-child');
        });
        
        // Auto-update indentation based on position relative to lists
        updateIndentationStyles();
    });

    div.querySelector('.remove-link-btn').addEventListener('click', () => {
        if (type === 'list') {
            if (confirm('Delete this list and all its links?')) {
                let next = div.nextElementSibling;
                while (next && next.classList.contains('sub-link-row')) {
                    const toRemove = next;
                    next = next.nextElementSibling;
                    toRemove.remove();
                }
                div.remove();
            }
        } else {
            div.remove();
        }
    });

    container.appendChild(div);
}

// Helper to update visual indentation based on DOM order
function updateIndentationStyles() {
    const rows = document.querySelectorAll('#group-links-container .link-edit-row');
    let currentList = null;

    rows.forEach(row => {
        if (row.dataset.type === 'list') {
            currentList = row;
            row.classList.remove('sub-link-row');
        } else {
            if (!currentList) {
                row.classList.remove('sub-link-row');
                row.dataset.type = 'link';
            }
        }
    });
}

function closeEditGroupModal() {
    editGroupModal.classList.add('hidden');
    currentEditGroupId = null;
}

async function saveGroupEdit() {
    const title = document.getElementById('edit-group-title').value;
    if (!title) {
        alert("Group title is required");
        return;
    }

    // Brand Data Handling
    const isBranded = document.getElementById('edit-group-branded').checked;
    const brandUrl = document.getElementById('edit-group-brand-url').value.trim();
    const headerColorVal = document.getElementById('edit-group-color').value;
    const headerColor = (!isBranded && headerColorVal && headerColorVal !== '#333333') ? headerColorVal : null;
    let brandData = null;

    // Save button state
    const saveBtn = document.getElementById('save-group-edit');
    const originalBtnText = saveBtn.textContent.trim() || 'Save';
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    try {
        const groupIndex = appData.groups.findIndex(g => g.id === currentEditGroupId);
        if (groupIndex === -1) {
            closeEditGroupModal();
            return;
        }

        const currentGroup = appData.groups[groupIndex];

        // Fetch brand data if needed
        if (isBranded && brandUrl) {
            // Check if we need to fetch (url changed or data missing)
            if (brandUrl !== currentGroup.brandUrl || !currentGroup.brandData) {
                try {
                    brandData = await fetchBrandData(brandUrl);
                } catch (e) {
                    console.error("Failed to fetch brand data", e);
                    alert("Could not fetch brand data. Please check the domain.");
                    // Fallback to existing if available?
                }
            } else {
                // Keep existing data
                brandData = currentGroup.brandData;
            }
        } else {
            // Branded turned off
            brandData = null;
        }

        const rows = document.querySelectorAll('.link-edit-row');
        const newLinks = [];
        
        let currentListObj = null;

        rows.forEach(row => {
            const name = row.querySelector('.link-name').value;
            // Handle optional URL input if it exists
            const urlInput = row.querySelector('.link-url');
            const url = urlInput ? ensureProtocol(urlInput.value.trim()) : '';
            
            const isList = row.classList.contains('list-row');
            const isSubLink = row.classList.contains('sub-link-row');
            
            // Get favicon preference
            const faviconBtnEl = row.querySelector('.use-favicon-btn');
            const useFavicon = faviconBtnEl ? faviconBtnEl.classList.contains('favicon-active') : false;

            if (name) {
                if (isList) {
                    // Create new List Object
                    currentListObj = {
                        id: 'l' + Math.random().toString(36).substr(2, 9),
                        name: name,
                        type: 'list',
                        links: []
                    };
                    newLinks.push(currentListObj);
                } else if (isSubLink && currentListObj) {
                    // Add to current list
                    currentListObj.links.push({
                        name: name,
                        url: url,
                        useFavicon: useFavicon
                    });
                } else {
                    // Top level link
                    newLinks.push({
                        id: 'l' + Math.random().toString(36).substr(2, 9),
                        name: name,
                        url: url,
                        useFavicon: useFavicon
                    });
                    // Reset current list object because we hit a top level link
                    currentListObj = null;
                }
            }
        });

        if (groupIndex !== -1) {
            appData.groups[groupIndex].title = title;
            appData.groups[groupIndex].links = newLinks;
            appData.groups[groupIndex].branded = isBranded;
            appData.groups[groupIndex].brandUrl = brandUrl;
            appData.groups[groupIndex].brandData = brandData;
            appData.groups[groupIndex].headerColor = headerColor;
            
            saveData();
            renderGrid();
        }
        closeEditGroupModal();

    } catch (err) {
        console.error(err);
        alert('Error saving group');
    } finally {
        saveBtn.textContent = originalBtnText;
        saveBtn.disabled = false;
    }
}

async function fetchBrandData(domain) {
    const cleanDomain = getDomain(domain) || domain;
    const res = await fetch(`https://api.brandfetch.io/v2/brands/${cleanDomain}`, {
        headers: {
            'Authorization': `Bearer ${BRANDFETCH_API_KEY}`
        }
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
}

// Move Group Logic
function openMoveGroupModal() {
    const sourceGroup = appData.groups.find(g => g.id === currentEditGroupId);
    if (!sourceGroup) return;

    // Populate source name
    document.getElementById('move-source-name').textContent = sourceGroup.title;

    // Populate targets
    const listContainer = document.getElementById('move-target-list');
    listContainer.innerHTML = '';

    const targets = appData.groups.filter(g => g.id !== currentEditGroupId);
    
    if (targets.length === 0) {
        listContainer.innerHTML = '<div style="padding: 10px; color: #666; text-align: center;">No other groups available.</div>';
    } else {
        targets.forEach(target => {
            const btn = document.createElement('button');
            btn.className = 'group-select-btn'; // We'll add some CSS for this
            btn.textContent = target.title;
            btn.style.padding = '10px';
            btn.style.textAlign = 'left';
            btn.style.border = '1px solid #ddd';
            btn.style.borderRadius = '6px';
            btn.style.backgroundColor = '#fff';
            btn.style.cursor = 'pointer';
            
            btn.addEventListener('mouseenter', () => btn.style.backgroundColor = '#f5f5f5');
            btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '#fff');
            
            btn.addEventListener('click', () => {
                executeGroupMove(sourceGroup.id, target.id);
            });
            
            listContainer.appendChild(btn);
        });
    }

    closeEditGroupModal(); // Close the edit modal
    moveGroupModal.classList.remove('hidden'); // Open move modal
}

function closeMoveGroupModal() {
    moveGroupModal.classList.add('hidden');
    // Re-open edit modal if we canceled? 
    // Or just close everything. Closing everything is safer/simpler for now.
    // If user wants to edit again, they can click the edit button on the card.
    currentEditGroupId = null; 
}

function executeGroupMove(sourceId, targetId) {
    const sourceIndex = appData.groups.findIndex(g => g.id === sourceId);
    const targetIndex = appData.groups.findIndex(g => g.id === targetId);
    
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    const sourceGroup = appData.groups[sourceIndex];
    const targetGroup = appData.groups[targetIndex];
    
    // Flatten links from source group
    const flattenedLinks = [];
    
    if (sourceGroup.links) {
        sourceGroup.links.forEach(link => {
            if (link.type === 'list' && link.links) {
                // If it's a list, extract its children
                link.links.forEach(sub => {
                     flattenedLinks.push({
                         name: sub.name,
                         url: sub.url
                     });
                });
            } else if (link.type !== 'list') {
                // Simple link
                flattenedLinks.push({
                    name: link.name,
                    url: link.url
                });
            }
        });
    }
    
    // Create new List item for target group
    const newList = {
        id: 'l' + Math.random().toString(36).substr(2, 9),
        name: sourceGroup.title,
        type: 'list',
        links: flattenedLinks
    };
    
    // Add to target
    if (!targetGroup.links) targetGroup.links = [];
    targetGroup.links.push(newList);
    
    // Remove source group
    appData.groups.splice(sourceIndex, 1);
    
    // Save and Render
    saveData();
    renderGrid();
    closeMoveGroupModal();
}

// Settings Modal
function openSettingsModal() {
    // --- Appearance tab ---
    // Wallpaper picker
    selectedWallpaperUrl = appData.backgroundUrl || PRESET_WALLPAPERS[0].url;
    renderWallpaperGrid();

    // Layout radios
    const layoutRadios = document.querySelectorAll('input[name="layout-mode"]');
    layoutRadios.forEach(r => r.checked = r.value === (appData.layoutMode || 'masonry'));

    // Link behavior radios
    const openInNewTab = !(appData && appData.openLinksInNewTab === false);
    const linkRadios = document.querySelectorAll('input[name="link-behavior"]');
    linkRadios.forEach(r => r.checked = r.value === (openInNewTab ? 'new-tab' : 'same-tab'));

    // --- Google Apps tab ---
    const container = document.getElementById('google-apps-toggles');
    if (container) {
        container.innerHTML = '';
        const enabledApps = appData.enabledGoogleApps || [];
        googleAppsConfig.forEach(app => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = enabledApps.includes(app.name);
            checkbox.value = app.name;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(app.name));
            container.appendChild(label);
        });
    }

    // --- Account tab ---
    const allowedEmailInput = document.getElementById('settings-allowed-email');
    const hideLoggedOutCheckbox = document.getElementById('settings-hide-loggedout');
    if (allowedEmailInput) {
        const emails = (appData.authConfig && appData.authConfig.allowedEmails) || [];
        allowedEmailInput.value = emails.join(', ');
        allowedEmailInput.placeholder = emails.length ? 'Saved emails' : 'Saved (Hidden) - Enter email(s) to update';
    }
    if (hideLoggedOutCheckbox) {
        hideLoggedOutCheckbox.checked = !!appData.hideWhenLoggedOut;
    }

    // --- Data tab ---
    const safeData = JSON.parse(JSON.stringify(appData || {}));
    if (safeData.authConfig) delete safeData.authConfig;
    document.getElementById('config-json').value = JSON.stringify(safeData, null, 2);

    // Show first tab
    switchSettingsTab('appearance');
    settingsModal.classList.remove('hidden');
}

function switchSettingsTab(tabName) {
    document.querySelectorAll('.settings-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tabName);
    });
    document.querySelectorAll('.settings-tab-content').forEach(c => {
        c.classList.toggle('active', c.dataset.tab === tabName);
    });
}

function renderWallpaperGrid() {
    const grid = document.getElementById('wallpaper-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const currentUrl = selectedWallpaperUrl;
    let isCustom = true;

    PRESET_WALLPAPERS.forEach(wp => {
        const isSelected = currentUrl === wp.url;
        if (isSelected) isCustom = false;

        const thumb = document.createElement('div');
        thumb.className = 'wallpaper-thumb' + (isSelected ? ' selected' : '');
        thumb.innerHTML = `
            <img src="${wp.url}" alt="${wp.name}" loading="lazy">
            <div class="wp-check">✓</div>
            <div class="wp-name">${wp.name}</div>
        `;
        thumb.addEventListener('click', () => {
            selectedWallpaperUrl = wp.url;
            document.getElementById('custom-url-input').style.display = 'none';
            renderWallpaperGrid();
            // Live preview
            document.body.style.backgroundImage = `url('${wp.url}')`;
        });
        grid.appendChild(thumb);
    });

    // Custom URL tile
    const customThumb = document.createElement('div');
    customThumb.className = 'wallpaper-thumb' + (isCustom ? ' selected' : '');
    customThumb.innerHTML = `
        <div class="wallpaper-thumb-custom"><span>+</span></div>
        <div class="wp-check">✓</div>
        <div class="wp-name">Custom URL</div>
    `;
    customThumb.addEventListener('click', () => {
        const urlRow = document.getElementById('custom-url-input');
        urlRow.style.display = 'flex';
        const urlInput = document.getElementById('wallpaper-custom-url');
        if (isCustom && currentUrl) {
            urlInput.value = currentUrl;
        }
        urlInput.focus();
    });
    grid.appendChild(customThumb);

    // Pre-fill custom URL if active
    if (isCustom && currentUrl) {
        document.getElementById('custom-url-input').style.display = 'flex';
        document.getElementById('wallpaper-custom-url').value = currentUrl;
    }
}

function closeSettingsModal() {
    settingsModal.classList.add('hidden');
}

// --- Event Listeners ---

function setupEventListeners() {
    window.addEventListener("resize", resizeAllGridItems);
    
    editModeBtn.addEventListener('click', toggleEditMode);
    settingsBtn.addEventListener('click', openSettingsModal);
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Group Edit Modal
    document.getElementById('cancel-group-edit').addEventListener('click', closeEditGroupModal);
    document.getElementById('save-group-edit').addEventListener('click', saveGroupEdit);
    document.getElementById('add-link-row-btn').addEventListener('click', () => addLinkRow());
    
    // Move Group Button
    const moveGroupBtn = document.getElementById('move-group-btn');
    if (moveGroupBtn) {
        moveGroupBtn.addEventListener('click', openMoveGroupModal);
    }
    
    // NEW: Add List Button
    const addListBtn = document.getElementById('add-list-btn');
    if (addListBtn) {
        addListBtn.addEventListener('click', () => addLinkRow('', '', 'list'));
    }
    
    document.getElementById('delete-group-full').addEventListener('click', () => {
        if (confirm("Are you sure you want to delete this entire group?")) {
            deleteGroup(currentEditGroupId);
            closeEditGroupModal();
        }
    });

    // Add Group Modal
    document.getElementById('cancel-add-group').addEventListener('click', closeAddGroupModal);
    document.getElementById('confirm-add-group').addEventListener('click', () => {
        const title = document.getElementById('new-group-name').value;
        if (title) {
            addGroup(title);
            closeAddGroupModal();
        }
    });

    // Settings Modal — tab switching
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => switchSettingsTab(tab.dataset.tab));
    });

    // Custom wallpaper URL apply
    document.getElementById('apply-custom-url').addEventListener('click', () => {
        const url = document.getElementById('wallpaper-custom-url').value.trim();
        if (url) {
            selectedWallpaperUrl = url;
            renderWallpaperGrid();
            document.body.style.backgroundImage = `url('${url}')`;
        }
    });

    document.getElementById('close-settings').addEventListener('click', closeSettingsModal);
    document.getElementById('copy-json-btn').addEventListener('click', (e) => {
        e.preventDefault();
        const textarea = document.getElementById('config-json');
        const textToCopy = textarea.value;

        // Helper for legacy copy
        const legacyCopy = () => {
            textarea.focus();
            textarea.select();
            textarea.setSelectionRange(0, 99999); // Mobile fallback
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    showToast("JSON copied to clipboard", "success");
                } else {
                    showToast("Failed to copy", "error");
                }
            } catch (err) {
                showToast("Failed to copy", "error");
            }
        };

        // Try Async Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast("JSON copied to clipboard", "success");
            }).catch(err => {
                console.warn('Clipboard write failed, trying fallback:', err);
                legacyCopy();
            });
        } else {
            legacyCopy();
        }
    });

    document.getElementById('save-settings').addEventListener('click', () => {
        try {
            // Save JSON Config
            const newData = JSON.parse(document.getElementById('config-json').value);
            if (newData.authConfig) delete newData.authConfig;
            appData = newData;
            
            // Save Layout Mode
            const layoutRadios = document.querySelectorAll('input[name="layout-mode"]');
            layoutRadios.forEach(r => {
                if (r.checked) appData.layoutMode = r.value;
            });

            // Save Link Behavior
            const linkBehaviorRadios = document.querySelectorAll('input[name="link-behavior"]');
            let openInNewTab = true;
            linkBehaviorRadios.forEach(r => {
                if (r.checked) {
                    openInNewTab = (r.value === 'new-tab');
                }
            });
            appData.openLinksInNewTab = openInNewTab;

            // Save wallpaper
            appData.backgroundUrl = selectedWallpaperUrl;

            // Save Auth Settings via separate secure endpoint
            const allowedEmailRaw = document.getElementById('settings-allowed-email').value.trim();
            const hideLoggedOut = document.getElementById('settings-hide-loggedout').checked;

            appData.hideWhenLoggedOut = hideLoggedOut;

            // Split comma-separated emails
            const allowedEmails = allowedEmailRaw
                ? allowedEmailRaw.split(',').map(e => e.trim()).filter(Boolean)
                : [];

            if (allowedEmails.length) {
                fetch('/api/auth_setup', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ allowedEmails })
                }).then(res => {
                    if (!res.ok) alert("Failed to save Auth Config (Unauthorized?)");
                    else {
                        if (!appData.authConfig) appData.authConfig = {};
                        appData.authConfig.configured = true;
                        appData.authConfig.allowedEmails = allowedEmails;
                    }
                });
            }

            // Save Checkboxes
            const container = document.getElementById('google-apps-toggles');
            if (container) {
                const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                const enabled = [];
                checkboxes.forEach(cb => {
                    if (cb.checked) enabled.push(cb.value);
                });
                appData.enabledGoogleApps = enabled;
            }
            
            renderGrid();
            renderGoogleApps(); // Refresh apps
            saveData();
            
            
            applyLoggedOutPrivacy(isAuthenticated);
            
            closeSettingsModal();
        } catch (e) {
            alert('Invalid JSON');
        }
    });
    document.getElementById('reset-defaults').addEventListener('click', () => {
        if (confirm('Reset to default data?')) {
            appData = defaultData;
            saveData();
            renderGrid();
            closeSettingsModal();
        }
    });

    // Move Group Modal Listeners
    document.getElementById('cancel-move-group').addEventListener('click', closeMoveGroupModal);
    
    // Close modals on outside click (except edit group — use Cancel/Save buttons)
    window.addEventListener('click', (e) => {
        if (e.target === addGroupModal) closeAddGroupModal();
        if (e.target === settingsModal) closeSettingsModal();
        if (e.target === moveGroupModal) closeMoveGroupModal();
    });

    // Apps Launcher
    const appsBtn = document.getElementById('apps-btn');
    const appsDropdown = document.getElementById('apps-dropdown');
    
    if (appsBtn && appsDropdown) {
        appsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            appsDropdown.classList.toggle('hidden');
            appsBtn.classList.toggle('active');
        });

        // Close apps dropdown on outside click
        window.addEventListener('click', (e) => {
            if (!appsDropdown.contains(e.target) && !appsBtn.contains(e.target)) {
                appsDropdown.classList.add('hidden');
                appsBtn.classList.remove('active');
            }
        });
    }


    // --- Modal Link Dragging Improved ---
    const linksContainer = document.getElementById('group-links-container');
    
    linksContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const draggingItem = document.querySelector('.link-edit-row.dragging');
        if (!draggingItem) return;

        const siblings = [...linksContainer.querySelectorAll('.link-edit-row:not(.dragging):not(.dragging-child)')];
        const nextSibling = siblings.find(sibling => {
            const box = sibling.getBoundingClientRect();
            return e.clientY <= box.top + box.height / 2;
        });
        
        // Visual Feedback logic
        siblings.forEach(sib => sib.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-list'));

        if (nextSibling) {
             linksContainer.insertBefore(draggingItem, nextSibling);
        } else {
             linksContainer.appendChild(draggingItem);
        }

        // MOVE CHILDREN LOGIC:
        // If we are dragging a list, we must move its marked children to follow it immediately
        if (draggingItem.dataset.type === 'list') {
            const children = document.querySelectorAll('.dragging-child');
            let ref = draggingItem;
            children.forEach(child => {
                // Insert after the ref (draggingItem or previous child)
                // insertBefore(newNode, referenceNode.nextSibling) is effectively insertAfter
                if (ref.nextSibling) {
                    linksContainer.insertBefore(child, ref.nextSibling);
                } else {
                    linksContainer.appendChild(child);
                }
                ref = child;
            });
        }
        
        // DYNAMIC INDENTATION CHECK
        const prev = draggingItem.previousElementSibling;
        const containerLeft = linksContainer.getBoundingClientRect().left;
        const mouseXOffset = e.clientX - containerLeft;
        
        if (prev && (prev.classList.contains('list-row') || prev.classList.contains('sub-link-row'))) {
            if (mouseXOffset > 50) {
                draggingItem.classList.add('sub-link-row');
                draggingItem.dataset.type = 'sub-link';
            } else {
                draggingItem.classList.remove('sub-link-row');
                draggingItem.dataset.type = 'link';
            }
        } else {
            draggingItem.classList.remove('sub-link-row');
            draggingItem.dataset.type = 'link';
        }
        
        if (draggingItem.dataset.isList === "true") {
             draggingItem.classList.remove('sub-link-row');
             draggingItem.dataset.type = 'list';
        }
    });

    // --- Grid Group Dragging ---
    gridContainer.addEventListener('dragover', (e) => {
        e.preventDefault(); 
        const draggable = document.querySelector('.card.dragging');
        if (!draggable) return;

        const addButton = gridContainer.querySelector('.add-group-card');
        const cards = [...gridContainer.querySelectorAll('.card:not(.dragging):not(.add-group-card)')];
        
        const closest = cards.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const boxCenterX = box.left + box.width / 2;
            const boxCenterY = box.top + box.height / 2;
            const dist = Math.hypot(e.clientX - boxCenterX, e.clientY - boxCenterY);
            
            if (closest.dist === undefined || dist < closest.dist) {
                return { dist: dist, element: child, box: box };
            }
            return closest;
        }, { dist: undefined });

        if (closest.element) {
            const box = closest.box;
            const isRightOfCenter = e.clientX > (box.left + box.width / 2);
            
            if (isRightOfCenter) {
                gridContainer.insertBefore(draggable, closest.element.nextElementSibling);
            } else {
                gridContainer.insertBefore(draggable, closest.element);
            }
        } else {
            gridContainer.insertBefore(draggable, addButton);
        }
        
        if (gridContainer.lastElementChild !== addButton) {
            gridContainer.appendChild(addButton);
        }
    });
}

// Search handling
const searchInput = document.getElementById('search-input');
if(searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value;
            if(query) {
                const target = getLinkTarget();
                window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, target);
                searchInput.value = '';
            }
        }
    });
}

// Start
init();
