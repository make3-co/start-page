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

// Font presets
const FONT_OPTIONS = [
    { id: 'system', name: 'System (SF Pro)', value: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" },
    { id: 'inter', name: 'Inter', value: "'Inter', sans-serif" },
    { id: 'poppins', name: 'Poppins', value: "'Poppins', sans-serif" },
    { id: 'dm-sans', name: 'DM Sans', value: "'DM Sans', sans-serif" },
    { id: 'outfit', name: 'Outfit', value: "'Outfit', sans-serif" },
    { id: 'sora', name: 'Sora', value: "'Sora', sans-serif" },
];

const WEIGHT_OPTIONS = [
    { name: 'Thin', value: '200' },
    { name: 'Light', value: '300' },
    { name: 'Regular', value: '400' },
    { name: 'Medium', value: '500' },
    { name: 'Semi', value: '600' },
];

// Preset wallpapers
const PRESET_WALLPAPERS = [
    { id: 'warm-nature', name: 'Warm Nature', url: 'https://images.unsplash.com/photo-1460500063983-994d4c27756c?w=1920&q=80' },
    { id: 'dark-ocean', name: 'Dark Ocean', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=80' },
    { id: 'mountains', name: 'Mountains', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80' },
    { id: 'twilight', name: 'Twilight', url: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1920&q=80' },
    { id: 'forest', name: 'Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80' },
];

// Section color palette for auto-assignment
const SECTION_COLORS = [
    'rgba(0, 122, 255, 0.35)',   // blue
    'rgba(52, 199, 89, 0.35)',   // green
    'rgba(255, 149, 0, 0.35)',   // orange
    'rgba(175, 82, 222, 0.35)',  // purple
    'rgba(255, 59, 48, 0.30)',   // red
    'rgba(0, 199, 190, 0.35)',   // teal
    'rgba(255, 204, 0, 0.30)',   // yellow
    'rgba(88, 86, 214, 0.35)',   // indigo
];

function ensureSections() {
    if (!appData.sections) appData.sections = [];
}

function getSectionColor(sectionId) {
    ensureSections();
    const idx = appData.sections.findIndex(s => s.id === sectionId);
    if (idx < 0) return SECTION_COLORS[0];
    const section = appData.sections[idx];
    // Use custom color if set, otherwise palette
    if (section.color) return section.color;
    return SECTION_COLORS[idx % SECTION_COLORS.length];
}

function renderSectionsManager() {
    ensureSections();
    const mgr = document.getElementById('sections-manager');
    if (!mgr) return;
    mgr.innerHTML = '';

    appData.sections.forEach((section, idx) => {
        const row = document.createElement('div');
        row.className = 'section-manager-row';

        // Color from palette based on index
        const paletteColor = SECTION_COLORS[idx % SECTION_COLORS.length];
        // Extract rgb for the color picker — convert rgba to hex
        const match = paletteColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        const hexColor = section.customColor || (match
            ? '#' + [match[1], match[2], match[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('')
            : '#007aff');

        row.innerHTML = `
            <input type="color" value="${hexColor}" data-section-id="${section.id}">
            <input type="text" value="${section.name}" data-section-id="${section.id}">
            <button type="button" class="section-manager-delete" data-section-id="${section.id}" title="Delete section"><i class="fas fa-trash"></i></button>
        `;

        // Live edit name
        row.querySelector('input[type="text"]').addEventListener('input', (e) => {
            section.name = e.target.value;
        });

        // Color change
        row.querySelector('input[type="color"]').addEventListener('input', (e) => {
            const hex = e.target.value;
            const r = parseInt(hex.slice(1,3), 16);
            const g = parseInt(hex.slice(3,5), 16);
            const b = parseInt(hex.slice(5,7), 16);
            section.customColor = hex;
            section.color = `rgba(${r}, ${g}, ${b}, 0.35)`;
        });

        // Delete
        row.querySelector('.section-manager-delete').addEventListener('click', () => {
            // Remove section from all groups
            appData.groups.forEach(group => {
                if (group.sectionId === section.id) group.sectionId = null;
            });
            appData.sections = appData.sections.filter(s => s.id !== section.id);
            renderSectionsManager();
        });

        mgr.appendChild(row);
    });
}

// Track selected wallpaper in settings
let selectedWallpaperUrl = null;

// Track auth configuration (set by initAuth)
let serverAuthEnabled = false;
let serverGoogleEnabled = false;
let serverPasswordEnabled = false;

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
    { name: "Maps", url: "https://maps.google.com", iconStyle: "background-image: url('https://www.gstatic.com/images/branding/product/2x/maps_48dp.png'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "YouTube", url: "https://www.youtube.com", iconStyle: "background-image: url('https://www.gstatic.com/images/branding/product/2x/youtube_64dp.png'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "News", url: "https://news.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idMbJg9Po3.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Gmail", url: "https://mail.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idBP5ltu-a.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Meet", url: "https://meet.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/ide81vGBGA.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Chat", url: "https://chat.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idlJx_D1re.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Contacts", url: "https://contacts.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idp4JxS-Wl.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Drive", url: "https://drive.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idncaAgFGT.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Calendar", url: "https://calendar.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idMX2_OMSc.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Translate", url: "https://translate.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idOA5j5-it.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Photos", url: "https://photos.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idXdVMQg1G.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Voice", url: "https://voice.google.com", iconStyle: "background-image: url('https://www.gstatic.com/images/branding/product/2x/voice_48dp.png'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Shopping", url: "https://shopping.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/id7WOXk600.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Docs", url: "https://docs.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/id9yxSb4R3.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Sheets", url: "https://sheets.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idKa2XnbFY.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Slides", url: "https://slides.google.com", iconStyle: "background-image: url('https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idY7x55JLN.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Keep", url: "https://keep.google.com", iconStyle: "background-image: url('https://www.gstatic.com/images/branding/product/2x/keep_2020q4_48dp.png'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Analytics", url: "https://analytics.google.com", iconStyle: "background-image: url('https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Google Ads", url: "https://ads.google.com", iconStyle: "background-image: url('https://www.gstatic.com/images/branding/product/2x/ads_48dp.png'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
    { name: "Gemini", url: "https://gemini.google.com", iconStyle: "background-image: url('https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg'); background-size: contain; background-repeat: no-repeat; background-position: center;" },
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
function checkUrlErrors() {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (!error) return;

    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);

    const redirectUri = params.get('redirect_uri');

    const messages = {
        token_exchange_failed: redirectUri
            ? `Google Sign-In failed. Add this redirect URI in Google Cloud Console → OAuth Client → Authorized redirect URIs:\n\n${decodeURIComponent(redirectUri)}`
            : 'Google Sign-In failed. Check that your redirect URI is configured in Google Cloud Console.',
        invalid_state: 'Sign-in failed (invalid state). Please try again.',
        unauthorized_email: 'Your email is not in the allowed list. Check Settings → Account.',
        missing_code: 'Sign-in was cancelled.',
        oauth_not_configured: 'Google OAuth is not configured. Set up your Client ID and Secret.',
    };

    if (error === 'token_exchange_failed' && redirectUri) {
        // Show a persistent error with the redirect URI to copy
        const uri = decodeURIComponent(redirectUri);
        const banner = document.createElement('div');
        banner.className = 'auth-error-banner';
        banner.innerHTML = `
            <div><strong>Google Sign-In failed.</strong> Add this as an Authorized redirect URI in <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a>:</div>
            <div class="auth-error-uri" title="Click to copy">${uri}</div>
            <div style="font-size:0.85em;opacity:0.7;">Click the URI to copy it. After adding it in Google Console, try signing in again.</div>
            <button onclick="this.parentElement.remove()" style="position:absolute;top:8px;right:12px;background:none;border:none;color:#fff;font-size:1.2em;cursor:pointer;">✕</button>
        `;
        banner.querySelector('.auth-error-uri').addEventListener('click', () => {
            navigator.clipboard.writeText(uri);
            banner.querySelector('.auth-error-uri').textContent = 'Copied!';
            setTimeout(() => { banner.querySelector('.auth-error-uri').textContent = uri; }, 2000);
        });
        document.body.appendChild(banner);
        return;
    }

    const msg = messages[error] || `Sign-in error: ${error}`;
    showToast(msg, 'error', 5000);
}

async function init() {
    checkUrlErrors();
    await loadData();
    await loadConfig(); // runs after loadData so user's brandfetch key is available
    applyBackground();
    applyTypography();
    startClock();
    fetchWeather();
    setupEventListeners();
    initPasswordLogin();

    // Initialize cookie-based auth
    await initAuth();
}

function applyBackground() {
    if (appData.backgroundUrl) {
        document.body.style.backgroundImage = `url('${appData.backgroundUrl}')`;
    }
}

function applyTypography() {
    const typo = appData.typography || {};
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date-display');

    if (clockEl) {
        if (typo.clockFont) clockEl.style.fontFamily = typo.clockFont;
        if (typo.clockWeight) clockEl.style.fontWeight = typo.clockWeight;
    }
    if (dateEl) {
        if (typo.dateFont) dateEl.style.fontFamily = typo.dateFont;
        if (typo.dateWeight) dateEl.style.fontWeight = typo.dateWeight;
    }
    // Links get applied via CSS variable
    if (typo.linkFont) {
        document.documentElement.style.setProperty('--link-font', typo.linkFont);
    }
    if (typo.linkWeight) {
        document.documentElement.style.setProperty('--link-weight', typo.linkWeight);
    }
}

function populateFontSelects() {
    const ids = ['settings-clock-font', 'settings-date-font', 'settings-link-font'];
    ids.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel || sel.options.length > 0) return;
        FONT_OPTIONS.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.value;
            opt.textContent = f.name;
            sel.appendChild(opt);
        });
    });
    const weightIds = ['settings-clock-weight', 'settings-date-weight', 'settings-link-weight'];
    weightIds.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel || sel.options.length > 0) return;
        WEIGHT_OPTIONS.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.value;
            opt.textContent = w.name;
            sel.appendChild(opt);
        });
    });

    // Live preview on change
    [...ids, ...weightIds].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) sel.addEventListener('change', previewTypography);
    });
}

