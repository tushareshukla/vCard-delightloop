import React from "react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone, User, BarChart } from "lucide-react";

interface WelcomeHeaderProps {
  firstName: string;
  stats: {
    events: number;
    campaigns: number;
    gifts: number;
  };
}

export default function WelcomeHeader({ firstName, stats }: WelcomeHeaderProps) {
  console.log('WelcomeHeader received firstName:', firstName);

  // Check if user has any activity
  const hasActivity = stats.events > 0 || stats.campaigns > 0 || stats.gifts > 0;

  // Get appropriate welcome message based on user activity
  const getWelcomeMessage = () => {
    if (hasActivity) {
      return (
        <p className="text-gray-600 mt-1">
          You've created {stats.events} event{stats.events !== 1 ? 's' : ''},
          launched {stats.campaigns} campaign{stats.campaigns !== 1 ? 's' : ''},
          and delivered {stats.gifts} gift{stats.gifts !== 1 ? 's' : ''}.
        </p>
      );
    } else {
      return (
        <p className="text-gray-600 mt-1">
          Welcome to your personalized dashboard! Ready to create your first event
          and start sending delightful gifts to your leads and customers?
        </p>
      );
    }
  };

  return (
    <div className="bg-white pt-4 pb-2 -ml-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center justify-center w-20 h-20 relative overflow-hidden">
            <div className="relative z-10 flex items-center justify-center w-full h-full overflow-hidden">
              <div className="w-[150%] h-[150%] transform scale-100">
                <DotLottieReact
                  src="https://lottie.host/f863ab84-e510-4fce-be66-6681ff87d20b/62dueY8um8.lottie"
                  loop
                  autoplay
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: 'scale(1.2)',
                    maxWidth: 'none',
                    position: 'relative'
                  }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-medium text-gray-900">
              Welcome back, {firstName}
            </h1>
            <p className="text-gray-500 text-base max-w-lg">
              {hasActivity ? 
                `Track, manage and forecast your customers and orders.` :
                `Welcome to your personalized dashboard! Ready to create your first event and start sending delightful gifts to your leads and customers?`
              }
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link 
            href="/campaigns/create" 
            className="flex flex-row justify-center items-center px-4 py-2.5 gap-2 rounded-lg text-sm font-medium bg-primary border border-primary text-white shadow-xs hover:bg-primary/90"
          >
            <Plus className="w-5 h-5" />
            <span>New Campaign</span>
          </Link>
          
        </div>
      </div>
    </div>
  );
}
