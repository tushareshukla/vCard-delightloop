import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, BarChart, Zap } from "lucide-react";

export default function QuickActions() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:border-purple-200">
      <div className="flex items-center mb-4">
        <Zap className="w-5 h-5 text-primary mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
      </div>
      
      <div className="flex flex-col space-y-3">
        <Button 
          asChild 
          className="w-full justify-start bg-primary hover:bg-primary/90 text-white hover:shadow-md hover:shadow-primary/30 transition-all duration-300 group relative overflow-hidden"
        >
          <Link href="/create-event" className="flex items-center">
            <span className="absolute inset-0 w-full h-full bg-white/[0.07] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
            <span className="relative flex items-center">
              <Plus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              <span className="group-hover:tracking-wide transition-transform duration-300">Create Event</span>
            </span>
          </Link>
        </Button>
        
        <Button 
          asChild 
          variant="outline" 
          className="w-full justify-start border-primary text-primary hover:bg-primary/5 transition-all duration-300 group hover:shadow-sm relative overflow-hidden"
        >
          <Link href="/campaigns" className="flex items-center">
            <span className="absolute inset-0 w-full h-full bg-primary/[0.05] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
            <span className="relative flex items-center">
              <BarChart className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              <span className="group-hover:tracking-wide transition-transform duration-300">View All Campaigns</span>
            </span>
          </Link>
        </Button>
      </div>
    </div>
  );
} 