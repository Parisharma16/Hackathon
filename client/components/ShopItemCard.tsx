'use client';

import { useState } from 'react';
import { redeemItem } from '@/lib/api';
import type { RedeemResult, ShopItem } from '@/lib/types';

interface ShopItemCardProps {
  item: ShopItem;
  userPoints: number;
  /** Called after a successful redemption with the user's updated point balance. */
  onRedeemed: (remainingPoints: number, result: RedeemResult) => void;
}

export default function ShopItemCard({ item, userPoints, onRedeemed }: ShopItemCardProps) {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAfford = userPoints >= item.points_cost;
  const inStock = item.stock > 0;

  const handleRedeem = async () => {
    if (!canAfford || !inStock || isRedeeming) return;
    setIsRedeeming(true);
    setError(null);
    try {
      const redeemResult = await redeemItem(item.id);
      setResult(redeemResult);
      onRedeemed(redeemResult.remaining_points, redeemResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Redemption failed. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      {/* Category strip */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{item.category}</span>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-bold text-gray-900 mb-1">{item.name}</h3>
        <p className="text-sm text-gray-600 mb-4 flex-1">{item.description}</p>

        {/* Cost + stock row */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-bold text-blue-600">
            {item.points_cost.toLocaleString()}
            <span className="text-sm font-normal text-gray-500 ml-1">pts</span>
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}>
            {inStock ? `${item.stock} left` : 'Out of stock'}
          </span>
        </div>

        {/* Error banner */}
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}

        {result ? (
          /* Post-redemption state: show success + unique code */
          <div className="space-y-2">
            <div className="w-full text-center bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg text-sm font-semibold">
              Redeemed successfully!
            </div>
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Your redemption code</p>
              <p className="text-lg font-mono font-bold text-gray-800 tracking-widest select-all">
                {result.code}
              </p>
              <p className="text-xs text-gray-400 mt-1">Present this code to collect your reward</p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleRedeem}
            disabled={!canAfford || !inStock || isRedeeming}
            title={!canAfford ? `You need ${item.points_cost - userPoints} more points` : undefined}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold
              hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRedeeming
              ? 'Redeeming...'
              : canAfford
              ? 'Redeem'
              : `Need ${(item.points_cost - userPoints).toLocaleString()} more pts`}
          </button>
        )}
      </div>
    </div>
  );
}
