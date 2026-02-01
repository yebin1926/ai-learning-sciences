import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Helper Types
type ChatMode = 'A' | 'B';
interface ChatContext {
    type: 'failure_reflection_1' | 'failure_explanation_request' | 'success_feedback' | 'general' | 'mode_a_failure_explanation';
    question_text?: string;
    user_answer?: string;
    correct_answer?: string;
    explanation?: string;
}

function generateSystemPrompt(mode: ChatMode, context?: ChatContext): string {
    let systemPrompt = "";

    try {
        const promptsDir = path.join(process.cwd(), 'prompts');
        const filename = mode === 'A' ? 'system-a.md' : 'system-b.md';
        const filePath = path.join(promptsDir, filename);
        systemPrompt = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        console.error("Error reading prompt file:", error);
        systemPrompt = mode === 'A'
            ? "You are a helpful assistant. ALWAYS answer in Korean."
            : "You are a helpful AI Tutor. ALWAYS answer in Korean.";
    }

    if (mode === 'B' && context) {
        if (context.type === 'failure_reflection_1') {
            systemPrompt += `
CRITICAL INSTRUCTION: The user just answered INCORRECTLY (Attempt 1).
Question: "${context.question_text}"
User Answer: "${context.user_answer}"

IGNORE previous conversation history regarding other topics.
Your IMMEDIATE goal is to help them reflect.
DO NOT give the answer.
Ask a short, specific question about why they chose "${context.user_answer}" or point out a specific detail in the question.
Ask this question in Korean.
CRITICAL: END your response with the exact phrase: "다시 한번 풀어보세요!"
`;
        } else if (context.type === 'failure_explanation_request') {
            systemPrompt += `
CRITICAL INSTRUCTION: The user failed twice. The correct answer is "${context.correct_answer}".
Explanation: "${context.explanation}"

The user has defined the correct answer now.
Ask them to explain in their own words WHY "${context.correct_answer}" is the correct answer based on your explanation.
Ask this question in Korean.
`;
        } else if (context.type === 'success_feedback') {
            systemPrompt += `
INSTRUCTION: The user just answered CORRECTLY!
Question: "${context.question_text}"
Answer: "${context.correct_answer}"

Give a VERY BRIEF positive reinforcement in Korean (MAX 1 Sentence).
`;
        }
    } else if (mode === 'A' && context) {
        if (context.type === 'mode_a_failure_explanation') {
            systemPrompt += `
CRITICAL INSTRUCTION: The user answered INCORRECTLY.
Question: "${context.question_text}"
User Answer: "${context.user_answer}"
Correct Answer: "${context.correct_answer}"

The user cannot retry.
Explain WHY the user's answer is incorrect and WHY the correct answer is correct.
Keep it concise and helpful.
Answer in Korean.
`;
        }
    }
    return systemPrompt;
}

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
        const model = "gpt-5.1";

        const systemPrompt = generateSystemPrompt(mode, context);

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


        // 4. API Call with Streaming
        const stream = await openai.chat.completions.create({
            model: model,
            messages: apiMessages,
            stream: true,
        });

        // Create a ReadableStream for the response
        const encoder = new TextEncoder();
        const customStream = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        controller.enqueue(encoder.encode(content));
                    }
                }
                controller.close();
            },
        });

        return new NextResponse(customStream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });

    } catch (error: any) {
        console.error("OpenAI API error:", error);
        return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
    }
}
