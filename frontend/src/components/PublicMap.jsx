import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchPublicReports } from "../api/client";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const STATUS_COLORS = {
  pending: "#B3261E",
  acknowledged: "#C98A1E",
  in_progress: "#1E6FC9",
  resolved: "#1B7A3D",
  closed: "#6B6B6B",
};

const DEFAULT_CENTER = [9.082, 8.6753];
const DEFAULT_ZOOM = 6;

export default function PublicMap() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPublicReports()
      .then(setReports)
      .catch(() => setError("Couldn't load reports. Please try again later."))
      .finally(() => setLoading(false));
  }, []);

  const center = reports.length > 0 ? [reports[0].latitude, reports[0].longitude] : DEFAULT_CENTER;

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-civic-green">Community Reports Map</h2>
      {loading && <p className="mt-2 text-sm text-gray-600">Loading reports...</p>}
      {error && <p className="mt-2 text-sm text-status-pending">{error}</p>}

      {!loading && !error && (
        <>
          <p className="mt-1 text-sm text-gray-600">
            {reports.length} report{reports.length !== 1 ? "s" : ""} reported so far.
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
            <MapContainer
              center={center}
              zoom={reports.length > 0 ? 12 : DEFAULT_ZOOM}
              style={{ height: "420px", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {reports.map((report) => (
                <Marker key={report.id} position={[report.latitude, report.longitude]}>
                  <Popup>
                    <strong>{report.category_display}</strong>
                    <p style={{ margin: "0.3rem 0" }}>{report.description}</p>
                    <span
                      style={{
                        color: STATUS_COLORS[report.status] || "#333",
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {report.status_display}
                    </span>
                    <br />
                    <small>{report.reference_code}</small>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <span key={status} className="flex items-center gap-1.5 capitalize">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                {status.replace("_", " ")}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

PublicMap.propTypes = {};
