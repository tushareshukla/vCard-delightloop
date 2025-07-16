import { NextResponse } from 'next/server';
import crypto from 'crypto';

const API_KEY = process.env.REFERRALCANDY_API_KEY;
const SECRET_KEY = process.env.REFERRALCANDY_SECRET_KEY;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Current timestamp
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Create signature
    const message = `${API_KEY}${email}${timestamp}`;
    const signature = crypto
      .createHmac('sha256', SECRET_KEY || '')
      .update(message)
      .digest('hex');

    // Make request to ReferralCandy API
    const response = await fetch('https://my.referralcandy.com/api/v1/referral_link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: API_KEY,
        email: email,
        timestamp: timestamp,
        signature: signature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get referral link');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('ReferralCandy API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get referral link' },
      { status: 500 }
    );
  }
} 