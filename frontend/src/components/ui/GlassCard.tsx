import React from 'react'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'interactive' | 'accent-neon' | 'accent-blue'
  glow?: boolean
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  glow = false,
  ...props
}) => {
  const baseStyles =
    'rounded-xl backdrop-blur-md bg-cyber-surface/85 border transition-all duration-300'

  const variantStyles = {
    default: 'border-white/10 shadow-lg shadow-black/50',
    interactive:
      'border-white/10 hover:border-cyber-blue/50 hover:shadow-xl hover:shadow-cyber-blue/10 cursor-pointer',
    'accent-neon':
      'border-cyber-neon/40 shadow-lg shadow-cyber-neon/10 hover:border-cyber-neon/70',
    'accent-blue':
      'border-cyber-blue/40 shadow-lg shadow-cyber-blue/15 hover:border-cyber-blue/70',
  }

  const glowStyle = glow ? 'ring-1 ring-cyber-neon/20' : ''

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${glowStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
