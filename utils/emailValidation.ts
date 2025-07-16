import User from "@/models/User";
import EmailVerificationToken from "@/models/EmailVerificationToken";

interface EmailValidationResult {
  isValid: boolean;
  message: string;
  action?: 'register' | 'resend' | 'login';
  existingToken?: string;
}

export async function validateEmailStatus(email: string): Promise<EmailValidationResult> {
  const user = await User.findOne({ email });

  if (!user) {
    return { isValid: true, message: '', action: 'register' };
  }

  if (user.emailVerified) {
    return { 
      isValid: false, 
      message: 'Email already registered. Please sign in.',
      action: 'login'
    };
  }

  // Check for existing verification token
  const existingToken = await EmailVerificationToken.findOne({
    userId: user._id,
    expiresAt: { $gt: new Date() }
  });

  if (existingToken) {
    return {
      isValid: false,
      message: 'Email pending verification. Resend verification email?',
      action: 'resend',
      existingToken: existingToken.token
    };
  }

  // Token expired or doesn't exist
  return {
    isValid: false,
    message: 'Previous verification expired. Resend verification email?',
    action: 'resend'
  };
} 