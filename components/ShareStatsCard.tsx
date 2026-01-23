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
      className="w-[1080px] h-[1920px] bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex flex-col items-center justify-center p-20 relative overflow-hidden"
    >
      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.03) 35px, rgba(255,255,255,.03) 70px)'
      }} />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[800px] aspect-[4/5] bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-[60px] p-16 flex flex-col justify-between border border-white/10 shadow-2xl">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div>
              <img src="/Worklog-White.png" alt="WorkLog" className="w-12 h-12 object-contain" />
            </div>
            <span className="text-4xl font-bold tracking-tight text-white">WorkLog</span>
          </div>
          
          <div className="pt-12">
            <h2 className="text-4xl font-medium text-indigo-300 mb-2 uppercase tracking-[0.2em]">{title}</h2>
            <p className="text-2xl text-slate-400">{subtitle}</p>
          </div>
        </div>

        <div className="space-y-4 my-8">
          <div className="text-[120px] font-black leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            {mainStat}
          </div>
          <div className="text-3xl font-medium text-indigo-400 uppercase tracking-widest pl-2">
            {label}
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 flex justify-between items-center">
          <div className="space-y-1">
            <div className="text-xl font-medium text-slate-300 uppercase tracking-wider">Consistency is key</div>
            <div className="text-sm text-slate-500">Generated via WorkLog App</div>
          </div>
          
          <div className="flex -space-x-3">
             <div className="w-10 h-10 rounded-full border-2 border-slate-800 bg-indigo-500/30" />
             <div className="w-10 h-10 rounded-full border-2 border-slate-800 bg-purple-500/30" />
             <div className="w-10 h-10 rounded-full border-2 border-slate-800 bg-emerald-500/30" />
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-20 text-white/20 text-2xl font-medium tracking-[0.3em] uppercase">
        worklog.app
      </div>
    </div>
  )
}
