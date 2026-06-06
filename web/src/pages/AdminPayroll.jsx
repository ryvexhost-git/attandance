import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { AlertTriangle, Clock, IndianRupee, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from '@/components/Header.jsx';
import apiClient from '@/lib/apiClient.js';

const formatMoney = (value = 0) => `Rs. ${Number(value || 0).toFixed(2)}`;
const formatHours = (value = 0) => `${Number(value || 0).toFixed(1)}h`;
const formatDateTime = (value) => value ? new Date(value).toLocaleString() : '-';

const AdminPayroll = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const loadPayroll = async () => {
      try {
        const response = await apiClient.get('/attendance/admin-summary');
        setStats(response.data.stats || {});
        setRows(response.data.employeePayroll || []);
      } catch (error) {
        console.error('Error loading admin payroll:', error);
        toast.error('Failed to load payroll');
      } finally {
        setLoading(false);
      }
    };

    loadPayroll();
  }, []);

  return (
    <>
      <Helmet>
        <title>Admin Payroll - Attendance Register</title>
        <meta name="description" content="Admin payroll summary, payments, and outstanding balances" />
      </Helmet>
      <Header />
      <div className="branded-app-shell min-h-screen bg-background pt-14 md:pl-72 md:pt-0">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="app-page-header">
            <h1 className="mb-2 text-3xl font-bold text-foreground">Payroll</h1>
            <p className="text-muted-foreground">Track payable, paid, received, and remaining employee payroll.</p>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="brand-visual-card metric-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMoney(stats.totalPayrollDue)}</div>
                <p className="text-xs text-muted-foreground">Current month payroll</p>
              </CardContent>
            </Card>
            <Card className="brand-visual-card metric-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMoney(stats.totalPaid)}</div>
                <p className="text-xs text-muted-foreground">Recorded by admin</p>
              </CardContent>
            </Card>
            <Card className="brand-visual-card metric-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Amount Received</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMoney(stats.totalReceived)}</div>
                <p className="text-xs text-muted-foreground">Confirmed received</p>
              </CardContent>
            </Card>
            <Card className="brand-visual-card metric-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Amount To Pay</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMoney(stats.balanceToPay)}</div>
                <p className="text-xs text-muted-foreground">Remaining balance</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Employee Payroll Details</CardTitle>
              <CardDescription>Monthly payroll is calculated from punch-out records and configured hourly wages.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="py-8 text-center text-muted-foreground">Loading payroll...</p>
              ) : rows.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No payroll records yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Month Payroll</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>To Pay</TableHead>
                        <TableHead>Month Hours</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Punch</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <div className="font-medium">{row.name}</div>
                            <div className="text-xs text-muted-foreground">{row.employeeCode}</div>
                          </TableCell>
                          <TableCell>{formatMoney(row.monthPayroll)}</TableCell>
                          <TableCell>{formatMoney(row.payrollPaidAmount)}</TableCell>
                          <TableCell>{formatMoney(row.payrollReceivedAmount)}</TableCell>
                          <TableCell className="font-semibold">{formatMoney(row.balanceToPay)}</TableCell>
                          <TableCell>{formatHours(row.monthHours)}</TableCell>
                          <TableCell>
                            <Badge variant={row.activeSession ? 'default' : row.status === 'active' ? 'secondary' : 'outline'}>
                              {row.activeSession ? 'Working' : row.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatDateTime(row.lastPunchInTime)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminPayroll;
