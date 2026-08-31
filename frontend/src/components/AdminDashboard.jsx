import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { fetchAdminReports, updateReportStatus, STATUSES } from "../api/client";

export default function AdminDashboard({ token, username, onLogout }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadReports();
  }, []);

  function loadReports() {
    setLoading(true);
    fetchAdminReports(token)
      .then(setReports)
      .catch(() => setError("Couldn't load reports."))
      .finally(() => setLoading(false));
  }

  async function handleStatusChange(reportId, newStatus) {
    setUpdatingId(reportId);
    try {
      const updated = await updateReportStatus(token, reportId, newStatus);
      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
    } catch {
      setError("Couldn't update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  const visibleReports =
    filterStatus === "all" ? reports : reports.filter((r) => r.status === filterStatus);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold text-civic-green">Admin Dashboard</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Logged in as {username}</span>
          <button
            onClick={onLogout}
            className="rounded-md bg-gray-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-700"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="my-4 flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 font-medium text-gray-700">
          Filter by status:
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-civic-green focus:outline-none focus:ring-1 focus:ring-civic-green"
          >
            <option value="all">All</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <span className="text-gray-500">{visibleReports.length} report(s)</span>
      </div>

      {error && <p className="text-sm text-status-pending">{error}</p>}
      {loading && <p className="text-sm text-gray-600">Loading reports...</p>}

      {!loading && (
        <div className="flex flex-col gap-4">
          {visibleReports.length === 0 && (
            <p className="text-sm text-gray-500">No reports match this filter.</p>
          )}
          {visibleReports.map((report) => (
            <div key={report.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <strong className="text-gray-900">{report.category_display}</strong>
                <span className="font-mono text-sm font-bold text-civic-green">
                  {report.reference_code}
                </span>
              </div>
              <p className="mt-2 text-gray-700">{report.description}</p>
              <p className="mt-1 text-xs text-gray-500">
                📍 {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)} &middot; Submitted{" "}
                {new Date(report.created_at).toLocaleString()}
              </p>
              {report.photos.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {report.photos.map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.image}
                      alt="Report evidence"
                      className="h-20 w-20 rounded-md border border-gray-200 object-cover"
                    />
                  ))}
                </div>
              )}
              <label className="mt-3 block text-sm font-semibold text-gray-800">
                Status:
                <select
                  value={report.status}
                  disabled={updatingId === report.id}
                  onChange={(e) => handleStatusChange(report.id, e.target.value)}
                  className="ml-2 rounded-md border border-gray-300 px-2 py-1 text-sm font-normal focus:border-civic-green focus:outline-none focus:ring-1 focus:ring-civic-green disabled:opacity-60"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

AdminDashboard.propTypes = {
  token: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
  onLogout: PropTypes.func.isRequired,
};
