
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, User, LayoutDashboard, Clock, IndianRupee, ChevronDown, Users, Sparkles } from 'lucide-react';

const Header = () => {
  const { currentUser, userRole, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminLinks = [
    { to: '/admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin-employees', label: 'Employees', icon: Users }
  ];

  const employeeLinks = [
    { to: '/employee-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/attendance-records', label: 'Attendance', icon: Clock },
    { to: '/payroll-summary', label: 'Payroll', icon: IndianRupee }
  ];

  const links = userRole === 'admin' ? adminLinks : userRole === 'employee' ? employeeLinks : [];

  const NavLinks = ({ mobile = false }) => (
    <>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = location.pathname === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => mobile && setMobileMenuOpen(false)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 transition-all duration-200 ${
              isActive
                ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </>
  );

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-300">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary shadow-lg shadow-primary/20">
          <Clock className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">Attendance</p>
          <p className="truncate text-xs text-zinc-500">Payroll Console</p>
        </div>
      </div>

      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{currentUser?.name || currentUser?.email}</p>
            <p className="text-xs capitalize text-zinc-500">{userRole} workspace</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Menu
        </div>
        <div className="space-y-1">
          <NavLinks mobile={mobile} />
        </div>

        {userRole === 'employee' && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span>Work</span>
              <ChevronDown className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              {employeeLinks.slice(1).map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={`sub-${link.to}`}
                    to={link.to}
                    onClick={() => mobile && setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Button onClick={logout} variant="ghost" className="w-full justify-start text-zinc-300 hover:bg-white/5 hover:text-white">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {isAuthenticated && (
        <>
          <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 border-r border-white/10 bg-zinc-950 md:block">
            <SidebarContent />
          </aside>
          <div className="fixed left-4 top-4 z-50 md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-zinc-800 bg-zinc-950 p-0">
                <SidebarContent mobile />
              </SheetContent>
            </Sheet>
          </div>
        </>
      )}

      {!isAuthenticated && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary shadow-lg shadow-primary/20">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden font-semibold text-foreground sm:inline-block">
              Attendance Register
            </span>
          </Link>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 rounded-md border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground sm:flex">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Live payroll-ready records
              </div>
              <Link to="/login">
                <Button size="sm">
                  Login
                </Button>
              </Link>
            </div>
        </div>
      </div>
    </header>
      )}
    </>
  );
};

export default Header;
