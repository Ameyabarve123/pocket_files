import { LucideIcon } from "lucide-react";

interface LandingCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function LandingCard({ icon: Icon, title, description }: LandingCardProps) {
  return (
    <div className="group p-8 rounded-2xl border border-border bg-card transition-all">
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 transition-colors">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}