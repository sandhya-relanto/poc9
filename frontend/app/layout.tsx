import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SalesCoach – Auth',
  description: 'Sign up or log in to SalesCoach',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
