import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/Button";
import { LogOut, Settings, User as UserIcon, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-extrabold mb-8">Profile</h1>
        
        <div className="bg-card dark:bg-card p-6 rounded-3xl border-2 border-border shadow-sm mb-8 text-center">
            <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-md">
                {user?.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <UserIcon className="w-12 h-12 text-muted-foreground m-auto mt-5" />
                )}
            </div>
            <h2 className="text-2xl font-black text-foreground">{user?.firstName} {user?.lastName}</h2>
            <p className="text-muted-foreground font-medium">{user?.email}</p>
        </div>

        <div className="space-y-4">
            <Button variant="outline" fullWidth className="justify-start px-6 h-14">
                <Settings className="mr-3 w-5 h-5 text-muted-foreground" />
                Settings
            </Button>

            <Button
                variant="outline"
                fullWidth
                className="justify-start px-6 h-14"
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
            >
                {theme === "dark" ? (
                    <Sun className="mr-3 w-5 h-5 text-muted-foreground" />
                ) : (
                    <Moon className="mr-3 w-5 h-5 text-muted-foreground" />
                )}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
            
            <Button 
                variant="danger" 
                fullWidth 
                className="justify-start px-6 h-14"
                onClick={() => logout()}
            >
                <LogOut className="mr-3 w-5 h-5" />
                Log Out
            </Button>
        </div>
      </div>
    </Layout>
  );
}
