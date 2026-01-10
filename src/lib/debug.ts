import fs from 'fs';
import path from 'path';

export function logDebug(message: string) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}\n`;

    // Always log to console
    console.log(formattedMessage);

    try {
        // Try to write to file. This will fail silently in Edge runtime.
        const logPath = path.join(process.cwd(), 'debug.log');
        fs.appendFileSync(logPath, formattedMessage);
    } catch (e) {
        // Fallback or ignore for Edge runtime
    }
}

// Initial log to confirm module load
logDebug("Debug module loaded");
