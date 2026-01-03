import { LucideIcon } from "lucide-react";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface AccordionItem {
  title: string;
  content: string;
}

interface LandingCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  imageURL: string;
  imageDescription: string;
  accordianData: Record<string, AccordionItem>;
}

export function LandingCard({ icon: Icon, title, description, imageURL, imageDescription, accordianData }: LandingCardProps) {
  return (
    <div className="group p-8 rounded-2xl bg-card transition-all flex md:flex-row flex-col gap-10 md:gap-20 xl:gap-30">
      <div>
        <div className="flex items-center gap-5 mb-3">
          <Icon className="w-14 h-14 text-primary" />
          <h3 className="text-2xl font-bold">
            {title}
          </h3>
        </div>
        <p className="text-muted-foreground">{description}</p>
        <Accordion type="single" collapsible>
          {
            Object.entries(accordianData).map(([key, item], index) => {
              return (
                <AccordionItem key={key} value={`item-${index}`}>
                  <AccordionTrigger>{item.title}</AccordionTrigger>
                  <AccordionContent>{item.content}</AccordionContent>
                </AccordionItem>
              );
            })
          }
        </Accordion>
      </div>
      <div>
        <Image 
        src={imageURL}
        width={800}
        height={800}
        className="border-4 border-white rounded-md"
        alt={imageDescription}/>
      </div>
    </div>
  );
}
