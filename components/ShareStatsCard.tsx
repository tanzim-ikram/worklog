'use client'

interface ShareStatsCardProps {
  title: string
  subtitle: string
  mainStat: string
  label: string
}

export default function ShareStatsCard({ title, subtitle, mainStat, label }: ShareStatsCardProps) {
  return (
    <div 
      id="share-stats-card"
      className="w-[1080px] h-[1920px] bg-[#050a06] flex flex-col items-center justify-center p-20 relative overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.15) 0px, transparent 50%)'
      }}
    >
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[800px] aspect-[4/5] glass-panel rounded-[60px] p-16 flex flex-col justify-between border-white/10 shadow-2xl backdrop-blur-3xl bg-white/5">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-4xl font-bold tracking-tight text-white/90">WorkLog</span>
          </div>
          
          <div className="pt-12">
            <h2 className="text-4xl font-medium text-white/60 mb-2 uppercase tracking-[0.2em]">{title}</h2>
            <p className="text-2xl text-white/40">{subtitle}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-[120px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50">
            {mainStat}
          </div>
          <div className="text-3xl font-medium text-indigo-400 uppercase tracking-widest pl-2">
            {label}
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex justify-between items-center">
          <div className="space-y-1">
            <div className="text-xl font-medium text-white/30 uppercase tracking-wider">Consistency is key</div>
            <div className="text-sm text-white/20">Generated via WorkLog App</div>
          </div>
          
          <div className="flex -space-x-3">
             <div className="w-10 h-10 rounded-full border-2 border-[#050a06] bg-indigo-500/20" />
             <div className="w-10 h-10 rounded-full border-2 border-[#050a06] bg-purple-500/20" />
             <div className="w-10 h-10 rounded-full border-2 border-[#050a06] bg-emerald-500/20" />
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-20 text-white/10 text-2xl font-medium tracking-[0.3em] uppercase">
        worklog.app
      </div>
    </div>
  )
}
