import TimerCard from '@/components/TimerCard'
import TodaySessions from '@/components/TodaySessions'
import WeeklyStatsCard from '@/components/WeeklyStatsCard'

export default async function DashboardPage() {
  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">Track your time and productivity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimerCard />
        <WeeklyStatsCard />
      </div>

      <TodaySessions />
    </div>
  )
}
