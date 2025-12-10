
import { TravelQuoteData } from "../types";

// Extend Window interface for SheetJS
declare global {
    interface Window {
        XLSX: any;
    }
}

export const fileToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            if (!base64String) {
                reject(new Error("파일 내용을 읽을 수 없습니다."));
                return;
            }
            // Remove data URL prefix if present (e.g., "data:image/png;base64,")
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = () => {
            console.error("FileReader Error:", reader.error);
            reject(new Error(`파일 읽기 실패: ${reader.error?.message || "알 수 없는 오류"}`));
        };
        reader.readAsDataURL(file);
    });
};

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

                const workbook = window.XLSX.read(data, { type: 'array', cellDates: true });
                let fullText = `--- DOCUMENT START: ${file.name} ---\n`;

                workbook.SheetNames.forEach((sheetName: string) => {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData && jsonData.length > 0) {
                        fullText += `\n[SHEET: ${sheetName}]\n`;
                        jsonData.forEach((row: any[]) => {
                            const rowStr = row.map((cell: any) => {
                                if (cell === null || cell === undefined) return "";
                                return String(cell).replace(/[\r\n]+/g, " ").trim();
                            }).join(" | ");
                            fullText += `| ${rowStr} |\n`;
                        });
                    }
                });

                if (fullText.length > 200000) {
                    fullText = fullText.substring(0, 200000) + "\n... (Content Truncated) ...";
                }

                resolve(fullText);
            } catch (error: any) {
                console.error("SheetJS processing error:", error);
                if (file.name.toLowerCase().endsWith('.csv')) {
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
export const cleanJsonString = (text: string): string => {
    if (!text) return "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return jsonMatch[0];
    }
    return text.trim();
};

export const normalizeData = (data: any): TravelQuoteData => {
    const validCategories = ["호텔", "차량", "가이드", "관광지", "식사", "기타"];

    // Default Pax calculation
    const defaultPax = (data?.trip_summary?.pax_adult || 0) + (data?.trip_summary?.pax_child || 0);

    return {
        quote_info: {
            code: data?.quote_info?.code || '',
            agency: data?.quote_info?.agency || '',
            manager_note: data?.quote_info?.manager_note || '',
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
                    let currencyVal = (d?.currency || '').trim();
                    if (currencyVal.toUpperCase() === 'NULL') currencyVal = '';

                    // --- FILTER LOGIC: Remove empty items ---
                    if (!detailText && amountVal === 0) return null;

                    // --- UX LOGIC: Remove "정보없음" placeholders ---
                    if (detailText === "정보없음" || detailText === "내용없음") detailText = "";

                    // Intelligent Categorization
                    if (!validCategories.includes(cat) || cat === '기타') {
                        const combinedText = (cat + ' ' + detailText).toLowerCase();

                        if (combinedText.includes('숙소') || combinedText.includes('리조트') || combinedText.includes('호텔') || combinedText.includes('배드') || combinedText.includes('bed') || combinedText.includes('room') || combinedText.includes('박')) cat = '호텔';
                        else if (combinedText.includes('버스') || combinedText.includes('교통') || combinedText.includes('차량') || combinedText.includes('픽업') || combinedText.includes('샌딩')) cat = '차량';
                        else if (combinedText.includes('입장') || combinedText.includes('투어') || combinedText.includes('티켓') || combinedText.includes('관람')) cat = '관광지';
                        else if (combinedText.includes('조식') || combinedText.includes('중식') || combinedText.includes('석식') || combinedText.includes('식사') || combinedText.includes('특식') || combinedText.includes('간식')) cat = '식사';
                        else if (combinedText.includes('가이드') || combinedText.includes('기사') || combinedText.includes('팁') || combinedText.includes('인솔자')) cat = '가이드';
                        else cat = '기타';
                    }
                    return {
                        category: cat,
                        detail: detailText,
                        currency: currencyVal,
                        amount: amountVal,
                        unit: d?.unit || '',
                        quantity: typeof d?.quantity === 'number' ? d.quantity : 1,
                        frequency: typeof d?.frequency === 'number' ? d.frequency : 1,
                        unit_price: (typeof d?.unit_price === 'number' && d.unit_price > 0)
                            ? d.unit_price
                            : (amountVal > 0 && (typeof d?.quantity !== 'number' || d.quantity === 1)) ? amountVal : 0,
                        note: d?.note || ''
                    };
                })
                .filter((item: any) => item !== null),
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

export const SYSTEM_INSTRUCTION = `
    Role: You are an expert Travel Itinerary Parser (Korean).
    Task: Extract structured JSON data from the provided travel document (Excel/Image/Text).
    
    Data Interpretation Rules:
    - **Currency Extraction (CRITICAL)**: 
      - Look for currency codes (e.g. **RM**, **USD**, **SGD**, **EUR**, **￥**, **$**) in **Column Headers** (e.g. "단가(RM)", "Price (USD)").
      - If a header defines the currency, **APPLY IT TO ALL ROWS** in that column.
      - If a cell contains "RM 50", extract currency="RM", amount=50.
      - **NEVER return "NULL" as a string.** If currency is unknown, return empty string "".
      - Do NOT default to KRW unless explicitly stated.
    - **Total Price (Per Person)**:
      - Look for keywords like "**지상비**", "**1인 상품가**", "**판매가**", "**Total**".
      - If you see "지상비 : 677,000원", extract **677000**.
      - **OCR Caution**: Carefully distinguish '6' vs '8', '1' vs '7'. (e.g. 677,000 vs 777,000).
    - **Numbers**: Extract EXACT numbers. No auto-multiplication.
    
    Extraction Rules:
    1. **Quote Info**: Code, Agency.
    2. **Trip Summary**: Title, Pax, Period, Countries, Cities.
    3. **Cost**: 
       - **Total Price**: Customer-facing final price (1 Person).
       - **Inclusions/Exclusions**: Split items. Remove conversational endings.
       - **Internal Cost Details**:
         - Extract **EVERY** cost item.
         - **Currency**: Check **HEADERS** first. If the column header is "RM", then every item in that column has currency "RM".
         - **Merged Amount Cells**: If price appears only in the first row of a group, assign it to the first item.
         - **Rows with Empty Amount**: Extract rows with valid Detail but empty/0 Amount as separate items with **Amount = 0**.
         - **Empty Row Exclusion**: If a row has **NO Description/Detail** AND Amount is 0, **DO NOT extract it**.
         - Categorize into: "호텔", "차량", "가이드", "관광지", "식사", "기타".
    4. **Itinerary**: Day-by-day schedule.

    Output Format:
    - JSON Only.
`;
