import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Clock, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import SelfieCapture from '@/components/SelfieCapture.jsx';

const EmployeeDashboard = () => {
  const { currentUser } = useAuth();
  const [showSelfieCapture, setShowSelfieCapture] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('');
  const [stats, setStats] = useState({
    todayWage: 0,
    weeklyWage: 0,
    monthlyWage: 0,
    todayHours: 0,
    totalHours: 0
  });

  useEffect(() => {
    loadCurrentSession();
    loadStats();
  }, []);

  useEffect(() => {
    let interval;
    if (currentSession && !currentSession.punchOutTime) {
      interval = setInterval(() => {
        const now = new Date();
        const punchIn = new Date(currentSession.punchInTime);
        const diff = now - punchIn;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setElapsedTime(`${hours}h ${minutes}m ${seconds}s`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSession]);

  const loadCurrentSession = async () => {
    try {
      const response = await apiClient.get('/attendance/my');
      const activeSession = response.data.find(r => !r.punchOutTime);
      setCurrentSession(activeSession || null);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.get('/attendance/my');
      const allRecords = response.data;
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const weekStart = startOfWeek.toISOString().split('T')[0];

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const todayRecords = allRecords.filter(r => {
        const recordDate = r.punchInTime.split('T')[0];
        return recordDate === today;
      });

      const weekRecords = allRecords.filter(r => {
        const recordDate = r.punchInTime.split('T')[0];
        return recordDate >= weekStart;
      });

      const monthRecords = allRecords.filter(r => {
        const recordDate = r.punchInTime.split('T')[0];
        return recordDate >= startOfMonth;
      });

      const todayWage = todayRecords.reduce((sum, r) => sum + (r.dailyWageEarned || 0), 0);
      const weeklyWage = weekRecords.reduce((sum, r) => sum + (r.dailyWageEarned || 0), 0);
      const monthlyWage = monthRecords.reduce((sum, r) => sum + (r.dailyWageEarned || 0), 0);
      const todayHours = todayRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);
      const totalHours = allRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);

      setStats({
        todayWage,
        weeklyWage,
        monthlyWage,
        todayHours,
        totalHours
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSelfieSuccess = () => {
    setShowSelfieCapture(false);
    loadCurrentSession();
    loadStats();
  };

  const formatTotalHours = (hours) => {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    const minutes = Math.floor((hours % 1) * 60);
    return `${days}d ${remainingHours}h ${minutes}m`;
  };

  return (
    <>
      <Helmet>
        <title>Employee Dashboard - Attendance & Payroll</title>
        <meta name="description" content="Track your attendance and view payroll information" />
      </Helmet>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome, {currentUser?.name}</h1>
            <p className="text-muted-foreground">Track your attendance and earnings</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Employee Profile</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee ID</span>
                  <span className="font-medium">{currentUser?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{currentUser?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{currentUser?.phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joining Date</span>
                  <span className="font-medium">{currentUser?.joiningDate ? new Date(currentUser?.joiningDate).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Wage</span>
                  <span className="font-medium">${currentUser?.dailyWage?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hourly Rate</span>
                  <span className="font-medium">${currentUser?.hourlyRate?.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Punch In/Out
                </CardTitle>
                <CardDescription>Record your attendance with selfie verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentSession && !currentSession.punchOutTime ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Currently working</p>
                      <p className="text-2xl font-bold text-primary">{elapsedTime}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Punched in at {new Date(currentSession.punchInTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <Button onClick={() => setShowSelfieCapture(true)} className="w-full">
                      <Camera className="h-4 w-4 mr-2" />
                      Punch Out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-muted-foreground">Not currently working</p>
                    </div>
                    <Button onClick={() => setShowSelfieCapture(true)} className="w-full">
                      <Camera className="h-4 w-4 mr-2" />
                      Punch In
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.todayWage.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.todayHours.toFixed(1)} hours worked</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Weekly Earnings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.weeklyWage.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Current week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.monthlyWage.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Current month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Hours Worked</span>
                <Badge variant="secondary" className="text-sm">
                  {formatTotalHours(stats.totalHours)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Today's Hours</span>
                <Badge variant="secondary" className="text-sm">
                  {stats.todayHours.toFixed(1)} hours
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showSelfieCapture && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SelfieCapture
            onSuccess={handleSelfieSuccess}
            onCancel={() => setShowSelfieCapture(false)}
          />
        </div>
      )}
    </>
  );
};

export default EmployeeDashboard;
