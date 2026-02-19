import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (Server-side)
if (!getApps().length) {
    initializeApp({
        // Vercel will have these as environment variables
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
    });
}

const db = getFirestore();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, notebookTitle } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API Key missing' });
    }

    try {
        // 1. Get the Cloud Mapping from Firestore
        const docRef = db.collection('strategy').doc('hub');
        const snap = await docRef.get();
        const data = snap.data();
        const cloudContext = data?.cloudContext || {};

        // Find the specific mapping for this area
        const mapping = Object.entries(cloudContext).find(([title]) =>
            title.toLowerCase().includes(notebookTitle.toLowerCase()) ||
            notebookTitle.toLowerCase().includes(title.toLowerCase())
        )?.[1];

        if (!mapping) {
            return res.status(404).json({ error: `Nessun contesto cloud trovato per '${notebookTitle}'. Esegui la sincronizzazione dal PC.` });
        }

        // 2. Query Gemini with the Cloud File
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: mapping.mimeType,
                    fileUri: mapping.uri
                }
            },
            {
                text: `Sei un assistente esperto per la strategia "Feudi di San Gregorio".
            Rispondi alla seguente domanda basandoti ESCLUSIVAMENTE sui documenti forniti.
            Se l'informazione non è presente, dillo chiaramente.
            Usa un tono professionale ma cordiale.
            Mantieni il markdown per la formattazione.
            
            Domanda: ${message}`
            }
        ]);

        res.json({
            answer: result.response.text(),
            sourceCount: "Integrazione Cloud" // Metadata placeholder
        });

    } catch (error) {
        console.error("Cloud Chat Error:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}
