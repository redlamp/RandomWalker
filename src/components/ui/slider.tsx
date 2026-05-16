import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

type SliderExtraProps = { centered?: boolean }

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  centered = false,
  ...props
}: SliderPrimitive.Root.Props & SliderExtraProps) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max]

  const single = typeof _values[0] === "number" ? _values[0] : 0
  const total = max - min || 1
  const centerPct = ((0 - min) / total) * 100
  const valuePct = ((single - min) / total) * 100
  const left = Math.max(0, Math.min(centerPct, valuePct))
  const right = Math.max(0, 100 - Math.max(centerPct, valuePct))

  return (
    <SliderPrimitive.Root
      className={cn("data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-foreground/30 ring-1 ring-foreground/10 select-none data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2"
        >
          {centered ? (
            <div
              data-slot="slider-range"
              className="bg-primary absolute top-0 bottom-0 select-none"
              style={{ left: `${left}%`, right: `${right}%` }}
            />
          ) : (
            <SliderPrimitive.Indicator
              data-slot="slider-range"
              className="bg-primary select-none data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
            />
          )}
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
