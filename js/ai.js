/* =============================================
   job.bar — AI Assistant
   Floating chat bot with conversational AI responses
   ============================================= */

let aiChatOpen = false;

function toggleAIAssistant() {
    aiChatOpen = !aiChatOpen;
    const panel = document.getElementById('ai-chat-panel');
    panel.classList.toggle('hidden', !aiChatOpen);

    if (aiChatOpen) {
        document.getElementById('ai-input').focus();
    }
}

function sendAIMessage() {
    const input = document.getElementById('ai-input');
    const message = input.value.trim();
    if (!message) return;

    addChatMessage(message, 'user');
    input.value = '';

    // Show typing
    const typingId = showTypingIndicator();

    // Generate response
    setTimeout(() => {
        removeTypingIndicator(typingId);
        const response = generateAIResponse(message);
        addChatMessage(response, 'ai');
    }, 800 + Math.random() * 800);
}

function handleAIChat(event) {
    if (event.key === 'Enter') sendAIMessage();
}

function addChatMessage(text, sender) {
    const messages = document.getElementById('ai-chat-messages');
    const div = document.createElement('div');
    div.className = sender === 'user' ? 'user-message fade-in' : 'ai-message fade-in';
    div.innerHTML = `<div class="${sender === 'user' ? 'user-msg-content' : 'ai-msg-content'}">${text}</div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function showTypingIndicator() {
    const messages = document.getElementById('ai-chat-messages');
    const id = `typing-${Date.now()}`;
    const div = document.createElement('div');
    div.id = id;
    div.className = 'ai-message';
    div.innerHTML = `<div class="ai-typing"><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div></div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    document.getElementById(id)?.remove();
}

function generateAIResponse(message) {
    const msg = message.toLowerCase();

    // Jobs
    if (msg.includes('job') || msg.includes('find') || msg.includes('search')) {
        const count = AppData.jobs.length;
        return `I found <strong>${count} matching jobs</strong> for you right now! Your top matches are at Google, Microsoft, and Stripe based on your React & Node.js skills. <a href="#" onclick="navigateTo('jobs')" style="color:var(--accent)">Browse all jobs →</a>`;
    }

    // Resume
    if (msg.includes('resume') || msg.includes('cv')) {
        if (!AppData.resumeUploaded) {
            return `Your resume hasn't been uploaded yet! Head to <a href="#" onclick="navigateTo('resume');toggleAIAssistant()" style="color:var(--accent)">Resume Lab</a> to upload your resume. Once uploaded, I'll match you with the best jobs and generate tailored resumes for each position.`;
        }
        return `Your resume has been parsed! I found your skills in React, Node.js, TypeScript, and Python. Your current ATS score is <strong>78/100</strong>. I recommend adding Docker and quantifying your achievements more. Want me to generate a tailored resume for a specific job?`;
    }

    // Cover letter
    if (msg.includes('cover') || msg.includes('letter')) {
        return `I can generate personalized cover letters for any job! Just go to <a href="#" onclick="navigateTo('cover');toggleAIAssistant()" style="color:var(--accent)">Cover Letters</a> and click "+ Generate". It takes only 30 seconds and is tailored to each specific job description.`;
    }

    // Applications
    if (msg.includes('application') || msg.includes('applied') || msg.includes('status')) {
        const apps = AppData.applications;
        const interviews = apps.filter(a => a.status === 'interview').length;
        return `You have <strong>${apps.length} applications</strong> tracked. ${interviews > 0 ? `🎉 You have <strong>${interviews} interview(s)</strong> scheduled!` : ''} Your response rate is 33% which is above average. <a href="#" onclick="navigateTo('applications');toggleAIAssistant()" style="color:var(--accent)">View all applications →</a>`;
    }

    // Interview prep
    if (msg.includes('interview') || msg.includes('prep') || msg.includes('practice')) {
        return `Great timing to prepare! 🎯 Go to <a href="#" onclick="navigateTo('prep');toggleAIAssistant()" style="color:var(--accent)">Interview Prep</a> to access company research, technical questions, coding challenges, and HR tips. I can also help with specific questions — just ask!`;
    }

    // Salary
    if (msg.includes('salary') || msg.includes('compensation') || msg.includes('lpa') || msg.includes('ctc')) {
        return `Based on your profile (3 years experience, React + Node.js), the market rate for your target roles in Bangalore is <strong>₹18-30 LPA</strong>. For remote/US-based roles, expect <strong>$100K-$150K</strong>. Senior roles can go up to <strong>₹40-60 LPA</strong>.`;
    }

    // Skills
    if (msg.includes('skill') || msg.includes('learn') || msg.includes('improve')) {
        return `Based on your profile and current job market trends, I recommend learning:\n• <strong>Docker & Kubernetes</strong> — adds 34% more job matches\n• <strong>System Design</strong> — key for senior roles\n• <strong>LangChain / AI APIs</strong> — hot in 2025-26\n• <strong>Go (Golang)</strong> — growing demand at tech companies`;
    }

    // LinkedIn
    if (msg.includes('linkedin')) {
        return `LinkedIn is great for job hunting! Tips to maximize LinkedIn:\n• Post 2-3 times/week about your projects\n• Connect with recruiters at target companies\n• Enable "Open to Work" (visible to recruiters only)\n• Add your resume to profile\n• Engage with posts from companies you're targeting`;
    }

    // Greetings
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
        return `Hey ${AppData.user.name.split(' ')[0]}! 👋 I'm your AI job search assistant. I can help you:\n• 🔍 Find matching jobs\n• 📄 Generate tailored resumes\n• ✉️ Write cover letters\n• 🧠 Prep for interviews\n\nWhat would you like to do?`;
    }

    // Thank you
    if (msg.includes('thank')) {
        return `You're welcome! 😊 Good luck with your job search! Remember: consistency is key — aim for 5-10 applications per week. You've got this! 🚀`;
    }

    // Profile
    if (msg.includes('profile') || msg.includes('bio')) {
        return `Your profile is <strong>78% complete</strong>. To improve your chances:\n• Add your LinkedIn and portfolio URL\n• Upload your latest resume\n• Add more project details\n• Set your availability and notice period\n\n<a href="#" onclick="navigateTo('profile');toggleAIAssistant()" style="color:var(--accent)">Complete your profile →</a>`;
    }

    // Default responses
    const defaults = [
        `That's a great question! Based on your profile, I can see you're well-positioned for ${AppData.jobs.slice(0, 3).map(j => j.role).join(', ')} roles. Would you like me to help with job search, resume improvement, or interview prep?`,
        `I'm here to help you land your dream job! You have ${AppData.jobs.length} job matches right now. What would you like to focus on — finding jobs, improving your resume, or preparing for interviews?`,
        `Great question! Let me analyze that for you. Based on current market data, the demand for your skills (React, Node.js) is very high — up 23% this year. You're in a strong position! Want specific job recommendations?`,
        `I can definitely help with that! Your job.bar profile gives me access to your skills and preferences. Shall I search for specific roles or help you optimize your application strategy?`,
    ];

    return defaults[Math.floor(Math.random() * defaults.length)];
}
