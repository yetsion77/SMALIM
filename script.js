import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, get, set, push, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAV5Egl-z0O_rLDqSq5iMPlwyGhN5o2WP0",
    authDomain: "ishh-cc6f3.firebaseapp.com",
    databaseURL: "https://ishh-cc6f3-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "ishh-cc6f3",
    storageBucket: "ishh-cc6f3.firebasestorage.app",
    messagingSenderId: "714204657852",
    appId: "1:714204657852:web:7083146262bb154969f8b9",
    measurementId: "G-56SGQ44SXV"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Game Data structure - Add actual files to the images/ folder!
const unitsData = [
    { id: '188', name: '188', image: '188.PNG' },
    { id: '401', name: '401', image: '401.png' },
    { id: 'modiin', name: 'אגף המודיעין', image: 'אגף המודיעין.png' },
    { id: 'tikshuv', name: 'אגף התקשוב', image: 'אגף התקשוב.png' },
    { id: 'alexandroni', name: 'אלכסנדרוני', image: 'אלכסנדרוני.png' },
    { id: 'bahad1', name: 'בהד 1', image: 'בהד 1.png' },
    { id: 'givati', name: 'גבעתי', image: 'גבעתי.png' },
    { id: 'golani', name: 'גולני', image: 'גולני.png' },
    { id: 'handasa', name: 'הנדסה קרבית', image: 'הנדסה קרבית.png' },
    { id: 'kommando', name: 'קומנדו', image: 'הקומנדו.png' },
    { id: 'hinuch', name: 'חיל החינוך', image: 'חיל החינוך.png' },
    { id: 'refua', name: 'חיל הרפואה', image: 'חיל הרפואה.png' },
    { id: 'hashmonaim', name: 'חשמונאים', image: 'חשמונאים.jpg' },
    { id: 'kfir', name: 'כפיר', image: 'כפיר.png' },
    { id: 'mishtara', name: 'משטרה צבאית', image: 'משטרה צבאית.png' },
    { id: 'nahal', name: 'נחל', image: 'נחל.png' },
    { id: 'tzanhanim', name: 'צנחנים', image: 'צנחנים.png' },
    { id: 'rochev', name: 'רוכב שמיים', image: 'רוכב שמיים.png' },
    { id: 'refaim', name: 'רפאים', image: 'רפאים.png' },
    { id: 'yoav', name: 'מגיני יואב', image: 'מגיני יואב.png' },
    { id: '669', name: '669', image: '669.png' },
    { id: 'egoz', name: 'אגוז', image: 'אגוז.png' },
    { id: 'duvdevan', name: 'דובדבן', image: 'דובדבן.png' },
    { id: 'yahalom', name: 'יהלום', image: 'יהלום.png' },
    { id: 'maglan', name: 'מגלן', image: 'מגלן.png' },
    { id: 'sayeret-golani', name: 'סיירת גולני', image: 'סיירת גולני.jpg' },
    { id: 'sayeret-matkal', name: 'סיירת מטכל', image: 'סיירת מטכל.gif' },
    { id: 'sayeret-tzanhanim', name: 'סיירת צנחנים', image: 'סיירת צנחנים.png' },
    { id: 'shayetet-13', name: 'שייטת 13', image: 'שייטת 13.gif' },
    { id: 'shaldag', name: 'שלדג', image: 'שלדג.gif' }
];

// Game State
let timeLeft = 90;
let timerInterval;
let score = 0;
let currentUnitIndex = 0;
let currentWord = "";
let availableUnits = [];
let topScoresCache = [];

// Elements
const screens = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    end: document.getElementById('end-screen')
};

const UI = {
    startBtn: document.getElementById('start-btn'),
    skipBtn: document.getElementById('skip-btn'),
    restartBtn: document.getElementById('restart-btn'),
    submitScoreBtn: document.getElementById('submit-score-btn'),
    timeLeft: document.getElementById('time-left'),
    currentScore: document.getElementById('current-score'),
    unitImage: document.getElementById('unit-image'),
    boxesContainer: document.getElementById('boxes-container'),
    imageCard: document.getElementById('image-card'),
    finalScore: document.getElementById('final-score'),
    startLeaderboard: document.getElementById('start-leaderboard'),
    endLeaderboard: document.getElementById('end-leaderboard'),
    newHSSection: document.getElementById('new-highscore-section'),
    endHSSection: document.getElementById('end-leaderboard-section'),
    playerNameInput: document.getElementById('player-name-input'),
    hiddenInput: document.getElementById('hidden-input')
};

