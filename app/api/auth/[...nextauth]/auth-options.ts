import { config } from "@/auth"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
    ...config
}