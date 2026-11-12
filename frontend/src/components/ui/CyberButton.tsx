import React from 'react'

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'neon' | 'blue' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
}

export const CyberButton: React.FC<CyberButtonProps> = ({
  children,
  variant = 'neon',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg'

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-2.5 gap-2.5',
  }

  const variantStyles = {
    neon: 'bg-cyber-neon text-cyber-bg font-semibold hover:brightness-110 active:scale-95 shadow-md shadow-cyber-neon/20 hover:shadow-cyber-neon/40',
    blue: 'bg-cyber-blue text-white hover:bg-cyber-blue/90 active:scale-95 shadow-md shadow-cyber-blue/30 hover:shadow-cyber-blue/50',
    outline:
      'border border-white/20 text-cyber-text hover:border-cyber-neon hover:text-cyber-neon active:scale-95 bg-white/5 hover:bg-cyber-neon/10',
    ghost:
      'text-cyber-muted hover:text-cyber-text hover:bg-white/5 active:scale-95',
  }

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}
