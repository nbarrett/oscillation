"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import AddLocationIcon from "@mui/icons-material/AddLocation";
import { trpc } from "@/lib/trpc/client";
import { useGameStore } from "@/stores/game-store";
import { formatLatLong, log } from "@/lib/utils";

interface AddStartingPointDialogProps {
  onSuccess: () => void;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
  );
  const data = await response.json();

  if (data.address) {
    const { road, hamlet, village, town, city, suburb, county } = data.address;
    const parts: string[] = [];

    if (road) parts.push(road);
    if (hamlet) parts.push(hamlet);
    if (village) parts.push(village);
    if (suburb) parts.push(suburb);
    if (town) parts.push(town);
    if (city) parts.push(city);

    if (parts.length === 0 && county) {
      parts.push(county);
    }

    return parts.slice(0, 3).join(", ") || "Unknown Location";
  }
  return "Unknown Location";
}

export default function AddStartingPointDialog({ onSuccess }: AddStartingPointDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isLoadingName, setIsLoadingName] = useState(false);

  const { mapClickPosition, mapCentre } = useGameStore();
  const createLocation = trpc.locations.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      setName("");
      onSuccess();
    },
  });

  const currentPosition = mapClickPosition?.latLng || (mapCentre ? { lat: mapCentre[0], lng: mapCentre[1] } : null);

  useEffect(() => {
    if (open && currentPosition && !name) {
      setIsLoadingName(true);
      reverseGeocode(currentPosition.lat, currentPosition.lng)
        .then((placeName) => {
          setName(placeName);
          setIsLoadingName(false);
        })
        .catch((error) => {
          log.error("Failed to reverse geocode:", error);
          setName("");
          setIsLoadingName(false);
        });
    }
  }, [open, currentPosition]);

  function handleOpen() {
    setName("");
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setName("");
  }

  function handleSave() {
    if (!currentPosition || !name.trim()) return;
    createLocation.mutate({
      name: name.trim(),
      lat: currentPosition.lat,
      lng: currentPosition.lng,
    });
  }

  const hasPosition = !!currentPosition;

  return (
    <>
      <Tooltip title={hasPosition ? "Add current location as starting point" : "Click on map first to set a location"}>
        <span>
          <IconButton
            onClick={handleOpen}
            disabled={!hasPosition}
            color="primary"
            size="small"
          >
            <AddLocationIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Add Starting Point</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {currentPosition && (
              <Typography variant="body2" color="text.secondary">
                Location: {formatLatLong(currentPosition)}
              </Typography>
            )}
            <TextField
              autoFocus
              label="Location Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoadingName}
              InputProps={{
                endAdornment: isLoadingName ? <CircularProgress size={20} /> : null,
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!name.trim() || createLocation.isPending}
          >
            {createLocation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
