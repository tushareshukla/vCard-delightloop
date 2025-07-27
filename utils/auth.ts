import User from "@/models/User";
import bcrypt from "bcryptjs";

const VALID_CREDENTIALS = [
  {
    email: "pshah@delightloop.com",
    password: "1coolbanan@!",
  },
  {
    email: "admin@delightloop.com",
    password: "@dministhebo55!",
  },
  {
    email: "p@p.com",
    password: "p",
  },
];

interface AuthResult {
  success: boolean;
  message: string;
  user?: any;
  logs: string[];
}

export async function validateLogin(
  email: string,
  password: string
): Promise<AuthResult> {
  const logs: string[] = [];
  const addLog = (message: string) => {
    logs.push(message);
    console.log(message); // Server-side log
  };

  addLog(`1. Starting login validation for: ${email}`);

  // First check static credentials
  addLog("2. Checking static credentials");
  const staticUser = VALID_CREDENTIALS.find(
    (cred) => cred.email === email && cred.password === password
  );
  if (staticUser) {
    addLog("3A. Static user found");
    return {
      success: true,
      message: "Login successful",
      user: { email: staticUser.email },
      logs,
    };
  }
  addLog("3B. No static user found, checking database");

  // If not static, check database
  addLog("4. Querying database for user");
  const dbUser = await User.findOne({ email });
  addLog(
    `5. Database query completed: ${dbUser ? "User found" : "User not found"}`
  );

  if (!dbUser) {
    addLog("6A. User not found in database");
    return {
      success: false,
      message: "Invalid email or password",
      logs,
    };
  }

  addLog("6B. User found, checking email verification");
  if (!dbUser.emailVerified) {
    addLog("7A. Email not verified");
    return {
      success: false,
      message: "Please verify your email before logging in",
      logs,
    };
  }
  addLog("7B. Email verified, proceeding to password check");

  // Password comparison
  addLog("8. Starting password comparison");
  const isValidPassword = await bcrypt.compare(password, dbUser.password);
  addLog(`9. Password comparison result: ${isValidPassword}`);

  if (!isValidPassword) {
    addLog("10A. Password invalid");
    return {
      success: false,
      message: "Invalid email or password",
      logs,
    };
  }

  addLog("10B. Password valid, login successful");
  return {
    success: true,
    message: "Login successful",
    user: {
      id: dbUser._id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      organization_id: dbUser.organization_id,
      login_count: dbUser.login_count,
    },
    logs,
  };
}