function previewTypography() {
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date-display');
    const cf = document.getElementById('settings-clock-font');
    const cw = document.getElementById('settings-clock-weight');
    const df = document.getElementById('settings-date-font');
    const dw = document.getElementById('settings-date-weight');
    const lf = document.getElementById('settings-link-font');
    const lw = document.getElementById('settings-link-weight');

    if (clockEl && cf) clockEl.style.fontFamily = cf.value;
    if (clockEl && cw) clockEl.style.fontWeight = cw.value;
    if (dateEl && df) dateEl.style.fontFamily = df.value;
    if (dateEl && dw) dateEl.style.fontWeight = dw.value;
    if (lf) document.documentElement.style.setProperty('--link-font', lf.value);
    if (lw) document.documentElement.style.setProperty('--link-weight', lw.value);
}

// Load Brandfetch keys from user settings (stored in appData, synced via KV)
function loadConfig() {
    if (appData.brandfetchApiKey) {
        BRANDFETCH_API_KEY = appData.brandfetchApiKey;
    }
    if (appData.brandfetchClientId) {
        BRANDFETCH_CLIENT_ID = appData.brandfetchClientId;
    }
}

// Append Brandfetch client cache param if available
function withBrandfetchCache(url) {
    if (!url || !BRANDFETCH_CLIENT_ID) return url;
    return url.includes('?') ? `${url}&c=${BRANDFETCH_CLIENT_ID}` : `${url}?c=${BRANDFETCH_CLIENT_ID}`;
}

