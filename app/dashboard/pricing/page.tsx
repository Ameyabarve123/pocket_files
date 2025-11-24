"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import PricingCard from "@/components/pricing-card";

export default function pricing() {
  const bulletJson = {
    "Free Plan": [
      "1 GB of storage",
      "Access to temporary storage, long-term storage, and sharing",
      "Max upload size of 5mb"
    ],
    "Pro Plan": [
      "Everything in Free Plan",
      "10 GB of storage",
      "Max upload size of 1GB",
      "No ads",
      "View videos on website"
    ],
    "Premium Plan": [
      "Everything in Pro Plan",
      "15 GB of storage",
      "Max upload size of 5GB",
      "Upload videos",
      "AI search for your uploads"
    ]
  }

  return (
    <div className="p-4  h-full">
      <h1 className="w-full text-2xl font-bold mb-5">Pricing</h1>
      <div className="columns-3 h-full">
        <PricingCard 
          title="Free Plan"
          text="$0/forever"
          bullets={bulletJson["Free Plan"]}
        />
        <PricingCard 
          title="Pro Plan"
          text="$5.99/month"
          bullets={bulletJson["Pro Plan"]}
        />
        <PricingCard 
          title="Premium Plan"
          text="$10.99/month"
          bullets={bulletJson["Premium Plan"]}  
        />
      </div>
    </div>
  );
}