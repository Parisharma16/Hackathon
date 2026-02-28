// app/dashboard/shop/page.tsx
// Shop items come from mock data (no backend endpoint yet).
// User points come from GET /points/my/
import ShopClient from './ShopClient';
import { fetchShopItems, fetchMyPoints } from '@/lib/api';

export default async function ShopPage() {
  const [items, pointsData] = await Promise.all([
    fetchShopItems(),
    fetchMyPoints(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Rewards Shop</h1>
        <p className="text-gray-500 mt-1">Redeem your hard-earned points for exclusive rewards</p>
      </div>

      <ShopClient items={items} initialPoints={pointsData.total_points} />
    </div>
  );
}
