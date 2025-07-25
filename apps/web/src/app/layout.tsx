import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Saneatsu Portfolio',
  description: 'Portfolio website of Saneatsu',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}