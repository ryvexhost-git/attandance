import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Image as ImageIcon, Upload, Users, UserPlus, Edit, Trash2, DollarSign, TrendingUp, X } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient.js';
import Header from '@/components/Header.jsx';

const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, totalPayroll: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dailyWage: '',
    joiningDate: '',
    status: 'active',
    password: '',
    profilePhoto: ''
  });

  useEffect(() => {
    loadEmployees();
    loadStats();
    loadRecentAttendance();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await apiClient.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // In a real app, you might have a dedicated stats endpoint
      // For now, we calculate from the employees list
      const response = await apiClient.get('/employees');
      const allEmployees = response.data;
      const activeEmployees = allEmployees.filter(emp => emp.status === 'active');

      // Note: totalPayroll calculation would ideally be done on the server
      // This is a placeholder since we don't have a global attendance list yet
      setStats({
        total: allEmployees.length,
        active: activeEmployees.length,
        totalPayroll: 0 // Placeholder
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentAttendance = async () => {
    try {
      const response = await apiClient.get('/attendance/all');
      setRecentAttendance(response.data);
    } catch (error) {
      console.error('Error loading attendance verification:', error);
    }
  };

  const openImage = (photo) => {
    if (!photo) return;
    const win = window.open();
    win.document.write(`<img src="${photo}" style="max-width:100%;height:auto;" />`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        dailyWage: parseFloat(formData.dailyWage)
      };

      if (editingEmployee) {
        await apiClient.put(`/employees/${editingEmployee.id}`, data);
        toast.success('Employee updated successfully');
      } else {
        const password = formData.password || Math.random().toString(36).slice(-8);
        await apiClient.post('/employees', {
          ...data,
          password: password
        });
        toast.success(`Employee created. Password: ${password}`);
      }

      setDialogOpen(false);
      resetForm();
      loadEmployees();
      loadStats();
      loadRecentAttendance();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error(error.response?.data?.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  const resizeImageFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();

        img.onload = () => {
          const maxSize = 640;
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };

        img.onerror = () => reject(new Error('Unable to read image'));
        img.src = reader.result;
      };

      reader.onerror = () => reject(new Error('Unable to read image'));
      reader.readAsDataURL(file);
    });
  };

  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      const profilePhoto = await resizeImageFile(file);
      setFormData({ ...formData, profilePhoto });
    } catch (error) {
      console.error('Profile photo error:', error);
      toast.error('Failed to process profile photo');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee? This action cannot be undone.')) return;

    try {
      await apiClient.delete(`/employees/${id}`);
      toast.success('Employee deleted');
      loadEmployees();
      loadStats();
      loadRecentAttendance();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  };

  const openEditDialog = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      dailyWage: employee.dailyWage.toString(),
      joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : '',
      status: employee.status,
      password: '',
      profilePhoto: employee.profilePhoto || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      dailyWage: '',
      joiningDate: '',
      status: 'active',
      password: '',
      profilePhoto: ''
    });
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Employee Attendance & Payroll</title>
        <meta name="description" content="Manage employees and view payroll statistics" />
      </Helmet>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage employees and track payroll</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalPayroll.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Employee Management</CardTitle>
                  <CardDescription>Add, edit, and manage employee records</CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                      <DialogDescription>
                        {editingEmployee ? 'Update employee information' : 'Create a new employee account'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dailyWage">Daily Wage ($)</Label>
                        <Input
                          id="dailyWage"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.dailyWage}
                          onChange={(e) => setFormData({ ...formData, dailyWage: e.target.value })}
                          required
                          className="text-foreground"
                        />
                        <p className="text-xs text-muted-foreground">Hourly rate will be calculated as daily wage ÷ 8</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="joiningDate">Joining Date</Label>
                        <Input
                          id="joiningDate"
                          type="date"
                          value={formData.joiningDate}
                          onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                          required
                          className="text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger className="text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password {editingEmployee && '(leave blank to keep current)'}</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required={!editingEmployee}
                          className="text-foreground"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="profilePhoto">Employee Photo</Label>
                        <div className="flex items-center gap-4">
                          <div className="h-20 w-20 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                            {formData.profilePhoto ? (
                              <img src={formData.profilePhoto} alt="Employee" className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex flex-1 gap-2">
                            <Label
                              htmlFor="profilePhoto"
                              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Label>
                            <Input
                              id="profilePhoto"
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePhotoChange}
                              className="hidden"
                            />
                            {formData.profilePhoto && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setFormData({ ...formData, profilePhoto: '' })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Used as the reference photo for punch-in and punch-out verification.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={loading} className="flex-1">
                          {loading ? 'Saving...' : editingEmployee ? 'Update' : 'Create'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading employees...</p>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No employees yet</p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Employee
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Photo</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Daily Wage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>
                            <div className="h-10 w-10 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                              {employee.profilePhoto ? (
                                <img src={employee.profilePhoto} alt={employee.name} className="h-full w-full object-cover" />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.phone || '-'}</TableCell>
                          <TableCell>${employee.dailyWage?.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                              {employee.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => openEditDialog(employee)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(employee.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Photo Verification</CardTitle>
              <CardDescription>Compare registered employee photos with recent punch selfies</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAttendance.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No attendance photos yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Punch In</TableHead>
                        <TableHead>Punch Out</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentAttendance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="font-medium">{record.employee?.name}</div>
                            <div className="text-xs text-muted-foreground">{record.employee?.email}</div>
                          </TableCell>
                          <TableCell>
                            {record.employee?.profilePhoto ? (
                              <button onClick={() => openImage(record.employee.profilePhoto)}>
                                <img src={record.employee.profilePhoto} alt="Reference" className="h-12 w-12 rounded-md object-cover border" />
                              </button>
                            ) : (
                              <Badge variant="secondary">Missing</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.punchInPhoto ? (
                              <button onClick={() => openImage(record.punchInPhoto)}>
                                <img src={record.punchInPhoto} alt="Punch in" className="h-12 w-12 rounded-md object-cover border" />
                              </button>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {record.punchOutPhoto ? (
                              <button onClick={() => openImage(record.punchOutPhoto)}>
                                <img src={record.punchOutPhoto} alt="Punch out" className="h-12 w-12 rounded-md object-cover border" />
                              </button>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>{new Date(record.punchInTime).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={record.punchOutTime ? 'default' : 'secondary'}>
                              {record.punchOutTime ? 'Completed' : 'Active'}
                            </Badge>
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

export default AdminDashboard;
