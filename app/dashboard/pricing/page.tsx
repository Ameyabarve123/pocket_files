import PricingCard from "@/components/pricing-card";

export default function pricing() {
  const bulletJson = {
    "Free Plan": [
      "250 MB of storage",
      "5 MB upload",
    ],
    "Pro Plan": [
      "Everything in Free Plan",
      "10 GB of storage",
      "1 GB upload",
      "No ads",
      "Basic AI search (10 searches a day)"
    ],
    "Premium Plan": [
      "Everything in Pro Plan",
      "50 GB of storage",
      "Max upload size of 5GB",
      "Upload videos",
      "Advanced AI search  (unlimited searches a day)"
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
          priceType={0}
        />
        <PricingCard 
          title="Pro Plan"
          text="$5.99/month"
          bullets={bulletJson["Pro Plan"]}
          priceType={1}
        />
        <PricingCard 
          title="Premium Plan"
          text="$10.99/month"
          bullets={bulletJson["Premium Plan"]}
          priceType={2}  
        />
      </div>
    </div>
  );
}