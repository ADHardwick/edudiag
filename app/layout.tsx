import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Find an Educational Diagnostician',
  description: 'Connect with qualified educational diagnosticians near you.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-text-primary`}>
        {children}
      </body>
    </html>
  )
}
