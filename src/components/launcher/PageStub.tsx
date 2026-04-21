import { Layout } from "@/components/launcher/Layout";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const PageStub = ({ title, description, icon: Icon }: Props) => {
  return (
    <Layout>
      <div className="rounded-[2rem] border border-border bg-card p-10 md:p-16 text-center max-w-3xl mx-auto card-shadow animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-6 animate-pulse-glow">
          <Icon className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl mb-3">{title}</h1>
        <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
        <div className="mt-8 inline-block px-4 py-2 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
          Раздел в разработке
        </div>
      </div>
    </Layout>
  );
};