let currentWordBoxes = [];

// Track clicks on game screen to keep the hidden input focused
screens.game.addEventListener('click', () => {
    if (screens.game.classList.contains('active')) {
        UI.hiddenInput.focus();
    }
});


// --- Leaderboard Logic ---
async function fetchLeaderboard() {
    try {
        const scoresRef = query(ref(db, 'leaderboard'), orderByChild('score'), limitToLast(10));
        const snapshot = await get(scoresRef);
        let scoresArray = [];

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                scoresArray.push(childSnapshot.val());
            });
            // Reverse because orderByChild goes ascending
            scoresArray.reverse();
        }

        topScoresCache = scoresArray;
        renderLeaderboard(UI.startLeaderboard, scoresArray);
    } catch (error) {
        console.error("Error fetching leaderboard from Firebase:", error);
        // Fallback to local storage if Firebase fails (e.g., rules expired)
        const localScores = JSON.parse(localStorage.getItem('smalim_leaderboard')) || [];
        topScoresCache = localScores;
        renderLeaderboard(UI.startLeaderboard, localScores);
    }
}

function renderLeaderboard(listElement, scores) {
    listElement.innerHTML = '';
    if (scores.length === 0) {
        listElement.innerHTML = "<li>אין עדיין אלופים. היו הראשונים!</li>";
        return;
    }

    scores.forEach((s, index) => {
        const li = document.createElement('li');
        // Prevent simple XSS
        const safeName = s.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        li.innerHTML = `<div><span class="rank">#${index + 1}</span> ${safeName}</div><span class="score">${s.score} נ"ק</span>`;
        listElement.appendChild(li);
    });
}

async function handleHighscore() {
    const isTop10 = topScoresCache.length < 10 || score > (topScoresCache.length > 0 ? topScoresCache[topScoresCache.length - 1].score : 0);

    if (isTop10 && score > 0) {
        UI.newHSSection.classList.remove('hidden');
        UI.endHSSection.classList.add('hidden');
    } else {
        UI.newHSSection.classList.add('hidden');
        UI.endHSSection.classList.remove('hidden');
        renderLeaderboard(UI.endLeaderboard, topScoresCache);
    }
}

UI.submitScoreBtn.addEventListener('click', async () => {
    const name = UI.playerNameInput.value.trim() || 'שחקן אנונימי';
    UI.submitScoreBtn.disabled = true;
    UI.submitScoreBtn.innerText = "שומר...";

    try {
        const lbRef = ref(db, 'leaderboard');
        const newScoreRef = push(lbRef);
        await set(newScoreRef, {
            name: name,
            score: score,
            timestamp: Date.now()
        });

        // Refresh cache
        await fetchLeaderboard();

        UI.newHSSection.classList.add('hidden');
        UI.endHSSection.classList.remove('hidden');
        renderLeaderboard(UI.endLeaderboard, topScoresCache);
    } catch (error) {
        console.error("Error saving score to Firebase:", error);
        // Fallback to local storage
        const localScores = JSON.parse(localStorage.getItem('smalim_leaderboard')) || [];
        localScores.push({ name, score, timestamp: Date.now() });
        localScores.sort((a, b) => b.score - a.score);
        const top10 = localScores.slice(0, 10);
        localStorage.setItem('smalim_leaderboard', JSON.stringify(top10));
        
        topScoresCache = top10;
        
        UI.newHSSection.classList.add('hidden');
        UI.endHSSection.classList.remove('hidden');
        renderLeaderboard(UI.endLeaderboard, topScoresCache);
    }
});

// --- Game Logic ---
function switchScreen(screenId) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenId].classList.add('active');
}

