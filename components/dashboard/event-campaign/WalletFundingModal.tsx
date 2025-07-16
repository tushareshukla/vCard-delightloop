"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CreditCard, DollarSign, Check } from "lucide-react"

interface WalletFundingModalProps {
  currentBalance: number
  requiredAmount: number
  onClose: () => void
  onSuccess: () => void
}

export default function WalletFundingModal({
  currentBalance,
  requiredAmount,
  onClose,
  onSuccess,
}: WalletFundingModalProps) {
  const [amount, setAmount] = useState(Math.max(requiredAmount - currentBalance, 50).toFixed(2))
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    name: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value)
    }
  }

  const handleQuickAmount = (value: number) => {
    setAmount(value.toFixed(2))
  }

  const handleContinue = () => {
    if (Number.parseFloat(amount) < 10) {
      setErrors({ amount: "Minimum amount is $10" })
      return
    }

    setErrors({})
    setShowPaymentForm(true)
  }

  const handlePaymentDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Format card number with spaces
    if (name === "cardNumber") {
      const formatted = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim()
      setPaymentDetails({ ...paymentDetails, [name]: formatted })
      return
    }

    // Format expiry date with slash
    if (name === "expiryDate") {
      const cleaned = value.replace(/\D/g, "")
      let formatted = cleaned
      if (cleaned.length > 2) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
      }
      setPaymentDetails({ ...paymentDetails, [name]: formatted })
      return
    }

    setPaymentDetails({ ...paymentDetails, [name]: value })
  }

  const validatePaymentForm = () => {
    const newErrors: Record<string, string> = {}

    if (!paymentDetails.cardNumber.trim() || paymentDetails.cardNumber.replace(/\s/g, "").length !== 16) {
      newErrors.cardNumber = "Please enter a valid 16-digit card number"
    }

    if (!paymentDetails.expiryDate.trim() || !/^\d{2}\/\d{2}$/.test(paymentDetails.expiryDate)) {
      newErrors.expiryDate = "Please enter a valid expiry date (MM/YY)"
    }

    if (!paymentDetails.cvv.trim() || !/^\d{3,4}$/.test(paymentDetails.cvv)) {
      newErrors.cvv = "Please enter a valid CVV"
    }

    if (!paymentDetails.name.trim()) {
      newErrors.name = "Please enter the cardholder name"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validatePaymentForm()) return

    setIsProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      setIsComplete(true)

      // Simulate success callback after showing success message
      setTimeout(() => {
        onSuccess()
      }, 1500)
    }, 2000)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Add Funds to Wallet</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!showPaymentForm ? (
              <>
                {/* Amount Selection */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                      Amount to Add
                    </label>
                    <span className="text-sm text-gray-500">Current Balance: ${currentBalance.toFixed(2)}</span>
                  </div>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="text"
                      name="amount"
                      id="amount"
                      value={amount}
                      onChange={handleAmountChange}
                      className={`block w-full pl-7 pr-12 py-2 border ${
                        errors.amount ? "border-red-500" : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                      placeholder="0.00"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">USD</span>
                    </div>
                  </div>
                  {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                </div>

                {/* Quick Amount Buttons */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Quick Select:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleQuickAmount(50)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded transition-colors"
                    >
                      $50
                    </button>
                    <button
                      onClick={() => handleQuickAmount(100)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded transition-colors"
                    >
                      $100
                    </button>
                    <button
                      onClick={() => handleQuickAmount(200)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded transition-colors"
                    >
                      $200
                    </button>
                  </div>
                </div>

                {/* Required Amount Info */}
                {requiredAmount > currentBalance && (
                  <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-md">
                    <div className="flex items-start gap-2">
                      <DollarSign className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-blue-700 font-medium">Recommended Amount</p>
                        <p className="text-blue-600 text-sm">
                          You need at least ${(requiredAmount - currentBalance).toFixed(2)} more to launch your
                          campaign.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Continue Button */}
                <button
                  onClick={handleContinue}
                  disabled={!amount || Number.parseFloat(amount) <= 0}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-colors ${
                    amount && Number.parseFloat(amount) > 0
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <span>Continue to Payment</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    ></path>
                  </svg>
                </button>
              </>
            ) : isComplete ? (
              <div className="text-center py-6">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-600 mb-6">
                  ${Number.parseFloat(amount).toFixed(2)} has been added to your wallet.
                </p>
                <button
                  onClick={onClose}
                  className="bg-primary text-white font-medium px-6 py-2.5 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Payment Form */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={paymentDetails.cardNumber}
                        onChange={handlePaymentDetailsChange}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          errors.cardNumber ? "border-red-500" : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    {errors.cardNumber && <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiryDate"
                        value={paymentDetails.expiryDate}
                        onChange={handlePaymentDetailsChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        className={`block w-full px-3 py-2 border ${
                          errors.expiryDate ? "border-red-500" : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                      />
                      {errors.expiryDate && <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>}
                    </div>

                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={paymentDetails.cvv}
                        onChange={handlePaymentDetailsChange}
                        placeholder="123"
                        maxLength={4}
                        className={`block w-full px-3 py-2 border ${
                          errors.cvv ? "border-red-500" : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                      />
                      {errors.cvv && <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={paymentDetails.name}
                      onChange={handlePaymentDetailsChange}
                      placeholder="John Doe"
                      className={`block w-full px-3 py-2 border ${
                        errors.name ? "border-red-500" : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={isProcessing}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-colors ${
                        isProcessing
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-primary text-white hover:bg-primary/90"
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Pay ${Number.parseFloat(amount).toFixed(2)}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

