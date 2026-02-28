// app/dashboard/leaderboard/page.tsx
// GET /points/leaderboard/  (public)
// Year filtering + podium are handled client-side in LeaderboardTable.
import { cookies } from 'next/headers';
import Image from 'next/image';
import LeaderboardTable from '@/components/LeaderboardTable';
import { fetchLeaderboard } from '@/lib/api';

export default async function LeaderboardPage() {
  const cookieStore = await cookies();

  // Default to the logged-in user's year so the relevant tab opens first.
  // The cookie is only written by storeUserInfo when year is a valid integer,
  // so parseInt is safer than Number() (Number("null") === NaN).
  const rawYear     = parseInt(cookieStore.get('user_year')?.value ?? '', 10);
  const defaultYear = ([1, 2, 3, 4].includes(rawYear) ? rawYear : 1);

  const entries = await fetchLeaderboard();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="relative mt-10">

        {/* Purple card — overflow-hidden clips only its own bg */}
        <div className="relative overflow-hidden rounded-3xl bg-[#b5c8fd] min-h-[170px] flex items-center">
          {/* Text */}
          <div className="relative z-10 px-7 py-7 max-w-[58%]">
            
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              Leaderboard
            </h1>
            <p className="text-blue-800 text-sm mt-2 font-medium">
              See the top performers for each year
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
          src="/leaderboard_hero.png"
          alt=""
          width={220}
          height={220}
          className="absolute -top-14 right-0 object-contain pointer-events-none drop-shadow-xl"
          aria-hidden="true"
        />

      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mt-4">
        <LeaderboardTable entries={entries} defaultYear={defaultYear} />
      </div>
    </div>
  );
}
