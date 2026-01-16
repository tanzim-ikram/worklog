'use client'

import { useState } from 'react'
import { toPng } from 'html-to-image'
import ShareStatsCard from './ShareStatsCard'

interface ShareButtonProps {
  title: string
  subtitle: string
  mainStat: string
  label: string
  fileName?: string
}

export default function ShareButton({ title, subtitle, mainStat, label, fileName = 'worklog-stats' }: ShareButtonProps) {
  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    const cardElement = document.getElementById('share-stats-wrapper')
    if (!cardElement) return

    setSharing(true)
    try {
      // Small delay to ensure any internal renders are stable
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const dataUrl = await toPng(cardElement, {
        cacheBust: true,
        width: 1080,
        height: 1920,
        pixelRatio: 2, // High resolution
        skipFonts: true, // Fix for "trim of undefined" font error
      })

      // Convert dataUrl to blob for sharing
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], `${fileName}.png`, { type: 'image/png' })

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Work Stats',
          text: 'Check out my focus time on WorkLog!',
        })
      } else {
        // Fallback for desktop: Trigger download
        const link = document.createElement('a')
        link.download = `${fileName}.png`
        link.href = dataUrl
        link.click()
      }
    } catch (err) {
      console.error('Sharing failed:', err)
      alert('Could not generate share image. Please try again.')
    } finally {
      setSharing(false)
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={sharing}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-500 rounded-xl hover:bg-indigo-500/20 transition-all font-medium text-sm border border-indigo-500/20 shadow-sm shadow-indigo-500/5 disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {sharing ? 'Generating...' : 'Share'}
      </button>

      {/* Hidden container for image generation */}
      <div 
        aria-hidden="true" 
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}
      >
        <div id="share-stats-wrapper">
          <ShareStatsCard 
            title={title}
            subtitle={subtitle}
            mainStat={mainStat}
            label={label}
          />
        </div>
      </div>
    </>
  )
}
