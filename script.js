// Initialize data
let appData = JSON.parse(localStorage.getItem('startPageData')) || defaultData;

// Elements
const gridContainer = document.getElementById('grid-container');
const clockEl = document.getElementById('clock');
const weatherEl = document.getElementById('weather');
const editModeBtn = document.getElementById('edit-mode-btn');
const settingsBtn = document.getElementById('settings-btn');
const body = document.body;

// Modals
const addGroupModal = document.getElementById('add-group-modal');
const editGroupModal = document.getElementById('edit-group-modal');
const settingsModal = document.getElementById('settings-modal');

// State
let isEditMode = false;
let currentEditGroupId = null;

// --- Initialization ---
function init() {
    renderGrid();
    startClock();
    fetchWeather();
    setupEventListeners();
}

// --- Rendering ---
function renderGrid() {
    gridContainer.innerHTML = '';
    
    appData.groups.forEach(group => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.groupId = group.id;

        const header = document.createElement('div');
        header.className = 'card-header';
        header.innerHTML = `
            <span class="group-title">${group.title}</span>
            <div class="header-actions">
                <i class="fas fa-pen header-btn edit-group-btn" title="Edit Group"></i>
            </div>
        `;
        
        // Edit Group Handler
        header.querySelector('.edit-group-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openEditGroupModal(group.id);
        });

        const body = document.createElement('div');
        body.className = 'card-body';

        if (group.links) {
            group.links.forEach(link => {
                const a = document.createElement('a');
                a.className = 'link-item';
                a.href = isEditMode ? '#' : link.url;
                a.textContent = link.name;
                a.target = "_blank"; // Open in new tab by default
                
                if (isEditMode) {
                    a.addEventListener('click', (e) => e.preventDefault());
                }

                body.appendChild(a);
            });
        }

        card.appendChild(header);
        card.appendChild(body);
        gridContainer.appendChild(card);
    });

    // Add Group Card (Visible in Edit Mode)
    const addGroupCard = document.createElement('div');
    addGroupCard.className = 'card add-group-card';
    addGroupCard.innerHTML = '<i class="fas fa-plus"></i>';
    addGroupCard.addEventListener('click', () => {
        openAddGroupModal();
    });
    gridContainer.appendChild(addGroupCard);
}

// --- Logic ---

function saveData() {
    localStorage.setItem('startPageData', JSON.stringify(appData));
    renderGrid();
}

function toggleEditMode() {
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
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        clockEl.textContent += ` | ${dateStr}`;
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
        weatherEl.textContent = `${Math.round(data.current_weather.temperature)}°F`;
    } catch (e) {
        weatherEl.textContent = "Weather Unavailable";
    }
}

// --- CRUD Operations ---

function deleteGroup(groupId) {
    appData.groups = appData.groups.filter(g => g.id !== groupId);
    saveData();
}

function addGroup(title) {
    const newGroup = {
        id: 'g' + Date.now(),
        title: title,
        links: []
    };
    appData.groups.push(newGroup);
    saveData();
}

// --- Modal Handlers ---

// Edit Group Modal
function openEditGroupModal(groupId) {
    currentEditGroupId = groupId;
    const group = appData.groups.find(g => g.id === groupId);
    if (!group) return;

    document.getElementById('edit-group-title').value = group.title;
    const container = document.getElementById('group-links-container');
    container.innerHTML = '';

    // Render existing links
    group.links.forEach(link => {
        addLinkRow(link.name, link.url);
    });

    editGroupModal.classList.remove('hidden');
}

function addLinkRow(name = '', url = '') {
    const container = document.getElementById('group-links-container');
    const div = document.createElement('div');
    div.className = 'link-edit-row';
    div.innerHTML = `
        <i class="fas fa-grip-vertical" style="color:#ccc; cursor:move"></i>
        <input type="text" class="link-name" placeholder="Name" value="${name}">
        <input type="text" class="link-url" placeholder="URL" value="${url}">
        <i class="fas fa-trash remove-link-btn"></i>
    `;
    
    div.querySelector('.remove-link-btn').addEventListener('click', () => {
        div.remove();
    });

    container.appendChild(div);
}

function closeEditGroupModal() {
    editGroupModal.classList.add('hidden');
    currentEditGroupId = null;
}

function saveGroupEdit() {
    const title = document.getElementById('edit-group-title').value;
    if (!title) {
        alert("Group title is required");
        return;
    }

    const rows = document.querySelectorAll('.link-edit-row');
    const newLinks = [];
    
    rows.forEach(row => {
        const name = row.querySelector('.link-name').value;
        const url = row.querySelector('.link-url').value;
        if (name && url) {
            newLinks.push({
                id: 'l' + Math.random().toString(36).substr(2, 9), // Simple unique ID
                name,
                url
            });
        }
    });

    const groupIndex = appData.groups.findIndex(g => g.id === currentEditGroupId);
    if (groupIndex !== -1) {
        appData.groups[groupIndex].title = title;
        appData.groups[groupIndex].links = newLinks;
        saveData();
    }
    closeEditGroupModal();
}

// Add Group Modal
function openAddGroupModal() {
    document.getElementById('new-group-name').value = '';
    addGroupModal.classList.remove('hidden');
}

function closeAddGroupModal() {
    addGroupModal.classList.add('hidden');
}

// Settings Modal
function openSettingsModal() {
    document.getElementById('config-json').value = JSON.stringify(appData, null, 2);
    settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
    settingsModal.classList.add('hidden');
}

// --- Event Listeners ---

function setupEventListeners() {
    editModeBtn.addEventListener('click', toggleEditMode);
    settingsBtn.addEventListener('click', openSettingsModal);

    // Group Edit Modal
    document.getElementById('cancel-group-edit').addEventListener('click', closeEditGroupModal);
    document.getElementById('save-group-edit').addEventListener('click', saveGroupEdit);
    document.getElementById('add-link-row-btn').addEventListener('click', () => addLinkRow());
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

    // Settings Modal
    document.getElementById('close-settings').addEventListener('click', closeSettingsModal);
    document.getElementById('save-settings').addEventListener('click', () => {
        try {
            const newData = JSON.parse(document.getElementById('config-json').value);
            appData = newData;
            saveData();
            closeSettingsModal();
        } catch (e) {
            alert('Invalid JSON');
        }
    });
    document.getElementById('reset-defaults').addEventListener('click', () => {
        if (confirm('Reset to default data?')) {
            appData = defaultData;
            saveData();
            closeSettingsModal();
        }
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === editGroupModal) closeEditGroupModal();
        if (e.target === addGroupModal) closeAddGroupModal();
        if (e.target === settingsModal) closeSettingsModal();
    });
}

// Start
init();