function startGame() {
    timeLeft = 90;
    score = 0;
    availableUnits = [...unitsData].sort(() => Math.random() - 0.5); // Shuffle

    UI.timeLeft.innerText = timeLeft;
    UI.timeLeft.parentElement.classList.remove('warning');
    UI.currentScore.innerText = score;

    switchScreen('game');
    loadNextUnit();

    // Ensure hidden input is focused when game starts
    setTimeout(() => UI.hiddenInput.focus(), 100);

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function updateTimerDisplay() {
    UI.timeLeft.innerText = timeLeft;
    if (timeLeft <= 10) {
        UI.timeLeft.parentElement.classList.add('warning');
    } else {
        UI.timeLeft.parentElement.classList.remove('warning');
    }
}

function loadNextUnit() {
    if (availableUnits.length === 0) {
        // Refill if they finished all
        availableUnits = [...unitsData].sort(() => Math.random() - 0.5);
    }

    const unit = availableUnits.pop();
    currentWord = unit.name;

    // Animation reset
    UI.imageCard.classList.remove('bounce-in');
    void UI.imageCard.offsetWidth; // trigger reflow
    UI.imageCard.classList.add('bounce-in');

    UI.unitImage.src = unit.image;
    createInputBoxes(currentWord);
}

function createInputBoxes(word) {
    UI.boxesContainer.innerHTML = '';
    currentWordBoxes = [];
    
    // Setup hidden input
    UI.hiddenInput.value = '';
    const cleanWord = word.replace(/ /g, '');
    UI.hiddenInput.maxLength = cleanWord.length;

    const words = word.split(' ');
    
    words.forEach((w, wIndex) => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'word-group';
        
        for (let i = 0; i < w.length; i++) {
            const box = document.createElement('div');
            box.className = "box";
            box.dataset.char = w[i];
            
            wordDiv.appendChild(box);
            currentWordBoxes.push(box);
        }
        
        UI.boxesContainer.appendChild(wordDiv);
        
        // Add a visual space between words, but not an input box
        if (wIndex < words.length - 1) {
            const spaceBox = document.createElement('div');
            spaceBox.className = "box spacer";
            UI.boxesContainer.appendChild(spaceBox);
        }
    });

    // Make sure we are focused and synced visually
    UI.hiddenInput.focus();
    syncBoxesWithInput(UI.hiddenInput.value);
}

UI.hiddenInput.addEventListener('input', (e) => {
    let rawVal = UI.hiddenInput.value;
    // Keep only Hebrew letters, quotes, digits, and hyphens. NO spaces.
    let val = rawVal.replace(/[^א-ת0-9"'\-]/g, '');
    
    if (rawVal !== val) {
        UI.hiddenInput.value = val;
    }
    
    syncBoxesWithInput(val);
});

function syncBoxesWithInput(val) {
    // Fill text and update focus styles
    for (let i = 0; i < currentWordBoxes.length; i++) {
        const box = currentWordBoxes[i];
        if (i < val.length) {
            box.innerText = val[i];
            box.classList.remove('focused');
        } else {
            box.innerText = '';
            box.classList.remove('focused');
        }
    }
    
    // Add focus styling to the current empty box
    if (val.length < currentWordBoxes.length) {
        currentWordBoxes[val.length].classList.add('focused');
    }
    
    // If input is complete, check it
    if (val.length === currentWordBoxes.length) {
        checkWord();
    }
}

function checkWord() {
    const val = UI.hiddenInput.value;
    const cleanCurrentWord = currentWord.replace(/ /g, '');

    if (val === cleanCurrentWord) {
        // Correct
        currentWordBoxes.forEach(b => b.classList.add('correct'));
        score++;
        UI.currentScore.innerText = score;

        setTimeout(() => {
            loadNextUnit();
        }, 800);
    } else {
        // Incorrect
        currentWordBoxes.forEach(b => {
            b.classList.remove('error');
            void b.offsetWidth;
            b.classList.add('error');
        });
    }
}

function endGame() {
    clearInterval(timerInterval);
    timeLeft = 0;
    updateTimerDisplay();

    UI.finalScore.innerText = score;
    UI.playerNameInput.value = '';
    UI.submitScoreBtn.disabled = false;
    UI.submitScoreBtn.innerText = "שמור שיא";

    switchScreen('end');
    handleHighscore();
}

// Events
UI.startBtn.addEventListener('click', startGame);
UI.restartBtn.addEventListener('click', startGame);
UI.skipBtn.addEventListener('click', () => {
    timeLeft -= 5;
    if (timeLeft <= 0) {
        endGame();
    } else {
        updateTimerDisplay();
        loadNextUnit();
    }
});

// Initialization
fetchLeaderboard();
