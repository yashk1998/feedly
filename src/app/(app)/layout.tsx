'use client'

import Navbar from '@/components/layout/navbar'
import CommandPalette from '@/components/ui/command-palette'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <CommandPalette />
      {children}
    </>
  )
}
