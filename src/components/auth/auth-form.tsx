"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { trpc } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPreviewHeader } from "@/components/ui/map-preview"

interface AuthFormProps {
  onSuccess?: () => void
  showMapPreview?: boolean
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  )
}

function PinInput({ id, name, placeholder, disabled }: {
  id: string
  name: string
  placeholder: string
  disabled: boolean
}) {
  return (
    <Input
      id={id}
      name={name}
      type="password"
      inputMode="numeric"
      maxLength={4}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete="new-password"
      data-form-type="other"
    />
  )
}

export function AuthForm({ onSuccess, showMapPreview = true }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const register = trpc.auth.register.useMutation({
    onSuccess: async (_, variables) => {
      const result = await signIn("credentials", {
        nickname: variables.nickname,
        pin: variables.pin,
        redirect: false,
      })
      if (result?.ok) {
        onSuccess?.()
      } else {
        setError("Registration successful but login failed")
      }
      setIsLoading(false)
    },
    onError: (err) => {
      setError(err.message)
      setIsLoading(false)
    },
  })

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const nickname = (formData.get("nickname") as string).trim()
    const pin = formData.get("pin") as string

    if (!nickname) {
      setError("Please enter your nickname")
      setIsLoading(false)
      return
    }

    if (!pin || !/^\d{4}$/.test(pin)) {
      setError("Please enter a valid 4-digit PIN")
      setIsLoading(false)
      return
    }

    try {
      const result = await signIn("credentials", { nickname, pin, redirect: false })
      if (result?.error) {
        setError("Invalid nickname or PIN")
        setIsLoading(false)
        return
      }
      if (result?.ok) {
        onSuccess?.()
      }
    } catch {
      setError("An error occurred. Please try again.")
    }
    setIsLoading(false)
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const nickname = (formData.get("nickname") as string).trim()
    const pin = formData.get("pin") as string
    const confirmPin = formData.get("confirmPin") as string

    if (!nickname) {
      setError("Please enter a nickname")
      setIsLoading(false)
      return
    }

    if (!pin || !/^\d{4}$/.test(pin)) {
      setError("Please enter a valid 4-digit PIN")
      setIsLoading(false)
      return
    }

    if (pin !== confirmPin) {
      setError("PINs do not match")
      setIsLoading(false)
      return
    }

    register.mutate({ nickname, pin })
  }

  return (
    <div className="w-full max-w-lg mx-auto overflow-hidden rounded-lg border bg-card">
      {showMapPreview && <MapPreviewHeader height="h-64" />}

      <div className="p-6">
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-0">
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-nickname">Nickname</Label>
                <Input id="login-nickname" name="nickname" placeholder="Enter your nickname" disabled={isLoading} autoComplete="username" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-pin">PIN</Label>
                <PinInput id="login-pin" name="pin" placeholder="4-digit PIN" disabled={isLoading} />
              </div>
              {error && <ErrorMessage message={error} />}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-0">
            <form onSubmit={handleRegister} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-nickname">Nickname</Label>
                <Input id="register-nickname" name="nickname" placeholder="Choose a nickname" disabled={isLoading} autoComplete="username" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-pin">PIN</Label>
                <PinInput id="register-pin" name="pin" placeholder="4-digit PIN" disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pin">Confirm PIN</Label>
                <PinInput id="confirm-pin" name="confirmPin" placeholder="Confirm PIN" disabled={isLoading} />
              </div>
              {error && <ErrorMessage message={error} />}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