async function initAuth() {
    const signInBtn = document.getElementById('google-signin-btn');
    const passwordSignInBtn = document.getElementById('password-signin-btn');
    const editBtn = document.getElementById('edit-mode-btn');

    let googleEnabled = false;
    let passwordEnabled = false;
    let setupComplete = false;

    // Check auth config
    try {
        const cfgRes = await fetch('/api/auth/config');
        if (cfgRes.ok) {
            const cfg = await cfgRes.json();
            googleEnabled = !!cfg.googleOAuthEnabled;
            passwordEnabled = !!cfg.passwordAuthEnabled;
            setupComplete = !!cfg.setupComplete;
            serverAuthEnabled = googleEnabled || passwordEnabled;
            serverGoogleEnabled = googleEnabled;
            serverPasswordEnabled = passwordEnabled;
        }
    } catch (e) {
        console.log('Auth config check failed', e);
    }

    // Show setup wizard if no auth is configured
    if (!setupComplete) {
        initSetupWizard();
        return;
    }

    const authed = await checkAuthSession();
    if (authed) {
        // Signed in — hide sign-in buttons, show edit/settings, refresh data
        if (signInBtn) signInBtn.classList.add('hidden');
        if (passwordSignInBtn) passwordSignInBtn.classList.add('hidden');
        await refreshDataWithAuth();
    } else if (serverAuthEnabled) {
        // Auth configured but not signed in — show appropriate sign-in button
        if (googleEnabled && signInBtn) signInBtn.classList.remove('hidden');
        if (passwordEnabled && passwordSignInBtn) passwordSignInBtn.classList.remove('hidden');
        if (editBtn) editBtn.classList.add('hidden');
        if (settingsBtn) settingsBtn.classList.add('hidden');
        applyLoggedOutPrivacy(false);
    } else {
        // No auth configured — open access mode
        if (editBtn) editBtn.classList.remove('hidden');
        if (settingsBtn) settingsBtn.classList.remove('hidden');
        if (signInBtn) signInBtn.classList.add('hidden');
        if (passwordSignInBtn) passwordSignInBtn.classList.add('hidden');
    }
}

// ---- Setup Wizard ----
async function initSetupWizard() {
    const wizard = document.getElementById('setup-wizard');
    if (!wizard) return;

    // Fetch callback URL for Google OAuth instructions
    try {
        const res = await fetch('/api/setup/status');
        if (res.ok) {
            const status = await res.json();
            const callbackUrlEl = document.getElementById('setup-callback-url');
            if (callbackUrlEl) callbackUrlEl.textContent = status.callbackUrl;
        }
    } catch (e) { /* ignore */ }

    wizard.classList.remove('hidden');

    function showStep(stepName) {
        wizard.querySelectorAll('.setup-step').forEach(s => s.classList.add('hidden'));
        wizard.querySelector(`.setup-step[data-step="${stepName}"]`).classList.remove('hidden');
    }

    // Auth choice buttons
    wizard.querySelectorAll('.setup-option').forEach(btn => {
        btn.addEventListener('click', () => showStep(btn.dataset.auth));
    });

    // Back buttons
    wizard.querySelectorAll('.setup-back-btn').forEach(btn => {
        btn.addEventListener('click', () => showStep(btn.dataset.back));
    });

    // Copy callback URL
    const copyBtn = wizard.querySelector('.setup-copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const url = document.getElementById('setup-callback-url').textContent;
            navigator.clipboard.writeText(url);
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i>'; }, 2000);
        });
    }

    // Password setup
    const passwordSubmit = document.getElementById('setup-password-submit');
    if (passwordSubmit) {
        passwordSubmit.addEventListener('click', async () => {
            const pw = document.getElementById('setup-password').value;
            const confirm = document.getElementById('setup-password-confirm').value;
            const errorEl = document.getElementById('setup-password-error');
            errorEl.classList.add('hidden');

            if (pw.length < 6) {
                errorEl.textContent = 'Password must be at least 6 characters.';
                errorEl.classList.remove('hidden');
                return;
            }
            if (pw !== confirm) {
                errorEl.textContent = 'Passwords do not match.';
                errorEl.classList.remove('hidden');
                return;
            }

            passwordSubmit.disabled = true;
            passwordSubmit.textContent = 'Setting up...';

            try {
                const res = await fetch('/api/auth/password-setup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: pw }),
                });
                if (res.ok) {
                    showStep('done');
                } else {
                    const data = await res.json();
                    errorEl.textContent = data.error || 'Setup failed.';
                    errorEl.classList.remove('hidden');
                }
            } catch (e) {
                errorEl.textContent = 'Network error.';
                errorEl.classList.remove('hidden');
            }
            passwordSubmit.disabled = false;
            passwordSubmit.textContent = 'Set Password & Sign In';
        });
    }

    // Google OAuth setup
    const googleSubmit = document.getElementById('setup-google-submit');
    if (googleSubmit) {
        googleSubmit.addEventListener('click', async () => {
            const clientId = document.getElementById('setup-google-client-id').value.trim();
            const clientSecret = document.getElementById('setup-google-client-secret').value.trim();
            const errorEl = document.getElementById('setup-google-error');
            errorEl.classList.add('hidden');

            if (!clientId || !clientId.includes('.apps.googleusercontent.com')) {
                errorEl.textContent = 'Client ID should end with .apps.googleusercontent.com';
                errorEl.classList.remove('hidden');
                return;
            }
            if (!clientSecret) {
                errorEl.textContent = 'Client Secret is required.';
                errorEl.classList.remove('hidden');
                return;
            }

            googleSubmit.disabled = true;
            googleSubmit.textContent = 'Saving...';

            try {
                const res = await fetch('/api/setup/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientId, clientSecret }),
                });
                if (res.ok) {
                    showStep('done');
                } else {
                    const data = await res.json();
                    errorEl.textContent = data.error || 'Setup failed.';
                    errorEl.classList.remove('hidden');
                }
            } catch (e) {
                errorEl.textContent = 'Network error.';
                errorEl.classList.remove('hidden');
            }
            googleSubmit.disabled = false;
            googleSubmit.textContent = 'Save & Enable Google Sign-In';
        });
    }

    // Done button
    const doneBtn = document.getElementById('setup-done-btn');
    if (doneBtn) {
        doneBtn.addEventListener('click', () => {
            wizard.classList.add('hidden');
            location.reload();
        });
    }
}

