'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(28, 25, 23, 0.4)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className={cn('w-full card p-0 overflow-hidden', widths[size])}
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>
            {title}
          </h2>
          <button onClick={onClose} className="btn btn-ghost p-1.5 rounded-md">
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
