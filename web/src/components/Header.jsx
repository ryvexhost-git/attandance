
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, User, LayoutDashboard, Clock, DollarSign } from 'lucide-react';

const Header = () => {
  const { currentUser, userRole, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminLinks = [
    { to: '/admin-dashboard', label: 'Dashboard', icon: LayoutDashboard }
  ];

  const employeeLinks = [
    { to: '/employee-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/attendance-records', label: 'Attendance', icon: Clock },
    { to: '/payroll-summary', label: 'Payroll', icon: DollarSign }
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
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden font-semibold text-foreground sm:inline-block">
              Attendance & Payroll
            </span>
          </Link>

          {isAuthenticated ? (
            <>
              <nav className="hidden md:flex items-center gap-2">
                <NavLinks />
              </nav>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{currentUser?.name || currentUser?.email}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {userRole}
                  </span>
                </div>
                <Button onClick={logout} variant="outline" size="sm" className="hidden md:flex">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>

                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="outline" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64">
                    <div className="flex flex-col gap-4 mt-8">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-muted-foreground">
                        <User className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{currentUser?.name || currentUser?.email}</span>
                          <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
                        </div>
                      </div>
                      <nav className="flex flex-col gap-2">
                        <NavLinks mobile />
                      </nav>
                      <Button onClick={logout} variant="outline" className="w-full">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login?role=admin">
                <Button variant="outline" size="sm">
                  Admin Login
                </Button>
              </Link>
              <Link to="/login?role=employee">
                <Button size="sm">
                  Employee Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
