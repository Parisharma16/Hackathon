// src/components/PointLedger.tsx
'use client';

export default function PointLedger({ points }: { points: number }) {
  return (
    <div className="bg-blue-950 p-6 rounded-xl border border-blue-900 shadow-sm flex flex-col justify-center items-center text-center transition-all">
      <h2 className="text-lg text-blue-200 font-medium mb-2">Total Engagement Points</h2>
      {/* Dynamic state update will reflect here when cache invalidates */}
      <div className="text-6xl font-extrabold text-blue-400 tracking-tighter">
        {points}
      </div>
    </div>
  );
}