import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import { validateEmailStatus } from "@/utils/emailValidation";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email } = await request.json();
    
    const validationResult = await validateEmailStatus(email);
    
    return NextResponse.json(validationResult);
  } catch (error) {
    return NextResponse.json(
      { 
        isValid: false, 
        message: 'Error validating email',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 