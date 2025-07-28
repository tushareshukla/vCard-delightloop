"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import InfinityLoader from "@/components/common/InfinityLoader";
import { config } from "@/utils/config";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [showResendButton, setShowResendButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState({ firstName: "", lastName: "" });

  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [vcardData, setVCardData] = useState(null);
  const [vcardFlow, setVcardFlow] = useState(false);

  const searchParams = useSearchParams();
  const verify_email = searchParams.get("verify_email");
  const vcr = searchParams.get("vcr");

  //   const hasSentEmailRef = useRef(false);

  // Function to fetch VCard data using key and secret
  const fetchVCardData = async (key: string, secret: string) => {
    try {
      const response = await fetch(
        `${config.BACKEND_URL}/v1/vcard/authenticate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: key,
            secret: secret,
          }),
        }
      );

      const data = await response.json();
      console.log("VCard data fetched on register page:", data);

      if (data.success) {
        setVCardData(data.data.fullName);
        console.log("VCard fullName:", data.data.fullName);
      } else {
        console.error("VCard authentication failed:", data.error_message);
        setVCardData(null);
      }

      return data;
    } catch (error) {
      console.error("Error fetching VCard data:", error);
      setVCardData(null);
      return null;
    }
  };

  //   useEffect(() => {
  //     const need_mail_verification_login = searchParams.get(
  //       "need_mail_verification_login"
  //     );
  //     if (need_mail_verification_login && !hasSentEmailRef.current) {
  //       console.log("need_mail_verification_login", verify_email);
  //       hasSentEmailRef.current = true;
  //       handleResendVerification();
  //     }
  //   }, [router, searchParams]);

  // Fetch VCard data if both vcr and vid parameters are present
  useEffect(() => {
    const vcr = searchParams.get("vcr");
    const vid = searchParams.get("vid");

    if (vcr) {
      setVcardFlow(true);
    }
    if (vcr && vid) {
      console.log("Both vcr and vid found, fetching VCard data...", {
        vcr,
        vid,
      });
      fetchVCardData(vcr, vid);
    }
  }, [searchParams]);

  // Function to construct login URL with all preserved parameters
  const getLoginUrl = () => {
    // Get all current search parameters
    const params = new URLSearchParams();

    // Preserve all existing parameters
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });

    // Add vcardsignupuser=true if vcr param exists
    if (searchParams.get("vcr")) {
      params.append("vcardsignupuser", "true");
    }

    // If no parameters exist, return to root
    if (params.toString() === "") return "/";

    return `/?${params.toString()}`;
  };

  const validateEmail = async (email: string) => {
    try {
      const response = await fetch("/api/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toUpperCase() }),
      });

      const data = await response.json();

      if (!data.isValid) {
        setEmailError(data.message);
        setShowResendButton(data.action === "resend");
        return false;
      }

      setEmailError("");
      setShowResendButton(false);
      return true;
    } catch (error) {
      console.error("Email validation error:", error);
      return false;
    }
  };

  const handleResendVerification = async () => {
    try {
      const emailToUse = registeredEmail || formData.email || verify_email;
      console.log("Attempting to resend verification to:", emailToUse);

      setIsLoading(true);
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailToUse?.trim().toLowerCase() || "",
        }),
      });

      const data = await response.json();
      console.log("Resend verification response:", data);

      if (data.success) {
        setEmailError(
          "Verification email sent successfully! Please check your inbox."
        );
        setShowResendButton(false);
      } else {
        setEmailError(data.error || "Failed to send verification email");
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      setEmailError("Failed to send verification email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Starting registration process with form data:", {
      ...formData,
      password: "****",
    });

    setError("");
    setEmailError("");
    setNameError({ firstName: "", lastName: "" });
    setIsLoading(true);

    try {
      // Name validation
      const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
      let hasNameError = false;

      const trimmedFirstName = formData.firstName.trim().replace(/\s+/g, " ");
      const trimmedLastName = formData.lastName.trim().replace(/\s+/g, " ");

      if (!nameRegex.test(trimmedFirstName)) {
        setNameError((prev) => ({
          ...prev,
          firstName: "Please enter a valid name using only letters and spaces.",
        }));
        hasNameError = true;
      }

      if (!nameRegex.test(trimmedLastName)) {
        setNameError((prev) => ({
          ...prev,
          lastName: "Please enter a valid name using only letters and spaces.",
        }));
        hasNameError = true;
      }

      if (hasNameError) {
        setIsLoading(false);
        return;
      }

      // Update formData with trimmed values
      const updatedFormData = {
        ...formData,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      };

      // Password validation
      const passwordRegex =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=])[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/;
      if (!passwordRegex.test(updatedFormData.password)) {
        setError(
          "Password must be at least 8 characters long, contain at least one letter, one number, and one special character (!@#$%^&*()_+-=) with no other symbols allowed."
        );
        setIsLoading(false);
        return;
      }

      // Validate email first
      const isEmailValid = await validateEmail(
        updatedFormData.email.toUpperCase()
      );
      if (!isEmailValid) {
        setIsLoading(false);
        return;
      }

      // Proceed with registration if email is valid
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...updatedFormData, vcr }),
      });
      const data = await response.json();
      console.log("Registration response:---------", data);

      if (!data.success) {
        throw new Error(data.error || "Registration failed");
      }
      if (data.success && vcr) {
        console.log("vcr", vcr);
        console.log("userId", data.data.id);

        // fetch vcard data by vcr key - direct API call
        try {
          const backendUrl = config.BACKEND_URL;
          const vCardResponse = await fetch(
            `${backendUrl}/v1/vcard/key/${vcr}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const vCardData = await vCardResponse.json();
          console.log("VCard data fetched:", vCardData);

          if (!vCardResponse.ok) {
            throw new Error("Failed to fetch VCard data");
          }

          if (vCardResponse.ok) {
            console.log("VCard data fetched:", vCardData);

            if (vCardData.success && vCardData.data) {
              // Store the VCard ID in a variable
              const fetchedVCardId = vCardData.data.vcard_id;
              console.log("VCard ID stored:", fetchedVCardId);
            }
          }
        } catch (vCardError) {
          console.error("Error fetching VCard data:", vCardError);
        }
      }

      // Store the email before clearing form data
      const emailForVerification = formData.email;
      console.log("Storing email for verification:", emailForVerification);
      setRegisteredEmail(emailForVerification);
      setIsRegistered(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      });
    } catch (err) {
      console.error("Registration error:", err);
      if (
        err instanceof Error &&
        err.message === "Email already registered via LinkedIn"
      ) {
        setError("Email already registered via LinkedIn");
      } else if (
        err instanceof Error &&
        err.message === "Email already registered"
      ) {
        setError("Email already registered");
      } else {
        setError(err instanceof Error ? err.message : "Registration failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (verify_email) {
      setRegisteredEmail(verify_email);
      setIsRegistered(true);
    }
  }, [verify_email]);

  return (
    <div className="flex min-h-screen w-full relative text-sm   ">
      {/* //! (1) (ONLY for first time registration) ======= Form Section  ======= */}
      <div
        className={`grid lg:w-2/3 sm:w-[60%] mx-auto w-full  bg-white px-4 sm:px-6 lg:px-8  pb-4 ${
          isRegistered ? "hidden" : ""
        }`}
      >
        {/* //? (1) ======= Logo  ======= */}
        <Link
          href="https://www.delightloop.com/"
          className={`${
            vcardFlow ? " w-fit" : ""
          } inline-block opacity-0  my-4 mx-auto lg:mx-0  `}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src="/svgs/Logo.svg"
            alt="Logo"
            className="w-[170px] sm:w-[150px] md:w-[189px] lg:w-[189px] h-auto"
            width={200}
            height={50}
            priority
          />
        </Link>
        {/* //? (2) ======= Form  ======= */}
        <div className=" pb-6 max-w-[450px] mx-auto h-fit">
          {/* // Text contect of form */}
          <div className="grid gap-2 mb-4">
            <h1 className=" text-3xl font-semibold   ">
              {vcardData ? `Welcome ${vcardData}!` : "Sign up"}
            </h1>
            <p className={`  text-gray-600  hidden`}>
              Start your 30-day free trial with Delightloop
            </p>
          </div>
          {/* // Form Section */}
          <form onSubmit={handleSubmit} className="space-y-4  ">
            <div className="grid gap-4">
              <div>
                <label
                  aria-label="First Name"
                  htmlFor="firstName"
                  className="block text-[#344054] text-sm font-medium mb-1"
                >
                  First Name*
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      firstName: e.target.value.replace(/\s+/g, " "),
                    })
                  }
                  onBlur={(e) =>
                    setFormData({
                      ...formData,
                      firstName: e.target.value.trim().replace(/\s+/g, " "),
                    })
                  }
                  className="h-11 w-full p-3 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]"
                  required
                />
                {nameError.firstName && (
                  <p className="text-sm text-red-500 mt-1">
                    {nameError.firstName}
                  </p>
                )}
              </div>
              <div>
                <label
                  aria-label="Last Name"
                  htmlFor="lastName"
                  className="block text-[#344054] text-sm font-medium mb-1"
                >
                  Last Name*
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lastName: e.target.value.replace(/\s+/g, " "),
                    })
                  }
                  onBlur={(e) =>
                    setFormData({
                      ...formData,
                      lastName: e.target.value.trim().replace(/\s+/g, " "),
                    })
                  }
                  className="h-11 w-full p-3 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]"
                  required
                />
                {nameError.lastName && (
                  <p className="text-sm text-red-500 mt-1">
                    {nameError.lastName}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                aria-label="Email"
                htmlFor="email"
                className="block text-[#344054] text-sm font-medium mb-1"
              >
                Email*
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  // Clear any existing errors when user types
                  setEmailError("");
                  setShowResendButton(false);
                }}
                className={`h-11 w-full p-3 border ${
                  emailError ? "border-red-500" : "border-gray-300"
                } rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]`}
                required
              />
              {emailError && (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm text-red-500">{emailError}</span>
                  {showResendButton && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="text-sm text-purple-600 hover:text-purple-700"
                      disabled={isLoading}
                    >
                      Resend verification
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label
                aria-label="Password"
                htmlFor="password"
                className="block text-[#344054] text-sm font-medium mb-1"
              >
                Password*
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="h-11 w-full p-3 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#7F56D9] pr-10"
                  required
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-sm text-[#667085] font-[400] mt-1">
                Password include letters, numbers & a special character
                (!@#...).
              </p>
            </div>

            {error && (
              <div className="text-red-500 text-sm">
                {error === "Email already registered via LinkedIn" ? (
                  <>
                    Looks like you already have an account with this email via
                    LinkedIn. Please log in using{" "}
                    <span className="font-bold text-[#7F56D9]">
                      Continue with LinkedIn
                    </span>{" "}
                    on{" "}
                    <Link
                      href={`/${
                        searchParams.toString()
                          ? `?${searchParams.toString()}`
                          : ""
                      }`}
                      className="text-primary hover:text-primary-dark underline transition-colors duration-200"
                    >
                      login page
                    </Link>
                    .
                  </>
                ) : error === "Email already registered" ? (
                  <>
                    This email is already registered. You can{" "}
                    <Link
                      href={`/${
                        searchParams.toString()
                          ? `?${searchParams.toString()}`
                          : ""
                      }`}
                      className="text-primary hover:text-primary-dark underline transition-colors duration-200"
                    >
                      log in here
                    </Link>{" "}
                    or{" "}
                    <Link
                      href={`/auth/forgot-password${
                        searchParams.toString()
                          ? `?${searchParams.toString()}`
                          : ""
                      }`}
                      className="text-primary hover:text-primary-dark underline transition-colors duration-200"
                    >
                      reset your password
                    </Link>{" "}
                    if needed.
                  </>
                ) : (
                  error
                )}
              </div>
            )}

            <button
              type="submit"
              className="h-11 w-full bg-[#7F56D9] text-white font-[500] rounded-[8px] hover:bg-[#6941C6] focus:outline-none focus:ring-2 focus:ring-[#7F56D9] flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <InfinityLoader width={24} height={24} />
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <div className=" mt-4 text-center text-sm text-gray-600 font-[500]">
            Already have an account?{" "}
            <Link
              href={`/${
                searchParams.toString() ? `?${searchParams.toString()}` : ""
              }`}
              className="text-[#6941C6] hover:text-[#5a35b1] font-medium hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
        {/* //? (3) ======= Footer  ======= */}
        <div className="text-sm text-center text-gray-600 mt-auto lg:text-start">
          © DelightLoop 2025
        </div>
      </div>
      {/* //! (1) (ONLY for email verification) ======= Email Verification Section  ======= */}
      <div
        className={`grid lg:w-2/3 md:w-full   justify-center bg-white p-8  my-auto  items-center space-y-6 w-full max-w-[500px] mx-auto text-center h-fit ${
          isRegistered ? "" : "hidden"
        }`}
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 capitalize">
          {verify_email
            ? "Please verify your email before logging in"
            : "Registration Successful!"}
        </h1>
        <p className="text-gray-600">
          Please check your email to verify your account. We've sent a
          verification link to {registeredEmail || formData.email}
        </p>
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or click below to
            resend.
          </p>
          <button
            onClick={handleResendVerification}
            disabled={isLoading}
            className="text-[#6941C6] hover:text-[#5a35b1] font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            {isLoading ? (
              <>
                <InfinityLoader width={16} height={16} />
                <span>Sending verification email...</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                <span>Resend verification email</span>
              </>
            )}
          </button>
          {emailError && (
            <p
              className={`text-sm text-center ${
                emailError.includes("sent") ? "text-green-600" : "text-red-500"
              }`}
            >
              {emailError}
            </p>
          )}
        </div>
        <div className="mt-6">
          <Link
            href={getLoginUrl()}
            className="text-[#6941C6] hover:text-[#5a35b1] font-medium"
          >
            Return to Login
          </Link>
        </div>
      </div>
      {/* //! (2) ======= Image Section  ======= */}
      <div className="hidden lg:flex lg:w-[40%] min-h-screen relative">
        <Image
          src="/auth/Register.png"
          alt="Register background"
          fill
          className="object-cover"
        />
      </div>

      {/* //TODO: =======  Modal (loading)  ======= */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-50 bg-opacity-70 flex items-center justify-center z-50">
          <InfinityLoader width={56} height={56} />
        </div>
      )}
    </div>
  );
}
