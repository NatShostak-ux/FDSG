
import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();
const require = createRequire(import.meta.url);
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('FDSG Backend is running 🚀');
});

// --- MCP CLIENT IMPLEMENTATION (STDIO) ---

class McpStdioClient {
    constructor(command, args) {
        this.command = command;
        this.args = args;
        this.process = null;
        this.requestId = 1;
        this.pendingRequests = new Map();
        this.isReady = false;
        this.isInitialized = false;
        this.buffer = '';
    }

    connect() {
        console.log(`Spawning MCP Server: ${this.command} ${this.args.join(' ')}`);
        try {
            this.process = spawn(this.command, this.args, {
                env: process.env
            });
        } catch (e) {
            console.error("Failed to spawn process:", e);
            return;
        }

        this.process.stdout.on('data', (data) => {
            const chunk = data.toString();
            this.buffer += chunk;
            this.processBuffer();
        });

        this.process.stderr.on('data', (data) => {
            console.error(`[MCP STDERR]: ${data}`);
        });

        this.process.on('error', (err) => {
            console.error("MCP Process Error:", err);
        });

        this.process.on('close', (code) => {
            console.log(`MCP process exited with code ${code}`);
            this.isReady = false;
            this.isInitialized = false;
        });

        this.isReady = true;

        this.initialize().catch(err => {
            console.error("MCP Handshake Failed:", err);
        });
    }

    async initialize() {
        console.log("Sending MCP Initialize...");
        const result = await this.sendRequest("initialize", {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "fdsg-chatbot-backend", version: "1.0.0" }
        });

        console.log("MCP Initialized. Server Info:", JSON.stringify(result.serverInfo));

        this.process.stdin.write(JSON.stringify({
            jsonrpc: "2.0",
            method: "notifications/initialized"
        }) + '\n');

        this.isInitialized = true;
        return result;
    }

    async sendRequest(method, params = {}) {
        if (!this.process) {
            throw new Error("MCP Client not connected");
        }

        const id = this.requestId++;
        const request = {
            jsonrpc: "2.0",
            id: id,
            method: method,
            params: params
        };

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });

            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error(`Request ${method} (id: ${id}) timed out`));
                }
            }, 60000);

            try {
                this.process.stdin.write(JSON.stringify(request) + '\n');
            } catch (err) {
                this.pendingRequests.delete(id);
                reject(err);
            }
        });
    }

    processBuffer() {
        let newlineIndex;
        while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
            const line = this.buffer.slice(0, newlineIndex).trim();
            this.buffer = this.buffer.slice(newlineIndex + 1);
            if (line) {
                if (line.startsWith('{')) {
                    this.handleMessage(line);
                } else {
                    console.log(`[MCP Non-JSON]: ${line}`);
                }
            }
        }
    }

    handleMessage(line) {
        try {
            const message = JSON.parse(line);
            if (message.id && this.pendingRequests.has(message.id)) {
                const { resolve, reject } = this.pendingRequests.get(message.id);
                this.pendingRequests.delete(message.id);
                if (message.error) {
                    reject(message.error);
                } else {
                    resolve(message.result);
                }
            }
        } catch (error) {
            console.error("Error parsing JSON from MCP:", error);
            console.error("Offending line:", line);
        }
    }

    async callTool(name, args) {
        if (!this.isInitialized) {
            console.log("Waiting for MCP initialization...");
            for (let i = 0; i < 20; i++) {
                if (this.isInitialized) break;
                await new Promise(r => setTimeout(r, 1000));
            }
            if (!this.isInitialized) throw new Error("MCP Server not initialized");
        }

        return this.sendRequest("tools/call", {
            name: name,
            arguments: args
        });
    }
}

// Initialize Client
const mcpClient = new McpStdioClient('/Users/nataliya.shostak/.local/bin/notebooklm-mcp', []);
mcpClient.connect();

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyADxBcJAldl28lvBT67Yfc-9yNKWosQZeo";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

// --- CONFIGURATION ---

const ALLOWED_NOTEBOOKS = [
    "Feudi di San Gregorio",
    "E-commerce",
    "Commerciale",
    "Lanieri"
];

// --- API ENDPOINT ---

