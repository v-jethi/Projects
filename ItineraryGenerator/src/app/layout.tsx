import type { Metadata } from 'next'
import './globals.css'
import { ThemeProviderWrapper } from '@/components/ThemeProviderWrapper'

export const metadata: Metadata = {
  title: 'AI Itinerary Creator',
  description: 'Generate personalized travel itineraries powered by AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProviderWrapper>
          {children}
        </ThemeProviderWrapper>
      </body>
    </html>
  )
}

