import type { FamilyStats } from "@/lib/stats";

interface Props {
  stats: FamilyStats;
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-1 text-center sm:px-3">
      <span className="text-base font-semibold text-amber-950 sm:text-lg">{value}</span>
      <span className="text-[11px] font-medium text-amber-800 sm:text-xs">{label}</span>
    </div>
  );
}

export default function StatsBar({ stats }: Props) {
  const { peopleCount, generationCount, oldest, youngest, earliestYear, yearSpan } = stats;

  return (
    <div className="border-b-2 border-amber-400 bg-amber-50 px-4 py-2">
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-1 sm:gap-y-2 sm:py-0.5">
        <StatItem label="אנשים בעץ" value={String(peopleCount)} />
        <span className="hidden text-amber-300 sm:inline">•</span>
        <StatItem label="דורות" value={String(generationCount)} />
        {oldest && (
          <>
            <span className="hidden text-amber-300 sm:inline">•</span>
            <StatItem label="האדם המבוגר ביותר" value={`${oldest.person.firstName} ${oldest.person.lastName}`} />
          </>
        )}
        {youngest && (
          <>
            <span className="hidden text-amber-300 sm:inline">•</span>
            <StatItem label="האדם הכי צעיר/ה" value={`${youngest.person.firstName} ${youngest.person.lastName}`} />
          </>
        )}
        {earliestYear && yearSpan !== null && (
          <>
            <span className="hidden text-amber-300 sm:inline">•</span>
            <div className="col-span-2 px-3 text-center text-xs font-medium text-amber-900 sm:col-span-1 sm:text-sm">
              מ-{earliestYear} ועד היום, {yearSpan} שנה של סיפור משפחתי
            </div>
          </>
        )}
      </div>
    </div>
  );
}
