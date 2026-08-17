import React from 'react';
import { 
  User, 
  LayoutDashboard, 
  Folder, 
  Settings, 
  HelpCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onSelectView: (view: string) => void;
  filesCount: number;
  userEmail?: string | null;
  onOpenSettings: () => void;
  onOpenSupport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  filesCount,
  userEmail,
  onOpenSettings,
  onOpenSupport,
}) => {
  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-stone-200 flex flex-col justify-between select-none min-h-[calc(100vh-3.5rem)]">
      
      {/* Top Section */}
      <div className="p-4 space-y-6">
        
        {/* Workspace Profile Badge */}
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 flex-shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-stone-900 truncate">Workspace</p>
            <p className="text-[11px] text-stone-400 font-normal truncate">Active</p>
          </div>
        </div>

        {/* Primary Workspace Links */}
        <nav className="space-y-1">
          
          <button
            id="sidebar-dashboard-btn"
            onClick={() => onSelectView('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
              activeView === 'dashboard'
                ? 'bg-stone-100 text-stone-900 font-bold'
                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-stone-500" />
            <span>Dashboard</span>
          </button>

          <button
            id="sidebar-myfiles-btn"
            onClick={() => onSelectView('my-files')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
              activeView === 'my-files'
                ? 'bg-stone-100 text-stone-900 font-bold'
                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Folder className="w-4 h-4 text-stone-500" />
              <span>My Files</span>
            </div>
            {filesCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-bold">
                {filesCount}
              </span>
            )}
          </button>

        </nav>
      </div>

      {/* Bottom Settings & Support Section */}
      <div className="p-4 border-t border-stone-200 space-y-1">
        
        <button
          id="sidebar-settings-btn"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors text-left"
        >
          <Settings className="w-4 h-4 text-stone-500" />
          <span>Settings</span>
        </button>

        <button
          id="sidebar-support-btn"
          onClick={onOpenSupport}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors text-left"
        >
          <HelpCircle className="w-4 h-4 text-stone-500" />
          <span>Support</span>
        </button>

      </div>

    </aside>
  );
};
