"use client"

import { useEffect } from "react"
import { useRouteStore, Profile } from "@/stores/route-store"
import { asTitle, log } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const profileOptions = Object.values(Profile)

export default function ProfileSelector() {
  const { profile, setProfile } = useRouteStore()

  useEffect(() => {
    if (!profile) {
      log.debug("ProfileSelector:profile:initialised to:", Profile.DRIVING_CAR)
      setProfile(Profile.DRIVING_CAR)
    }
  }, [profile, setProfile])

  useEffect(() => {
    log.debug("ProfileSelector:profile:", profile)
  }, [profile])

  return (
    <div className="space-y-2">
      <Label>Driving Profile</Label>
      <Select value={profile || ""} onValueChange={(value) => setProfile(value as Profile)}>
        <SelectTrigger>
          <SelectValue placeholder="Select profile" />
        </SelectTrigger>
        <SelectContent>
          {profileOptions.map((value) => (
            <SelectItem key={value} value={value}>
              {asTitle(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
