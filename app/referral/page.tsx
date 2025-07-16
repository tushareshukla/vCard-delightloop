"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowRight, Zap, Share2, Clock } from "lucide-react";
import InfinityLoader from "@/components/common/InfinityLoader";

interface ReferralProfileData {
  handle: string;
  fullName: string;
  title?: string;
  company?: string;
  avatarUrl?: string;
}

export default function ReferralLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [referralProfile, setReferralProfile] =
    useState<ReferralProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const referralVcr = searchParams?.get("vcr");

  useEffect(() => {
    if (referralVcr) {
      fetchReferralProfile(referralVcr);
    } else {
      setLoading(false);
    }
    setIsLoaded(true);
  }, [referralVcr]);

  const fetchReferralProfile = async (vcr: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/vcard/key/${vcr}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReferralProfile(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching referral profile:", error);
      setError("Could not load referral information");
    } finally {
      setLoading(false);
    }
  };

  const handleGetMyCard = () => {
    const params = new URLSearchParams();
    if (referralVcr) {
      params.set("vcr", referralVcr);
    }
    router.push(`/referral/linkedin?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ECFCFF] to-[#E8C2FF] relative overflow-hidden">
      {/* Enhanced Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-32 left-10 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-xl animate-ping delay-500"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto min-h-screen">
        <div className="bg-white min-h-screen md:min-h-fit shadow-lg overflow-hidden pb-10">
          {/* Hero Section */}
          <div className="pt-16 pb-8 px-6 text-center">
            <div
              className={`transform transition-all duration-1000 ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              {/* Animated Delightloop Logo with Glass Morphism */}

              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Want your own
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#A855F7]">
                  Delight Card?
                </span>
              </h1>

              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Create your smart business card in minutes — powered by NFC
                magic.
              </p>

              {/* Referral Profile Display */}
              {referralProfile && !loading && (
                <div
                  className={`bg-gradient-to-r from-[#7C3AED]/10 to-[#A855F7]/10 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-[#7C3AED]/20 transform transition-all duration-500 delay-200 ${
                    isLoaded
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-0"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 shadow-lg">
                      {referralProfile.avatarUrl ? (
                        <Image
                          src={referralProfile.avatarUrl}
                          alt={referralProfile.fullName}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white font-semibold">
                          {referralProfile.fullName?.charAt(0)?.toUpperCase() ||
                            "?"}
                        </div>
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-gray-900">
                        {referralProfile.fullName || "Unknown"}
                      </p>
                      <p className="text-sm text-[#7C3AED] font-medium">
                        shared their card with you!
                      </p>
                    </div>
                    <div className="text-2xl animate-bounce">
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm">✨</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div
            className={`px-6 space-y-4 mb-8 transform transition-all duration-1000 delay-300 ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <div className="bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] rounded-2xl p-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Instant Sharing
                  </h3>
                  <p className="text-gray-500">
                    Just tap your card on any phone
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] rounded-2xl p-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Always Updated
                  </h3>
                  <p className="text-gray-500">Change your info anytime</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] rounded-2xl p-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Fast Delivery
                  </h3>
                  <p className="text-gray-500">Premium card in 5-7 days</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div
            className={`px-6 mt-8 transform transition-all duration-1000 delay-500 ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <Button
              onClick={handleGetMyCard}
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] text-white font-bold py-6 rounded-2xl text-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl shadow-lg relative overflow-hidden group"
            >
              {/* Button shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="relative flex items-center justify-center">
                Get My Card
                <ArrowRight className="w-6 h-6 ml-2 transition-transform group-hover:translate-x-1" />
              </div>
            </Button>

            <div className="text-center mt-4 space-y-1">
              <p className="text-sm text-gray-500">
                Free shipping • Setup in 2 minutes
              </p>
              <p className="text-xs text-gray-400">
                100% satisfaction guarantee
              </p>
            </div>
          </div>

          {/* Bottom Spacing */}
          <div className="h-8"></div>
        </div>
      </div>
    </div>
  );
}
