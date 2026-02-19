
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        // Note: listModels is not directly on genAI in some versions of the SDK
        // In the latest version, it's often a separate method or not exposed directly this way.
        // Let's try to just check the API version or try 'gemini-pro'

        console.log("Testing gemini-pro...");
        const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
        const resultPro = await modelPro.generateContent("Hello");
        console.log("gemini-pro OK:", resultPro.response.text());
    } catch (e) {
        console.error("gemini-pro FAILED:", e.message);
    }
}

listModels();