// ---- Password Login ----
function initPasswordLogin() {
    const btn = document.getElementById('password-signin-btn');
    const modal = document.getElementById('password-login-modal');
    const input = document.getElementById('password-login-input');
    const submit = document.getElementById('password-login-submit');
    const errorEl = document.getElementById('password-login-error');
    if (!btn || !modal) return;

    btn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        input.value = '';
        errorEl.classList.add('hidden');
        setTimeout(() => input.focus(), 100);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    async function doLogin() {
        errorEl.classList.add('hidden');
        const pw = input.value;
        if (!pw) return;

        submit.disabled = true;
        try {
            const res = await fetch('/api/auth/password-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pw }),
            });
            if (res.ok) {
                location.reload();
            } else {
                const data = await res.json();
                errorEl.textContent = data.error || 'Invalid password.';
                errorEl.classList.remove('hidden');
            }
        } catch (e) {
            errorEl.textContent = 'Network error.';
            errorEl.classList.remove('hidden');
        }
        submit.disabled = false;
    }

    submit.addEventListener('click', doLogin);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doLogin();
    });
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
    const googleSignInBtn = document.getElementById('google-signin-btn');
    const passwordSignInBtn = document.getElementById('password-signin-btn');

    const canEdit = computeCanEdit(isSignedIn);

    if (isSignedIn) {
        if (canEdit) {
            editBtn.classList.remove('hidden');
        } else {
            editBtn.classList.add('hidden');
            if (isEditMode) toggleEditMode();
        }
        logoutBtn.classList.remove('hidden');
        if (googleSignInBtn) googleSignInBtn.classList.add('hidden');
        if (passwordSignInBtn) passwordSignInBtn.classList.add('hidden');
    } else {
        editBtn.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        if (isEditMode) toggleEditMode();

        // Show the correct sign-in button based on what's configured
        if (serverGoogleEnabled && googleSignInBtn) googleSignInBtn.classList.remove('hidden');
        if (serverPasswordEnabled && passwordSignInBtn) passwordSignInBtn.classList.remove('hidden');
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

    // Show the correct sign-in button again
    if (serverGoogleEnabled) {
        const signInBtn = document.getElementById('google-signin-btn');
        if (signInBtn) signInBtn.classList.remove('hidden');
    }
    if (serverPasswordEnabled) {
        const pwBtn = document.getElementById('password-signin-btn');
        if (pwBtn) pwBtn.classList.remove('hidden');
    }

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
        // Hide all children except sign-in buttons
        Array.from(settingsControls.children).forEach(child => {
            if (child.id === 'google-signin-btn' || child.id === 'password-signin-btn') return;
            child.classList.toggle('hidden', shouldHide);
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

    // Measure natural content height by summing child heights.
    // We can't rely on offsetHeight/scrollHeight since the grid row constrains them.
    let contentHeight = 0;
    for (const child of item.children) {
        contentHeight += child.offsetHeight;
    }

    const rowSpan = Math.ceil((contentHeight + desiredGap + 5) / rowHeight);
    
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
    
    // Sort groups: sectioned groups first (grouped by section), then ungrouped
    const sortedGroups = [...appData.groups].sort((a, b) => {
        const aSection = a.sectionId || '';
        const bSection = b.sectionId || '';
        if (aSection && !bSection) return -1;
        if (!aSection && bSection) return 1;
        if (aSection && bSection && aSection !== bSection) {
            // Sort by section order
            ensureSections();
            const aIdx = appData.sections.findIndex(s => s.id === aSection);
            const bIdx = appData.sections.findIndex(s => s.id === bSection);
            return aIdx - bIdx;
        }
        return 0;
    });

    sortedGroups.forEach((group) => {
        const card = document.createElement('div');

        // Only animate if the group ID is NOT in our known history
        if (!renderedGroupIds.has(group.id)) {
            card.className = 'card animate-in';
            card.addEventListener('animationend', () => {
                card.classList.remove('animate-in');
                resizeGridItem(card);
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

        // Collect large icon links to render in a grid at the bottom
        const largeIconLinks = [];

        if (group.links) {
            group.links.forEach(link => {
                if (link.type === 'list') {
                    // Separate large icon sub-links from regular ones
                    const regularSubLinks = [];
                    const largeSubLinks = [];
                    if (link.links) {
                        link.links.forEach(sub => {
                            if (sub.largeIcon) largeSubLinks.push(sub);
                            else regularSubLinks.push(sub);
                        });
                    }

                    if (link.sectionMode) {
                        // Section mode: inline divider + title + links
                        const section = document.createElement('div');
                        section.className = 'list-section';

                        const sectionTitle = document.createElement('div');
                        sectionTitle.className = 'list-section-title';
                        sectionTitle.textContent = link.name;
                        section.appendChild(sectionTitle);

                        regularSubLinks.forEach(subLink => {
                            const a = document.createElement('a');
                            a.className = 'link-item';
                            a.href = isEditMode ? '#' : ensureProtocol(subLink.url);
                            a.target = getLinkTarget();
                            if (isEditMode) a.addEventListener('click', (e) => e.preventDefault());
                            const iconElement = createLinkIcon(subLink.url, subLink.useFavicon);
                            if (iconElement) a.appendChild(iconElement);
                            const span = document.createElement('span');
                            span.textContent = subLink.name;
                            a.appendChild(span);
                            section.appendChild(a);
                        });

                        body.appendChild(section);
                    } else if (regularSubLinks.length > 0 || largeSubLinks.length === 0) {
                        // Dropdown mode
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

                        regularSubLinks.forEach(subLink => {
                            const a = document.createElement('a');
                            a.className = 'link-item';
                            a.href = isEditMode ? '#' : ensureProtocol(subLink.url);
                            a.target = getLinkTarget();
                            if (isEditMode) a.addEventListener('click', (e) => e.preventDefault());
                            const iconElement = createLinkIcon(subLink.url, subLink.useFavicon);
                            if (iconElement) a.appendChild(iconElement);
                            const span = document.createElement('span');
                            span.textContent = subLink.name;
                            a.appendChild(span);
                            listItems.appendChild(a);
                        });

                        listHeader.addEventListener('click', () => {
                            const isOpen = listItems.classList.toggle('open');
                            listHeader.classList.toggle('open');
                            if (isOpen) {
                                card.style.zIndex = '100';
                            } else {
                                const openLists = card.querySelectorAll('.list-items.open');
                                if (openLists.length === 0) card.style.zIndex = '';
                            }
                        });

                        listContainer.appendChild(listHeader);
                        listContainer.appendChild(listItems);
                        body.appendChild(listContainer);
                    }

                    // Collect large icon sub-links
                    largeSubLinks.forEach(sub => largeIconLinks.push(sub));

                } else if (link.largeIcon) {
                    // Collect for grid
                    largeIconLinks.push(link);
                } else {
                    // Render a normal link
                    const a = document.createElement('a');
                    a.className = 'link-item';
                    a.href = isEditMode ? '#' : ensureProtocol(link.url);
                    a.target = getLinkTarget();
                    if (isEditMode) a.addEventListener('click', (e) => e.preventDefault());
                    const iconElement = createLinkIcon(link.url, link.useFavicon);
                    if (iconElement) a.appendChild(iconElement);
                    const span = document.createElement('span');
                    span.textContent = link.name;
                    a.appendChild(span);
                    body.appendChild(a);
                }
            });
        }

        // Render large icon grid at the bottom
        if (largeIconLinks.length > 0) {
            const grid = document.createElement('div');
            grid.className = 'large-icon-grid';
            largeIconLinks.forEach(link => {
                const a = document.createElement('a');
                a.className = 'large-icon-item';
                a.href = isEditMode ? '#' : ensureProtocol(link.url);
                a.target = getLinkTarget();
                if (isEditMode) a.addEventListener('click', (e) => e.preventDefault());

                const iconDiv = document.createElement('div');
                iconDiv.className = 'large-icon-img';

                // Use the same icon logic as regular links
                const iconElement = createLinkIcon(link.url, link.useFavicon);
                if (iconElement) {
                    // If it's an img, use it as a background
                    if (iconElement.tagName === 'IMG') {
                        iconDiv.style.backgroundImage = `url('${iconElement.src}')`;
                    } else if (iconElement.style.backgroundImage) {
                        iconDiv.style.backgroundImage = iconElement.style.backgroundImage;
                    }
                }

                const label = document.createElement('span');
                label.className = 'large-icon-label';
                label.textContent = link.name;

                a.appendChild(iconDiv);
                a.appendChild(label);
                grid.appendChild(a);
            });
            body.appendChild(grid);
        }

        // Apply section tint
        if (group.sectionId) {
            const tint = getSectionColor(group.sectionId);
            card.classList.add('section-tinted');
            card.style.setProperty('--section-tint', tint);
            card.dataset.sectionId = group.sectionId;
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

    // Section dropdown
    ensureSections();
    const sectionSelect = document.getElementById('edit-group-section');
    sectionSelect.innerHTML = '<option value="">No Section</option>';
    appData.sections.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        sectionSelect.appendChild(opt);
    });
    sectionSelect.value = group.sectionId || '';

    const container = document.getElementById('group-links-container');
    container.innerHTML = '';

    // Render existing links
    group.links.forEach(link => {
        if (link.type === 'list') {
            // Add List Parent
            addLinkRow(link.name, '', 'list', false, false, link.sectionMode);

            // Add List Children
            if (link.links) {
                link.links.forEach(sub => {
                    addLinkRow(sub.name, sub.url, 'sub-link', sub.useFavicon, sub.largeIcon);
                });
            }
        } else {
            addLinkRow(link.name, link.url, 'link', link.useFavicon, link.largeIcon);
        }
    });

    editGroupModal.classList.remove('hidden');
}

function addLinkRow(name = '', url = '', type = 'link', useFavicon = false, largeIcon = false, sectionMode = false) {
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
    const largeIconActive = largeIcon ? ' favicon-active' : '';
    const largeIconPressed = largeIcon ? 'true' : 'false';
    const faviconBtn = type !== 'list'
        ? `<button type="button" class="icon-btn use-favicon-btn${faviconActive}" title="Use favicon" aria-pressed="${faviconPressed}"><i class="fas fa-image"></i></button>`
        : '';
    const largeIconBtn = type !== 'list'
        ? `<button type="button" class="icon-btn large-icon-btn${largeIconActive}" title="Large icon" aria-pressed="${largeIconPressed}"><i class="fas fa-th-large"></i></button>`
        : '';

    const urlInput = type !== 'list'
        ? `<input type="text" class="link-url" placeholder="${placeholder}" value="${url}">`
        : '';

    const sectionModeActive = sectionMode ? ' favicon-active' : '';
    const sectionModePressed = sectionMode ? 'true' : 'false';
    const sectionModeBtn = type === 'list'
        ? `<button type="button" class="icon-btn section-mode-btn${sectionModeActive}" title="Show as section" aria-pressed="${sectionModePressed}"><i class="fas fa-minus"></i></button>`
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
            ${largeIconBtn}
            ${sectionModeBtn}
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

    const lgIconBtn = div.querySelector('.large-icon-btn');
    if (lgIconBtn) {
        lgIconBtn.addEventListener('click', () => {
            lgIconBtn.classList.toggle('favicon-active');
            lgIconBtn.setAttribute('aria-pressed', lgIconBtn.classList.contains('favicon-active'));
            // Auto-enable favicon when large icon is on
            if (lgIconBtn.classList.contains('favicon-active') && favBtn && !favBtn.classList.contains('favicon-active')) {
                favBtn.classList.add('favicon-active');
                favBtn.setAttribute('aria-pressed', 'true');
            }
        });
    }
    
    const secBtn = div.querySelector('.section-mode-btn');
    if (secBtn) {
        secBtn.addEventListener('click', () => {
            secBtn.classList.toggle('favicon-active');
            secBtn.setAttribute('aria-pressed', secBtn.classList.contains('favicon-active'));
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
            if (brandUrl !== currentGroup.brandUrl || !currentGroup.brandData) {
                if (!BRANDFETCH_API_KEY) {
                    // No API key — save branded flag and URL but skip fetch
                    showToast("Add a Brandfetch API key in Settings → Account to enable brand styling.", "info");
                    brandData = currentGroup.brandData || null;
                } else {
                    try {
                        brandData = await fetchBrandData(brandUrl);
                    } catch (e) {
                        console.error("Failed to fetch brand data", e);
                        showToast("Could not fetch brand data for " + brandUrl, "error");
                        brandData = currentGroup.brandData || null;
                    }
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
            
            // Get favicon and large icon preferences
            const faviconBtnEl = row.querySelector('.use-favicon-btn');
            const useFavicon = faviconBtnEl ? faviconBtnEl.classList.contains('favicon-active') : false;
            const largeIconBtnEl = row.querySelector('.large-icon-btn');
            const largeIcon = largeIconBtnEl ? largeIconBtnEl.classList.contains('favicon-active') : false;

            // Get section mode preference for lists
            const sectionModeBtnEl = row.querySelector('.section-mode-btn');
            const sectionMode = sectionModeBtnEl ? sectionModeBtnEl.classList.contains('favicon-active') : false;

            if (name) {
                if (isList) {
                    // Create new List Object
                    currentListObj = {
                        id: 'l' + Math.random().toString(36).substr(2, 9),
                        name: name,
                        type: 'list',
                        sectionMode: sectionMode,
                        links: []
                    };
                    newLinks.push(currentListObj);
                } else if (isSubLink && currentListObj) {
                    // Add to current list
                    currentListObj.links.push({
                        name: name,
                        url: url,
                        useFavicon: useFavicon,
                        largeIcon: largeIcon
                    });
                } else {
                    // Top level link
                    newLinks.push({
                        id: 'l' + Math.random().toString(36).substr(2, 9),
                        name: name,
                        url: url,
                        useFavicon: useFavicon,
                        largeIcon: largeIcon
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
            appData.groups[groupIndex].sectionId = document.getElementById('edit-group-section').value || null;
            
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

    // Typography selects
    populateFontSelects();
    const typo = appData.typography || {};
    const defaultFont = FONT_OPTIONS[0].value;
    document.getElementById('settings-clock-font').value = typo.clockFont || defaultFont;
    document.getElementById('settings-clock-weight').value = typo.clockWeight || '200';
    document.getElementById('settings-date-font').value = typo.dateFont || defaultFont;
    document.getElementById('settings-date-weight').value = typo.dateWeight || '400';
    document.getElementById('settings-link-font').value = typo.linkFont || defaultFont;
    document.getElementById('settings-link-weight').value = typo.linkWeight || '400';

    // Sections manager
    renderSectionsManager();

    // --- Google Apps tab ---
    const container = document.getElementById('google-apps-toggles');
    if (container) {
        container.innerHTML = '';
        const enabledApps = appData.enabledGoogleApps || [];
        googleAppsConfig.forEach(app => {
            const row = document.createElement('div');
            row.className = 'app-toggle-row';

            // Icon
            const hasCustomIcon = app.iconStyle && app.iconStyle.includes('background-image');
            const icon = document.createElement('span');
            icon.className = 'app-toggle-icon';
            if (hasCustomIcon) {
                icon.style.cssText = app.iconStyle;
            } else {
                // Fallback: first letter
                icon.textContent = app.name.charAt(0);
                icon.classList.add('app-toggle-icon-letter');
            }

            // Name
            const name = document.createElement('span');
            name.className = 'app-toggle-name';
            name.textContent = app.name;

            // Toggle switch
            const toggle = document.createElement('label');
            toggle.className = 'toggle-switch';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = enabledApps.includes(app.name);
            input.value = app.name;
            const slider = document.createElement('span');
            slider.className = 'toggle-slider';
            toggle.appendChild(input);
            toggle.appendChild(slider);

            row.appendChild(icon);
            row.appendChild(name);
            row.appendChild(toggle);
            container.appendChild(row);
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

    // Brandfetch keys
    const bfKeyInput = document.getElementById('settings-brandfetch-key');
    const bfClientInput = document.getElementById('settings-brandfetch-client');
    if (bfKeyInput) bfKeyInput.value = appData.brandfetchApiKey || '';
    if (bfClientInput) bfClientInput.value = appData.brandfetchClientId || '';

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

    // New section — show inline input
    const newSectionBtn = document.getElementById('new-section-btn');
    const newSectionRow = document.getElementById('new-section-input-row');
    const newSectionInput = document.getElementById('new-section-name');
    const confirmNewSection = document.getElementById('confirm-new-section');
    const cancelNewSection = document.getElementById('cancel-new-section');

    newSectionBtn.addEventListener('click', () => {
        newSectionRow.style.display = 'flex';
        newSectionInput.value = '';
        newSectionInput.focus();
    });

    cancelNewSection.addEventListener('click', () => {
        newSectionRow.style.display = 'none';
    });

    const addNewSection = () => {
        const name = newSectionInput.value.trim();
        if (!name) return;
        ensureSections();
        const id = 's' + Date.now();
        const colorIdx = appData.sections.length % SECTION_COLORS.length;
        appData.sections.push({ id, name, color: SECTION_COLORS[colorIdx] });
        const sectionSelect = document.getElementById('edit-group-section');
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = name;
        sectionSelect.appendChild(opt);
        sectionSelect.value = id;
        newSectionRow.style.display = 'none';
    };

    confirmNewSection.addEventListener('click', addNewSection);
    newSectionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addNewSection(); }
        if (e.key === 'Escape') { newSectionRow.style.display = 'none'; }
    });
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

    // Add section from settings
    document.getElementById('add-section-settings-btn').addEventListener('click', () => {
        ensureSections();
        const id = 's' + Date.now();
        const colorIdx = appData.sections.length % SECTION_COLORS.length;
        appData.sections.push({ id, name: 'New Section', color: SECTION_COLORS[colorIdx] });
        renderSectionsManager();
        // Focus the new name input
        const rows = document.querySelectorAll('.section-manager-row');
        const lastRow = rows[rows.length - 1];
        if (lastRow) {
            const nameInput = lastRow.querySelector('input[type="text"]');
            if (nameInput) { nameInput.focus(); nameInput.select(); }
        }
    });

    document.getElementById('close-settings').addEventListener('click', closeSettingsModal);
    // Export JSON — download as file
    document.getElementById('export-json-btn').addEventListener('click', () => {
        const textarea = document.getElementById('config-json');
        const blob = new Blob([textarea.value], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'start-page-data.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast("JSON exported", "success");
    });

    // Import JSON — load from file
    const importFileInput = document.getElementById('import-json-file');
    document.getElementById('import-json-btn').addEventListener('click', () => {
        importFileInput.click();
    });
    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsed = JSON.parse(evt.target.result);
                document.getElementById('config-json').value = JSON.stringify(parsed, null, 2);
                showToast("JSON imported — click Save to apply", "success");
            } catch (err) {
                showToast("Invalid JSON file", "error");
            }
        };
        reader.readAsText(file);
        importFileInput.value = ''; // reset so same file can be re-imported
    });

    document.getElementById('save-settings').addEventListener('click', () => {
        try {
            // Preserve sections before JSON overwrite (they're edited live in memory)
            const currentSections = appData.sections ? [...appData.sections] : [];

            // Save JSON Config
            const newData = JSON.parse(document.getElementById('config-json').value);
            if (newData.authConfig) delete newData.authConfig;
            appData = newData;

            // Restore sections (settings manager edits take priority over JSON textarea)
            appData.sections = currentSections;

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

            // Save typography
            appData.typography = {
                clockFont: document.getElementById('settings-clock-font').value,
                clockWeight: document.getElementById('settings-clock-weight').value,
                dateFont: document.getElementById('settings-date-font').value,
                dateWeight: document.getElementById('settings-date-weight').value,
                linkFont: document.getElementById('settings-link-font').value,
                linkWeight: document.getElementById('settings-link-weight').value,
            };

            // Save Brandfetch keys
            const bfKey = document.getElementById('settings-brandfetch-key').value.trim();
            const bfClient = document.getElementById('settings-brandfetch-client').value.trim();
            if (bfKey) {
                appData.brandfetchApiKey = bfKey;
                BRANDFETCH_API_KEY = bfKey;
            } else {
                delete appData.brandfetchApiKey;
                BRANDFETCH_API_KEY = '';
            }
            if (bfClient) {
                appData.brandfetchClientId = bfClient;
                BRANDFETCH_CLIENT_ID = bfClient;
            } else {
                delete appData.brandfetchClientId;
                BRANDFETCH_CLIENT_ID = '';
            }

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

// Search handling with autocomplete
const searchInput = document.getElementById('search-input');
const searchDropdown = document.getElementById('search-dropdown');
let searchDebounceTimer = null;
let activeSearchIndex = -1;

function searchLinks(query) {
    if (!query || !appData.groups) return [];
    const q = query.toLowerCase();
    const results = [];
    appData.groups.forEach(group => {
        if (!group.links) return;
        const groupMatch = group.title && group.title.toLowerCase().includes(q);
        group.links.forEach(link => {
            if (link.type === 'list' && link.links) {
                link.links.forEach(sub => {
                    if (groupMatch ||
                        (sub.name && sub.name.toLowerCase().includes(q)) ||
                        (sub.url && sub.url.toLowerCase().includes(q))) {
                        results.push({ name: sub.name, url: sub.url, group: group.title });
                    }
                });
            } else if (groupMatch ||
                       (link.name && link.name.toLowerCase().includes(q)) ||
                       (link.url && link.url.toLowerCase().includes(q))) {
                results.push({ name: link.name, url: link.url, group: group.title });
            }
        });
    });
    return results.slice(0, 5);
}

async function fetchSuggestions(query) {
    if (!query) return [];
    try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);
        if (res.ok) return await res.json();
    } catch (e) {}
    return [];
}

function renderSearchDropdown(linkResults, suggestions, query) {
    if (!searchDropdown) return;
    if (!linkResults.length && !suggestions.length) {
        searchDropdown.classList.add('hidden');
        return;
    }

    let html = '';
    activeSearchIndex = -1;

    if (linkResults.length) {
        html += '<div class="search-dropdown-section">Your Links</div>';
        linkResults.forEach((link, i) => {
            const domain = getDomain(link.url);
            const favicon = domain ? `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" alt="">` : '<i class="fas fa-link"></i>';
            html += `<div class="search-dropdown-item" data-index="${i}" data-type="link" data-url="${link.url}">
                <span class="search-item-icon">${favicon}</span>
                <span class="search-item-text">${link.name}</span>
                <span class="search-item-group">${link.group}</span>
            </div>`;
        });
    }

    if (suggestions.length) {
        if (linkResults.length) html += '<div class="search-dropdown-divider"></div>';
        html += '<div class="search-dropdown-section">Google</div>';
        suggestions.forEach((s, i) => {
            const idx = linkResults.length + i;
            html += `<div class="search-dropdown-item" data-index="${idx}" data-type="google" data-query="${s}">
                <span class="search-item-icon"><i class="fas fa-search"></i></span>
                <span class="search-item-text">${s}</span>
            </div>`;
        });
    }

    searchDropdown.innerHTML = html;
    searchDropdown.classList.remove('hidden');

    // Click handlers
    searchDropdown.querySelectorAll('.search-dropdown-item').forEach(item => {
        item.addEventListener('click', () => selectSearchItem(item));
    });
}

function selectSearchItem(item) {
    const type = item.dataset.type;
    const target = getLinkTarget();
    if (type === 'link') {
        window.open(ensureProtocol(item.dataset.url), target);
    } else {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(item.dataset.query)}`, target);
    }
    searchInput.value = '';
    searchDropdown.classList.add('hidden');
}

function updateSearchHighlight() {
    const items = searchDropdown.querySelectorAll('.search-dropdown-item');
    items.forEach((el, i) => {
        el.classList.toggle('active', i === activeSearchIndex);
    });
    if (activeSearchIndex >= 0 && items[activeSearchIndex]) {
        items[activeSearchIndex].scrollIntoView({ block: 'nearest' });
    }
}

if (searchInput) {
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        clearTimeout(searchDebounceTimer);

        if (!query) {
            searchDropdown.classList.add('hidden');
            return;
        }

        // Show link results immediately
        const linkResults = searchLinks(query);
        renderSearchDropdown(linkResults, [], query);

        // Fetch Google suggestions with debounce
        searchDebounceTimer = setTimeout(async () => {
            const suggestions = await fetchSuggestions(query);
            const freshLinkResults = searchLinks(searchInput.value.trim());
            renderSearchDropdown(freshLinkResults, suggestions, searchInput.value.trim());
        }, 200);
    });

    searchInput.addEventListener('keydown', (e) => {
        const items = searchDropdown.querySelectorAll('.search-dropdown-item');
        const isOpen = !searchDropdown.classList.contains('hidden') && items.length > 0;

        if (e.key === 'ArrowDown' && isOpen) {
            e.preventDefault();
            activeSearchIndex = Math.min(activeSearchIndex + 1, items.length - 1);
            updateSearchHighlight();
        } else if (e.key === 'ArrowUp' && isOpen) {
            e.preventDefault();
            activeSearchIndex = Math.max(activeSearchIndex - 1, -1);
            updateSearchHighlight();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeSearchIndex >= 0 && items[activeSearchIndex]) {
                selectSearchItem(items[activeSearchIndex]);
            } else {
                const query = searchInput.value.trim();
                if (query) {
                    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, getLinkTarget());
                    searchInput.value = '';
                    searchDropdown.classList.add('hidden');
                }
            }
        } else if (e.key === 'Escape') {
            searchDropdown.classList.add('hidden');
            activeSearchIndex = -1;
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar-wrapper')) {
            searchDropdown.classList.add('hidden');
        }
    });
}

// Start
init();
