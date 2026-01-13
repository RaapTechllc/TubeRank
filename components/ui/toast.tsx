'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  description?: string
  duration?: number
}

interface ToastProps extends Toast {
  onRemove: (id: string) => void
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const styles = {
  success: 'bg-green-500/10 border-green-500/20 text-green-400',
  error: 'bg-red-500/10 border-red-500/20 text-red-400',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
}

export function ToastComponent({ id, type, title, description, duration = 5000, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  
  const Icon = icons[type]
  
  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])
  
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleRemove()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration])
  
  const handleRemove = () => {
    setIsLeaving(true)
    setTimeout(() => onRemove(id), 300)
  }
  
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm shadow-lg transition-all duration-300 transform',
        styles[type],
        isVisible && !isLeaving ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
      )}
      role="alert"
      aria-live="assertive"
    >
      <Icon className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{title}</h4>
        {description && (
          <p className="text-xs opacity-80 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={handleRemove}
        className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Toast container and hook would go here in a real implementation
// For now, this is just the component structure