'use client';

import { useEffect } from 'react';
import MenuItem from '@mui/material/MenuItem';
import { TextField } from '@mui/material';
import { useRouteStore, Profile } from '@/stores/route-store';
import { asTitle, log } from '@/lib/utils';

const profileOptions = Object.values(Profile);

export default function ProfileSelector() {
  const { profile, setProfile } = useRouteStore();

  useEffect(() => {
    if (!profile) {
      log.debug('ProfileSelector:profile:initialised to:', Profile.DRIVING_CAR);
      setProfile(Profile.DRIVING_CAR);
    }
  }, [profile, setProfile]);

  useEffect(() => {
    log.debug('ProfileSelector:profile:', profile);
  }, [profile]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setProfile(event.target.value as Profile);
  }

  return (
    <TextField
      fullWidth
      sx={{ minWidth: 220 }}
      select
      size="small"
      label="Driving Profile"
      value={profile || ''}
      onChange={handleChange}
    >
      {profileOptions.map((value) => (
        <MenuItem key={value} value={value}>
          {asTitle(value)}
        </MenuItem>
      ))}
    </TextField>
  );
}
