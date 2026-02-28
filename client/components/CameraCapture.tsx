'use client';

/**
 * CameraCapture — captures a group photograph for attendance verification.
 *
 * The attendance submission endpoint (POST /attendance/mark/) will be wired
 * once the face-recognition microservice integration is complete.
 * For now this component handles the camera UI only.
 */

import { useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CameraCapture() {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage]     = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);

  // Reads ?eventId=... from the URL — useSearchParams is safe inside a Suspense boundary
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') ?? '';

  const startCamera = async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCamError('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0, 640, 480);
    setImage(canvasRef.current.toDataURL('image/jpeg'));

    // Stop the camera stream
    const stream = videoRef.current.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Event context */}
      {eventId && (
        <p className="text-sm text-gray-500 self-start">
          Event ID: <span className="font-mono text-gray-700">{eventId}</span>
        </p>
      )}

      {camError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 w-full">
          {camError}
        </p>
      )}

      {!image ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-w-md rounded-xl bg-gray-900 aspect-video object-cover"
          />
          <div className="flex gap-3">
            <button
              onClick={startCamera}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Open Camera
            </button>
            <button
              onClick={capturePhoto}
              className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              Capture Group
            </button>
          </div>
        </>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt="Captured group photograph"
            className="w-full max-w-md rounded-xl shadow-lg"
          />

          <div className="flex gap-3">
            <button
              onClick={() => setImage(null)}
              className="bg-gray-100 text-gray-800 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Retake
            </button>
          </div>

          {/* Placeholder notice — attendance submission coming soon */}
          <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">⏳ Attendance submission coming soon</p>
            <p className="text-xs">
              The face-recognition pipeline is being integrated. Once ready, recognised
              roll numbers will be submitted automatically to <code className="font-mono">/attendance/mark/</code>.
            </p>
          </div>
        </>
      )}

      <canvas ref={canvasRef} width={640} height={480} className="hidden" />
    </div>
  );
}
