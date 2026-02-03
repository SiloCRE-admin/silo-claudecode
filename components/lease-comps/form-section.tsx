'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react'

interface FormSectionProps {
  title?: string
  icon?: LucideIcon
  children: React.ReactNode
  showAccentBar?: boolean
  headerAction?: React.ReactNode
  className?: string
  collapsible?: boolean
  defaultOpen?: boolean
  onExpand?: () => void
}

export default function FormSection({
  title,
  icon: Icon,
  children,
  showAccentBar = true,
  headerAction,
  className,
  collapsible = false,
  defaultOpen = true,
  onExpand,
}: FormSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const expandedOnce = React.useRef(defaultOpen)

  const handleToggle = () => {
    if (!collapsible) return
    const next = !open
    setOpen(next)
    if (next && !expandedOnce.current) {
      expandedOnce.current = true
      onExpand?.()
    }
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {showAccentBar && (
        <div className="h-1 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8b]" />
      )}
      {title && (
        <div
          className={cn(
            'flex items-center justify-between px-3 pt-2',
            collapsible && 'cursor-pointer select-none'
          )}
          onClick={handleToggle}
        >
          <div className="flex items-center gap-1.5">
            {collapsible && (
              open ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )
            )}
            {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {title}
            </span>
          </div>
          {headerAction && (
            <div onClick={(e) => e.stopPropagation()}>{headerAction}</div>
          )}
        </div>
      )}
      {open && <div className="px-3 pb-2 pt-1">{children}</div>}
    </Card>
  )
}
