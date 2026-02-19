import { spawn } from 'child_process';
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// --- MCP CLIENT (Simplified for sync) ---
class McpSimple {
    constructor(command) {
        this.command = command;
        this.process = null;
        this.requestId = 1;
        this.buffer = '';
    }

    async connect() {
        this.process = spawn(this.command, [], { env: process.env });
        return new Promise((resolve, reject) => {
            this.process.stdout.on('data', d => {
                this.buffer += d.toString();
                this.processBuffer();
            });
            this.process.stderr.on('data', d => console.error(`[MCP ERR]: ${d}`));

            this.sendRequest("initialize", {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "sync-tool", version: "1.0.0" }
            }).then(() => {
                this.process.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + '\n');
                resolve();
            }).catch(reject);
        });
    }

    sendRequest(method, params = {}) {
        return new Promise((resolve) => {
            const id = this.requestId++;
            const pending = (msg) => {
                if (msg.id === id) {
                    this.responseHandler = null;
                    resolve(msg.result);
                }
            };
            this.responseHandler = pending;
            this.process.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + '\n');
        });
    }

    processBuffer() {
        let idx;
        while ((idx = this.buffer.indexOf('\n')) !== -1) {
            const line = this.buffer.slice(0, idx).trim();
            this.buffer = this.buffer.slice(idx + 1);
            if (line && this.responseHandler) {
                try {
                    const msg = JSON.parse(line);
                    this.responseHandler(msg);
                } catch (e) { }
            }
        }
    }

    async callTool(name, args) {
        const res = await this.sendRequest("tools/call", { name, arguments: args });
        return JSON.parse(res.content[0].text);
    }

    stop() {
        if (this.process) this.process.kill();
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // This endpoint only works locally
    if (process.env.VERCEL) {
        return res.status(403).json({ error: 'Sincronizzazione disponibile solo in locale sul PC di origine.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY mancante' });

    const fileManager = new GoogleAIFileManager(apiKey);
    const mcp = new McpSimple('/Users/nataliya.shostak/.local/bin/notebooklm-mcp');

    try {
        await mcp.connect();

        const ALLOWED_NOTEBOOKS = ["Feudi di San Gregorio", "E-commerce", "Commerciale", "Lanieri"];
        const notebooksData = await mcp.callTool("notebook_list", {});
        const notebooks = notebooksData.notebooks || [];

        const targetNotebooks = notebooks.filter(nb =>
            ALLOWED_NOTEBOOKS.some(a => nb.title.toLowerCase().includes(a.toLowerCase()))
        );

        const cloudMappings = {};

        for (const nb of targetNotebooks) {
            const details = await mcp.callTool("notebook_get", { notebook_id: nb.id });
            const sources = details.sources || [];
            let fullText = `DOCUMENTAZIONE PER AREA: ${nb.title}\n\n`;

            for (const src of sources) {
                try {
                    const content = await mcp.callTool("source_get_content", { source_id: src.id });
                    fullText += `--- DOC: ${src.title} ---\n${content.content}\n\n`;
                } catch (e) { }
            }

            const tempFile = path.join('/tmp', `sync_${nb.id}.txt`);
            fs.writeFileSync(tempFile, fullText);

            const upload = await fileManager.uploadFile(tempFile, {
                mimeType: "text/plain",
                displayName: `FDSG Cloud - ${nb.title}`,
            });

            cloudMappings[nb.title] = {
                uri: upload.file.uri,
                mimeType: upload.file.mimeType,
                updatedAt: new Date().toISOString()
            };

            fs.unlinkSync(tempFile);
        }

        mcp.stop();

        // Initialize Firebase Admin to update Firestore
        if (!getApps().length) {
            initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                })
            });
        }
        const firestore = getFirestore();
        await firestore.collection('strategy').doc('hub').set({ cloudContext: cloudMappings }, { merge: true });

        res.json({ status: 'success', mappings: cloudMappings });

    } catch (error) {
        console.error("Sync Error:", error);
        mcp.stop();
        res.status(500).json({ error: error.message });
    }
}
