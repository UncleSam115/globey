import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function Layout({ children, className }: { children: ReactNode; className?: string }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const isLanding = location === "/landing" || !user;

  if (isLanding) {
    return <main className={className}>{children}</main>;
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 md:pl-64">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 border-r border-border flex-col p-6 bg-card z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-extrabold text-xl">
            G
          </div>
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">Globey</h1>
        </div>
        
        <nav className="space-y-2 flex-1">
          <SidebarItem href="/" label="Chat Assistant" />
          <SidebarItem href="/trips" label="My Trips" />
          <SidebarItem href="/bookings" label="Bookings" />
          <SidebarItem href="/world" label="World Map" />
          <SidebarItem href="/profile" label="Profile" />
        </nav>
        
        <div className="mt-auto pt-6 border-t border-border">
            <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                   {user?.profileImageUrl ? (
                       <img src={user.profileImageUrl} alt="User" className="w-full h-full object-cover" />
                   ) : (
                       <span className="font-bold text-muted-foreground">?</span>
                   )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold truncate text-sm">{user?.firstName || 'Traveler'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
            </div>
        </div>
      </aside>

      <main className={cn("max-w-4xl mx-auto min-h-screen", className)}>
        {children}
      </main>
      
      <BottomNav />
    </div>
  );
}

function SidebarItem({ href, label }: { href: string; label: string }) {
  const [location] = useLocation();
  const isActive = location === href || (href !== "/" && location.startsWith(href));

  return (
    <Link href={href}>
      <div className={cn(
        "px-4 py-3 rounded-xl font-bold transition-all cursor-pointer border-2 border-transparent",
        isActive 
          ? "bg-primary/10 text-primary border-primary/20" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}>
        {label}
      </div>
    </Link>
  );
}
