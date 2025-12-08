
import { GoogleGenAI, Type, Schema, HarmBlockThreshold, HarmCategory } from "@google/genai";
import { TravelQuoteData } from "../types";

// Extend Window interface for SheetJS
declare global {
  interface Window {
    XLSX: any;
  }
}

// Helper to convert file to Base64 for images and PDFs
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (!base64String) {
        reject(new Error("파일 내용을 읽을 수 없습니다."));
        return;
      }
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = () => {
      console.error("FileReader Error:", reader.error);
      reject(new Error(`파일 읽기 실패: ${reader.error?.message || "알 수 없는 오류"}`));
    };
    reader.readAsDataURL(file);
  });
};

// Helper to parse Excel/CSV using SheetJS
export const parseSpreadsheet = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;

        if (!window.XLSX) {
          reject(new Error("엑셀 처리 라이브러리가 로드되지 않았습니다. 페이지를 새로고침 후 다시 시도해주세요."));
          return;
        }

        // Read workbook
        const workbook = window.XLSX.read(data, { type: 'array', cellDates: true });

        let fullText = `--- DOCUMENT START: ${file.name} ---\n`;

        // Process each sheet
        workbook.SheetNames.forEach((sheetName: string) => {
          const worksheet = workbook.Sheets[sheetName];
          // Use sheet_to_json for better formatting than CSV
          const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData && jsonData.length > 0) {
            fullText += `\n[SHEET: ${sheetName}]\n`;
            // Markdown Table format for better AI understanding
            jsonData.forEach((row: any[]) => {
              const rowStr = row.map((cell: any) => {
                if (cell === null || cell === undefined) return "";
                // Replace newlines with space to keep table structure
                return String(cell).replace(/[\r\n]+/g, " ").trim();
              }).join(" | ");
              fullText += `| ${rowStr} |\n`;
            });
          }
        });

        // Truncate if too long
        if (fullText.length > 200000) {
          fullText = fullText.substring(0, 200000) + "\n... (Content Truncated) ...";
        }

        resolve(fullText);
      } catch (error: any) {
        console.error("SheetJS processing error:", error);

        // Fallback for simple CSVs
        if (file.name.toLowerCase().endsWith('.csv')) {
          console.log("Attempting fallback: Reading CSV as text");
          const textReader = new FileReader();
          textReader.onload = (ev) => resolve(ev.target?.result as string);
          textReader.onerror = () => reject(new Error("CSV 텍스트 읽기 실패"));
          textReader.readAsText(file);
        } else {
          const errorMessage = error instanceof Error ? error.message : "알 수 없는 파싱 오류";
          reject(new Error(`엑셀 파일 변환 실패: ${errorMessage}`));
        }
      }
    };

    reader.onerror = () => {
      console.error("FileReader Error:", reader.error);
      reject(new Error(`파일 읽기 실패: ${reader.error?.message || "알 수 없는 오류"}`));
    };

    reader.readAsArrayBuffer(file);
  });
};

// Robust JSON cleaner
const cleanJsonString = (text: string): string => {
  if (!text) return "{}";

  // Regex to capture JSON object (greedy match for outermost braces)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return text.trim();
};

const quoteSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    quote_info: {
      type: Type.OBJECT,
      properties: {
        code: { type: Type.STRING, description: "Quote code (견적코드)" },
        agency: { type: Type.STRING, description: "Travel agency name (여행사명)" },
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
              currency: { type: Type.STRING, description: "Currency string. Extract EXACTLY as written (e.g. 'RM', 'SGD$', '$', 'USD', '원'). Do NOT default to KRW if other currency is present." },
              amount: { type: Type.INTEGER, description: "Cost amount. Extract EXACT number from cell. Do not auto-multiply." },
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

// Normalize data to prevent UI crashes if AI omits fields
const normalizeData = (data: any): TravelQuoteData => {
  const validCategories = ["호텔", "차량", "가이드", "관광지", "식사", "기타"];

  // Default Pax calculation
  const defaultPax = (data?.trip_summary?.pax_adult || 0) + (data?.trip_summary?.pax_child || 0);

  return {
    quote_info: {
      code: data?.quote_info?.code || '',
      agency: data?.quote_info?.agency || '',
    },
    trip_summary: {
      title: data?.trip_summary?.title || '',
      pax_adult: data?.trip_summary?.pax_adult || 0,
      pax_child: data?.trip_summary?.pax_child || 0,
      period_text: data?.trip_summary?.period_text || '',
      start_date: data?.trip_summary?.start_date || '',
      countries: data?.trip_summary?.countries || [],
      cities: data?.trip_summary?.cities || [],
    },
    cost: {
      total_price: data?.cost?.total_price || 0,
      currency: data?.cost?.currency || 'KRW',
      inclusions: data?.cost?.inclusions || [],
      exclusions: data?.cost?.exclusions || [],
      shopping_conditions: data?.cost?.shopping_conditions || '',
      exchangeRates: {}, // Initialize empty
      internal_pax: defaultPax > 0 ? defaultPax : 1, // Initialize internal pax for calculation
      details: (data?.cost?.details || [])
        .map((d: any) => {
          let cat = d?.category || '기타';
          let detailText = (d?.detail || '').trim();
          const amountVal = typeof d?.amount === 'number' ? d.amount : 0;
          const currencyVal = (d?.currency || '').trim(); // Default to empty string

          // --- FILTER LOGIC: Remove empty items ---
          if (!detailText && amountVal === 0) return null;

          // --- UX LOGIC: Remove "정보없음" placeholders ---
          if (detailText === "정보없음" || detailText === "내용없음") detailText = "";

          // Intelligent Categorization
          // If category is invalid or '기타', try to infer from the Detail text as well
          if (!validCategories.includes(cat) || cat === '기타') {
            const combinedText = (cat + ' ' + detailText).toLowerCase();

            if (combinedText.includes('숙소') || combinedText.includes('리조트') || combinedText.includes('호텔')) cat = '호텔';
            else if (combinedText.includes('버스') || combinedText.includes('교통') || combinedText.includes('차량') || combinedText.includes('픽업') || combinedText.includes('샌딩')) cat = '차량';
            else if (combinedText.includes('입장') || combinedText.includes('투어') || combinedText.includes('티켓') || combinedText.includes('관람')) cat = '관광지';
            else if (combinedText.includes('조식') || combinedText.includes('중식') || combinedText.includes('석식') || combinedText.includes('식사') || combinedText.includes('특식') || combinedText.includes('간식')) cat = '식사';
            // Guide/Driver logic
            else if (combinedText.includes('가이드') || combinedText.includes('기사') || combinedText.includes('팁') || combinedText.includes('핸들링') || combinedText.includes('인솔자')) cat = '가이드';
            else cat = '기타';
          }
          return {
            category: cat,
            detail: detailText, // Empty string if no info
            currency: currencyVal,
            amount: amountVal,
            note: d?.note || ''
          };
        })
        .filter((item: any) => item !== null), // Remove filtered items
    },
    itinerary: (data?.itinerary || []).map((day: any) => ({
      day: day?.day || 0,
      location: day?.location || '',
      transport: day?.transport || '',
      activities: day?.activities || [],
      meals: {
        breakfast: day?.meals?.breakfast || '',
        lunch: day?.meals?.lunch || '',
        dinner: day?.meals?.dinner || '',
      },
      hotel: day?.hotel || '',
    })),
  };
};

export const extractDataFromDocument = async (file: File, apiKey: string): Promise<TravelQuoteData> => {
  if (!apiKey) {
    throw new Error("API 키가 없습니다. 'API 키 재설정'을 눌러 키를 입력해주세요.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let contentPart;
  const isSpreadsheet = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');

  try {
    if (isSpreadsheet) {
      const textContent = await parseSpreadsheet(file);
      console.log("Parsed Spreadsheet Content Length:", textContent.length);
      contentPart = { text: textContent };
    } else if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      contentPart = await fileToGenerativePart(file);
    } else {
      const textContent = await file.text();
      contentPart = { text: textContent };
    }
  } catch (e: any) {
    throw new Error(`파일 처리 중 오류 발생: ${e.message}`);
  }

  const systemInstruction = `
    Role: You are an expert Travel Itinerary Parser (Korean).
    Task: Extract structured JSON data from the provided travel document (Excel/Image/Text).
    
    Data Interpretation Rules:
    - **Currency Awareness**:
      - Extract currency and amounts separately.
      - If a cell says "RM 320", currency="RM", amount=320.
      - If a column header says "Amount (USD)" or "Price (SGD)", apply that currency to all rows in that column.
      - **Context Inference**: If a cell only has a number (e.g. "300"), look at the "Currency" or "Unit" column in the same row, or the table header. If the entire table seems to be in "RM" or "USD", use that.
      - Do NOT default currency to "KRW" if it is missing. Leave it empty ONLY if absolutely no clue is found.
    - **Number Extraction**:
      - Extract EXACT numbers. Do NOT multiply by 1000 automatically (e.g. if cell says 2400, extract 2400, not 2400000).
    
    Extraction Rules:
    1. **Quote Info**: Code, Agency.
    2. **Trip Summary**: Title, Pax, Period, Countries, Cities.
       - **Countries/Cities**: Extract all unique countries and cities mentioned in the itinerary or title.
    3. **Cost**: 
       - **Total Price (Customer Facing)**: This is the final price quoted to the customer. DO NOT sum up the internal details. Find the specific field that says "Total Price" or "Per Person Price".
       - **Inclusions/Exclusions**:
         - **Split items**: If multiple items are listed in one line (comma/slash separated), split them into separate array elements.
         - **Concise Nouns**: Remove conversational endings (e.g. "불포함입니다", "별도", "포함", "제외"). Keep only the core item name.
         - Example: "개인경비, 매너팁 불포함" -> ["개인경비", "매너팁"]
       - **Internal Cost Details**:
         - Extract EVERY cost item found in the cost breakdown table.
         - **Include items with 0 cost** (e.g. free services, included items).
         - Categorize into: "호텔", "차량", "가이드", "관광지", "식사", "기타".
         - Use "기타" if the category is ambiguous (but check if it relates to Driver/Tip -> Guide).
    4. **Itinerary**: Day-by-day schedule.
    
    Output Format:
    - JSON Only.
  `;

  try {
    const apiCall = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [contentPart]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: quoteSchema,
        // Disable safety settings to prevent blocking travel content
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      },
    });

    // 180s Timeout (Increased from 60s)
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

    // Friendly error mapping
    if (userMsg.includes("429")) userMsg = "API 사용량 초과 (429). 잠시 후 시도하세요.";
    else if (userMsg.includes("400")) userMsg = "요청 형식이 잘못되었습니다 (400).";
    else if (userMsg.includes("Rpc failed") || userMsg.includes("xhr error")) {
      userMsg = "네트워크 연결 오류입니다. 광고 차단 프로그램(AdBlock)이나 VPN을 끄고 다시 시도해주세요.";
    }

    throw new Error(userMsg);
  }
};
