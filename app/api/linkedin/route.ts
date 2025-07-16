import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { endpoint, data } = body;

    // Use the existing API endpoint from the backup
    const response = await fetch(`https://api.generect.com/api/linkedin/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Token 80475e52ba78e77493de27a8c067635eebba6c3b',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`LinkedIn API failed with status: ${response.status}`);
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('LinkedIn API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch from LinkedIn API' },
      { status: 500 }
    );
  }
} 