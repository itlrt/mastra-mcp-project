import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { MCPConfiguration } from "@mastra/mcp";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { createOllama } from "ollama-ai-provider";
import { Memory } from "@mastra/memory";
import { PostgresStore, PgVector } from "@mastra/pg";

const mcp = new MCPConfiguration({
  servers: {
    braveSearch: {
      command: "docker",
      args: [
        "run",
        "-i",
        "--rm",
        "-e",
        "BRAVE_API_KEY=BSAKnvYz2PUQmzoPxzkSVIo0ztxEY_h",
        "mcp/brave-search"
      ],
      env: {
        BRAVE_API_KEY: "BSAKnvYz2PUQmzoPxzkSVIo0ztxEY_h"
      }
    },
  },
});

const connectionString = process.env.POSTGRES_CONNECTION_STRING;
if (!connectionString) {
  throw new Error('POSTGRES_CONNECTION_STRING tidak ditemukan di .env');
}

const pgVector = new PgVector(connectionString);

const memory = new Memory({
  storage: new PostgresStore({
    connectionString
  }),
  vector: pgVector,
  options: {
    lastMessages: 5,
    semanticRecall: {
      topK: 3,
      messageRange: 5
    }
  },
});

const ollama = createOllama({
  baseURL: process.env.OLLAMA_API_URL,
});

const mcpTools = await mcp.getTools();

export const mcpAgent = new Agent({
  name: "MCP Agent",
  instructions: `
      Anda adalah asisten yang berguna yang dapat melakukan pencarian web.

      【Ketika diminta informasi】
      Gunakan webSearchTool untuk melakukan pencarian web. webSearchTool menerima parameter berikut:
      - query: kueri pencarian (wajib)
      - country: kode negara untuk hasil pencarian (contoh: JP, US) (opsional)
      - count: jumlah maksimum hasil pencarian yang dikembalikan (opsional)
      - search_lang: bahasa pencarian (contoh: ja, en) (opsional)

      Jawaban harus selalu ringkas tetapi tetap informatif. Prioritaskan informasi yang langsung terkait dengan pertanyaan pengguna.
  `,
  model: openrouter("openrouter/quasar-alpha"),
  tools: mcpTools,
  memory,
});
 