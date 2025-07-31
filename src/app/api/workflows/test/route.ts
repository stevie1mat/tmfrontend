import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Return a simple test response
    return NextResponse.json({
      success: true,
      message: 'API is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: 'Test failed',
      message: err.message
    }, { status: 500 });
  }
} 