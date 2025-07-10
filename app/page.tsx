"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import Link from "next/link";
import { Fetch } from "@/hooks/fetch";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<{ email: string, name: string, image: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handle = async () => {
      setLoading(true);
      try {
        const response = await Fetch({
          body: '',
          api: 'get/user/selected',
          method: "GET",
          host: 'server',
          loading: (v) => { }
        });

        if (response !== null) {
          setUser({
            name: response.fullName,
            email: response.email,
            image: response.avatarUrl
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    handle();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/chat?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0ebf8] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col m-0 p-0">
      {/* Header */}
      <header className="flex items-center justify-between px-9 pt-10">
        <div className="flex items-center">
          <Image src="/parkpal-logo-clean.png" alt="Parkpal" width={120} height={40} />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/reserve">
            <Button variant="outline" size="sm" className="text-sm px-4">
              Test Reserve
            </Button>
          </Link>
          <div className="text-zinc-800">
            <ThemeToggle />
          </div>

          {user ? (
            <div
              className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200 select-none"
              title={`Logged in as ${user.name}`}
            >
              <div className="relative">
                <Image
                  src={user.image || "/default-avatar.png"}
                  alt={user.name}
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                />
                {/* Online status dot */}
                <span className="absolute bottom-0 right-0 block w-3 h-3 bg-green-500 border-2 border-white rounded-full dark:border-gray-700" />
              </div>
              <span className="max-w-[120px] truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {user.name}
              </span>
            </div>
          ) : (
            <Link href="/auth/signin">
              <Button
                variant="outline"
                size="sm"
                className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-sm px-4"
              >
                Log in
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="text-center max-w-4xl mx-auto w-full">
          <h1 className="text-6xl font-bold text-black mb-8 leading-tight">
            {user ? `Hi ${user.name}, I'm Parkpal` : "Hi, I'm Parkpal"}
          </h1>

          <p className="text-lg text-black mb-12">
            How it works? Type: 'Park me asap' or 'Park me near [post-code]'
          </p>

          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="relative bg-[#021e34] rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder=""
                    className="w-full bg-transparent text-white text-lg outline-none"
                  />
                  {!searchQuery && (
                    <div className="absolute inset-0 flex items-center text-gray-400 text-lg pointer-events-none">
                      <span className="text-white animate-pulse" style={{ animationDuration: "0.8s" }}>|</span>
                      <span className="ml-1">Where are you looking to park today?</span>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-[#9ef01a] hover:bg-[#8ed617] text-black px-4 py-2 rounded-xl font-bold transition-colors duration-200 flex-shrink-0"
                >
                  PARK
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-4 px-6">
        <div className="text-center max-w-6xl mx-auto">
          <div className="-mb-4">
            <Image src="/parkpal-logo-minimal.png" alt="Pp" width={86} height={86} className="mx-auto opacity-30" />
          </div>
          <div className="text-sm text-black whitespace-nowrap">
            By sending a message, you agree to our{" "}
            <button className="underline hover:no-underline">Terms of Use</button> and acknowledge that you have read
            and understand our <button className="underline hover:no-underline">Privacy Policy</button>.
          </div>
        </div>
      </footer>
    </div>
  );
}