app.post('/api/chat', async (req, res) => {
    const { message, notebookTitle } = req.body;

    try {
        // 1. List Notebooks
        const listResult = await mcpClient.callTool("notebook_list", {});
        let responseData;
        try {
            responseData = JSON.parse(listResult.content[0].text);
        } catch (e) {
            console.error("Failed to parse notebook list:", listResult.content[0].text);
            return res.status(500).json({ error: "Invalid response from NotebookLM", raw: listResult.content[0].text });
        }

        let notebooks = [];
        if (Array.isArray(responseData)) {
            notebooks = responseData;
        } else if (responseData.status === "success" && Array.isArray(responseData.notebooks)) {
            notebooks = responseData.notebooks;
        } else if (responseData.status === "error" || responseData.error) {
            console.error("NotebookLM List Error:", responseData.error || responseData.message);
            return res.status(401).json({ error: "NotebookLM Authentication Required", details: responseData.error });
        }

        console.log("Available Notebooks:", notebooks.map(n => `"${n.title}" (${n.id}) [Sources: ${n.src || n.source_count || 0}]`));

        // Filter by whitelist if defined
        if (ALLOWED_NOTEBOOKS && ALLOWED_NOTEBOOKS.length > 0) {
            notebooks = notebooks.filter(nb =>
                ALLOWED_NOTEBOOKS.some(allowed =>
                    nb.title.toLowerCase() === allowed.toLowerCase() ||
                    nb.id === allowed
                )
            );
        }

        if (notebooks.length === 0) {
            return res.status(404).json({ error: "No whitelisted notebooks found or access denied." });
        }

        // 2. Find Best Match
        let targetNotebook = notebooks.find(nb =>
            nb.title.toLowerCase() === notebookTitle.toLowerCase() ||
            nb.id === notebookTitle
        );

        if (!targetNotebook) {
            targetNotebook = notebooks.find(nb =>
                nb.title.toLowerCase().includes(notebookTitle.toLowerCase()) ||
                notebookTitle.toLowerCase().includes(nb.title.toLowerCase())
            );
        }

        let notebookId;
        if (!targetNotebook) {
            notebookId = notebooks[0].id;
            targetNotebook = notebooks[0];
            console.log(`Notebook '${notebookTitle}' not found in whitelist. Falling back to '${notebooks[0].title}'`);
        } else {
            notebookId = targetNotebook.id;
            console.log(`Selected notebook: ${targetNotebook.title} (${notebookId})`);
        }

        // 3. Query
        console.log(`Querying notebook '${notebookId}' (${targetNotebook.title}) with: "${message}"`);
        const queryResult = await mcpClient.callTool("notebook_query", {
            notebook_id: notebookId,
            query: message
        });

        if (!queryResult.content || queryResult.content.length === 0) {
            throw new Error("No response content from NotebookLM");
        }

        let answer = queryResult.content[0].text;

        // Handle JSON nested response or trailing metadata
        try {
            const parsed = JSON.parse(answer);
            if (parsed.answer) {
                answer = parsed.answer;
            } else if (parsed.status === "success" && parsed.answer) {
                answer = parsed.answer;
            }
        } catch (e) {
            if (answer.includes('","conversation_id":"')) {
                answer = answer.split('","conversation_id":"')[0];
                answer = answer.replace(/"$/, '').trim();
                if (answer.includes('{"status":"success","answer":"')) {
                    answer = answer.split('{"status":"success","answer":"')[1];
                }
            }
        }

        answer = answer.trim();
        const sourcesCountValue = targetNotebook.src || targetNotebook.source_count || 0;
        console.log(`Response sent. Sources available: ${sourcesCountValue}`);

        res.json({
            answer,
            sourceCount: sourcesCountValue
        });

    } catch (error) {
        console.error("API Error Trace:", error);
        res.status(500).json({
            error: error.message || "Internal Server Error"
        });
    }
});

app.post('/api/ai-writer', async (req, res) => {
    const { text, instruction, mode, selection } = req.body;

    // Use selection if present, otherwise use full text
    const targetText = selection || text;

    try {
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

        console.log(`AI Writer Prompt: "${prompt}"`);
        prompt += "\nFornisci SOLO il testo risultante, senza commenti o markdown.";

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim().replace(/^"|"$/g, '');
        console.log(`AI Writer Result: "${responseText.substring(0, 50)}..."`);

        res.json({ text: responseText });
    } catch (error) {
        console.error("AI Writer Error:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server (Stdio Transport) running on http://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
