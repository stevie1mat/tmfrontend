import { NextRequest, NextResponse } from 'next/server';
import { writeFile, appendFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { logEntry } = await request.json();
    
    if (!logEntry) {
      return NextResponse.json({ error: 'Log entry is required' }, { status: 400 });
    }

    // Get the path to the debug log file
    const debugLogPath = join(process.cwd(), 'debug-log.txt');
    
    // Append the log entry to the file
    await appendFile(debugLogPath, logEntry, 'utf8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing to debug log:', error);
    return NextResponse.json({ error: 'Failed to write to debug log' }, { status: 500 });
  }
} 