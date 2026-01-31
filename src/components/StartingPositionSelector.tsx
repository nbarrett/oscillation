"use client";

import { useEffect } from "react";
import MenuItem from "@mui/material/MenuItem";
import { Button, TextField, Typography, Stack } from "@mui/material";
import { trpc } from "@/lib/trpc/client";
import { useRouteStore, NamedLocation } from "@/stores/route-store";
import { useGameStore } from "@/stores/game-store";
import { formatLatLong, asTitle, colours, log } from "@/lib/utils";
import AddStartingPointDialog from "./AddStartingPointDialog";

const referenceStartingPoints = [
  { name: "London", lat: 51.505, lng: -0.09 },
  { name: "Challock", lat: 51.21861, lng: 0.88011 },
  { name: "Cambridge", lat: 52.17487, lng: 0.1283 },
];

export default function StartingPositionSelector() {
  const { startingPosition, setStartingPosition, setNamedLocations, namedLocations } = useRouteStore();
  const { initialisePlayers } = useGameStore();

  const { data: locations, refetch } = trpc.locations.getAll.useQuery();
  const createLocation = trpc.locations.create.useMutation({
    onSuccess: () => refetch(),
  });

  useEffect(() => {
    if (locations) {
      setNamedLocations(locations);
      log.debug("StartingPositionSelector:locations:", locations);
    }
  }, [locations, setNamedLocations]);

  useEffect(() => {
    if (namedLocations.length > 0 && !startingPosition) {
      const firstLocation = namedLocations[0];
      log.debug("StartingPositionSelector:initialised to:", firstLocation);
      setStartingPosition(firstLocation);
    }
  }, [namedLocations, startingPosition, setStartingPosition]);

  useEffect(() => {
    if (startingPosition) {
      initialisePlayers([startingPosition.lat, startingPosition.lng]);
    }
  }, [startingPosition, initialisePlayers]);

  async function prePopulateDataStore() {
    for (const point of referenceStartingPoints) {
      log.debug("prePopulateDataStore:point:", point);
      const existing = namedLocations.find((loc) => loc.name === point.name);
      if (!existing) {
        await createLocation.mutateAsync(point);
      }
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = namedLocations.find((loc) => loc.name === event.target.value);
    if (selected) {
      setStartingPosition(selected);
    }
  }

  if (!locations || locations.length === 0) {
    return (
      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={prePopulateDataStore}
        disabled={createLocation.isPending}
        sx={{
          "&": { backgroundColor: colours.osMapsPurple },
          "&:hover": { backgroundColor: colours.osMapsPink },
        }}
      >
        {createLocation.isPending ? "Populating..." : "Populate Starting Points"}
      </Button>
    );
  }

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <TextField
        fullWidth
        sx={{ minWidth: 220 }}
        select
        size="small"
        label="Game Starting Point"
        value={startingPosition?.name || ""}
        onChange={handleChange}
      >
        {namedLocations.map((location) => (
          <MenuItem key={location.name} value={location.name}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <div>{asTitle(location.name)}</div>
              <Typography variant="body2" color="text.secondary">
                {formatLatLong([location.lat, location.lng])}
              </Typography>
            </Stack>
          </MenuItem>
        ))}
      </TextField>
      <AddStartingPointDialog onSuccess={refetch} />
    </Stack>
  );
}
