'use client';

import dynamic from 'next/dynamic';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Grid, Stack, Icon, Box, CircularProgress } from '@mui/material';
import { useEffect } from 'react';
import { useMapStore } from '@/stores/map-store';
import { trpc } from '@/lib/trpc/client';

const DiceRoller = dynamic(() => import("@/components/DiceRoller"), { ssr: false });
const PlayerPositions = dynamic(() => import('@/components/PlayerPositions'), { ssr: false });
const MapWithCars = dynamic(
  () => import('@/components/MapWithCars'),
  {
    ssr: false,
    loading: () => (
      <Box
        sx={{
          height: '80vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
        }}
      >
        <CircularProgress />
      </Box>
    ),
  }
);
const ProfileSelector = dynamic(() => import('@/components/ProfileSelector'), { ssr: false });
const MapLayerSelector = dynamic(() => import('@/components/MapLayerSelector'), { ssr: false });
const MappingProviderSelector = dynamic(() => import('@/components/MappingProviderSelector'), { ssr: false });
const StartingPositionSelector = dynamic(() => import('@/components/StartingPositionSelector'), { ssr: false });
const MapPositions = dynamic(() => import('@/components/MapPositions'), { ssr: false });
const Copyright = dynamic(() => import('@/components/Copyright'), { ssr: false });
const ProTip = dynamic(() => import('@/components/ProTip'), { ssr: false });

export default function GamePage() {
  const setAccessToken = useMapStore((state) => state.setAccessToken);

  const { data: tokenData } = trpc.token.getRawToken.useQuery();

  useEffect(() => {
    if (tokenData) {
      setAccessToken(tokenData);
    }
  }, [tokenData, setAccessToken]);

  return (
    <Container maxWidth={false}>
      <Stack pt={2} direction="row" alignItems="center" spacing={2}>
        <Icon sx={{ pt: 1, height: 60, width: 150 }}>
          <img src="https://labs.os.uk/static/media/os-logo.svg" alt="OS Logo" />
        </Icon>
        <Typography variant="h4" component="h1" gutterBottom>
          Oscillation
        </Typography>
        <Typography
          sx={{ display: { xs: 'none', xl: 'block' } }}
          variant="h6"
          component="h1"
          gutterBottom
        >
          Version 0.2 (T3 Stack)
        </Typography>
      </Stack>

      <Grid pt={1} container alignItems="center" spacing={2}>
        <Grid item xs>
          <ProfileSelector />
        </Grid>
        <Grid item xs>
          <MappingProviderSelector />
        </Grid>
        <Grid item xs>
          <MapLayerSelector />
        </Grid>
        <Grid item xs>
          <StartingPositionSelector />
        </Grid>
      </Grid>

      <Grid container alignItems="center" spacing={2}>
        <Grid item xs={12} xl={8}>
          <DiceRoller />
        </Grid>
        <Grid item xs={12} xl={4}>
          <MapPositions />
        </Grid>
      </Grid>

      <PlayerPositions />
      <MapWithCars />

      <Grid container alignItems="start">
        <Grid item xs>
          <ProTip />
        </Grid>
        <Grid item xs>
          <Copyright />
        </Grid>
      </Grid>
    </Container>
  );
}
