import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DelightSense() {
  return (
    <div className="bg-white rounded-lg p-6 border transition-all duration-300 hover:border-purple-200 h-full flex flex-col" style={{
      boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
      borderColor: '#EAECF0'
    }}>
      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: rotate(0deg);
          }
          20% {
            transform: rotate(20deg);
          }
          40% {
            transform: rotate(-20deg);
          }
          60% {
            transform: rotate(20deg);
          }
          80% {
            transform: rotate(-20deg);
          }
        }
        .brain-icon:hover {
          animation: shake 2.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      <div className="flex items-center mb-4">
        <div className="brain-icon w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Delight Sense</h2>
        </div>
      </div>

      <p className="text-muted-foreground mb-auto">
        DelightSense helps you identify the right time to nurture your leads
        based on real-time engagement patterns, buying signals, job changes, CRM
        behavior, and more.
      </p>

      <div className="mt-6">
        <Link
          href="https://www.delightloop.com/bookademo"
          className="block w-full"
        >
          <Button className="w-full text-white" size="lg">
            ✨ Activate DelightSense
          </Button>
        </Link>
      </div>
    </div>
  );
}
