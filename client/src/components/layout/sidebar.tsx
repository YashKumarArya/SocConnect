import { Shield, BarChart3, AlertTriangle, Server, TrendingUp, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  className?: string;
}

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    badge: null,
  },
  {
    id: 'incidents',
    label: 'Incidents',
    icon: AlertTriangle,
    badge: { count: 5, variant: 'destructive' as const },
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: Shield,
    badge: { count: 23, variant: 'warning' as const },
  },
  {
    id: 'sources',
    label: 'Sources',
    icon: Server,
    badge: null,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: TrendingUp,
    badge: null,
  },
  {
    id: 'feedback',
    label: 'Feedback',
    icon: MessageSquare,
    badge: null,
  },
];

export function Sidebar({ currentSection, onSectionChange, className }: SidebarProps) {
  return (
    <nav className={cn("flex flex-col w-full", className)}>
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-slate-700">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="ml-3 text-xl font-semibold text-white">SOC Platform</span>
      </div>
      
      {/* Navigation Menu */}
      <div className="flex-1 px-3 py-4 space-y-1">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            data-testid={`nav-${item.id}`}
            className={cn(
              "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md group transition-colors",
              currentSection === item.id
                ? "bg-slate-700 text-white"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            )}
          >
            <item.icon className="mr-3 w-5 h-5" />
            {item.label}
            {item.badge && (
              <span
                className={cn(
                  "ml-auto text-xs rounded-full px-2 py-1",
                  item.badge.variant === 'destructive' && "bg-red-500 text-white",
                  item.badge.variant === 'warning' && "bg-amber-500 text-white"
                )}
                data-testid={`badge-${item.id}`}
              >
                {item.badge.count}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* User Profile */}
      <div className="px-3 py-4 border-t border-slate-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">JS</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">John Smith</p>
            <p className="text-xs text-slate-400">Security Analyst</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
