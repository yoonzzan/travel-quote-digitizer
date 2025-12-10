
import OpenAI from "openai";
import { TravelQuoteData } from "../types";
import { cleanJsonString, normalizeData, parseSpreadsheet, fileToBase64, SYSTEM_INSTRUCTION } from "./common";

// Append schema description for OpenAI since it doesn't support 'responseSchema' object in the same way as Gemini without strict structured outputs
const OPENAI_SCHEMA_DESC = `
    
    JSON Schema Structure:
    {
      "quote_info": { "code": "string", "agency": "string", "manager_note": "string" },
      "trip_summary": {
        "title": "string",
        "pax_adult": number,
        "pax_child": number,
        "period_text": "string",
        "start_date": "YYYY-MM-DD",
        "countries": ["string"],
        "cities": ["string"]
      },
      "cost": {
        "total_price": number,
        "currency": "string",
        "inclusions": ["string"],
        "exclusions": ["string"],
        "shopping_conditions": "string",
        "details": [
          {
            "category": "string (호텔|차량|가이드|관광지|식사|기타)",
            "detail": "string",
            "currency": "string",
            "amount": number,
            "unit": "string",
            "quantity": number,
            "frequency": number,
            "unit_price": number,
            "note": "string"
          }
        ]
      },
      "itinerary": [
        {
          "day": number,
          "location": "string",
          "transport": "string",
          "activities": ["string"],
          "meals": { "breakfast": "string", "lunch": "string", "dinner": "string" },
          "hotel": "string"
        }
      ]
    }
`;

export const extractWithOpenAI = async (file: File, apiKey: string): Promise<TravelQuoteData> => {
    const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Client-side usage
    });

    let userContent: any[] = [];
    const isSpreadsheet = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');

    try {
        if (isSpreadsheet) {
            const textContent = await parseSpreadsheet(file);
            userContent.push({ type: "text", text: textContent });
        } else if (file.type.startsWith('image/')) {
            const base64Data = await fileToBase64(file);
            userContent.push({
                type: "image_url",
                image_url: {
                    url: `data:${file.type};base64,${base64Data}`,
                    detail: "high"
                }
            });
        } else {
            const textContent = await file.text();
            userContent.push({ type: "text", text: textContent });
        }
    } catch (e: any) {
        throw new Error(`파일 처리 중 오류 발생: ${e.message}`);
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: SYSTEM_INSTRUCTION + OPENAI_SCHEMA_DESC
                },
                {
                    role: "user",
                    content: userContent
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1, // Low temperature for consistent extraction
        });

        const text = completion.choices[0].message.content;
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
        console.error("OpenAI API Error:", error);
        let userMsg = error.message || "알 수 없는 오류";

        if (userMsg.includes("401")) userMsg = "API 키가 올바르지 않습니다 (401).";
        else if (userMsg.includes("429")) userMsg = "API 사용량 초과 (429). 잠시 후 시도하세요.";

        throw new Error(userMsg);
    }
};
