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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Rewards Shop</h1>
        <p className="text-gray-500 mt-1">Redeem your hard-earned points for exclusive rewards</p>
      </div>

      <ShopClient
        items={items}
        initialPoints={pointsData.total_points}
        initialRedemptions={redemptions}
      />
    </div>
  );
}
