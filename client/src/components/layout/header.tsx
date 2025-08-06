import { Search, Bell, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

export function Header({ onMobileMenuToggle, connectionStatus }: HeaderProps) {
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
        </div>
      </div>
    </header>
  );
}
