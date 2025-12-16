// Game State
let players = [];
let currentPlayerIndex = 0;

let impostorIndices = [];
let impostorCount = 1;
let currentWordObj = null;
let usedWordIndices = [];
let lastStartingPlayer = null;

// DOM Elements
const screens = {
    setup: document.getElementById('setup-screen'),
    turn: document.getElementById('game-turn-screen'),
    final: document.getElementById('final-screen')
};

const playerNameInput = document.getElementById('player-name');
const addPlayerBtn = document.getElementById('add-player-btn');
const playerList = document.getElementById('player-list');
const startGameBtn = document.getElementById('start-game-btn');
const impostorCountSelect = document.getElementById('impostor-count');

const prevTurnBtn = document.getElementById('prev-turn-btn');

// Turn Screen Elements
const turnPlayerName = document.getElementById('turn-player-name');
const swipeCard = document.getElementById('swipe-card');
const swipeHandleArea = document.querySelector('.swipe-handle-area');
const cardNextBtn = document.getElementById('card-next-btn');
const safeNextBtn = document.getElementById('safe-next-btn');

// Role Content Elements (Inside Card)
const roleTitle = document.getElementById('role-title');
const secretValue = document.getElementById('secret-value');
const roleInstruction = document.getElementById('role-instruction');

// Final Screen Elements
const finalTitle = document.getElementById('final-title');
const finalSubtitle = document.getElementById('final-subtitle');
const resultArea = document.getElementById('result-area');
const revealStarterBtn = null; // Removed from DOM
const backToSetupBtn = document.getElementById('back-to-setup-btn');

// Event Listeners
addPlayerBtn.addEventListener('click', addPlayer);
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPlayer();
});

startGameBtn.addEventListener('click', startGame);

// Removed newGameBtn listener as the button no longer exists in HTML

impostorCountSelect.addEventListener('change', (e) => {
    impostorCount = parseInt(e.target.value);
    updateStartButton();
});

// Turn Navigation
cardNextBtn.addEventListener('click', nextTurn);
safeNextBtn.addEventListener('click', nextTurn);
prevTurnBtn.addEventListener('click', prevTurn);

// Final Screen Buttons
backToSetupBtn.addEventListener('click', resetGame);

// Swipe Logic (Keep existing touch/click logic...) 
// ... [Lines 64-129 unchanged in logic, assuming no changes needed here] ...

// [Skipping unchanged swipe logic manually in replace block not possible, 
// so will target only top variable declarations and bottom function logic]

// ... logic ...



// Swipe Logic
let startY = 0;
let currentY = 0;
let isDragging = false;
let isExpanded = false;

// Touch Events
swipeCard.addEventListener('touchstart', (e) => {
    // START touching: Allow drag regardless of state
    startY = e.touches[0].clientY;
    isDragging = true;
    swipeCard.style.transition = 'none'; // Disable transition for direct follow
}, { passive: false });

swipeCard.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scrolling
    currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    if (!isExpanded) {
        // Closed state: Drag UP (negative diff)
        if (diff < 0) {
            const constrainedDiff = Math.max(diff, -window.innerHeight * 0.7);
            swipeCard.style.transform = `translateY(calc(100% - 100px + ${constrainedDiff}px))`;
        }
    } else {
        // Expanded state: Drag DOWN (positive diff)
        if (diff > 0) {
            swipeCard.style.transform = `translateY(${diff}px)`;
        }
    }
}, { passive: false });

swipeCard.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    swipeCard.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';

    const diff = currentY - startY;

    if (!isExpanded) {
        // Was closed, check if dragged UP enough
        if (diff < -60) {
            expandCard();
        } else {
            collapseCard();
        }
    } else {
        // Was open, check if dragged DOWN enough
        if (diff > 60) {
            collapseCard();
        } else {
            expandCard();
        }
    }
});

// Click fallback
swipeHandleArea.addEventListener('click', () => {
    if (!isExpanded) {
        expandCard();
    } else {
        collapseCard();
    }
});

// Functions

function switchScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    screens[screenName].classList.add('active');
}

function expandCard() {
    isExpanded = true;
    swipeCard.classList.add('expanded');
    swipeCard.style.transform = '';

    // Populate role data just before visual reveal implies 'seen'
    revealRole();

    // Logic for showing safe button moved to always be visible
}

function collapseCard() {
    isExpanded = false;
    swipeCard.classList.remove('expanded');
    swipeCard.style.transform = '';

    // Do NOT hide the safe button again when collapsing
    // This allows the "Next Player" button to remain visible 
    // after the user has seen their role and closed the card.
    /*
    if (safeNextBtn) {
        safeNextBtn.style.opacity = '0';
        safeNextBtn.style.pointerEvents = 'none';
        setTimeout(() => {
            if (!isExpanded) safeNextBtn.style.display = 'none';
        }, 300); // Wait for fade out
    }
    */
}

