const Game = {
    state: {
        username: null,
        level: { add: 1, sub: 1, mul: 1, div: 1 },
        xp: 0,
        score: 0,
        currentOperation: null,
        currentQuestion: null,
        isProcessing: false
    },

    config: {
        xpPerCorrect: 10,
        xpToLevelUp: [0, 100, 300, 600], // XP thresholds for Level 1, 2, 3
        maxLevel: 3
    },

    sounds: {
        correct: document.getElementById('sfx-correct'),
        wrong: document.getElementById('sfx-wrong'),
        click: document.getElementById('sfx-click'),
        levelup: document.getElementById('sfx-levelup')
    },

    init: () => {
        // Event Listeners
        document.getElementById('login-btn').addEventListener('click', Game.handleLogin);
        document.getElementById('back-btn').addEventListener('click', () => Game.showScreen('dashboard-screen'));
        document.getElementById('submit-answer').addEventListener('click', Game.submitAnswer);
        document.getElementById('answer-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') Game.submitAnswer();
        });

        // Dashboard Buttons
        document.querySelectorAll('.level-card').forEach(card => {
            card.addEventListener('click', () => {
                const op = card.dataset.op;
                Game.startGame(op);
            });
        });

        // Tutorial
        document.getElementById('tutorial-btn').addEventListener('click', () => {
            Game.showScreen('tutorial-screen');
            document.getElementById('tutorial-input').focus();
        });
        document.getElementById('close-tutorial').addEventListener('click', () => Game.showScreen('dashboard-screen'));
        
        document.getElementById('tutorial-input').addEventListener('input', (e) => {
            const val = parseInt(e.target.value) || 0;
            Game.renderHands(val);
        });

        // Pre-load sounds (attempt to unlock audio context)
        ['click', 'correct', 'wrong', 'levelup'].forEach(s => {
            try { Game.sounds[s].volume = 0.5; } catch(e){}
        });
    },

    playSound: (name) => {
        try {
            const sound = Game.sounds[name];
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(e => console.log("Audio play failed (user interaction needed first)", e));
            }
        } catch (e) {
            console.error("Sound Error:", e);
        }
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
        const msg = document.getElementById('login-message');
        
        btn.disabled = true;
        btn.innerText = "Menghubungkan...";
        msg.innerText = "";

        try {
            const response = await API.login(username);
            console.log("Login Response:", response);

            if (response && response.status === 'success') {
                Game.state.username = response.data.username;
                Game.state.level = response.data.level || { add: 1, sub: 1, mul: 1, div: 1 };
                Game.state.xp = parseInt(response.data.xp) || 0;
                Game.state.score = parseInt(response.data.score) || 0;

                Game.updateDashboard();
                Game.showScreen('dashboard-screen');
            } else {
                msg.innerText = "Gagal masuk. Coba lagi.";
            }
        } catch (e) {
            console.error(e);
            msg.innerText = "Terjadi kesalahan koneksi.";
        } finally {
            btn.disabled = false;
            btn.innerText = "Mulai Petualangan";
        }
    },

    updateDashboard: () => {
        document.getElementById('display-username').innerText = Game.state.username;
        document.getElementById('total-xp').innerText = Game.state.xp;

        // Update Level Cards
        ['add', 'sub', 'mul', 'div'].forEach(op => {
            const lvl = Game.state.level[op];
            const card = document.querySelector(`.level-card[data-op="${op}"]`);
            card.querySelector('.level-val').innerText = lvl;
            
            // Calculate progress to next level
            // Simple logic: If max level, 100%. Else based on total XP?
            // Since XP is global, this logic is tricky. 
            // Let's assume global XP unlocks levels for ALL operations or per operation?
            // Prompt: "Level lain baru akan terbuka kuncinya dengan XP dan score tertentu."
            // "Pemain dapat melihat XP atau score yang diperlukan untuk dapat membuka level selanjutnya."
            
            // Let's use Global XP for simplicity as per common game design
            let nextXp = Game.config.xpToLevelUp[lvl];
            if (!nextXp) nextXp = 9999; // Maxed out
            
            // Visual feedback could be improved, but simple text is fine for now
        });
    },

    startGame: (op) => {
        Game.state.currentOperation = op;
        Game.state.score = 0; // Reset session score? Or keep cumulative? 
        // Usually "Score" in DB is cumulative. Let's keep cumulative.
        
        Game.showScreen('game-screen');
        Game.nextQuestion();
    },

    nextQuestion: () => {
        const op = Game.state.currentOperation;
        const level = Game.state.level[op];
        let q = {};

        // Difficulty Logic
        const range = level === 1 ? 10 : (level === 2 ? 50 : 99);
        
        let a, b;
        
        switch (op) {
            case 'add':
                a = Math.floor(Math.random() * range);
                b = Math.floor(Math.random() * (range - a)); // Ensure result <= range (for fingers)
                q = { text: `${a} + ${b} = ?`, answer: a + b };
                break;
            case 'sub':
                a = Math.floor(Math.random() * range);
                b = Math.floor(Math.random() * a); // No negative
                q = { text: `${a} - ${b} = ?`, answer: a - b };
                break;
            case 'mul':
                // Small numbers for mul to fit in 99
                const maxMul = level === 1 ? 5 : (level === 2 ? 9 : 12); 
                a = Math.floor(Math.random() * maxMul) + 1;
                b = Math.floor(Math.random() * maxMul) + 1;
                // Cap at 99 for Jarimatika display
                if (a * b > 99) { a = 9; b = 9; } 
                q = { text: `${a} × ${b} = ?`, answer: a * b };
                break;
            case 'div':
                // Inverse multiplication
                const maxDiv = level === 1 ? 5 : 9;
                b = Math.floor(Math.random() * maxDiv) + 1; // Divisor
                a = b * (Math.floor(Math.random() * maxDiv) + 1); // Dividend
                q = { text: `${a} ÷ ${b} = ?`, answer: a / b };
                break;
        }

        Game.state.currentQuestion = q;
        document.getElementById('question-text').innerText = q.text;
        document.getElementById('answer-input').value = '';
        document.getElementById('answer-input').focus();
        document.getElementById('feedback-msg').innerText = '';
        document.getElementById('feedback-msg').className = '';
        
        // Hide hands initially or show "0"? Show 0.
        Game.renderHands(0); 
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
            // Correct
            Game.playSound('correct');
            feedback.innerText = "Benar! 🎉";
            feedback.className = "feedback-correct";
            
            Game.state.score += 10;
            Game.state.xp += Game.config.xpPerCorrect;
            
            // Show hands for the answer
            Game.renderHands(correct);

            // Check Level Up
            await Game.checkLevelUp();
            
            // Update UI
            document.getElementById('game-score').innerText = Game.state.score;
            document.getElementById('total-xp').innerText = Game.state.xp; // In dashboard usually, but useful here

            // Save Progress
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
            // Wrong
            Game.playSound('wrong');
            feedback.innerText = `Salah, jawabannya ${correct}`;
            feedback.className = "feedback-wrong";
            Game.renderHands(correct); // Show correct hand gesture
            
            setTimeout(() => {
                Game.state.isProcessing = false;
                // Optional: Let them retry or next question? Next for flow.
                Game.nextQuestion();
            }, 3000);
        }
    },

    checkLevelUp: async () => {
        const op = Game.state.currentOperation;
        const currentLvl = Game.state.level[op];
        
        if (currentLvl >= Game.config.maxLevel) return;

        const nextThreshold = Game.config.xpToLevelUp[currentLvl];
        if (Game.state.xp >= nextThreshold) {
            // Level Up!
            Game.state.level[op]++;
            Game.playSound('levelup');
            alert(`Selamat! Kamu naik ke Level ${Game.state.level[op]} untuk ${op}!`);
            // We don't wait for API here, it saves in the main flow
        }
    },

    // Jarimatika Rendering Logic
    renderHands: (num) => {
        if (num < 0 || num > 99) return; // Limit for this implementation

        const tens = Math.floor(num / 10);
        const units = num % 10;

        // Update ALL instances (Game screen and Tutorial screen)
        Game.setHandState('.left-hand', tens);
        Game.setHandState('.right-hand', units);
    },

    setHandState: (selector, val) => {
        // Standard Jarimatika:
        // 0: Closed
        // 1: Index
        // 2: Index + Middle
        // 3: Index + Middle + Ring
        // 4: Index + Middle + Ring + Little
        // 5: Thumb
        // 6: Thumb + Index
        // 7: Thumb + Index + Middle
        // 8: Thumb + Index + Middle + Ring
        // 9: All Open
        
        const hand = document.querySelector(selector);
        const fingers = {
            thumb: false,
            index: false,
            middle: false,
            ring: false,
            little: false
        };

        if (val >= 5) {
            fingers.thumb = true;
            val -= 5;
        }
        
        if (val >= 1) fingers.index = true;
        if (val >= 2) fingers.middle = true;
        if (val >= 3) fingers.ring = true;
        if (val >= 4) fingers.little = true;

        // Apply classes to ALL matching hands (e.g., both tutorial and game screens)
        const hands = document.querySelectorAll(selector);
        hands.forEach(hand => {
            for (const [finger, isOpen] of Object.entries(fingers)) {
                const el = hand.querySelector(`.finger.${finger}`);
                if (el) {
                    if (isOpen) {
                        el.classList.remove('closed');
                    } else {
                        el.classList.add('closed');
                    }
                }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', Game.init);
