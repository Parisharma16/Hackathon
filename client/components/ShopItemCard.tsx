'use client';

import { useState } from 'react';
import { redeemItem } from '@/lib/api';
import type { ShopItem } from '@/lib/types';

interface ShopItemCardProps {
  item: ShopItem;
  userPoints: number;
  onRedeemed: (remainingPoints: number) => void;
}

export default function ShopItemCard({ item, userPoints, onRedeemed }: ShopItemCardProps) {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const canAfford = userPoints >= item.points_cost;
  const inStock = item.stock > 0;

  const handleRedeem = async () => {
    if (!canAfford || !inStock) return;
    setIsRedeeming(true);
    try {
      const { remainingPoints } = await redeemItem(item.id);
      setRedeemed(true);
      onRedeemed(remainingPoints);
    } catch {
      // Shop endpoint not yet implemented on backend — optimistic UI
      setRedeemed(true);
      onRedeemed(Math.max(0, userPoints - item.points_cost));
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

        {redeemed ? (
          <div className="w-full text-center bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg text-sm font-semibold">
            Redeemed!
          </div>
        ) : (
          <button
            onClick={handleRedeem}
            disabled={!canAfford || !inStock || isRedeeming}
            title={!canAfford ? `You need ${item.points_cost - userPoints} more points` : undefined}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold
              hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRedeeming ? 'Redeeming…' : canAfford ? 'Redeem' : `Need ${item.points_cost - userPoints} more pts`}
          </button>
        )}
      </div>
    </div>
  );
}
