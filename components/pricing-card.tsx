"use client";

import { Check } from "lucide-react";
import { Button } from "./ui/button";
import { useStorage } from "./storage-context";

interface PricingCardProps {
  title: string;
  text: string;
  bullets: string[];
  best?: boolean;
  priceType: number;
}

function sendToPayment(){
  alert("Pricing plans coming soon!");
}

const PricingCard = (props: PricingCardProps) => {
  const { subType} = useStorage();
  console.log("SubType", typeof(subType));
  
  return (
    <div className="p-4 border rounded-lg shadow-md h-4/5">
      <h1 className="text-xl font-bold mb-2 text-center pb-2 pt-2">{props.title}</h1>
      <p>{props.text}</p>
      <ul className="mt-3 space-y-2">
        {props.bullets.map((bullet, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className="flex-shrink-0" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      
      <div  className="container py-10 px-10 mx-0 min-w-full flex flex-col items-center w-full">
        {subType === props.priceType ? (
          <Button 
            className="w-full"
            onClick={sendToPayment}
            >
              Current Tier!
          </Button>
        ) : (
          <Button 
            className="w-full"
            onClick={sendToPayment}
            >
              Upgrade Today!
          </Button>
        )}
      </div>
     
    </div>
  )
}

export default PricingCard
