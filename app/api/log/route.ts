import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { participantId, type, data } = body;

        if (!participantId) {
            return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
        }

        // Ensure logs directory exists
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir);
        }

        const filePath = path.join(logsDir, `${participantId}.json`);

        let fileData: any = {};

        // Read existing data if available
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            try {
                fileData = JSON.parse(fileContent);
            } catch (e) {
                console.error("Error parsing existing log file:", e);
                // Proceed with empty object if parse fails, or maybe backup? 
                // For now, we'll assume we can overwrite/merge.
            }
        }

        // Merge Data
        if (type === 'learn') {
            fileData.learnSession = {
                ...fileData.learnSession,
                ...data,
                timestamp: new Date().toISOString()
            };
        } else if (type === 'test') {
            fileData.testSession = {
                ...fileData.testSession,
                ...data,
                timestamp: new Date().toISOString()
            };
        } else {
            // General update or initial user creation
            fileData = { ...fileData, ...data };
        }

        // Write back
        fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error writing log:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
