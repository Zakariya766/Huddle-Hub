import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Venue, Team } from "@shared/schema";

// Fix default marker icons not loading with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER: [number, number] = [41.8827, -87.6233];
const DEFAULT_ZOOM = 13;

function createColoredIcon(color: string) {
  return L.divIcon({
    className: "custom-map-marker",
    html: `<div style="
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

interface VenueMapProps {
  venues: Venue[];
  teams: Team[];
  selectedVenueId?: string | null;
  onVenueSelect?: (venue: Venue) => void;
}

export function VenueMap({ venues, teams, selectedVenueId, onVenueSelect }: VenueMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // Update markers when venues change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markerLayer = markersRef.current;
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();

    if (venues.length === 0) return;

    venues.forEach((venue) => {
      const team = teams.length > 0 ? teams[0] : undefined;
      const color = "#6B7280";
      const icon = createColoredIcon(color);

      const marker = L.marker([venue.lat, venue.lng], { icon }).addTo(markerLayer);

      const popupContent = `
        <div style="min-width: 180px; font-family: system-ui, sans-serif;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${venue.name}</div>
          ${team ? `<div style="display: inline-block; background: #6B728022; color: #6B7280; font-size: 11px; padding: 2px 8px; border-radius: 12px; margin-bottom: 6px; font-weight: 500;">${team.name}</div>` : ""}
          <div style="font-size: 12px; color: #6B7280; margin-bottom: 4px;">${venue.description || ""}</div>
          <div style="font-size: 11px; color: #9CA3AF; display: flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${venue.address}
          </div>
          <div style="margin-top: 6px;">
            <span style="font-size: 10px; border: 1px solid #E5E7EB; padding: 2px 6px; border-radius: 4px; color: #6B7280;">${venue.category}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { closeButton: true, maxWidth: 250 });

      marker.on("click", () => {
        onVenueSelect?.(venue);
      });
    });

    // Fit bounds to show all markers
    const bounds = L.latLngBounds(venues.map((v) => [v.lat, v.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [venues, teams, onVenueSelect]);

  // Pan to selected venue
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedVenueId) return;

    const venue = venues.find((v) => v.id === selectedVenueId);
    if (venue) {
      map.setView([venue.lat, venue.lng], 15, { animate: true });
    }
  }, [selectedVenueId, venues]);

  return (
    <div className="relative rounded-lg overflow-hidden border">
      <div ref={mapRef} style={{ height: "400px", width: "100%" }} />
    </div>
  );
}
