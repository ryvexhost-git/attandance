
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Camera, DollarSign, Shield, Users, TrendingUp } from 'lucide-react';
import Header from '@/components/Header.jsx';

const HomePage = () => {
  return (
    <>
      <Helmet>
        <title>Employee Attendance & Payroll Management System</title>
        <meta name="description" content="Modern attendance tracking and payroll management system with selfie verification" />
      </Helmet>
      <Header />
      <div className="branded-app-shell min-h-screen bg-background">
        <section className="branded-login-surface relative flex min-h-[90vh] items-center justify-center px-4 py-20">
          <div className="coffee-hero-copy container relative z-10 mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Clock className="h-4 w-4" />
              Modern Workforce Management
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight" style={{letterSpacing: '-0.02em'}}>
              Track attendance and manage payroll with confidence
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Streamline your workforce management with selfie-verified attendance tracking and automated payroll calculations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login?role=admin">
                <Button size="lg" className="w-full sm:w-auto">
                  <Shield className="h-5 w-5 mr-2" />
                  Admin Login
                </Button>
              </Link>
              <Link to="/login?role=employee">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Users className="h-5 w-5 mr-2" />
                  Employee Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Key features</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to manage attendance and payroll efficiently
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <Camera className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Selfie verification</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Employees punch in and out using selfie verification, ensuring accurate attendance records and preventing time theft
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Real-time camera capture for punch in/out</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Secure photo storage with each attendance record</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Automatic timestamp recording</span>
                  </li>
                </ul>
              </div>
              <div className="overflow-hidden rounded-2xl border shadow-lg">
                <img
                  src="/Mascot_Cafe_Counter_Combo_REFERENCE.jpeg"
                  alt="Cafe counter"
                  className="h-[360px] w-full object-cover"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div className="order-2 overflow-hidden rounded-2xl border shadow-lg md:order-1">
                <img
                  src="/Mascot_Bun_Coffee_Combo_Table_REFERENCE.jpeg"
                  alt="Coffee bun table"
                  className="h-[360px] w-full object-cover"
                />
              </div>
              <div className="order-1 md:order-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Attendance tracking</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Track work hours automatically with precise punch in/out times and calculate total hours worked
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Live session timer showing current work duration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Complete attendance history with date filters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Cumulative hours tracking from joining date</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <DollarSign className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Payroll management</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Automated wage calculations based on actual hours worked with detailed breakdowns
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Automatic hourly rate calculation from daily wage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Daily, weekly, and monthly earnings summaries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Transparent wage calculation display</span>
                  </li>
                </ul>
              </div>
              <div className="overflow-hidden rounded-2xl border shadow-lg">
                <img
                  src="/Mascot_Bun_Coffee_Poster_Text_REFERENCE.jpeg"
                  alt="Coffee bun poster"
                  className="h-[360px] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Benefits for everyone</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Designed to make workforce management easier for both administrators and employees
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
                      <Shield className="h-5 w-5" />
                    </div>
                    <CardTitle>For administrators</CardTitle>
                  </div>
                  <CardDescription>Complete control over workforce management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Employee management</p>
                      <p className="text-sm text-muted-foreground">Add, edit, and manage employee records with ease</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Payroll oversight</p>
                      <p className="text-sm text-muted-foreground">Track total payroll expenses and individual earnings</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Dashboard analytics</p>
                      <p className="text-sm text-muted-foreground">View key metrics and workforce statistics at a glance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
                      <Users className="h-5 w-5" />
                    </div>
                    <CardTitle>For employees</CardTitle>
                  </div>
                  <CardDescription>Simple and transparent attendance tracking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Camera className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Easy punch in/out</p>
                      <p className="text-sm text-muted-foreground">Quick selfie verification for attendance recording</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Work hour tracking</p>
                      <p className="text-sm text-muted-foreground">View real-time work duration and attendance history</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Earnings transparency</p>
                      <p className="text-sm text-muted-foreground">See daily, weekly, and monthly wage calculations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Ready to get started?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Choose your role to access the system
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login?role=admin">
                <Button size="lg" className="w-full sm:w-auto">
                  <Shield className="h-5 w-5 mr-2" />
                  Admin Login
                </Button>
              </Link>
              <Link to="/login?role=employee">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Users className="h-5 w-5 mr-2" />
                  Employee Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t bg-muted/30 py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-semibold">Attendance & Payroll</span>
              </div>
              <div className="flex gap-6 text-sm">
                <span>Privacy Policy</span>
                <span>Terms of Service</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © 2026 Attendance & Payroll. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;
