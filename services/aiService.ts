
import { TravelQuoteData } from "../types";
import { extractWithBackend } from "./backendService";

export const extractDataFromDocument = async (fileOrText: File | string): Promise<TravelQuoteData> => {
    // Use the backend service (which now uses OpenAI)
    return await extractWithBackend(fileOrText);
};
