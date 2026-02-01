import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Force this route to be dynamic so Vercel doesn't cache it
export const dynamic = "force-dynamic";

// Initialize Redis
// It will automatically read UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env
// or KV_REST_API_URL / KV_REST_API_TOKEN if you use Vercel KV aliases
const redis = Redis.fromEnv();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { participantId, type, data } = body;

        if (!participantId) {
            return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
        }

        const key = `logs:${participantId}`;

        // 1. Fetch existing data
        // Returns null if not found
        let existingData: any = await redis.get(key);

        if (!existingData) {
            existingData = {};
        }

        // 2. Merge Data
        // Replicate the logic from the file-based system
        if (type === 'learn') {
            existingData.learnSession = {
                ...existingData.learnSession,
                ...data,
                timestamp: new Date().toISOString()
            };
        } else if (type === 'test') {
            existingData.testSession = {
                ...existingData.testSession,
                ...data,
                timestamp: new Date().toISOString()
            };
        } else {
            // General update (e.g. demographics from test page)
            existingData = { ...existingData, ...data };
        }

        // 3. Save back to Redis
        await redis.set(key, existingData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error writing log to Redis:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
