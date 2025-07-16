"use client";

import { EmailFormProps } from "./ContactModal.types";

export default function EmailForm({
  emailAddress,
  emailError,
  sendingError,
  isValidatingEmail,
  isSendingEmail,
  onEmailChange,
  onSubmit,
}: EmailFormProps) {
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEmailChange(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <>
      {/* Slider Header */}
      <h2 className="text-xl font-semibold text-gray-900 mb-6 pr-8 text-center">
        Get contact info via email
      </h2>

      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <div className="w-full flex flex-col items-center">
          <span
            className="text-[#A259F7] font-medium uppercase text-base tracking-wide text-center mb-1"
            style={{ letterSpacing: "0.08em" }}
          >
            EMAIL
          </span>
          <span className="block h-0.5 w-full max-w-full bg-[#A259F7] rounded-full" />
        </div>
      </div>

      {/* Error Message */}
      {sendingError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{sendingError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-6">
          <input
            type="email"
            value={emailAddress}
            onChange={handleEmailChange}
            placeholder="Enter your email address"
            className={`w-full px-4 py-3 border ${
              emailError ? "border-red-500" : "border-gray-300"
            } rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
              emailError ? "focus:ring-red-500" : "focus:ring-purple-500"
            } focus:border-transparent transition-colors`}
            disabled={isValidatingEmail || isSendingEmail}
            required
          />
          {emailError && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {emailError}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isValidatingEmail || isSendingEmail || !emailAddress.trim()}
          className={`w-full font-semibold py-4 rounded-lg transition-all duration-200 ${
            isValidatingEmail || isSendingEmail || !emailAddress.trim()
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          }`}
        >
          {isValidatingEmail ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Validating Email...
            </div>
          ) : isSendingEmail ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Sending Contact...
            </div>
          ) : (
            "Receive Contact"
          )}
        </button>
      </form>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center">
        We'll send you an email with the contact information as a downloadable
        file.
      </p>
    </>
  );
}
