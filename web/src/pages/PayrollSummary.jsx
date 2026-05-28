import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, Calendar, TrendingUp } from 'lucide-react';
import apiClient from '@/lib/apiClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';

const PayrollSummary = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeklyBreakdown, setWeeklyBreakdown] = useState([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);
  const [totals, setTotals] = useState({
    weeklyWage: 0,
    weeklyHours: 0,
    monthlyWage: 0,
    monthlyHours: 0
  });

  useEffect(() => {
    loadPayrollData();
  }, []);

  const loadPayrollData = async () => {
    try {
      const response = await apiClient.get('/attendance/my');
      const allRecords = response.data;

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const weekStart = startOfWeek.toISOString().split('T')[0];

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const weekRecords = allRecords.filter(r => {
        const recordDate = r.punchInTime.split('T')[0];
        return recordDate >= weekStart;
      });

      const monthRecords = allRecords.filter(r => {
        const recordDate = r.punchInTime.split('T')[0];
        return recordDate >= startOfMonth;
      });

      const weeklyByDay = {};
      weekRecords.forEach(record => {
        const date = record.punchInTime.split('T')[0];
        if (!weeklyByDay[date]) {
          weeklyByDay[date] = { date, hours: 0, wage: 0, status: 'completed' };
        }
        weeklyByDay[date].hours += record.workHours || 0;
        weeklyByDay[date].wage += record.dailyWageEarned || 0;
        if (!record.punchOutTime) {
          weeklyByDay[date].status = 'pending';
        }
      });

      const monthlyByWeek = {};
      monthRecords.forEach(record => {
        const recordDate = new Date(record.punchInTime.split('T')[0]);
        const weekNum = Math.ceil(recordDate.getDate() / 7);
        const weekKey = `Week ${weekNum}`;
        
        if (!monthlyByWeek[weekKey]) {
          monthlyByWeek[weekKey] = { week: weekKey, hours: 0, wage: 0, status: 'completed' };
        }
        monthlyByWeek[weekKey].hours += record.workHours || 0;
        monthlyByWeek[weekKey].wage += record.dailyWageEarned || 0;
        if (!record.punchOutTime) {
          monthlyByWeek[weekKey].status = 'pending';
        }
      });

      setWeeklyBreakdown(Object.values(weeklyByDay).sort((a, b) => b.date.localeCompare(a.date)));
      setMonthlyBreakdown(Object.values(monthlyByWeek));

      const weeklyWage = weekRecords.reduce((sum, r) => sum + (r.dailyWageEarned || 0), 0);
      const weeklyHours = weekRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);
      const monthlyWage = monthRecords.reduce((sum, r) => sum + (r.dailyWageEarned || 0), 0);
      const monthlyHours = monthRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);

      setTotals({ weeklyWage, weeklyHours, monthlyWage, monthlyHours });
    } catch (error) {
      console.error('Error loading payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Payroll Summary - Employee Dashboard</title>
        <meta name="description" content="View your earnings breakdown and payroll information" />
      </Helmet>
      <Header />
      <div className="branded-app-shell min-h-screen bg-background pt-14 md:pl-72 md:pt-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="app-page-header">
            <h1 className="text-3xl font-bold text-foreground mb-2">Payroll Summary</h1>
            <p className="text-muted-foreground">View your earnings breakdown by period</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card className="brand-visual-card metric-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Weekly Earnings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs. {totals.weeklyWage.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totals.weeklyHours.toFixed(1)} hours worked this week
                </p>
              </CardContent>
            </Card>

            <Card className="brand-visual-card metric-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs. {totals.monthlyWage.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totals.monthlyHours.toFixed(1)} hours worked this month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Breakdown</CardTitle>
                <CardDescription>Daily earnings for current week</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading data...</p>
                  </div>
                ) : weeklyBreakdown.length === 0 ? (
                  <div className="text-center py-8">
                    <IndianRupee className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No records for this week</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Wage</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeklyBreakdown.map((day) => (
                        <TableRow key={day.date}>
                          <TableCell className="font-medium">
                            {new Date(day.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{day.hours.toFixed(1)}h</TableCell>
                          <TableCell>Rs. {day.wage.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={day.status === 'completed' ? 'default' : 'secondary'}>
                              {day.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Breakdown</CardTitle>
                <CardDescription>Weekly earnings for current month</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading data...</p>
                  </div>
                ) : monthlyBreakdown.length === 0 ? (
                  <div className="text-center py-8">
                    <IndianRupee className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No records for this month</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Wage</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyBreakdown.map((week) => (
                        <TableRow key={week.week}>
                          <TableCell className="font-medium">{week.week}</TableCell>
                          <TableCell>{week.hours.toFixed(1)}h</TableCell>
                          <TableCell>Rs. {week.wage.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={week.status === 'completed' ? 'default' : 'secondary'}>
                              {week.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Wage Calculation</CardTitle>
              <CardDescription>How your daily wage is calculated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Hourly Rate</span>
                <span className="font-medium">Rs. {currentUser?.hourlyRate?.toFixed(2)}/hour</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Daily Wage (8 hours)</span>
                <span className="font-medium">Rs. {currentUser?.dailyWage?.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Your daily wage is calculated as: <span className="font-medium text-foreground">Actual Hours Worked x Hourly Rate</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PayrollSummary;
