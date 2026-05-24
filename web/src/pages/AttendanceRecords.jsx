import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Image as ImageIcon } from 'lucide-react';
import apiClient from '@/lib/apiClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';

const AttendanceRecords = () => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [cumulativeHours, setCumulativeHours] = useState(0);

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [records, fromDate, toDate]);

  const loadRecords = async () => {
    try {
      const response = await apiClient.get('/attendance/my');
      const allRecords = response.data;
      setRecords(allRecords);
      
      const totalHours = allRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);
      setCumulativeHours(totalHours);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...records];

    if (fromDate) {
      filtered = filtered.filter(r => {
        const recordDate = r.punchInTime.split('T')[0];
        return recordDate >= fromDate;
      });
    }

    if (toDate) {
      filtered = filtered.filter(r => {
        const recordDate = r.punchInTime.split('T')[0];
        return recordDate <= toDate;
      });
    }

    setFilteredRecords(filtered);
  };

  const formatDuration = (hours) => {
    if (!hours) return '-';
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    const minutes = Math.floor((hours % 1) * 60);
    
    if (days > 0) {
      return `${days}d ${remainingHours}h ${minutes}m`;
    }
    return `${remainingHours}h ${minutes}m`;
  };

  const formatCumulativeHours = (hours) => {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    const minutes = Math.floor((hours % 1) * 60);
    return `${days} days ${remainingHours} hours ${minutes} minutes`;
  };

  return (
    <>
      <Helmet>
        <title>Attendance Records - Employee Dashboard</title>
        <meta name="description" content="View your attendance history and punch records" />
      </Helmet>
      <Header />
      <div className="branded-app-shell min-h-screen bg-background pt-14 md:pl-72 md:pt-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Attendance Records</h1>
            <p className="text-muted-foreground">View your punch history and work hours</p>
          </div>

          <Card className="brand-visual-card mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Cumulative Work Hours
              </CardTitle>
              <CardDescription>Total hours worked since joining</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{formatCumulativeHours(cumulativeHours)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filter Records</CardTitle>
              <CardDescription>Filter attendance by date range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="from-date">From Date</Label>
                  <Input
                    id="from-date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to-date">To Date</Label>
                  <Input
                    id="to-date"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="text-foreground"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFromDate('');
                      setToDate('');
                    }}
                    className="w-full"
                  >
                    Clear Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Punch Records</CardTitle>
              <CardDescription>Your attendance history</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading records...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No attendance records found</p>
                  {(fromDate || toDate) && (
                    <Button variant="outline" onClick={() => { setFromDate(''); setToDate(''); }}>
                      Clear Filter
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Punch In</TableHead>
                        <TableHead>Punch Out</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Wage Earned</TableHead>
                        <TableHead>Selfies</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {new Date(record.punchInTime).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(record.punchInTime).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            {record.punchOutTime ? (
                              new Date(record.punchOutTime).toLocaleTimeString()
                            ) : (
                              <Badge variant="secondary">No punch-out</Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDuration(record.workHours)}</TableCell>
                          <TableCell>
                            {record.dailyWageEarned ? `$${record.dailyWageEarned.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {record.punchInPhoto && (
                                <button
                                  onClick={() => {
                                    const win = window.open();
                                    win.document.write(`<img src="${record.punchInPhoto}" />`);
                                  }}
                                  className="text-primary hover:underline"
                                >
                                  <ImageIcon className="h-4 w-4" />
                                </button>
                              )}
                              {record.punchOutPhoto && (
                                <button
                                  onClick={() => {
                                    const win = window.open();
                                    win.document.write(`<img src="${record.punchOutPhoto}" />`);
                                  }}
                                  className="text-primary hover:underline"
                                >
                                  <ImageIcon className="h-4 w-4" />
                                </button>
                              )}
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

export default AttendanceRecords;
