import { Check } from "lucide-react";

interface PricingCardProps {
  title: string;
  text: string;
  bullets: string[];
  best?: boolean;
}

const PricingCard = (props: PricingCardProps) => {
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
    </div>
  )
}

export default PricingCard
