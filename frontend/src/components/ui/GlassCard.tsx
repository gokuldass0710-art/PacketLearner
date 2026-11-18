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
    'rounded-lg bg-cyber-surface border transition-colors duration-200'

  const variantStyles = {
    default: 'border-white/10',
    interactive:
      'border-white/10 hover:border-cyber-blue/70 cursor-pointer',
    'accent-neon':
      'border-cyber-neon/50 hover:border-cyber-neon/80',
    'accent-blue':
      'border-cyber-blue/50 hover:border-cyber-blue/80',
  }

  const glowStyle = glow ? 'border-cyber-neon/60' : ''

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${glowStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
