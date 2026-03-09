import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function testGemini() {
    const apiKey = process.env.GEMINI_SMART_ASSISTANT_API_KEY;
    if (!apiKey) {
        console.error("❌ No API key found in .env");
        return;
    }

    const genAI = new GoogleGenAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-thinking-preview-01-21",
        systemInstruction: `You are a financial assistant. Current date: ${new Date().toISOString()}.
    
    RULES:
    1. One-time spending -> record_expense.
    2. Recurring/Subscriptions/Debt (Netflix, Cashea, Rent) -> record_reminder.
    3. Receiving money -> record_income.
    
    Output ONLY the tool call.`
    });

    const tools = [{
        functionDeclarations: [
            {
                name: "record_expense",
                parameters: {
                    type: "object",
                    properties: {
                        macro_category: { type: "string", enum: ["Alimentos y bebidas", "Vivienda y hogar"] },
                        category: { type: "string" },
                        business_type: { type: "string" },
                        amount: { type: "number" },
                        currency: { type: "string", enum: ["USD", "VES"] }
                    },
                    required: ["macro_category", "category", "business_type", "amount", "currency"]
                }
            },
            {
                name: "record_reminder",
                parameters: {
                    type: "object",
                    properties: {
                        macro_category: { type: "string", enum: ["Recordatorios y Pagos Recurrentes"] },
                        category: { type: "string", enum: ["Suscripciones digitales"] },
                        next_payment_date: { type: "string" },
                        pay_frequency: { type: "string" },
                        amount: { type: "number" },
                        currency: { type: "string" }
                    },
                    required: ["macro_category", "category", "amount", "currency"]
                }
            }
        ]
    }];

    const testCases = [
        "Pagué 20$ en el súper hoy",
        "Tengo que pagar Netflix mañana son 10 dólares"
    ];

    for (const text of testCases) {
        console.log(`\nTesting: "${text}"`);
        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text }] }],
                tools: tools,
                generationConfig: {
                    thinkingConfig: { includeThoughts: true }
                }
            });

            const response = result.response;
            console.log("Thoughts:", response.candidates[0].groundingMetadata?.thoughts || "No thoughts returned");
            const calls = response.functionCalls();
            if (calls) {
                console.log("Tool Call:", JSON.stringify(calls[0], null, 2));
            } else {
                console.log("Raw Response:", response.text());
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
}

testGemini();
