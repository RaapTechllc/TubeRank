import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  id?: string
  min?: number
  max?: number
  step?: number
  value?: number[]
  onValueChange?: (value: number[]) => void
  disabled?: boolean
  className?: string
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ id, min = 0, max = 100, step = 1, value = [0], onValueChange, disabled = false, className, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(event.target.value)
      onValueChange?.([newValue])
    }

    const currentValue = value[0] || 0
    const percentage = ((currentValue - min) / (max - min)) * 100

    return (
      <div ref={ref} className={cn("relative flex w-full touch-none select-none items-center", className)} {...props}>
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <div 
            className="absolute h-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div 
          className="absolute block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }