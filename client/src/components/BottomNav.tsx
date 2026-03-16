import { Link, useLocation } from "wouter";
import { MessageSquare, Map, User, Plane, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = location === href || (href !== "/" && location.startsWith(href));
    
    return (
      <Link href={href} className="flex-1">
        <div className={cn(
          "flex flex-col items-center justify-center py-2 h-full cursor-pointer transition-colors",
          isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
        )}>
          <Icon className={cn("w-6 h-6 mb-1", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
          <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-nav pb-safe pt-2 px-4 h-20 md:hidden">
      <div className="flex justify-around items-center h-full pb-2">
        <NavItem href="/" icon={MessageSquare} label="Chat" />
        <NavItem href="/trips" icon={Plane} label="Trips" />
        <NavItem href="/bookings" icon={Ticket} label="Bookings" />
        <NavItem href="/world" icon={Map} label="World" />
        <NavItem href="/profile" icon={User} label="Profile" />
      </div>
    </div>
  );
}
