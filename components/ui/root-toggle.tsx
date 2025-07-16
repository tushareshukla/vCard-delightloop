"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface RootSelectOption {
  url: string
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  urls?: string[]
  className?: string
}

interface RootSelectProps extends React.HTMLAttributes<HTMLButtonElement> {
  options: RootSelectOption[]
  placeholder?: React.ReactNode
  onSelect?: () => void
}

export function RootSelect({ 
  options, 
  placeholder,
  onSelect,
  className,
  ...props 
}: RootSelectProps) {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  const selected = React.useMemo(() => {
    return options.findLast((item) =>
      item.urls
        ? item.urls.includes(pathname)
        : pathname.startsWith(item.url)
    )
  }, [options, pathname])

  const handleSelect = () => {
    setOpen(false)
    onSelect?.()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {(selected || placeholder) && (
        <PopoverTrigger
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1.5",
            "hover:bg-accent/50 hover:text-accent-foreground",
            className
          )}
          {...props}
        >
          <SelectItem {...(selected ?? { title: placeholder })} />
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </PopoverTrigger>
      )}
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="overflow-hidden rounded-md">
          {options.map((option) => (
            <Link
              key={option.url}
              href={option.url}
              onClick={handleSelect}
              className={cn(
                "flex w-full items-center gap-2 px-2 py-1.5",
                "transition-colors",
                selected === option
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50 hover:text-accent-foreground",
                option.className
              )}
            >
              <SelectItem {...option} />
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function SelectItem({ 
  icon, 
  title, 
  description 
}: Partial<RootSelectOption>) {
  return (
    <>
      {icon}
      <div className="flex-1 text-left">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </>
  )
}