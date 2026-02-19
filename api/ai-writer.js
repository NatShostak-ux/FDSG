import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text, instruction, mode, selection } = req.body;
    const targetText = selection || text;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API Key missing on server' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let prompt = "";
        if (mode === "Professionale") {
            prompt = `Rendi questo testo professionale ed elegante, adatto a una strategia di digital transformation per un'azienda vinicola di lusso come Feudi di San Gregorio.
            Testo: "${targetText}"`;
        } else if (mode === "Accorcia") {
            prompt = `Sintetizza questo testo mantenendo solo i punti chiave essenziali.
            Testo: "${targetText}"`;
        } else if (mode === "Espandi") {
            prompt = `Dettaglia ed espandi questo testo aggiungendo sfumature strategiche e operative.
            Testo: "${targetText}"`;
        } else if (mode === "Fluido") {
            prompt = `Correggi la grammatica e migliora la fluidità sintattica di questo testo.
            Testo: "${targetText}"`;
        } else if (instruction) {
            prompt = `Modifica il seguente testo seguendo questa istruzione: "${instruction}".
            Testo: "${targetText}"`;
        } else {
            return res.status(400).json({ error: "Istruzione o modalità mancante." });
        }

        prompt += "\nFornisci SOLO il testo risultante, senza commenti o markdown.";

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim().replace(/^"|"$/g, '');

        res.json({ text: responseText });
    } catch (error) {
        console.error("AI Writer Error:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}
