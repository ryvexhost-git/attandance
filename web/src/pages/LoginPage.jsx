
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Clock, IndianRupee, LogIn, Shield, User } from 'lucide-react';
import Header from '@/components/Header.jsx';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, isAuthenticated, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get('role') || 'employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate(userRole === 'admin' ? '/admin-dashboard' : '/employee-dashboard');
    }
  }, [isAuthenticated, userRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password, activeTab);
      if (result.success) {
        navigate(result.role === 'admin' ? '/admin-dashboard' : '/employee-dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - Employee Attendance & Payroll</title>
        <meta name="description" content="Login to access your attendance and payroll dashboard" />
      </Helmet>
      <Header />
      <div className="branded-login-surface min-h-[calc(100vh-4rem)] px-4 py-12">
        <div className="login-orbit hidden lg:block" />
        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-10rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_420px]">
          <div className="hidden max-w-xl lg:block">
            <div className="mb-6 inline-flex items-center gap-2 rounded-md border bg-card/70 px-3 py-2 text-sm font-medium text-primary shadow-sm">
              <Clock className="h-4 w-4" />
              Attendance Register
            </div>
            <h1 className="mb-4 text-5xl font-bold leading-tight text-foreground">A clear start for every shift.</h1>
            <p className="mb-8 text-lg leading-8 text-muted-foreground">
              Access attendance, selfie verification, employee records, and payroll-ready wage summaries from one focused workspace.
            </p>
            <div className="login-feature-grid">
              <div className="login-feature-tile">
                <Camera className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">Selfie proof</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Photo-backed punch records for each shift.</p>
              </div>
              <div className="login-feature-tile">
                <IndianRupee className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">Payroll ready</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Earnings calculated from real work hours.</p>
              </div>
            </div>
          </div>
          <Card className="glass-panel w-full max-w-md justify-self-center rounded-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="employee" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Employee
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </TabsTrigger>
                </TabsList>

              <TabsContent value="employee">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee-email">Email</Label>
                    <Input
                      id="employee-email"
                      type="email"
                      placeholder="employee@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employee-password">Password</Label>
                    <Input
                      id="employee-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="text-foreground"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    <LogIn className="h-4 w-4 mr-2" />
                    {loading ? 'Signing in...' : 'Sign in as Employee'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="text-foreground"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    <LogIn className="h-4 w-4 mr-2" />
                    {loading ? 'Signing in...' : 'Sign in as Admin'}
                  </Button>
                </form>
              </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
