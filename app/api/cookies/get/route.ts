import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const cookieStore = await cookies();
        
        // Get all cookies for debugging
        const allCookies = await cookieStore.getAll();
        
        // Get specific cookies
        const authToken = await cookieStore.get('auth_token')?.value;
        const userId = await cookieStore.get('user_id')?.value;
        const userEmail = await cookieStore.get('user_email')?.value;
        const organizationId = await cookieStore.get('organization_id')?.value;

        console.log('API Route - Retrieved cookies:', {
            authToken,
            userId,
            userEmail,
            organizationId,
            allCookies
        });

        return NextResponse.json({
            auth_token: authToken,
            user_id: userId,
            user_email: userEmail,
            organization_id: organizationId,
            debug: {
                allCookies: allCookies.map(cookie => ({
                    name: cookie.name,
                    value: cookie.value
                }))
            }
        });
    } catch (error) {
        console.error('Error in cookie API route:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve cookies' },
            { status: 500 }
        );
    }
}