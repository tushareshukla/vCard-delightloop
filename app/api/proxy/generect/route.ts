import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Determine which Generect API to call based on the request body structure
    const isEmailFinder = Array.isArray(body) && body[0]?.domain;
    const apiEndpoint = isEmailFinder ?
      'https://api.generect.com/api/linkedin/email_finder/' :
      'https://api.generect.com/api/linkedin/leads/by_link/';

    console.log(`Calling Generect API: ${apiEndpoint}`, { body });

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Authorization": "Token 80475e52ba78e77493de27a8c067635eebba6c3b",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Generect API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Generect API' },
      { status: 500 }
    );
  }
} 