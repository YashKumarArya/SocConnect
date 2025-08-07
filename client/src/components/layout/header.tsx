import { Search, Bell, Menu, LogOut, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User as UserType } from "@shared/schema";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  user?: UserType;
}

export function Header({ onMobileMenuToggle, connectionStatus, user }: HeaderProps) {
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      // Reload page to trigger authentication check
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: reload anyway
      window.location.reload();
    }
  };

  const getUserInitials = (user: UserType) => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';
  };
  return (
    <header className="bg-slate-800 border-b border-slate-700 px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuToggle}
            className="lg:hidden mr-4 text-slate-400 hover:text-white hover:bg-slate-700"
            data-testid="mobile-menu-button"
          >
            <Menu className="w-6 h-6" />
          </Button>
          
          <div>
            <h1 className="text-2xl font-semibold text-white">Security Operations Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Real-time monitoring and incident response</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Real-time status indicator */}
          <div className="flex items-center space-x-2" data-testid="connection-status">
            <div 
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                'bg-red-500'
              }`} 
            />
            <span className="text-sm text-slate-300 capitalize">{connectionStatus}</span>
          </div>
          
          {/* Search */}
          <div className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search incidents..."
                className="bg-slate-700 border-slate-600 pl-10 pr-4 text-white placeholder-slate-400 focus:ring-sky-500 focus:border-transparent w-64"
                data-testid="search-input"
              />
            </div>
          </div>
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-400 hover:text-white"
            data-testid="notifications-button"
          >
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 bg-red-400 rounded-full"></span>
          </Button>

          {/* User Profile */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} alt="Profile" />
                    <AvatarFallback className="bg-slate-600 text-white text-sm">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-white">
                      {user.firstName || user.lastName 
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : 'User'
                      }
                    </p>
                    <p className="text-xs leading-none text-slate-400">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem 
                  className="text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
