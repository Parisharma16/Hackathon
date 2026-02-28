// app/dashboard/student/upload/page.tsx
// Navigation is injected by app/dashboard/layout.tsx
import Link from 'next/link';
import DocumentUploadForm from '@/components/DocumentUploadForm';

export default function StudentUploadPage() {
  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto space-y-8">
      <Link
        href="/dashboard/profile"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Profile
      </Link>

      <header>
        <h1 className="text-2xl font-bold text-gray-900">Upload Certificate</h1>
        <p className="text-gray-500 mt-1">
          Submit participation certificates, achievement awards, and other documents
          for verification and point allocation.
        </p>
      </header>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-6 text-gray-800">Document Submission</h2>
        <DocumentUploadForm />

        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Submission Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Accepted formats: PDF, JPG, PNG (max 5 MB)</li>
            <li>• Document must clearly show your name and event details</li>
            <li>• Allow 3–5 business days for review and point allocation</li>
          </ul>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Point Values</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Technical',  pts: '15–30', color: 'bg-blue-50 text-blue-700'    },
            { label: 'Cultural',   pts: '10–25', color: 'bg-purple-50 text-purple-700' },
            { label: 'Sports',     pts: '15–35', color: 'bg-green-50 text-green-700'   },
            { label: 'Leadership', pts: '20–50', color: 'bg-orange-50 text-orange-700' },
          ].map(({ label, pts, color }) => (
            <div key={label} className={`${color} rounded-xl p-4`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
              <p className="font-bold mt-0.5">{pts} pts</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
