const Game = {
    state: {
        username: null,
        level: { add: 1, sub: 1, mul: 1, div: 1 },
        xp: 0,
        score: 0,
        currentOperation: null,
        currentQuestion: null,
        isProcessing: false,
        tutorialStep: 0
    },

    config: {
        xpPerCorrect: 10,
        xpToLevelUp: [0, 100, 300, 600],
        maxLevel: 3,
        tutorialSteps: [
            {
                title: "Selamat Datang di Jarimatika!",
                desc: "Metode berhitung cepat menggunakan jari-jari tangan. Mari kita mulai dari dasar.",
                handVal: 0,
                arrows: []
            },
            {
                title: "Satuan (Tangan Kanan)",
                desc: "Jari telunjuk kanan bernilai 1. Cobalah buka telunjukmu!",
                handVal: 1,
                arrows: [{ hand: 'right', finger: 'index' }]
            },
            {
                title: "Angka 2, 3, 4",
                desc: "Buka jari tengah untuk 2, jari manis untuk 3, dan kelingking untuk 4.",
                handVal: 4,
                arrows: [{ hand: 'right', finger: 'little' }]
            },
            {
                title: "Angka 5 (Spesial)",
                desc: "Jempol kanan bernilai 5. Keempat jari lain ditutup saat jempol dibuka.",
                handVal: 5,
                arrows: [{ hand: 'right', finger: 'thumb' }]
            },
            {
                title: "Angka 6 sampai 9",
                desc: "Gabungkan Jempol (5) dengan jari lain. Contoh: Jempol + Telunjuk = 6.",
                handVal: 6,
                arrows: [{ hand: 'right', finger: 'thumb' }, { hand: 'right', finger: 'index' }]
            },
            {
                title: "Puluhan (Tangan Kiri)",
                desc: "Konsepnya sama, tapi di tangan kiri. Telunjuk kiri = 10, Jempol kiri = 50.",
                handVal: 10,
                arrows: [{ hand: 'left', finger: 'index' }]
            },
            {
                title: "Contoh: 12",
                desc: "10 di kiri (Telunjuk) + 2 di kanan (Telunjuk & Tengah).",
                handVal: 12,
                arrows: [{ hand: 'left', finger: 'index' }, { hand: 'right', finger: 'middle' }]
            },
            {
                title: "Siap Bermain?",
                desc: "Sekarang kamu siap! Tutup tutorial ini dan pilih tantanganmu.",
                handVal: 0,
                arrows: []
            }
        ]
    },

    sounds: {
        correct: document.getElementById('sfx-correct'),
        wrong: document.getElementById('sfx-wrong'),
        click: document.getElementById('sfx-click'),
        levelup: document.getElementById('sfx-levelup')
    },

    init: () => {
        // ... (Listeners same as before, adding new ones)
        document.getElementById('login-btn').addEventListener('click', Game.handleLogin);
        document.getElementById('back-btn').addEventListener('click', () => Game.showScreen('dashboard-screen'));
        document.getElementById('submit-answer').addEventListener('click', Game.submitAnswer);
        document.getElementById('answer-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') Game.submitAnswer();
        });

        document.querySelectorAll('.level-card').forEach(card => {
            card.addEventListener('click', () => {
                const op = card.dataset.op;
                Game.startGame(op);
            });
        });

        // Tutorial Navigation
        document.getElementById('tutorial-btn').addEventListener('click', Game.startTutorial);
        document.getElementById('close-tutorial').addEventListener('click', () => Game.showScreen('dashboard-screen'));
        document.getElementById('next-step').addEventListener('click', () => Game.navigateTutorial(1));
        document.getElementById('prev-step').addEventListener('click', () => Game.navigateTutorial(-1));

        document.getElementById('tutorial-input').addEventListener('input', (e) => {
            const val = parseInt(e.target.value) || 0;
            Game.renderHands(val, '#tutorial-hands'); // Render to tutorial specifically
        });

        // Hint System
        document.getElementById('hint-btn').addEventListener('click', Game.showHint);

        // Init Sounds
        ['click', 'correct', 'wrong', 'levelup'].forEach(s => {
            try { Game.sounds[s].volume = 0.5; } catch(e){}
        });
    },

    playSound: (name) => {
        try {
            const sound = Game.sounds[name];
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(e => {});
            }
        } catch (e) {}
    },

    showScreen: (screenId) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        Game.playSound('click');
    },

    handleLogin: async () => {
        const usernameInput = document.getElementById('username-input');
        const username = usernameInput.value.trim();
        if (!username) return;

        const btn = document.getElementById('login-btn');
        btn.disabled = true;
        btn.innerText = "Menghubungkan...";

        try {
            const response = await API.login(username);
            if (response && response.status === 'success') {
                Game.state.username = response.data.username;
                Game.state.level = response.data.level || { add: 1, sub: 1, mul: 1, div: 1 };
                Game.state.xp = parseInt(response.data.xp) || 0;
                Game.state.score = parseInt(response.data.score) || 0;
                Game.updateDashboard();
                Game.showScreen('dashboard-screen');
            } else {
                alert("Gagal Login.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            btn.disabled = false;
            btn.innerText = "Mulai";
        }
    },

    updateDashboard: () => {
        document.getElementById('display-username').innerText = Game.state.username;
        document.getElementById('total-xp').innerText = Game.state.xp;
        ['add', 'sub', 'mul', 'div'].forEach(op => {
            const lvl = Game.state.level[op];
            document.querySelector(`.level-card[data-op="${op}"] .level-val`).innerText = lvl;
        });
    },

    startGame: (op) => {
        Game.state.currentOperation = op;
        Game.showScreen('game-screen');
        Game.nextQuestion();
    },

    nextQuestion: () => {
        const op = Game.state.currentOperation;
        const level = Game.state.level[op];
        let q = {};
        const range = level === 1 ? 10 : (level === 2 ? 50 : 99);

        let a, b;
        switch (op) {
            case 'add':
                a = Math.floor(Math.random() * range);
                b = Math.floor(Math.random() * (range - a));
                q = { text: `${a} + ${b} = ?`, answer: a + b };
                break;
            case 'sub':
                a = Math.floor(Math.random() * range);
                b = Math.floor(Math.random() * a);
                q = { text: `${a} - ${b} = ?`, answer: a - b };
                break;
            case 'mul':
                const maxMul = level === 1 ? 5 : (level === 2 ? 9 : 12);
                a = Math.floor(Math.random() * maxMul) + 1;
                b = Math.floor(Math.random() * maxMul) + 1;
                if (a * b > 99) { a = 9; b = 9; }
                q = { text: `${a} × ${b} = ?`, answer: a * b };
                break;
            case 'div':
                const maxDiv = level === 1 ? 5 : 9;
                b = Math.floor(Math.random() * maxDiv) + 1;
                a = b * (Math.floor(Math.random() * maxDiv) + 1);
                q = { text: `${a} ÷ ${b} = ?`, answer: a / b };
                break;
        }

        Game.state.currentQuestion = q;
        document.getElementById('question-text').innerText = q.text;
        document.getElementById('answer-input').value = '';
        document.getElementById('feedback-msg').innerText = '';

        // Reset hands to 0 for new question
        Game.renderHands(0, '#game-hands');
    },

    submitAnswer: async () => {
        if (Game.state.isProcessing) return;
        const input = document.getElementById('answer-input');
        const val = parseInt(input.value);
        const correct = Game.state.currentQuestion.answer;
        const feedback = document.getElementById('feedback-msg');

        if (isNaN(val)) return;
        Game.state.isProcessing = true;

        if (val === correct) {
            Game.playSound('correct');
            feedback.innerText = "Benar! 🎉";
            feedback.style.color = "var(--secondary)";
            Game.state.score += 10;
            Game.state.xp += Game.config.xpPerCorrect;
            Game.renderHands(correct, '#game-hands');
            await Game.checkLevelUp();
            API.updateProgress({
                username: Game.state.username,
                level: Game.state.level,
                xp: Game.state.xp,
                score: Game.state.score,
                action: 'update'
            });
            setTimeout(() => {
                Game.state.isProcessing = false;
                Game.nextQuestion();
            }, 2000);
        } else {
            Game.playSound('wrong');
            feedback.innerText = `Salah, coba lagi!`;
            feedback.style.color = "var(--danger)";
            setTimeout(() => { Game.state.isProcessing = false; }, 1000);
        }
    },

    showHint: () => {
        const correct = Game.state.currentQuestion.answer;
        Game.renderHands(correct, '#game-hands');
        // Add visual arrows temporarily?
        // For now, showing the hand configuration IS the hint.
    },

    checkLevelUp: async () => {
        const op = Game.state.currentOperation;
        const currentLvl = Game.state.level[op];
        if (currentLvl >= Game.config.maxLevel) return;
        const nextThreshold = Game.config.xpToLevelUp[currentLvl];
        if (Game.state.xp >= nextThreshold) {
            Game.state.level[op]++;
            Game.playSound('levelup');
            alert(`Selamat! Naik Level ${Game.state.level[op]}!`);
        }
    },

    // --- Tutorial Logic ---
    startTutorial: () => {
        Game.state.tutorialStep = 0;
        Game.showScreen('tutorial-screen');
        Game.updateTutorialUI();
    },

    navigateTutorial: (dir) => {
        const newStep = Game.state.tutorialStep + dir;
        if (newStep >= 0 && newStep < Game.config.tutorialSteps.length) {
            Game.state.tutorialStep = newStep;
            Game.updateTutorialUI();
        }
    },

    updateTutorialUI: () => {
        const step = Game.config.tutorialSteps[Game.state.tutorialStep];
        document.getElementById('step-title').innerText = step.title;
        document.getElementById('step-desc').innerText = step.desc;
        document.getElementById('tutorial-input').value = step.handVal;

        // Render Hands
        Game.renderHands(step.handVal, '#tutorial-hands');

        // Render Arrows
        const arrowContainer = document.getElementById('tutorial-arrows');
        arrowContainer.innerHTML = ''; // Clear
        step.arrows.forEach(arrow => {
            const el = document.createElement('div');
            el.className = 'arrow-indicator';
            el.innerText = '⬇️';
            // Position logic based on finger
            // Simple absolute positioning style based on percentages
            // Adjust based on the layout of .hands-container
            if (arrow.hand === 'left') el.style.left = '25%';
            else el.style.left = '75%';

            // Refined position would need specific coordinates per finger
            // simplified for this iteration:
            el.style.top = '10%';
            arrowContainer.appendChild(el);
        });

        // Update Dots
        const dots = document.getElementById('tutorial-dots');
        dots.innerHTML = '';
        Game.config.tutorialSteps.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = `dot ${i === Game.state.tutorialStep ? 'active' : ''}`;
            dots.appendChild(dot);
        });

        document.getElementById('prev-step').disabled = Game.state.tutorialStep === 0;
        document.getElementById('next-step').disabled = Game.state.tutorialStep === Game.config.tutorialSteps.length - 1;
    },

    // --- Core Render Logic ---
    renderHands: (num, containerSelector) => {
        if (num < 0 || num > 99) return;
        const tens = Math.floor(num / 10);
        const units = num % 10;

        const container = document.querySelector(containerSelector);
        if (!container) return;

        Game.setHandState(container.querySelector('.left-hand'), tens);
        Game.setHandState(container.querySelector('.right-hand'), units);
    },

    setHandState: (handEl, val) => {
        // Standard Jarimatika Map
        const fingers = { thumb: false, index: false, middle: false, ring: false, little: false };
        if (val >= 5) { fingers.thumb = true; val -= 5; }
        if (val >= 1) fingers.index = true;
        if (val >= 2) fingers.middle = true;
        if (val >= 3) fingers.ring = true;
        if (val >= 4) fingers.little = true;

        for (const [finger, isOpen] of Object.entries(fingers)) {
            const group = handEl.querySelector(`.finger-group.${finger}`);
            if (group) {
                if (isOpen) group.classList.remove('closed');
                else group.classList.add('closed');
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', Game.init);
