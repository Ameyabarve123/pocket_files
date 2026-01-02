import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Clock, Upload, Shield, Zap, Link2, FolderOpen } from "lucide-react";
import { LandingCard } from "@/components/landingCards";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect("/dashboard"); 
  }

  const dataDescriptions = {
    "firstBlock": {
      "one": {
        "title" : "Temporary Share",
        "content": "Uploads auto delete for reduced clutter when sharing files between devices."
      },
      "two" : {
        "title" : "Quick Share",
        "content": "Create temporary links that share your uploads with others."
      }
    },
    "secondBlock": {
      "one": {
        "title" : "Long Term Storage",
        "content": "Store links to your favorite videos, or files you want to keep on the cloud."
      },
      "two": {
        "title" : "AI powered search",
        "content": "Search for content based on your mood with AI powered search."
      }, 
      "three" : {
        "title" : "Quick Share",
        "content": "Create temporary links that share your uploads with others."
      }
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <span className="text-xl font-bold">PocketFiles</span>
            </div>
            <AuthButton size="sm"/>
          </div>
        </nav>
        
        <div className="flex-1 w-full">
          {/* Hero Section */}
          <section className="w-full bg-gradient-to-b from-primary/5 to-transparent">
            <div className="max-w-7xl mx-auto px-5 py-24 md:py-32">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                      PocketFiles
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground">
                      One platform to seamlessly organize your digital life
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <AuthButton size="lg" />
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    No credit card required • Free forever • Instant setup
                  </p>
                </div>

             
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="w-full py-24">
            <div className="px-4 grid-cols-1 md:px-8 lg:px-12">
              <div className="grid gap-8">
                <LandingCard
                  icon={Clock}
                  title="Share Files Quickly"
                  description="Share files between devices instantly that expire automatically for enhanced security."
                  imageURL="/homePageBlack.png"
                  imageDescription="Picture quick share page"
                  accordianData={dataDescriptions["firstBlock"]}
                />
                
                <LandingCard
                  icon={FolderOpen}
                  title="Smart Storage"
                  description="Keep all your important links and files organized in one secure, searchable location."
                  imageURL="/longTermStorageBlack.png"
                  imageDescription="Picture long term storage page"
                  accordianData={dataDescriptions["secondBlock"]}
                />

              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="w-full bg-gradient-to-b from-transparent to-primary/5 py-24">
            <div className="max-w-4xl mx-auto px-5 text-center space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold mb-7">
                Start organizing your digital life today
              </h2>

              <button className="px-12 py-5 bg-primary text-primary-foreground rounded-lg font-semibold text-xl hover:opacity-90 transition-all shadow-lg">
                <Link href="/auth/login">Get Started For Free</Link>
              </button>
            </div>
          </section>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}