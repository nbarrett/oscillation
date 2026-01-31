"use client";

import { useState, useEffect } from "react";
import { useMapEvents } from "react-leaflet";
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import AddLocationIcon from "@mui/icons-material/AddLocation";
import { trpc } from "@/lib/trpc/client";
import { formatLatLong, log, colours } from "@/lib/utils";

interface ContextMenuState {
  mouseX: number;
  mouseY: number;
  lat: number;
  lng: number;
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

export default function MapContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);

  const utils = trpc.useUtils();
  const createLocation = trpc.locations.create.useMutation({
    onSuccess: () => {
      setDialogOpen(false);
      setName("");
      setPendingLocation(null);
      utils.locations.getAll.invalidate();
    },
  });

  useMapEvents({
    contextmenu(e) {
      e.originalEvent.preventDefault();
      setContextMenu({
        mouseX: e.originalEvent.clientX,
        mouseY: e.originalEvent.clientY,
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  function handleClose() {
    setContextMenu(null);
  }

  function handleAddStartingPoint() {
    if (!contextMenu) return;

    setPendingLocation({ lat: contextMenu.lat, lng: contextMenu.lng });
    setContextMenu(null);
    setDialogOpen(true);
    setIsLoadingName(true);

    reverseGeocode(contextMenu.lat, contextMenu.lng)
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

  function handleDialogClose() {
    setDialogOpen(false);
    setName("");
    setPendingLocation(null);
  }

  function handleSave() {
    if (!pendingLocation || !name.trim()) return;
    createLocation.mutate({
      name: name.trim(),
      lat: pendingLocation.lat,
      lng: pendingLocation.lng,
    });
  }

  return (
    <>
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleAddStartingPoint}>
          <ListItemIcon>
            <AddLocationIcon fontSize="small" sx={{ color: colours.osMapsPurple }} />
          </ListItemIcon>
          <ListItemText>Add as Starting Point</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>Add Starting Point</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {pendingLocation && (
              <Typography variant="body2" color="text.secondary">
                Location: {formatLatLong(pendingLocation)}
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
          <Button onClick={handleDialogClose}>Cancel</Button>
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
