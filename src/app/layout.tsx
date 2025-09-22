import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: '不良率モニタリングシステム',
  description: 'Next.js mock'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-800">
        {children}
      </body>
    </html>
  )
}

