import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Inbox,
  FolderOpen,
  Users,
  UserCog,
  BarChart3,
  LogOut,
  Search,
  Menu,
  CheckCircle,
  Settings,
  X,
  Command,
  Sparkles,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import NotificationsDropdown from './NotificationsDropdown';
import { Button } from './ui';

const navigation = [
  { name: 'Inbox', href: '/inbox', icon: Inbox, shortcut: '1' },
  { name: 'Approvals', href: '/approvals', icon: CheckCircle, adminOnly: true, shortcut: '2' },
  { name: 'Projects', href: '/projects', icon: FolderOpen, shortcut: '3' },
  { name: 'Clients', href: '/clients', icon: Users, shortcut: '4' },
  { name: 'Team', href: '/team', icon: UserCog, shortcut: '5' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, shortcut: '6' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['inbox-stats'],
    queryFn: api.getInboxStats,
    refetchInterval: 30000,
  });

  const { data: pendingCount } = useQuery({
    queryKey: ['pending-count'],
    queryFn: async () => {
      const responses = await api.getPendingResponses();
      return responses?.length || 0;
    },
    refetchInterval: 30000,
    enabled: user?.role === 'ADMIN',
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }
      // Cmd/Ctrl + number for navigation
      if ((e.metaKey || e.ctrlKey) && /^[1-6]$/.test(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        const item = navigation.filter(i => !i.adminOnly || user?.role === 'ADMIN')[index];
        if (item) navigate(item.href);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, user?.role]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on all screen sizes */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border',
          'transform transition-transform duration-300 ease-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-heading font-bold text-foreground">Agency Hub</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto p-2 text-muted-foreground hover:text-foreground lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
            {/* Main Section */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Main
              </p>
              {navigation
                .filter((item) => !item.adminOnly || user?.role === 'ADMIN')
                .map((item) => {
                  const isActive = location.pathname.startsWith(item.href);
                  const badge =
                    item.name === 'Inbox'
                      ? stats?.needsResponse
                      : item.name === 'Approvals'
                      ? pendingCount
                      : null;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                        'group relative',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon className={cn(
                        'w-5 h-5 mr-3 transition-transform duration-200',
                        'group-hover:scale-110'
                      )} />
                      <span className="flex-1">{item.name}</span>
                      {badge > 0 && (
                        <span
                          className={cn(
                            'ml-auto px-2 py-0.5 text-xs font-semibold rounded-full min-w-[20px] text-center',
                            isActive
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-primary text-primary-foreground'
                          )}
                        >
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                      <span className="ml-2 text-xs opacity-50 hidden lg:block">
                        <Command className="w-3 h-3 inline" /> {item.shortcut}
                      </span>
                    </Link>
                  );
                })}
            </div>

            {/* Quick Actions */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Actions
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => navigate('/projects?create=true')}
              >
                New Project
              </Button>
            </div>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.role === 'ADMIN' ? 'Administrator' : 'Team Member'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={logout}
                  className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content - Margin matches sidebar width on desktop */}
      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col w-full">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-card/80 backdrop-blur-md border-b border-border lg:px-6 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4">
            <div
              className={cn(
                'relative group transition-all duration-200',
                isSearchFocused && 'scale-[1.02]'
              )}
            >
              <Search className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
                isSearchFocused ? 'text-primary' : 'text-muted-foreground'
              )} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search threads, clients, projects..."
                className={cn(
                  'w-full pl-10 pr-20 py-2 text-sm bg-muted border-0 rounded-xl',
                  'placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card',
                  'transition-all duration-200'
                )}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-sans font-medium text-muted-foreground bg-background border border-border rounded">
                  <Command className="w-3 h-3" /> K
                </kbd>
              </div>
            </div>
          </form>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <NotificationsDropdown />
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 lg:p-6 animate-fade-in overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
