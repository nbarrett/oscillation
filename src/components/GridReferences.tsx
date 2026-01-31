'use client';

import { useEffect } from 'react';
import { Grid } from '@mui/material';
import { useGameStore } from '@/stores/game-store';
import { asTitle, log } from '@/lib/utils';

export default function GridReferences() {
  const mapClickPosition = useGameStore((state) => state.mapClickPosition);
  const gridReferenceData = mapClickPosition?.gridReferenceData;
  const gridSquareCorners = mapClickPosition?.gridSquareCorners;
  const cornerPairs = gridSquareCorners ? Object.entries(gridSquareCorners) : null;

  useEffect(() => {
    log.info('gridReferenceData:', gridReferenceData, 'cornerPairs:', cornerPairs);
  }, [cornerPairs, gridReferenceData]);

  if (!cornerPairs) return null;

  return (
    <>
      <Grid item xs>
        <div>Grid Reference</div>
        <div>{gridReferenceData?.gridReference}</div>
      </Grid>
      {cornerPairs.map((cornerPair) => (
        <Grid item xs key={cornerPair[0]}>
          <div>{asTitle(cornerPair[0])}</div>
          <div>{cornerPair[1]}</div>
        </Grid>
      ))}
    </>
  );
}
