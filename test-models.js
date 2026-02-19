
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModels() {
    try {
        console.log("Testing gemini-1.5-flash-latest...");
        const modelLatest = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const resultLatest = await modelLatest.generateContent("Hello");
        console.log("gemini-1.5-flash-latest OK:", resultLatest.response.text());
    } catch (e) {
        console.error("gemini-1.5-flash-latest FAILED:", e.message);
    }

    try {
        console.log("Testing gemini-1.5-flash...");
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const resultFlash = await modelFlash.generateContent("Hello");
        console.log("gemini-1.5-flash OK:", resultFlash.response.text());
    } catch (e) {
        console.error("gemini-1.5-flash FAILED:", e.message);
    }
}

testModels();
