import React from 'react';
import { LayoutDashboard, Users, PieChart, MessageSquare } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'reports', label: 'Reports', icon: PieChart },
    { id: 'templates', label: 'Templates', icon: MessageSquare },
  ];

  return (
    <div className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 glass border-t border-borderMuted/40 px-2 py-1.5 flex justify-around items-center shadow-[0_-2px_10px_rgba(0,0,0,0.06)] lg:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 relative ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-inkLight hover:text-ink font-medium'
            }`}
          >
            <Icon className={`h-5 w-5 transition-all duration-300 ${isActive ? 'text-primary scale-110' : ''}`} />
            <span className={`text-[10px] mt-0.5 tracking-tight transition-all duration-300 ${isActive ? 'text-primary font-bold' : 'text-inkLight'}`}>
              {item.label}
            </span>
            {isActive && (
              <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-primary shadow-sm shadow-primary/30"></span>
            )}
          </button>
        );
      })}
    </div>
  );
}
