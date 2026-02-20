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

        // Real-time Hand Update on Input
        document.getElementById('answer-input').addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            if (!isNaN(val)) {
                Game.renderHands(val, 'game');
            } else {
                Game.renderHands(0, 'game'); // Reset to 0 if empty
            }
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
            // Render to tutorial specifically
            Game.renderHands(val, 'tutorial'); 
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
        Game.renderHands(0, 'game');
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
            Game.renderHands(correct, 'game');
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
        Game.renderHands(correct, 'game');
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
        Game.renderHands(step.handVal, 'tutorial');

        // Arrows (Only visual, now image based hands don't have finger elements to attach to)
        // We can still overlay arrows based on approximate positions if needed, but the prompt focused on Image replacement.
        // Let's keep arrows overlay but simplify or remove if not applicable to images.
        // The original plan said "Add arrows...". With static images, we can't target "finger" elements.
        // We will skip arrows for now as images handle the "show" part.
        const arrowContainer = document.getElementById('tutorial-arrows');
        arrowContainer.innerHTML = ''; 
        
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

    // --- Core Render Logic (Image Based) ---
    renderHands: (num, context = 'game') => {
        // context: 'game' or 'tutorial'
        if (num < 0 || num > 99) return;
        const tens = Math.floor(num / 10);
        const units = num % 10;
        
        // Target IDs: game-left-hand-img, game-right-hand-img
        const leftId = `${context}-left-hand-img`;
        const rightId = `${context}-right-hand-img`;
        
        const leftEl = document.getElementById(leftId);
        const rightEl = document.getElementById(rightId);
        
        if (leftEl) leftEl.src = `images/left/${tens}.png`;
        if (rightEl) rightEl.src = `images/right/${units}.png`;
    }
};

document.addEventListener('DOMContentLoaded', Game.init);
