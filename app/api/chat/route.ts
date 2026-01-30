import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import crypto from 'crypto';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { messages, context, mode } = await req.json();

        // 1. Validation
        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
        }

        // 2. Logging Setup
        const timestamp = new Date().toISOString();
        const model = "gpt-5-mini"; // or whatever model identifier

        let systemPrompt = "";

        if (mode === 'A') {
            // MODE A: Basic Helper (No pedagogical scaffolding)
            systemPrompt = `You are a helpful assistant. 
answer questions if the user types in a question. 
Do not provide unsolicited feedback.`;
        } else {
            // MODE B: Scaffolded Tutor (Default)
            systemPrompt = `You are a helpful and friendly AI Tutor for an English learning app.
Your goal is to help the student learn. 
- Be encouraging and concise.
- If the user asks a general question, answer it helpfully.
- Use **Markdown** formatting (bold, lists, etc.) to make your responses engaging and structured.
`;

            // Dynamic Context for Mode B Only
            if (context) {
                if (context.type === 'failure_reflection_1') {
                    systemPrompt += `
CRITICAL INSTRUCTION: The user just answered INCORRECTLY (Attempt 1).
Question: "${context.question_text}"
User Answer: "${context.user_answer}"

IGNORE previous conversation history regarding other topics.
Your IMMEDIATE goal is to help them reflect.
DO NOT give the answer.
Ask a short, specific question about why they chose "${context.user_answer}" or point out a specific detail in the question.
`;
                } else if (context.type === 'failure_explanation_request') {
                    systemPrompt += `
CRITICAL INSTRUCTION: The user failed twice. The correct answer is "${context.correct_answer}".
Explanation: "${context.explanation}"

The user has defined the correct answer now.
Ask them to explain in their own words WHY "${context.correct_answer}" is the correct answer based on your explanation.
`;
                } else if (context.type === 'success_feedback') {
                    systemPrompt += `
INSTRUCTION: The user just answered CORRECTLY!
Question: "${context.question_text}"
Answer: "${context.correct_answer}"

Give a VERY BRIEF positive reinforcement.
`;
                }
            }
        }

        const apiMessages = [
            { role: "system", content: systemPrompt },
            ...messages.map((msg: any) => ({
                role: msg.role === 'bot' ? 'assistant' : msg.role,
                content: msg.text || msg.content
            }))
        ];

        // Fix for Repeated Responses:
        // If specific context is present, we might want to suppress passing the *entire* history if it confuses the model,
        // OR we trust the "CRITICAL INSTRUCTION" appended to system prompt to override it.
        // verified: The appended system prompt above should be sufficient.


        // 4. API Call
        const completion = await openai.chat.completions.create({
            model: model,
            messages: apiMessages,
        });

        const assistantMessage = completion.choices[0]?.message;

        // Logging
        console.log("CHAT_LOG:", JSON.stringify({
            timestamp,
            context_type: context?.type || 'general',
            model,
            messages_count: messages.length,
            response_preview: assistantMessage?.content?.substring(0, 50)
        }));

        return NextResponse.json({
            message: assistantMessage,
        });

    } catch (error: any) {
        console.error("OpenAI API error:", error);
        return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
    }
}
