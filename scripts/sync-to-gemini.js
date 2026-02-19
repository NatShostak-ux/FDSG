import { spawn } from 'child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from "@google/generative-ai/server";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

// --- CONFIG ---
const ALLOWED_NOTEBOOKS = [
    "Feudi di San Gregorio",
    "E-commerce",
    "Commerciale",
    "Lanieri"
];

// --- MCP CLIENT ---
class McpSimple {
    constructor(command) {
        this.command = command;
        this.process = null;
        this.requestId = 1;
        this.buffer = '';
    }

    async connect() {
        this.process = spawn(this.command, [], { env: process.env });
        this.process.stdout.on('data', d => { this.buffer += d.toString(); this.processBuffer(); });
        this.process.stderr.on('data', d => console.error(`[MCP ERR]: ${d}`));

        await this.sendRequest("initialize", {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "sync-tool", version: "1.0.0" }
        });
        this.process.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + '\n');
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
                try { this.responseHandler(JSON.parse(line)); } catch (e) { }
            }
        }
    }

    async callTool(name, args) {
        const res = await this.sendRequest("tools/call", { name, arguments: args });
        return JSON.parse(res.content[0].text);
    }
}

async function sync() {
    console.log("🚀 Starting Cloud Sync...");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY missing in .env");

    const fileManager = new GoogleAIFileManager(apiKey);
    const mcp = new McpSimple('/Users/nataliya.shostak/.local/bin/notebooklm-mcp');
    await mcp.connect();

    // Init Firebase Admin (using local credentials or env)
    // Assumes user has configured firebase-admin or we use a service account.
    // For simplicity, we can use the web SDK if configured, but admin is better for scripts.
    // Let's assume the user will provide a serviceAccount.json or we skip for now and just log the URIs.

    console.log("Fetching Notebooks...");
    const notebooks = await mcp.callTool("notebook_list", {});
    const targetNotebooks = notebooks.notebooks.filter(nb =>
        ALLOWED_NOTEBOOKS.some(a => nb.title.toLowerCase().includes(a.toLowerCase()))
    );

    const cloudMappings = {};

    for (const nb of targetNotebooks) {
        console.log(`\nProcessing: ${nb.title} (${nb.id})`);
        const details = await mcp.callTool("notebook_get", { notebook_id: nb.id });
        const sources = details.sources || [];

        let fullText = `DOCUMENTAZIONE PER AREA: ${nb.title}\n\n`;

        for (const src of sources) {
            process.stdout.write(`  Reading source: ${src.title}... `);
            try {
                const content = await mcp.callTool("source_get_content", { source_id: src.id });
                fullText += `--- INIZIO DOCUMENTO: ${src.title} ---\n${content.content}\n--- FINE DOCUMENTO ---\n\n`;
                console.log("OK");
            } catch (e) {
                console.log("FAILED");
            }
        }

        const tempFile = path.join('/tmp', `fdsg_${nb.id}.txt`);
        fs.writeFileSync(tempFile, fullText);

        console.log(`  Uploading to Gemini Cloud...`);
        const uploadResponse = await fileManager.uploadFile(tempFile, {
            mimeType: "text/plain",
            displayName: `FDSG Knowledge Base - ${nb.title}`,
        });

        console.log(`  Cloud URI: ${uploadResponse.file.uri}`);
        cloudMappings[nb.title] = {
            uri: uploadResponse.file.uri,
            mimeType: uploadResponse.file.mimeType,
            updatedAt: new Date().toISOString()
        };

        fs.unlinkSync(tempFile);
    }

    console.log("\n✅ Sync Complete!");
    console.log("Save these mappings to your Firestore document 'strategy/hub' field 'cloudContext':");
    console.log(JSON.stringify(cloudMappings, null, 2));

    process.exit(0);
}

sync().catch(console.error);
