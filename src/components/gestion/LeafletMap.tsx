"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
// leaflet.css is imported in the parent component (TabMapa) to avoid SSR issues

// Fix Leaflet's broken default icon paths in webpack/Next.js environments
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export type MapMarker = {
  lat: number;
  lng: number;
  label: string;
};

// ─── Fit all markers in view ──────────────────────────────────────────────────
function FitMarkers({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 13);
    } else {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [map, markers]);
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────
interface LeafletMapProps {
  markers: MapMarker[];
}

export default function LeafletMap({ markers }: LeafletMapProps) {
  // Default center: Argentina
  const defaultCenter: [number, number] = [-34.6, -63.6];
  const initialCenter: [number, number] =
    markers.length > 0 ? [markers[0].lat, markers[0].lng] : defaultCenter;

  return (
    <MapContainer
      center={initialCenter}
      zoom={markers.length === 1 ? 13 : 5}
      style={{ width: "100%", height: "100%", minHeight: 400 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitMarkers markers={markers} />
      {markers.map((m, i) => (
        <Marker key={i} position={[m.lat, m.lng]}>
          <Popup>
            <strong>{m.label}</strong>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
