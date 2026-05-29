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
import { Image as ImageIcon, Upload, Users, UserPlus, Edit, Trash2, IndianRupee, TrendingUp, X } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient.js';
import Header from '@/components/Header.jsx';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, totalPayroll: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    employeeCode: '',
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    place: '',
    educationalQualification: '',
    governmentIdFront: '',
    governmentIdBack: '',
    bloodGroup: '',
    dailyWage: '',
    joiningDate: '',
    status: 'active',
    password: '',
    profilePhoto: ''
  });

  const getNextEmployeeCode = () => {
    const usedNumbers = employees
      .map((employee) => Number(/^TCB-(\d{4})$/.exec(employee.employeeCode || '')?.[1]))
      .filter(Number.isInteger);
    const nextNumber = Math.max(2025, ...usedNumbers) + 1;

    return `TCB-${nextNumber}`;
  };

  const normalizeEmployeeCodeInput = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    return digits ? `TCB-${digits}` : 'TCB-';
  };

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
        const response = await apiClient.post('/employees', data);
        toast.success(`Employee created. Password: ${response.data.loginPassword}`);
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

  const handleImageFieldChange = async (event, fieldName) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      const image = await resizeImageFile(file);
      setFormData({ ...formData, [fieldName]: image });
    } catch (error) {
      console.error('Document image error:', error);
      toast.error('Failed to process image');
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
      employeeCode: employee.employeeCode || '',
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
      place: employee.place || '',
      educationalQualification: employee.educationalQualification || '',
      governmentIdFront: employee.governmentIdFront || '',
      governmentIdBack: employee.governmentIdBack || '',
      bloodGroup: employee.bloodGroup || '',
      dailyWage: employee.dailyWage.toString(),
      joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : '',
      status: employee.status,
      password: '',
      profilePhoto: employee.profilePhoto || ''
    });
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingEmployee(null);
    setFormData({
      employeeCode: getNextEmployeeCode(),
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      place: '',
      educationalQualification: '',
      governmentIdFront: '',
      governmentIdBack: '',
      bloodGroup: '',
      dailyWage: '',
      joiningDate: '',
      status: 'active',
      password: '',
      profilePhoto: ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingEmployee(null);
    setFormData({
      employeeCode: '',
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      place: '',
      educationalQualification: '',
      governmentIdFront: '',
      governmentIdBack: '',
      bloodGroup: '',
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
      <div className="branded-app-shell min-h-screen bg-background pt-14 md:pl-72 md:pt-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="app-page-header">
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage employees and track payroll</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="brand-visual-card metric-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card className="brand-visual-card metric-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active}</div>
              </CardContent>
            </Card>
            <Card className="brand-visual-card metric-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs. {stats.totalPayroll.toFixed(2)}</div>
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
                    <Button onClick={openAddDialog}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="left-0 top-0 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden border-0 p-0 sm:rounded-none">
                    <DialogHeader className="border-b px-6 py-5">
                      <DialogTitle className="text-2xl">{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                      <DialogDescription>
                        {editingEmployee
                          ? 'Update employee information, payroll details, login access, and verification photo'
                          : 'Create a complete employee profile with payroll details, login access, and verification photo'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                        <Label htmlFor="employeeCode">TCB-ID</Label>
                        <Input
                          id="employeeCode"
                          value={formData.employeeCode}
                          onChange={(e) => setFormData({ ...formData, employeeCode: normalizeEmployeeCodeInput(e.target.value) })}
                          required
                          className="text-foreground"
                        />
                        <p className="text-xs text-muted-foreground">Must start with TCB-. New employees use the 4-digit number as their password.</p>
                      </div>
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
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          className="text-foreground"
                        />
                      </div>
                            <div className="space-y-2">
                        <Label htmlFor="place">Place</Label>
                        <Input
                          id="place"
                          value={formData.place}
                          onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                          className="text-foreground"
                        />
                      </div>
                            <div className="space-y-2">
                        <Label htmlFor="educationalQualification">Educational Qualification</Label>
                        <Input
                          id="educationalQualification"
                          value={formData.educationalQualification}
                          onChange={(e) => setFormData({ ...formData, educationalQualification: e.target.value })}
                          className="text-foreground"
                        />
                      </div>
                            <div className="space-y-2">
                        <Label htmlFor="bloodGroup">Blood Group</Label>
                        <Select value={formData.bloodGroup} onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}>
                          <SelectTrigger className="text-foreground">
                            <SelectValue placeholder="Select blood group" />
                          </SelectTrigger>
                          <SelectContent>
                            {BLOOD_GROUPS.map((group) => (
                              <SelectItem key={group} value={group}>{group}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                            <div className="space-y-2">
                        <Label htmlFor="dailyWage">Daily Wage (Rs.)</Label>
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
                        <p className="text-xs text-muted-foreground">Hourly rate will be calculated as daily wage / 8</p>
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
                            <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="password">Password {editingEmployee && '(leave blank to keep current)'}</Label>
                        <Input
                          id="password"
                          type="text"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="text-foreground"
                        />
                        <p className="text-xs text-muted-foreground">
                          {editingEmployee
                            ? 'Optional. Changing this overrides the TCB-ID based password.'
                            : 'Leave blank. The password is created from the 4-digit TCB-ID number.'}
                        </p>
                      </div>
                          </div>

                          <div className="space-y-4 rounded-md border bg-muted/30 p-4">
                        <Label htmlFor="profilePhoto">Employee Photo</Label>
                        <div className="flex items-center gap-4">
                          <div className="aspect-square w-full overflow-hidden rounded-md border bg-background flex items-center justify-center">
                            {formData.profilePhoto ? (
                              <img src={formData.profilePhoto} alt="Employee" className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-14 w-14 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                          <div className="flex gap-2">
                            <Label
                              htmlFor="profilePhoto"
                              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Photo
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
                        <p className="text-xs text-muted-foreground">Reference photo for punch-in and punch-out verification.</p>
                        <div className="space-y-3 border-t pt-4">
                          <Label>Government ID Front</Label>
                          <div className="aspect-[1.58] w-full overflow-hidden rounded-md border bg-background flex items-center justify-center">
                            {formData.governmentIdFront ? (
                              <img src={formData.governmentIdFront} alt="Government ID front" className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-10 w-10 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Label
                              htmlFor="governmentIdFront"
                              className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Front
                            </Label>
                            <Input
                              id="governmentIdFront"
                              type="file"
                              accept="image/*"
                              onChange={(event) => handleImageFieldChange(event, 'governmentIdFront')}
                              className="hidden"
                            />
                            {formData.governmentIdFront && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setFormData({ ...formData, governmentIdFront: '' })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3 border-t pt-4">
                          <Label>Government ID Back</Label>
                          <div className="aspect-[1.58] w-full overflow-hidden rounded-md border bg-background flex items-center justify-center">
                            {formData.governmentIdBack ? (
                              <img src={formData.governmentIdBack} alt="Government ID back" className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-10 w-10 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Label
                              htmlFor="governmentIdBack"
                              className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Back
                            </Label>
                            <Input
                              id="governmentIdBack"
                              type="file"
                              accept="image/*"
                              onChange={(event) => handleImageFieldChange(event, 'governmentIdBack')}
                              className="hidden"
                            />
                            {formData.governmentIdBack && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setFormData({ ...formData, governmentIdBack: '' })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                        </div>
                      </div>
                      <div className="flex flex-col-reverse gap-3 border-t bg-background px-6 py-4 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="sm:min-w-32">
                          {loading ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Create Employee'}
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
                  <Button onClick={openAddDialog}>
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
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Password</TableHead>
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
                            <Badge variant="secondary">{employee.employeeCode || '-'}</Badge>
                          </TableCell>
                          <TableCell className="font-mono">{employee.loginPassword || '-'}</TableCell>
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
                          <TableCell>Rs. {employee.dailyWage?.toFixed(2)}</TableCell>
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
                            <div className="text-xs text-muted-foreground">{record.employee?.employeeCode || record.employee?.email}</div>
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