function addPlayer() {
    const name = playerNameInput.value.trim();
    if (name) {
        if (players.some(p => p.toLowerCase() === name.toLowerCase())) {
            alert('¡Ese nombre ya está en uso! Elige otro.');
            playerNameInput.focus();
            return;
        }
        players.push(name);
        renderPlayerList();
        playerNameInput.value = '';
        playerNameInput.focus();
        updateStartButton();
    }
}

function removePlayer(index) {
    players.splice(index, 1);
    renderPlayerList();
    updateStartButton();
}

function renderPlayerList() {
    playerList.innerHTML = '';
    players.forEach((player, index) => {
        const li = document.createElement('li');
        li.className = 'player-item';
        li.innerHTML = `
            <span>${player}</span>
            <button class="delete-btn">×</button>
        `;
        playerList.appendChild(li);
    });
}

// Event delegation for delete buttons
playerList.addEventListener('click', (e) => {
    let target = e.target;
    // Handle click on text node (the 'x' char)
    if (target.nodeType === 3) {
        target = target.parentNode;
    }

    const btn = target.closest('.delete-btn');

    if (btn) {
        const li = btn.closest('li');
        const index = Array.from(playerList.children).indexOf(li);
        removePlayer(index);
    }
});

function updateStartButton() {
    const minPlayers = impostorCount + 2;
    startGameBtn.disabled = players.length < minPlayers;
    startGameBtn.textContent = players.length < minPlayers ? `Mínimo ${minPlayers} jugadores (${players.length}/${minPlayers})` : 'Comenzar Partida';
}

function startGame() {
    const minPlayers = impostorCount + 2;
    if (players.length < minPlayers) return;

    // Shuffle players
    for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
    }
    renderPlayerList();

    currentPlayerIndex = 0;

    // Word selection
    if (usedWordIndices.length === gameData.length) {
        usedWordIndices = [];
    }

    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * gameData.length);
    } while (usedWordIndices.includes(randomIndex));

    usedWordIndices.push(randomIndex);
    currentWordObj = gameData[randomIndex];

    // Impostor selection
    impostorIndices = [];
    while (impostorIndices.length < impostorCount) {
        const rIndex = Math.floor(Math.random() * players.length);
        if (!impostorIndices.includes(rIndex)) {
            impostorIndices.push(rIndex);
        }
    }

    startTurn();
}


function startTurn() {
    // 1. Switch Screen
    switchScreen('turn');

    // 2. Set Player Name IMMEDIATELLY
    if (players[currentPlayerIndex]) {
        turnPlayerName.textContent = players[currentPlayerIndex];
    } else {
        turnPlayerName.textContent = "Jugador " + (currentPlayerIndex + 1);
    }

    // 3. Back Button Logic
    if (currentPlayerIndex > 0) {
        prevTurnBtn.style.display = 'block';
    } else {
        prevTurnBtn.style.display = 'none';
    }

    // 4. Reset Card State
    if (typeof collapseCard === 'function') collapseCard();

    if (swipeCard) {
        swipeCard.classList.remove('impostor-mode');
    }

    // 5. Reset Safe Button (Always Visible now)
    if (safeNextBtn) {
        safeNextBtn.style.display = 'block';
        safeNextBtn.style.opacity = '1';
        safeNextBtn.style.pointerEvents = 'all';
    }
}

function prevTurn() {
    if (currentPlayerIndex > 0) {
        currentPlayerIndex--;
        startTurn();
    }
}


function revealRole() {
    const isImpostor = impostorIndices.includes(currentPlayerIndex);

    // Clear previous specific styling
    swipeCard.classList.remove('impostor-mode');

    if (isImpostor) {
        swipeCard.classList.add('impostor-mode');
        roleTitle.textContent = "¡ERES EL IMPOSTOR!";
        secretValue.textContent = currentWordObj.hint; // Pista
        roleInstruction.textContent = "Esta es tu PISTA. Disimula.";
    } else {
        roleTitle.textContent = "Tu PALABRA:";
        secretValue.textContent = currentWordObj.word;
        roleInstruction.textContent = "Memorízala y no dejes que nadie más la vea.";
    }
}

function nextTurn() {
    currentPlayerIndex++;
    if (currentPlayerIndex < players.length) {
        startTurn();
    } else {
        finishGame();
    }
}

function finishGame() {
    switchScreen('final');

    // Logic merged from revealStarter
    let startingPlayerIndex;
    let startingPlayer;

    if (players.length > 1 && lastStartingPlayer) {
        do {
            startingPlayerIndex = Math.floor(Math.random() * players.length);
            startingPlayer = players[startingPlayerIndex];
        } while (startingPlayer === lastStartingPlayer);
    } else {
        startingPlayerIndex = Math.floor(Math.random() * players.length);
        startingPlayer = players[startingPlayerIndex];
    }

    lastStartingPlayer = startingPlayer;

    // Show result immediately
    document.getElementById('starting-player').textContent = startingPlayer;
}

function resetGame() {
    switchScreen('setup');
}
