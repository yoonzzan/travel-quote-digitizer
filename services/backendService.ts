
import { TravelQuoteData } from "../types";
import { cleanJsonString, normalizeData, parseSpreadsheet, fileToBase64, extractTextFromPdf } from "./common";

export const extractWithBackend = async (file: File): Promise<TravelQuoteData> => {
  let contentPart;
  const isSpreadsheet = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');

  try {
    if (isSpreadsheet) {
      const textContent = await parseSpreadsheet(file);
      console.log("Parsed Spreadsheet Content Length:", textContent.length);
      contentPart = { text: textContent };
    } else if (file.type === 'application/pdf') {
      console.log("Extracting Text from PDF...");
      const pdfText = await extractTextFromPdf(file);
      console.log("Extracted PDF Text Length:", pdfText.length);
      contentPart = { text: pdfText };
    } else if (file.type.startsWith('image/')) {
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
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: contentPart }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.result;

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
    console.error("Backend API Error:", error);
    let userMsg = error.message || "알 수 없는 오류";

    if (userMsg.includes("429")) userMsg = "API 사용량 초과 (429). 잠시 후 시도하세요.";
    else if (userMsg.includes("504")) userMsg = "서버 응답 시간 초과. 파일이 너무 크거나 AI 처리가 지연되고 있습니다.";

    throw new Error(userMsg);
  }
};
