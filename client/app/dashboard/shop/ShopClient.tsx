'use client';

import { useState } from 'react';
import ShopItemCard from '@/components/ShopItemCard';
import RedemptionCard from '@/components/RedemptionCard';
import type { Redemption, RedeemResult, ShopItem } from '@/lib/types';

type Tab = 'shop' | 'redeemed';

interface ShopClientProps {
  items: ShopItem[];
  initialPoints: number;
  initialRedemptions: Redemption[];
}

export default function ShopClient({ items, initialPoints, initialRedemptions }: ShopClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('shop');
  const [userPoints, setUserPoints] = useState(initialPoints);
  const [activeCategory, setActiveCategory] = useState('All');
  /**
   * Redemptions list is maintained as local state so that a newly completed
   * redemption appears instantly in the "Redeemed" tab without a page reload.
   */
  const [redemptions, setRedemptions] = useState<Redemption[]>(initialRedemptions);

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))];
  const filteredItems = activeCategory === 'All' ? items : items.filter((i) => i.category === activeCategory);

  /**
   * Called by ShopItemCard on successful redemption.
   * Updates the balance counter and prepends the new entry to the history list.
   */
  const handleRedeemed = (remainingPoints: number, result: RedeemResult) => {
    setUserPoints(remainingPoints);
    // Build a Redemption object from the RedeemResult to prepend to history.
    const newRedemption: Redemption = {
      id: result.id,
      item_id: result.item_id,
      item_name: result.item_name,
      item_category: result.item_category,
      points_cost: result.points_cost,
      code: result.code,
      redeemed_at: result.redeemed_at,
    };
    setRedemptions((prev) => [newRedemption, ...prev]);
  };

  return (
    <>
      {/* Points balance banner */}
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl p-5 mb-8 text-white flex items-center justify-between">
        <div>
          <p className="text-blue-100 text-sm font-medium">Your Balance</p>
          <p className="text-3xl font-bold mt-0.5">
            {userPoints.toLocaleString()}
            <span className="text-lg font-normal text-yellow-200 ml-1.5">points</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-yellow-200 text-xs">{redemptions.length} item{redemptions.length !== 1 ? 's' : ''} redeemed</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {(['shop', 'redeemed'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-md text-sm font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            {tab === 'redeemed' && redemptions.length > 0 && (
              <span className="ml-1.5 bg-blue-100 text-orange-600 text-xs font-bold rounded-full px-1.5 py-0.5">
                {redemptions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Shop tab ── */}
      {activeTab === 'shop' && (
        <>
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  activeCategory === cat
                    ? 'bg-orange-500 text-white border-orange-400'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-yellow-400 hover:text-yellow-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <p className="text-gray-400 text-sm py-12 text-center">No items in this category.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  userPoints={userPoints}
                  onRedeemed={handleRedeemed}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Redeemed tab ── */}
      {activeTab === 'redeemed' && (
        <>
          {redemptions.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-medium mb-1">No redemptions yet</p>
              <p className="text-sm">Items you redeem will appear here with their unique codes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {redemptions.map((redemption) => (
                <RedemptionCard key={redemption.id} redemption={redemption} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
