import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import AuthProvider from "./api/auth/[...nextauth]/auth-provider"
import { getServerSession } from "next-auth"
import { authOptions } from "./api/auth/[...nextauth]/auth-options"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Parkpal - AI Parking Assistant",
  description: "Find parking that suits your precise needs with AI assistance"
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider session={session}>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
