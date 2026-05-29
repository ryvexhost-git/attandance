import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, CheckCircle2, Clock, IndianRupee, LogIn, Shield, TrendingUp } from 'lucide-react';
import Header from '@/components/Header.jsx';

const featureBlocks = [
  {
    icon: Camera,
    title: 'Selfie verification',
    body: 'Capture punch-in and punch-out selfies with every attendance record.',
    image: '/Mascot_Cafe_Counter_Combo_REFERENCE.jpeg',
    points: ['Live camera capture', 'Reference photo checks', 'Secure proof for each shift']
  },
  {
    icon: Clock,
    title: 'Accurate work hours',
    body: 'Track active sessions, completed shifts, date filters, and total worked time.',
    image: '/Mascot_Bun_Coffee_Combo_Table_REFERENCE.jpeg',
    points: ['Live session timer', 'Punch history by date', 'Cumulative hour tracking']
  },
  {
    icon: IndianRupee,
    title: 'Payroll-ready wages',
    body: 'Calculate daily, weekly, and monthly wages from real attendance hours.',
    image: '/Mascot_Bun_Coffee_Poster_Text_REFERENCE.jpeg',
    points: ['Daily wage setup', 'Hourly rate breakdown', 'Transparent earning summary']
  }
];

const HomePage = () => {
  return (
    <>
      <Helmet>
        <title>Attendance Register - Attendance & Payroll Management</title>
        <meta name="description" content="Modern attendance register with selfie verification and payroll-ready reporting" />
      </Helmet>
      <Header />
      <main className="branded-app-shell min-h-screen bg-background">
        <section className="relative px-4 py-14 sm:py-16 lg:py-20">
          <div className="container mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_460px]">
            <div>
              <Badge className="mb-5 rounded-md px-3 py-1.5" variant="secondary">
                Modern Workforce Management
              </Badge>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
                Attendance register that feels fast, clear, and payroll-ready.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                Manage employee records, selfie-verified shifts, and wage summaries from a cleaner dashboard built for daily use.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    <LogIn className="h-5 w-5" />
                    Login
                  </Button>
                </Link>
                <Link to="/punch-attendance">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Camera className="h-5 w-5" />
                    Punch In
                  </Button>
                </Link>
              </div>
            </div>

            <div className="glass-panel overflow-hidden rounded-lg">
              <img
                src="/Mascot_Pair_Poster_Location_REFERENCE.jpeg"
                alt="Attendance register workplace"
                className="h-72 w-full object-cover sm:h-96"
              />
              <div className="grid grid-cols-3 gap-px bg-border">
                {[
                  ['99%', 'Record clarity'],
                  ['Live', 'Punch timer'],
                  ['3-step', 'Payroll flow']
                ].map(([value, label]) => (
                  <div key={label} className="bg-card/95 p-4 text-center">
                    <div className="text-xl font-bold text-foreground">{value}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-3xl font-bold text-foreground md:text-4xl">Everything needed for daily attendance</h2>
                <p className="mt-3 max-w-2xl text-muted-foreground">
                  Focused screens for administrators and employees, with fewer clicks and clearer records.
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              {featureBlocks.map((feature, index) => {
                const Icon = feature.icon;
                const imageFirst = index % 2 === 1;

                return (
                  <div key={feature.title} className="grid items-center gap-8 lg:grid-cols-2">
                    <div className={imageFirst ? 'feature-image lg:order-1' : 'feature-image lg:order-2'}>
                      <img src={feature.image} alt={feature.title} className="h-72 w-full object-cover md:h-80" />
                    </div>
                    <div className={imageFirst ? 'lg:order-2' : 'lg:order-1'}>
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl font-semibold text-foreground">{feature.title}</h3>
                      <p className="mt-3 leading-7 text-muted-foreground">{feature.body}</p>
                      <div className="mt-5 grid gap-3">
                        {feature.points.map((point) => (
                          <div key={point} className="flex items-center gap-3 rounded-md border bg-card/70 p-3">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium text-foreground">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/35 px-4 py-16">
          <div className="container mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
            <Card className="metric-card">
              <CardHeader>
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Shield className="h-5 w-5" />
                </div>
                <CardTitle>For administrators</CardTitle>
                <CardDescription>Employee control, photo verification, and payroll oversight in one place.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-muted-foreground">
                <p>Manage employee records, profile photos, wages, and active status.</p>
                <p>Review recent attendance photos to verify each punch record.</p>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardHeader>
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <CardTitle>For employees</CardTitle>
                <CardDescription>Simple punch flow, visible hours, and transparent earnings.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-muted-foreground">
                <p>Punch in and out with a guided selfie verification workflow.</p>
                <p>See today, weekly, and monthly wage summaries without confusion.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">Start with one secure login or quick punch</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Admin credentials open the dashboard. Employees can punch with their employee ID and selfie verification.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <LogIn className="h-5 w-5" />
                  Login
                </Button>
              </Link>
              <Link to="/punch-attendance">
                <Button size="lg" className="w-full sm:w-auto">
                  <Camera className="h-5 w-5" />
                  Punch In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t bg-card/70 px-4 py-8">
          <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              Attendance Register
            </div>
            <p>Copyright 2026 Attendance Register. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </>
  );
};

export default HomePage;
