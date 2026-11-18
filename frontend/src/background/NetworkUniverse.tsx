import { useEffect, useRef, useState } from 'react'

export const NetworkUniverse = () => {
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = (event: MediaQueryListEvent) => setReducedMotion(event.matches)
    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    if (paused || reducedMotion) svg.pauseAnimations()
    else svg.unpauseAnimations()
  }, [paused, reducedMotion])

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-cyber-bg" aria-hidden="true">
        <svg
          ref={svgRef}
          className="h-full w-full"
          viewBox="0 0 1400 900"
          preserveAspectRatio="xMidYMid slice"
          focusable="false"
        >
          <path d="M-80 210 C180 140 300 330 560 270 S980 130 1480 250" fill="none" stroke="var(--color-cyber-blue)" strokeOpacity=".13" />
          <path d="M-60 570 C220 640 380 410 650 480 S1060 720 1480 540" fill="none" stroke="var(--color-cyber-blue)" strokeOpacity=".10" />
          <path d="M100 980 C260 720 450 700 710 420 S1120 150 1350 -80" fill="none" stroke="var(--color-cyber-neon)" strokeOpacity=".09" />
          {!reducedMotion && (
            <>
              <circle r="3.5" fill="var(--color-cyber-blue)" opacity=".85">
                <animateMotion dur="16s" repeatCount="indefinite" path="M-80 210 C180 140 300 330 560 270 S980 130 1480 250" />
              </circle>
              <circle r="2.5" fill="var(--color-cyber-blue)" opacity=".7">
                <animateMotion dur="21s" begin="-8s" repeatCount="indefinite" path="M-60 570 C220 640 380 410 650 480 S1060 720 1480 540" />
              </circle>
              <circle r="3" fill="var(--color-cyber-neon)" opacity=".8">
                <animateMotion dur="19s" begin="-11s" repeatCount="indefinite" path="M100 980 C260 720 450 700 710 420 S1120 150 1350 -80" />
              </circle>
            </>
          )}
        </svg>
      </div>
      {!reducedMotion && (
        <button
          type="button"
          className="network-motion-toggle"
          aria-pressed={paused}
          onClick={() => setPaused((current) => !current)}
        >
          {paused ? 'Resume background' : 'Pause background'}
        </button>
      )}
    </>
  )
}
