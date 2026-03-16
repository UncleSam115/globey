import { Link } from "wouter";
import { Button } from "@/components/Button";
import { Globe2, Map, Compass } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 font-extrabold text-2xl text-primary tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-lg">G</div>
          Globey
        </div>
        <a href="/api/login">
            <Button variant="ghost" className="font-bold">Log in</Button>
        </a>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-12 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent-foreground font-bold text-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <SparkleIcon className="w-4 h-4 text-accent" />
           AI-Powered Travel Planning
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          The world is waiting. <br/>
          <span className="text-primary">Just ask.</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Your personal AI travel companion. Plan trips, track countries visited, and explore the world with simple conversations.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <a href="/api/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto px-10 h-16 text-lg">Get Started</Button>
          </a>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
           <FeatureCard 
             icon={Compass} 
             title="Smart Itineraries" 
             desc="Generates full day-by-day plans in seconds based on your interests."
             color="bg-blue-100 text-blue-600"
           />
           <FeatureCard 
             icon={Map} 
             title="Interactive Map" 
             desc="Visualize your travels and track every country you've visited."
             color="bg-green-100 text-green-600"
           />
           <FeatureCard 
             icon={Globe2} 
             title="Local Insights" 
             desc="Get hidden gems, food recommendations, and cultural tips."
             color="bg-purple-100 text-purple-600"
           />
        </div>
      </main>
      
      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border">
        © {new Date().getFullYear()} Globey. All rights reserved.
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) {
    return (
        <div className="p-6 rounded-2xl bg-card dark:bg-card border border-border/50 shadow-lg shadow-black/5 hover:-translate-y-1 transition-transform duration-300">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto ${color}`}>
                <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{desc}</p>
        </div>
    )
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 9 4.5ZM1.5 16.5a.75.75 0 0 1 .721.544l.325 1.14a2.25 2.25 0 0 0 1.545 1.545l1.14.325a.75.75 0 0 1 0 1.442l-1.14.325a2.25 2.25 0 0 0-1.546 1.545l-.325 1.14a.75.75 0 0 1-1.442 0l-.325-1.14a2.25 2.25 0 0 0-1.545-1.546l-1.14-.325a.75.75 0 0 1 0-1.442l1.14-.325a2.25 2.25 0 0 0 1.545-1.545l.325-1.14a.75.75 0 0 1 .722-.544Zm19.5 0a.75.75 0 0 1 .721.544l.325 1.14a2.25 2.25 0 0 0 1.545 1.545l1.14.325a.75.75 0 0 1 0 1.442l-1.14.325a2.25 2.25 0 0 0-1.546 1.545l-.325 1.14a.75.75 0 0 1-1.442 0l-.325-1.14a2.25 2.25 0 0 0-1.545-1.546l-1.14-.325a.75.75 0 0 1 0-1.442l1.14-.325a2.25 2.25 0 0 0 1.545-1.545l.325-1.14a.75.75 0 0 1 .722-.544Z" clipRule="evenodd" />
    </svg>
  );
}
