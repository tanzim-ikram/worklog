import TimerCard from '@/components/TimerCard'
import TodaySessions from '@/components/TodaySessions'

export default async function DashboardPage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-primary">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">Track your work time</p>
      </div>

      <TimerCard />

      <TodaySessions />
    </div>
  )
}
