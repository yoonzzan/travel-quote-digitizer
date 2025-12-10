
import { TravelQuoteData } from "../types";
import { extractWithGemini } from "./geminiService";
import { extractWithOpenAI } from "./openaiService";

export const extractDataFromDocument = async (file: File, apiKey: string): Promise<TravelQuoteData> => {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
        throw new Error("API 키가 없습니다. 설정에서 키를 입력해주세요.");
    }

    // Detect API Provider based on Key format
    if (trimmedKey.startsWith("sk-")) {
        console.log("Using OpenAI Service");
        return extractWithOpenAI(file, trimmedKey);
    } else if (trimmedKey.startsWith("AIza")) {
        console.log("Using Google Gemini Service");
        return extractWithGemini(file, trimmedKey);
    } else {
        // Fallback or Error
        // Some users might have non-standard keys or proxies, but usually:
        // Gemini: AIza...
        // OpenAI: sk-...
        // Let's assume Gemini if unsure, or throw helpful error.
        console.warn("Unknown API Key format. Defaulting to Gemini.");
        try {
            return await extractWithGemini(file, trimmedKey);
        } catch (e) {
            throw new Error("유효하지 않은 API 키 형식입니다. Google Gemini(AIza...) 또는 OpenAI(sk-...) 키를 입력해주세요.");
        }
    }
};
