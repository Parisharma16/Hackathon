// app/dashboard/organizer/capture/page.tsx
// Navigation is injected by app/dashboard/layout.tsx
import { Suspense } from 'react';
import CameraCapture from '@/components/CameraCapture';

export default function OrganizerCapturePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Event Verification</h1>
        <p className="text-gray-500 mt-1">
          Capture the group photograph for biometric attendance.
        </p>
      </div>

      {/* CameraCapture uses useSearchParams which requires a Suspense boundary */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <Suspense fallback={<p className="text-center text-gray-400 py-8">Loading camera...</p>}>
          <CameraCapture />
        </Suspense>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
        <ul className="space-y-2 text-gray-600 text-sm list-none">
          <li className="flex gap-2"><span>•</span>Ensure all participants are clearly visible in the frame</li>
          <li className="flex gap-2"><span>•</span>Use good lighting for optimal facial recognition</li>
          <li className="flex gap-2"><span>•</span>Hold the camera steady when capturing</li>
          <li className="flex gap-2"><span>•</span>Upload immediately after capture for processing</li>
        </ul>
      </div>
    </div>
  );
}
