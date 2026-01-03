import TimerCard from '@/components/TimerCard'
import TodaySessions from '@/components/TodaySessions'

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Track your work time</p>
      </div>

      <TimerCard />

      <TodaySessions />
    </div>
  )
}

