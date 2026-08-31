import { useState } from "react";
import PropTypes from "prop-types";
import { lookupReport, STATUSES } from "../api/client";

const STATUS_STEPS = STATUSES.map(s => s.value);

function StatusTracker({ status }) {
  const currentIndex = STATUS_STEPS.indexOf(status);
  return (
    <div className="relative my-6 flex justify-between">
      <div className="absolute left-[5%] right-[5%] top-1.75 h-0.5 bg-gray-300" />
      {STATUS_STEPS.map((step, index) => {
        const active = index <= currentIndex;
        return (
          <div key={step} className="relative z-10 flex flex-1 flex-col items-center gap-1.5">
            <span
              className={
                "h-3.5 w-3.5 rounded-full border-2 border-[#F7F5EF] " +
                (active ? "bg-[#1B4332]" : "bg-gray-400")
              }
            />
            <span
              className={
                "text-center text-[0.65rem] capitalize " +
                (index === currentIndex ? "font-bold text-[#1B4332]" : "text-gray-600")
              }
            >
              {step.replace("_", " ")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function TrackReport() {
  const [code, setCode] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLookup(e) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");
    setReport(null);
    try {
      const data = await lookupReport(code);
      setReport(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("No report found with that reference code. Double-check and try again.");
      } else {
        setError("Something went wrong looking up your report. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1B4332]">Track My Report</h2>
      <form onSubmit={handleLookup} className="mt-4 flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter reference code (e.g. CR-A1B2C3)"
          className="flex-1 rounded-md border border-gray-400 bg-[#FCFBF8] px-3 py-2 text-base text-gray-900 focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[#1B4332] px-4 py-2 text-sm font-semibold text-[#F7F5EF] hover:bg-[#12301F] disabled:opacity-60"
        >
          {loading ? "Looking up..." : "Track"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm font-medium text-[#B3261E]">{error}</p>}

      {report && (
        <div className="mt-6 rounded-xl border border-gray-300 bg-[#FCFBF8] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">{report.category_display}</h3>
          <p className="font-mono text-sm font-bold text-[#1B4332]">{report.reference_code}</p>
          <p className="mt-3 text-gray-800">{report.description}</p>
          <StatusTracker status={report.status} />
          <p className="text-xs text-gray-600">
            Submitted: {new Date(report.created_at).toLocaleString()}
          </p>
          {report.photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {report.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.image}
                  alt="Report evidence"
                  className="h-24 w-24 rounded-md border border-gray-300 object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

TrackReport.propTypes = {};
