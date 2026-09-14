import type { FamilyStats } from "@/lib/stats";

interface Props {
  stats: FamilyStats;
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-3 text-center">
      <span className="text-lg font-semibold text-amber-950">{value}</span>
      <span className="text-xs font-medium text-amber-800">{label}</span>
    </div>
  );
}

export default function StatsBar({ stats }: Props) {
  const { peopleCount, generationCount, oldest, youngest, earliestYear, yearSpan } = stats;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 border-b-2 border-amber-400 bg-amber-50 px-4 py-2.5">
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
          <div className="px-3 text-center text-sm font-medium text-amber-900">
            מ-{earliestYear} ועד היום, {yearSpan} שנה של סיפור משפחתי
          </div>
        </>
      )}
    </div>
  );
}
