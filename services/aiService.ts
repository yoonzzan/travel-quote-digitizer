
import { TravelQuoteData } from "../types";
import { extractWithBackend } from "./backendService";

export const extractDataFromDocument = async (file: File): Promise<TravelQuoteData> => {
    return extractWithBackend(file);
};
