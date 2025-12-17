import OpenAI from 'openai';

const SYSTEM_INSTRUCTION = `
    Role: You are an expert Travel Itinerary Parser (Korean).
    Task: Extract structured JSON data from the provided travel document (Excel/Image/Text).
    
    Data Interpretation Rules:
    - **Currency Extraction (CRITICAL)**: 
      - **Look EVERYWHERE for currency codes**: Headers (e.g. "단가(RM)"), Cell Values (e.g. "RM 500", "$100"), or Summary Tables.
      - **Explicitly check Column Headers**: If a header says "RM", "USD", "SGD", apply that currency to ALL items in that column.
      - **Formatted Cells**: If a cell value is "RM 300", extract currency="RM" and amount=300.
      - **Contextual Inference**: If most items use "RM" and one item has no currency but is in the same column, assume "RM".
      - **NEVER return "NULL"**. If unknown, return empty string "".
      - **Do NOT default to KRW** unless the document explicitly says "원" or "KRW".
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
       - **Inclusions/Exclusions**: 
         - **Split Combined Items**: If a line contains multiple items separated by commas (e.g., "개인경비, 옵션비용, 포터비"), split them into separate strings in the array.
         - **Clean Text**: Remove conversational phrases like "불포함 입니다", "포함 사항입니다", "별도 문의", "제외" so that ONLY the noun remains (e.g., "개인경비 불포함 입니다." -> "개인경비").
       - **Internal Cost Details**:
         - Extract **EVERY** cost item.
         - **Currency**: Check **HEADERS** first. If the column header is "RM", then every item in that column has currency "RM".
         - **Merged Amount Cells**: If price appears only in the first row of a group, assign it to the first item.
         - **Rows with Empty Amount**: Extract rows with valid Detail but empty/0 Amount as separate items with **Amount = 0**.
         - **Empty Row Exclusion**: If a row has **NO Description/Detail** AND Amount is 0, **DO NOT extract it**.
         - Categorize into: "항공", "호텔", "차량", "가이드", "관광지", "식사", "기타".
    4. **Itinerary**: Day-by-day schedule.

    Output Format:
    - JSON Only.
    - The output must be a valid JSON object matching the structure:
    {
      "quote_info": { "code": string, "agency": string, "manager_note": string },
      "trip_summary": { "title": string, "pax_adult": number, "pax_child": number, "period_text": string, "start_date": string, "countries": string[], "cities": string[] },
      "cost": { "total_price": number, "currency": string, "inclusions": string[], "exclusions": string[], "shopping_conditions": string, "details": [{ "category": string, "detail": string, "currency": string, "amount": number, "unit": string, "quantity": number, "frequency": number, "unit_price": number, "note": string }] },
      "itinerary": [{ "day": number, "location": string, "transport": string, "activities": string[], "meals": { "breakfast": string, "lunch": string, "dinner": string }, "hotel": string }]
    }
`;

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: OPENAI_API_KEY is missing' });
    }

    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'No content provided' });
        }

        const openai = new OpenAI({ apiKey });

        let messages: any[] = [
            { role: "system", content: SYSTEM_INSTRUCTION }
        ];

        if (content.text) {
            messages.push({ role: "user", content: content.text });
        } else if (content.images && Array.isArray(content.images)) {
            // Handle multiple images (e.g. PDF pages converted to images)
            const contentParts: any[] = [
                { type: "text", text: "Analyze this travel quote document (converted from PDF/Images) and extract data." }
            ];

            content.images.forEach((img: { data: string, mimeType: string }) => {
                const dataUrl = `data:${img.mimeType};base64,${img.data}`;
                contentParts.push({
                    type: "image_url",
                    image_url: {
                        url: dataUrl,
                        detail: "high"
                    }
                });
            });

            messages.push({
                role: "user",
                content: contentParts
            });
        } else if (content.inlineData) {
            const { data, mimeType } = content.inlineData;

            if (mimeType === 'application/pdf') {
                return res.status(400).json({ error: "PDF file detected. Please ensure the client converts PDF to images before sending." });
            }

            const dataUrl = `data:${mimeType};base64,${data}`;
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: "Analyze this travel quote image and extract data." },
                    {
                        type: "image_url",
                        image_url: {
                            url: dataUrl,
                            detail: "high"
                        }
                    }
                ]
            });
        } else {
            return res.status(400).json({ error: 'Invalid content format' });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: messages,
            response_format: { type: "json_object" },
            temperature: 0.1, // Low temperature for extraction
        });

        const text = completion.choices[0].message.content;
        return res.status(200).json({ result: text });

    } catch (error: any) {
        console.error("OpenAI API Error:", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
