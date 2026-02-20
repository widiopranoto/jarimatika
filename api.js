const API = {
    // PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
    BASE_URL: "https://script.google.com/macros/s/AKfycbzcdnX74CN5U15PHJpZzoa4o6oAIXGqn5d3gsJdvBwIPtmF9E9QpwReR6QBYK4CKcj1/exec", 

    mockData: {
        username: "DemoUser",
        level: { add: 1, sub: 1, mul: 1, div: 1 },
        xp: 150,
        score: 500
    },

    login: async (username) => {
        if (!API.BASE_URL) {
            console.warn("⚠️ API URL not set. Using Mock Data.");
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve({
                        status: 'success',
                        data: {
                            username: username,
                            level: API.mockData.level,
                            xp: API.mockData.xp,
                            score: API.mockData.score
                        }
                    });
                }, 800);
            });
        }

        try {
            // Google Apps Script requires a specific setup for POST requests to be read
            // It often follows a redirect (302)
            const response = await fetch(API.BASE_URL, {
                method: 'POST',
                redirect: 'follow', // Important for GAS
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', // 'text/plain' avoids preflight OPTIONS check which GAS doesn't handle well
                },
                body: JSON.stringify({ action: 'login', username: username })
            });
            
            return await response.json();
        } catch (e) {
            console.error("Login Error:", e);
            // Fallback for demo purposes if network fails
            alert("Gagal terhubung ke server. Masuk ke Mode Offline.");
            return {
                status: 'success',
                data: { username: username, level: {add:1, sub:1, mul:1, div:1}, xp:0, score:0 }
            };
        }
    },

    updateProgress: async (data) => {
        console.log("Saving Progress:", data);
        if (!API.BASE_URL) return { status: 'success' };
        
        try {
            await fetch(API.BASE_URL, {
                method: 'POST',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.error("Save Error:", e);
        }
    }
};