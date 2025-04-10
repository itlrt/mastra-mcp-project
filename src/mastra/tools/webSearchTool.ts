import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import fetch from "node-fetch";

// Daftar kode bahasa yang valid
const validLanguages = [
  'ar', 'eu', 'bn', 'bg', 'ca', 'zh-hans', 'zh-hant', 'hr', 'cs', 'da', 'nl', 'en', 'en-gb', 
  'et', 'fi', 'fr', 'gl', 'de', 'gu', 'he', 'hi', 'hu', 'is', 'it', 'jp', 'kn', 'ko', 'lv', 
  'lt', 'ms', 'ml', 'mr', 'nb', 'pl', 'pt-br', 'pt-pt', 'pa', 'ro', 'ru', 'sr', 'sk', 'sl', 
  'es', 'sv', 'ta', 'te', 'th', 'tr', 'uk', 'vi'
] as const;

const validCountries = [
  'AR', 'AU', 'AT', 'BE', 'BR', 'CA', 'CL', 'DK', 'FI', 'FR', 'DE', 'HK', 'IN', 'ID', 
  'IT', 'JP', 'KR', 'MY', 'MX', 'NL', 'NZ', 'NO', 'CN', 'PL', 'PT', 'PH', 'RU', 'SA', 
  'ZA', 'ES', 'SE', 'CH', 'TW', 'TR', 'GB', 'US', 'ALL', 'ID'
] as const;

export const webSearchTool = createTool({
  id: "web-search",
  description: "Melakukan pencarian web menggunakan mesin pencari",
  inputSchema: z.object({
    query: z.string().describe("Kueri pencarian"),
    country: z.enum(validCountries).optional().describe("Kode negara untuk hasil pencarian (contoh: ID untuk Indonesia)"),
    count: z.number().optional().describe("Jumlah maksimum hasil pencarian yang dikembalikan (default: 10)"),
    language: z.enum(validLanguages).optional()
      .describe("Bahasa pencarian (catatan: Bahasa Indonesia belum didukung, gunakan en=Bahasa Inggris). Nilai yang tersedia: " + validLanguages.join(', ')),
    offset: z.number().max(9).optional().describe("Offset hasil pencarian (nilai maksimum: 9)"),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        description: z.string(),
      })
    ),
    query: z.string(),
    total_results: z.number().optional(),
  }),
  execute: async ({ context }: { context: { query: string; country?: string; count?: number; language?: string; offset?: number } }) => {
    return await performWebSearch(
      context.query,
      context.country,
      context.count,
      context.language,
      context.offset
    );
  },
});

interface WebSearchResponse {
  type: string;
  web?: {
    results: Array<{
      title: string;
      url: string;
      description: string;
    }>;
    total_results?: number;
  };
  query?: {
    original: string;
  };
}

const performWebSearch = async (
  query: string,
  country?: string,
  count?: number,
  language?: string,
  offset?: number
) => {
  // Kunci API diambil dari variabel lingkungan
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    throw new Error("Kunci API Brave Search tidak ditemukan. Silakan atur variabel lingkungan BRAVE_API_KEY.");
  }

  const baseUrl = "https://api.search.brave.com/res/v1/web/search";

  // Membangun parameter URL
  const params = new URLSearchParams({
    q: query
  });
  
  // Menambahkan parameter opsional
  if (country) params.append("country", country);
  if (count) params.append("count", count.toString());
  if (language) params.append("search_lang", language);
  if (offset) params.append("offset", offset.toString());

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error API Brave: ${response.status} ${errorText}`);
    }

    const data = await response.json() as WebSearchResponse;

    // Memformat respons
    return {
      results: data.web?.results.map(result => ({
        title: result.title,
        url: result.url,
        description: result.description
      })) || [],
      query: data.query?.original || query,
      total_results: data.web?.total_results
    };
  } catch (error) {
    console.error("Kesalahan pencarian web:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Terjadi kesalahan saat melakukan pencarian: ${errorMessage}`);
  }
};
