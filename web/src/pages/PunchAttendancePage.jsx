import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { AlertCircle, Camera, Check, Clock, IdCard, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/apiClient.js';
import { comparePhotos } from '@/lib/photoVerification.js';

const REQUIRED_MATCH_PERCENT = 50;

const formatDateTime = (date) => new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short'
}).format(date);

const formatWorkHours = (startDate, endDate) => {
  const diffMs = Math.max(endDate - startDate, 0);
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const PunchAttendancePage = () => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [punchDetails, setPunchDetails] = useState(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState('');
  const [capturedAt, setCapturedAt] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [completedPunch, setCompletedPunch] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => () => stopCamera(), [stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const resetCapture = () => {
    stopCamera();
    setStream(null);
    setCameraError('');
    setCapturedPhoto('');
    setCapturedAt(null);
    setMatchScore(null);
    setCompletedPunch(null);
  };

  const lookupEmployee = async (event) => {
    event.preventDefault();
    const normalizedCode = employeeCode.trim().toUpperCase();

    if (!normalizedCode) {
      toast.error('Enter employee ID');
      return;
    }

    setLookupLoading(true);
    resetCapture();

    try {
      const response = await apiClient.get(`/attendance/punch-lookup/${encodeURIComponent(normalizedCode)}`);
      setEmployeeCode(normalizedCode);
      setPunchDetails(response.data);
      await startCamera();
    } catch (error) {
      setPunchDetails(null);
      toast.error(error.response?.data?.message || 'Employee ID not found');
    } finally {
      setLookupLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 720, height: 540 }
      });

      setStream(mediaStream);
      setCameraError('');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Unable to access camera. Allow camera permission and try again.');
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !punchDetails?.employee?.profilePhoto) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photo = canvas.toDataURL('image/jpeg', 0.82);
    const now = new Date();

    setCapturedPhoto(photo);
    setCapturedAt(now);
    setVerificationLoading(true);
    stopCamera();
    setStream(null);

    try {
      const score = await comparePhotos(punchDetails.employee.profilePhoto, photo);
      setMatchScore(score);

      if (score < REQUIRED_MATCH_PERCENT) {
        toast.error(`Photo match is ${score}%. Please retake with better lighting.`);
      }
    } catch (error) {
      console.error('Photo verification error:', error);
      setMatchScore(0);
      toast.error('Unable to verify selfie. Please retake the photo.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const retakePhoto = async () => {
    setCapturedPhoto('');
    setCapturedAt(null);
    setMatchScore(null);
    await startCamera();
  };

  const submitPunch = async () => {
    if (!capturedPhoto || matchScore < REQUIRED_MATCH_PERCENT) return;

    setSubmitLoading(true);

    try {
      const response = await apiClient.post('/attendance/punch-kiosk', {
        employeeCode,
        photo: capturedPhoto,
        verificationScore: matchScore
      });

      setCompletedPunch(response.data);
      setPunchDetails((details) => details ? { ...details, action: response.data.action } : details);
      toast.success(response.data.action === 'punch-in' ? 'Punched in successfully' : 'Punched out successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to submit punch');
    } finally {
      setSubmitLoading(false);
    }
  };

  const actionLabel = punchDetails?.action === 'punch-out' ? 'Punch Out' : 'Punch In';
  const canSubmit = capturedPhoto && matchScore >= REQUIRED_MATCH_PERCENT && !completedPunch;
  const previewTime = capturedAt || new Date();
  const activePunchInTime = punchDetails?.activeSession?.punchInTime
    ? new Date(punchDetails.activeSession.punchInTime)
    : null;

  return (
    <>
      <Helmet>
        <title>Punch Attendance - Attendance Register</title>
        <meta name="description" content="Punch in or punch out with employee ID and selfie verification" />
      </Helmet>
      <Header />
      <main className="branded-app-shell min-h-screen bg-background px-4 py-10">
        <div className={`container mx-auto grid gap-8 ${punchDetails ? 'max-w-6xl lg:grid-cols-[380px_1fr]' : 'max-w-lg'}`}>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard className="h-5 w-5" />
                Employee Punch
              </CardTitle>
              <CardDescription>Enter your employee ID to start attendance.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={lookupEmployee} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee-code">Employee ID</Label>
                  <Input
                    id="employee-code"
                    value={employeeCode}
                    onChange={(event) => setEmployeeCode(event.target.value.toUpperCase())}
                    placeholder="TCB24052603"
                    className="text-foreground"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={lookupLoading}>
                  <Search className="h-4 w-4 mr-2" />
                  {lookupLoading ? 'Checking...' : 'Continue'}
                </Button>
              </form>

              {punchDetails?.employee && (
                <div className="mt-6 rounded-md border bg-muted/35 p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={punchDetails.employee.profilePhoto}
                      alt={punchDetails.employee.name}
                      className="h-14 w-14 rounded-md border object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{punchDetails.employee.name}</p>
                      <p className="text-sm text-muted-foreground">{punchDetails.employee.employeeCode}</p>
                    </div>
                  </div>
                  <Badge className="mt-4" variant={punchDetails.action === 'punch-out' ? 'default' : 'secondary'}>
                    Next action: {actionLabel}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {punchDetails && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Selfie Verification
                </CardTitle>
                <CardDescription>Selfie must match the profile photo by at least {REQUIRED_MATCH_PERCENT}%.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[1fr_280px]">
                <div className="space-y-4">
                  <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
                    {cameraError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
                        <p className="text-sm font-medium text-destructive">{cameraError}</p>
                        <Button onClick={startCamera} variant="outline" size="sm" className="mt-4">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Try Again
                        </Button>
                      </div>
                    ) : capturedPhoto ? (
                      <img src={capturedPhoto} alt="Captured selfie" className="h-full w-full object-cover" />
                    ) : (
                      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover scale-x-[-1]" />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    {!capturedPhoto ? (
                      <Button onClick={capturePhoto} disabled={!stream || verificationLoading} className="w-full sm:w-auto">
                        <Camera className="h-4 w-4 mr-2" />
                        Take Selfie
                      </Button>
                    ) : (
                      <>
                        <Button onClick={retakePhoto} variant="outline" disabled={submitLoading}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Retake
                        </Button>
                        <Button onClick={submitPunch} disabled={!canSubmit || submitLoading}>
                          <Check className="h-4 w-4 mr-2" />
                          {submitLoading ? 'Submitting...' : `Submit ${actionLabel}`}
                        </Button>
                      </>
                    )}
                    <Link to="/login" className="sm:ml-auto">
                      <Button variant="ghost" className="w-full sm:w-auto">Staff Login</Button>
                    </Link>
                  </div>
                </div>

                <div className="space-y-4">
                  {punchDetails?.employee?.profilePhoto && (
                    <div className="rounded-md border bg-card p-3">
                      <p className="mb-2 text-sm font-medium text-foreground">Profile photo</p>
                      <img
                        src={punchDetails.employee.profilePhoto}
                        alt="Profile reference"
                        className="aspect-square w-full rounded-md object-cover"
                      />
                    </div>
                  )}

                  {matchScore !== null && (
                    <div className="rounded-md border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Photo match</p>
                        <Badge variant={matchScore >= REQUIRED_MATCH_PERCENT ? 'default' : 'destructive'}>
                          {matchScore}%
                        </Badge>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full ${matchScore >= REQUIRED_MATCH_PERCENT ? 'bg-primary' : 'bg-destructive'}`}
                          style={{ width: `${matchScore}%` }}
                        />
                      </div>
                      {matchScore < REQUIRED_MATCH_PERCENT && (
                        <p className="mt-3 text-sm text-destructive">Retake the selfie with your face centered and better lighting.</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {capturedPhoto && punchDetails?.employee && (
              <Card>
                <CardHeader>
                  <CardTitle>{completedPunch ? 'Attendance Submitted' : `Review ${actionLabel}`}</CardTitle>
                  <CardDescription>Confirm the photo and attendance details before submitting.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-[180px_1fr]">
                  <img src={capturedPhoto} alt="Selfie preview" className="aspect-square w-full rounded-md border object-cover" />
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium text-foreground">{punchDetails.employee.name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Employee ID</span>
                      <span className="font-medium text-foreground">{punchDetails.employee.employeeCode}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">{actionLabel} date and time</span>
                      <span className="font-medium text-foreground">{formatDateTime(previewTime)}</span>
                    </div>
                    {punchDetails.action === 'punch-out' && activePunchInTime && (
                      <>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Punched in at</span>
                          <span className="font-medium text-foreground">{formatDateTime(activePunchInTime)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Total worked hours</span>
                          <span className="font-medium text-foreground">{formatWorkHours(activePunchInTime, previewTime)}</span>
                        </div>
                      </>
                    )}
                    <div className="mt-2 flex items-center gap-2 rounded-md bg-muted/50 p-3 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Server records the final submit time when you press the button.</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          )}
        </div>
      </main>
    </>
  );
};

export default PunchAttendancePage;
