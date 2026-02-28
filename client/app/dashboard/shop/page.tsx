/**
 * Shop page — server component.
 *
 * Fetches all three data sources in parallel:
 *   1. Shop catalogue  — GET /shop/items/           (public)
 *   2. User points     — GET /points/my/            (authenticated)
 *   3. Past redemptions — GET /shop/redemptions/my/ (authenticated)
 *
 * All three calls fall back gracefully when the backend is unreachable so the
 * page still renders in local development without a running server.
 */

import ShopClient from './ShopClient';
import { fetchShopItems } from '@/lib/api';
import { serverUnwrap } from '@/lib/server-fetch';
import Image from 'next/image';
import type { PointsData, Redemption } from '@/lib/types';

export default async function ShopPage() {
  const [items, pointsData, redemptions] = await Promise.all([
    // Public endpoint — no auth needed, existing helper is fine.
    fetchShopItems(),
    // Authenticated endpoints — must use serverUnwrap so the access_token
    // cookie is forwarded from the browser to the Django backend.
    serverUnwrap<PointsData>('/points/my/').then((d) => d ?? { total_points: 0, ledger: [] }),
    serverUnwrap<Redemption[]>('/shop/redemptions/my/').then((d) => d ?? []),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="relative mt-10 mb-4">
      <div className="relative overflow-hidden rounded-3xl bg-[#fdeab5] min-h-[170px] flex items-center">
          {/* Text */}
          <div className="relative z-10 px-7 py-7 max-w-[58%]">
            
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              Shop
            </h1>
            <p className="text-yellow-800 text-sm mt-2 font-medium">
              Redeem your hard-earned points for exclusive rewards
            </p>
          </div>

          
        </div>

        {/*
          Image is a SIBLING of the card, not a child.
          `absolute` positions it relative to the outer `relative` div.
          `-top-14` pulls it 3.5rem above the outer div's top edge (into the mt-14 space),
          which is above the card's top border — giving the 3-D pop-out effect.
        */}
        <Image
          src="/shop_hero.png"
          alt=""
          width={220}
          height={220}
          className="absolute -top-14 right-0 object-contain pointer-events-none drop-shadow-xl"
          aria-hidden="true"
        />
      </div>

      <ShopClient
        items={items}
        initialPoints={pointsData.total_points}
        initialRedemptions={redemptions}
      />
    </div>
  );
}
