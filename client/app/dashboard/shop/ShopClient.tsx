'use client';

import { useState } from 'react';
import ShopItemCard from '@/components/ShopItemCard';
import type { ShopItem } from '@/lib/types';

interface ShopClientProps {
  items: ShopItem[];
  initialPoints: number;
}

export default function ShopClient({ items, initialPoints }: ShopClientProps) {
  const [userPoints, setUserPoints] = useState(initialPoints);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))];
  const filtered = activeCategory === 'All' ? items : items.filter((i) => i.category === activeCategory);

  return (
    <>
      {/* Points banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 mb-8 text-white flex items-center justify-between">
        <div>
          <p className="text-blue-100 text-sm font-medium">Your Balance</p>
          <p className="text-3xl font-bold mt-0.5">
            {userPoints.toLocaleString()}
            <span className="text-lg font-normal text-blue-200 ml-1.5">points</span>
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border
              ${activeCategory === cat
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <ShopItemCard
            key={item.id}
            item={item}
            userPoints={userPoints}
            onRedeemed={(remaining) => setUserPoints(remaining)}
          />
        ))}
      </div>
    </>
  );
}
