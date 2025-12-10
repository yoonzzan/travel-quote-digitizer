
import { GoogleGenAI, Type, Schema, HarmBlockThreshold, HarmCategory } from "@google/genai";
import { TravelQuoteData } from "../types";
import { cleanJsonString, normalizeData, parseSpreadsheet, fileToBase64, SYSTEM_INSTRUCTION } from "./common";

const quoteSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    quote_info: {
      type: Type.OBJECT,
      properties: {
        code: { type: Type.STRING, description: "Quote code (견적코드)" },
        agency: { type: Type.STRING, description: "Travel agency name (여행사명)" },
        manager_note: { type: Type.STRING, description: "Manager's note/comment (담당자 비고)" },
      },
      required: ["code", "agency"],
    },
    trip_summary: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Trip title (여행 상품명)" },
        pax_adult: { type: Type.INTEGER, description: "Adult count (성인 인원)" },
        pax_child: { type: Type.INTEGER, description: "Child count (아동 인원)" },
        period_text: { type: Type.STRING, description: "Duration (e.g. 3박 5일)" },
        start_date: { type: Type.STRING, description: "Start date (YYYY-MM-DD) or empty" },
        countries: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of countries visited" },
        cities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of cities visited" },
      },
      required: ["title", "pax_adult", "period_text"],
    },
    cost: {
      type: Type.OBJECT,
      properties: {
        total_price: { type: Type.INTEGER, description: "Total price per person (Customer Facing)" },
        currency: { type: Type.STRING, description: "Currency string (e.g. KRW, USD, SGD, RM)" },
        inclusions: { type: Type.ARRAY, items: { type: Type.STRING } },
        exclusions: { type: Type.ARRAY, items: { type: Type.STRING } },
        shopping_conditions: { type: Type.STRING, description: "Shopping options (e.g. 노쇼핑)" },
        details: {
          type: Type.ARRAY,
          description: "Internal cost breakdown (내부 정산용 원가 내역)",
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "Cost Category (호텔, 차량, 가이드, 관광지, 식사, 기타)" },
              detail: { type: Type.STRING, description: "Detailed item name (e.g. 힐튼호텔 2박, 45인승 버스)" },
              currency: { type: Type.STRING, description: "Currency string. Check HEADERS first (e.g. 'Price (RM)'). Extract EXACTLY as written. Do NOT default to KRW. Return empty string if unknown." },
              amount: { type: Type.INTEGER, description: "Total Cost amount (Calculated as Qty * Freq * UnitPrice). Extract EXACT number from cell." },
              unit: { type: Type.STRING, description: "Unit (e.g. 박, 명, 대, 개)" },
              quantity: { type: Type.NUMBER, description: "Quantity (Q'ty)" },
              frequency: { type: Type.NUMBER, description: "Frequency (C.T / 횟수)" },
              unit_price: { type: Type.NUMBER, description: "Unit Price (단가)" },
              note: { type: Type.STRING }
            },
            required: ["category", "detail", "amount"]
          }
        }
      },
      required: ["total_price", "currency"],
    },
    itinerary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER },
          location: { type: Type.STRING },
          transport: { type: Type.STRING },
          activities: { type: Type.ARRAY, items: { type: Type.STRING } },
          meals: {
            type: Type.OBJECT,
            properties: {
              breakfast: { type: Type.STRING },
              lunch: { type: Type.STRING },
              dinner: { type: Type.STRING },
            },
          },
          hotel: { type: Type.STRING },
        },
        required: ["day", "activities", "meals", "hotel"],
      },
    },
  },
  required: ["quote_info", "trip_summary", "cost", "itinerary"],
};

export const extractWithGemini = async (file: File, apiKey: string): Promise<TravelQuoteData> => {
  const ai = new GoogleGenAI({ apiKey });

  let contentPart;
  const isSpreadsheet = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');

  try {
    if (isSpreadsheet) {
      const textContent = await parseSpreadsheet(file);
      console.log("Parsed Spreadsheet Content Length:", textContent.length);
      contentPart = { text: textContent };
    } else if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      const base64Data = await fileToBase64(file);
      contentPart = {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        }
      };
    } else {
      const textContent = await file.text();
      contentPart = { text: textContent };
    }
  } catch (e: any) {
    throw new Error(`파일 처리 중 오류 발생: ${e.message}`);
  }

  try {
    const apiCall = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [contentPart]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: quoteSchema,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      },
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("AI 응답 시간 초과 (3분). 데이터가 너무 많거나 처리가 지연되고 있습니다. 다시 시도해주세요.")), 180000);
    });

    const response: any = await Promise.race([apiCall, timeoutPromise]);
    const text = response.text;

    if (!text) throw new Error("AI가 빈 응답을 반환했습니다.");

    const cleanedJson = cleanJsonString(text);

    try {
      const parsedData = JSON.parse(cleanedJson);
      return normalizeData(parsedData);
    } catch (parseError) {
      console.error("JSON Parse Failed:", cleanedJson);
      throw new Error("데이터 변환 실패 (JSON 형식이 아님).");
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let userMsg = error.message || "알 수 없는 오류";

    if (userMsg.includes("429")) userMsg = "API 사용량 초과 (429). 잠시 후 시도하세요.";
    else if (userMsg.includes("400")) userMsg = "요청 형식이 잘못되었습니다 (400).";
    else if (userMsg.includes("Rpc failed") || userMsg.includes("xhr error")) {
      userMsg = "네트워크 연결 오류입니다. 광고 차단 프로그램(AdBlock)이나 VPN을 끄고 다시 시도해주세요.";
    }

    throw new Error(userMsg);
  }
};
