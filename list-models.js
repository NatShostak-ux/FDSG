
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();
        if (data.error) {
            console.error("API Error:", data.error.message);
            return;
        }
        console.log("Available Models:");
        data.models.forEach(m => console.log(`- ${m.name} (displayName: ${m.displayName})`));
    } catch (e) {
        console.error("List Models FAILED:", e.message);
    }
}

listModels();
