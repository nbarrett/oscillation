"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { trpc } from "@/lib/trpc/client"
import superjson from "superjson"
import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SessionProvider } from "@/components/auth/session-provider"
import { ErrorSnackbar } from "@/components/error-snackbar"
import { useErrorStore } from "@/stores/error-store"
import { TRPCClientError } from "@trpc/client"

function baseUrl() {
  if (typeof window !== "undefined") return ""
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

function handleTRPCError(error: unknown) {
  const addError = useErrorStore.getState().addError
  if (error instanceof TRPCClientError) {
    addError(error.message)
  } else if (error instanceof Error) {
    addError(error.message)
  } else {
    addError("An unexpected error occurred")
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: handleTRPCError,
        }),
        mutationCache: new MutationCache({
          onError: handleTRPCError,
        }),
      })
  )
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${baseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  )

  return (
    <SessionProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              {children}
              <ErrorSnackbar />
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  )
}
