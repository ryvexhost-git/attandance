import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Droplets, GraduationCap, IdCard, IndianRupee, Image as ImageIcon, Mail, MapPin, MessageSquareText, Phone, Search, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import apiClient from '@/lib/apiClient.js';

const formatDate = (value) => {
  if (!value) return '-';

  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatMoney = (value) => {
  if (typeof value !== 'number') return '-';
  return `Rs. ${value.toFixed(2)}`;
};

const getInitials = (name = '') => (
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'E'
);

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="rounded-md border bg-background p-4">
    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="h-4 w-4" />
      {label}
    </div>
    <div className="break-words text-base font-medium text-foreground">{value || '-'}</div>
  </div>
);

const DocumentImage = ({ label, src }) => (
  <div className="rounded-md border bg-background p-4">
    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <IdCard className="h-4 w-4" />
      {label}
    </div>
    {src ? (
      <img src={src} alt={label} className="aspect-[1.58] w-full rounded-md border object-cover" />
    ) : (
      <div className="flex aspect-[1.58] w-full items-center justify-center rounded-md border bg-muted/40 text-sm text-muted-foreground">
        Not uploaded
      </div>
    )}
  </div>
);

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    loadEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return employees;

    return employees.filter((employee) => (
      employee.name?.toLowerCase().includes(query)
      || employee.employeeCode?.toLowerCase().includes(query)
      || employee.email?.toLowerCase().includes(query)
      || employee.phone?.toLowerCase().includes(query)
    ));
  }, [employees, searchTerm]);

  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId);

  return (
    <>
      <Helmet>
        <title>Employee Details - Admin Dashboard</title>
        <meta name="description" content="Select one employee and view their full profile details" />
      </Helmet>
      <Header />
      <div className="branded-app-shell min-h-screen bg-background pt-14 md:pl-72 md:pt-0">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="app-page-header">
            <h1 className="mb-2 text-3xl font-bold text-foreground">Employee Details</h1>
            <p className="text-muted-foreground">Select an employee name to display only that employee information.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Employee Names</CardTitle>
                <CardDescription>Choose one employee from the list</CardDescription>
                <div className="relative pt-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 translate-y-0.5 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search employee"
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="py-8 text-center text-muted-foreground">Loading employees...</p>
                ) : filteredEmployees.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No employees found</p>
                ) : (
                  <div className="space-y-2">
                    {filteredEmployees.map((employee) => {
                      const isSelected = employee.id === selectedEmployeeId;

                      return (
                        <button
                          key={employee.id}
                          type="button"
                          onClick={() => setSelectedEmployeeId(employee.id)}
                          className={`flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-foreground'
                              : 'border-border bg-background hover:bg-muted/60'
                          }`}
                        >
                          <Avatar className="h-11 w-11 rounded-md">
                            <AvatarImage src={employee.profilePhoto || undefined} alt={employee.name} className="object-cover" />
                            <AvatarFallback className="rounded-md">{getInitials(employee.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{employee.name}</div>
                            <div className="truncate text-xs text-muted-foreground">{employee.employeeCode || employee.email}</div>
                          </div>
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>{employee.status}</Badge>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="min-h-[520px]">
              {!selectedEmployee ? (
                <CardContent className="flex min-h-[520px] flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                    <UserRound className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">No employee selected</h2>
                  <p className="mt-2 max-w-sm text-muted-foreground">
                    Select a name from the employee list to show that employee profile here.
                  </p>
                </CardContent>
              ) : (
                <>
                  <CardHeader>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 rounded-lg border">
                          <AvatarImage src={selectedEmployee.profilePhoto || undefined} alt={selectedEmployee.name} className="object-cover" />
                          <AvatarFallback className="rounded-lg text-xl">{getInitials(selectedEmployee.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-2xl">{selectedEmployee.name}</CardTitle>
                          <CardDescription className="mt-1">{selectedEmployee.employeeCode || 'Employee ID not generated'}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={selectedEmployee.status === 'active' ? 'default' : 'secondary'} className="w-fit capitalize">
                        {selectedEmployee.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 overflow-hidden rounded-lg border bg-muted/30">
                      {selectedEmployee.profilePhoto ? (
                        <img
                          src={selectedEmployee.profilePhoto}
                          alt={selectedEmployee.name}
                          className="h-72 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-72 items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <ImageIcon className="mx-auto mb-3 h-12 w-12" />
                            <p>No employee photo uploaded</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator className="mb-6" />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <DetailItem icon={Mail} label="Email" value={selectedEmployee.email} />
                      <DetailItem icon={Phone} label="Phone" value={selectedEmployee.phone} />
                      <DetailItem icon={CalendarDays} label="Date of Birth" value={formatDate(selectedEmployee.dateOfBirth)} />
                      <DetailItem icon={MapPin} label="Place" value={selectedEmployee.place} />
                      <DetailItem icon={GraduationCap} label="Educational Qualification" value={selectedEmployee.educationalQualification} />
                      <DetailItem icon={Droplets} label="Blood Group" value={selectedEmployee.bloodGroup} />
                      <DetailItem icon={CalendarDays} label="Joining Date" value={formatDate(selectedEmployee.joiningDate)} />
                      <DetailItem icon={IndianRupee} label="Daily Wage" value={formatMoney(selectedEmployee.dailyWage)} />
                      <DetailItem icon={IndianRupee} label="Hourly Rate" value={formatMoney(selectedEmployee.hourlyRate)} />
                      <DetailItem icon={UserRound} label="Employee ID" value={selectedEmployee.employeeCode} />
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <DocumentImage label="Government ID Front" src={selectedEmployee.governmentIdFront} />
                      <DocumentImage label="Government ID Back" src={selectedEmployee.governmentIdBack} />
                    </div>
                    <div className="mt-6 rounded-md border bg-background p-5">
                      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <MessageSquareText className="h-4 w-4" />
                        Review & Remark
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                        {selectedEmployee.reviewRemark || 'No review or remark added yet.'}
                      </p>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminEmployees;
