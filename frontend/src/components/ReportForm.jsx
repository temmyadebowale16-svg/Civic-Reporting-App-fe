import { useState } from "react";
import PropTypes from "prop-types";
import { CATEGORIES, submitReport } from "../api/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function ReportForm() {
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fileError, setFileError] = useState("");
  const [result, setResult] = useState(null);

  function handleGetLocation() {
    if (!navigator.geolocation) {
      setLocationError("Your browser doesn't support location detection.");
      return;
    }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
      },
      (error) => {
        setLocationError("Couldn't get your location: " + error.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleFileChange(e) {
    setFileError("");
    const files = Array.from(e.target.files);

    // Validate each file
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File "${file.name}" exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
        return;
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setFileError(`File "${file.name}" is not a supported image format. Use JPEG, PNG, WebP, or GIF.`);
        return;
      }
    }

    // Create previews
    const previews = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      size: (file.size / (1024 * 1024)).toFixed(1),
    }));

    setImages(files);
    setImagePreviews(previews);
  }

  function removeImage(index) {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(imagePreviews[index].url);
    setImages(newImages);
    setImagePreviews(newPreviews);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    if (!location) {
      setSubmitError("Please share your location before submitting.");
      return;
    }
    if (!description.trim()) {
      setSubmitError("Please describe the issue.");
      return;
    }

    setSubmitting(true);
    try {
      const report = await submitReport({
        category,
        description,
        latitude: location.latitude,
        longitude: location.longitude,
        images,
      });
      setResult(report);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || "Something went wrong submitting your report.";
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-xl border border-[#1B4332]/20 bg-[#EAF2ED] p-8 text-center">
        <h2 className="text-xl font-bold text-[#1B4332]">Report submitted ✅</h2>
        <p className="mt-2 text-sm text-gray-800">
          Thank you for reporting this issue. Save your reference code to track its status:
        </p>
        <p className="mx-auto my-4 inline-block rounded-lg border-2 border-dashed border-[#C9A227] bg-[#F7F5EF] px-6 py-3 font-mono text-2xl font-bold tracking-wider text-[#1B4332]">
          {result.reference_code}
        </p>
        <div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-[#1B4332] px-4 py-2 text-sm font-semibold text-[#F7F5EF] hover:bg-[#12301F]"
          >
            Submit another report
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-gray-300 bg-[#FCFBF8] p-6 shadow-sm">
      <h2 className="text-xl font-bold text-[#1B4332]">Report an Issue</h2>

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-800">
        Category
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-gray-400 bg-[#FCFBF8] px-3 py-2 text-base font-normal text-gray-900 focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-800">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue (what, where, how bad)..."
          rows={4}
          maxLength={5000}
          required
          className="rounded-md border border-gray-400 bg-[#FCFBF8] px-3 py-2 text-base font-normal text-gray-900 focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
        />
        <span className="text-xs font-normal text-gray-500">{description.length}/5000</span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-800">
        Photos (optional, max 5 MB each)
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="rounded-md border border-gray-400 bg-[#FCFBF8] px-3 py-2 text-sm font-normal text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-[#1B4332] file:px-3 file:py-1.5 file:text-[#F7F5EF]"
        />
        {fileError && <p className="text-sm font-medium text-[#B3261E]">{fileError}</p>}
      </label>

      {imagePreviews.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-700">Image Preview ({imagePreviews.length} selected):</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square overflow-hidden rounded-lg border border-gray-300 bg-gray-100">
                <img src={preview.url} alt={`Preview ${index}`} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="rounded-full bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
                <span className="absolute bottom-1 right-1 rounded bg-black/70 px-2 py-1 text-xs text-white">
                  {preview.size} MB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleGetLocation}
          disabled={locating}
          className="self-start rounded-md bg-[#1B4332] px-4 py-2 text-sm font-semibold text-[#F7F5EF] hover:bg-[#12301F] disabled:opacity-60"
        >
          {locating ? "Getting location..." : location ? "Update location" : "Share my location"}
        </button>
        {location && (
          <span className="text-sm font-medium text-[#1B4332]">
            📍 Location captured ({location.latitude.toFixed(5)}, {location.longitude.toFixed(5)})
          </span>
        )}
        {locationError && <p className="text-sm font-medium text-[#B3261E]">{locationError}</p>}
      </div>

      {submitError && <p className="text-sm font-medium text-[#B3261E]">{submitError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-[#1B4332] px-4 py-2.5 text-base font-semibold text-[#F7F5EF] hover:bg-[#12301F] disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit Report"}
      </button>
    </form>
  );
}

ReportForm.propTypes = {
  onReportSubmitted: PropTypes.func,
};
