import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, RotateCcw, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

const SelfieCapture = ({ onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraError(null);
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Unable to access camera. Please grant camera permissions.');
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmCapture = async () => {
    if (!capturedImage) return;

    setLoading(true);
    try {
      // Check if there's an active session
      const response = await apiClient.get('/attendance/my');
      const activeSession = response.data.find(r => !r.punchOutTime);

      if (!activeSession) {
        await apiClient.post('/attendance/punch-in', { photo: capturedImage });
        toast.success('Punched in successfully');
      } else {
        await apiClient.post(`/attendance/punch-out/${activeSession.id}`, { photo: capturedImage });
        toast.success('Punched out successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Attendance error:', error);
      toast.error(error.response?.data?.message || 'Failed to record attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">Selfie Verification</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel} disabled={loading}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="relative aspect-video bg-muted rounded-xl overflow-hidden border-2 border-muted shadow-inner">
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <Camera className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-sm text-destructive font-medium">{cameraError}</p>
              <Button variant="outline" size="sm" onClick={startCamera} className="mt-4">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex gap-3">
          {!capturedImage ? (
            <Button onClick={capturePhoto} className="w-full" disabled={!stream}>
              <Camera className="h-4 w-4 mr-2" />
              Capture Photo
            </Button>
          ) : (
            <>
              <Button onClick={retake} variant="outline" className="flex-1" disabled={loading}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button onClick={confirmCapture} className="flex-1" disabled={loading}>
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Confirm
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SelfieCapture;
