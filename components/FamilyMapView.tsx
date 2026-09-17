"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Person } from "@/types/family";

// Leaflet's default marker icons reference image files the bundler doesn't
// resolve automatically — point them at a CDN instead of copying assets.
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface MapMarker {
  place: string;
  lat: number;
  lon: number;
  people: Person[];
}

interface Props {
  markers: MapMarker[];
  onSelectPerson?: (person: Person) => void;
}

const ISRAEL_CENTER: [number, number] = [31.5, 34.9];

export default function FamilyMapView({ markers, onSelectPerson }: Props) {
  const bounds = useMemo(() => {
    if (markers.length === 0) return null;
    return L.latLngBounds(markers.map((m) => [m.lat, m.lon]));
  }, [markers]);

  return (
    <MapContainer
      center={ISRAEL_CENTER}
      zoom={8}
      bounds={bounds ?? undefined}
      boundsOptions={{ padding: [40, 40] }}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <Marker key={marker.place} position={[marker.lat, marker.lon]} icon={markerIcon}>
          <Popup>
            <div className="text-sm">
              <p className="mb-1 font-semibold">{marker.place}</p>
              <ul>
                {marker.people.map((person) => (
                  <li key={person.id}>
                    {onSelectPerson ? (
                      <button
                        type="button"
                        onClick={() => onSelectPerson(person)}
                        className="text-amber-800 hover:underline"
                      >
                        {person.firstName} {person.lastName}
                      </button>
                    ) : (
                      `${person.firstName} ${person.lastName}`
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
