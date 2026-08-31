import { useState, useEffect } from "react";
import ReportForm from "./components/ReportForm";
import TrackReport from "./components/TrackReport";
import PublicMap from "./components/PublicMap";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import ErrorBoundary from "./components/ErrorBoundary";

const TABS = [
  { id: "report", label: "Report an Issue" },
  { id: "track", label: "Track My Report" },
  { id: "map", label: "Community Map" },
  { id: "admin", label: "Admin" },
];

function App() {
  const [view, setView] = useState("report");
  const [adminToken, setAdminToken] = useState(null);
  const [adminUsername, setAdminUsername] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from sessionStorage on app startup
  useEffect(() => {
    const storedToken = sessionStorage.getItem("adminToken");
    const storedUsername = sessionStorage.getItem("adminUsername");
    if (storedToken) {
      setAdminToken(storedToken);
      setAdminUsername(storedUsername);
    }
    setIsLoading(false);
  }, []);

  function handleLoginSuccess(token, username) {
    // Store in sessionStorage (not localStorage for security)
    sessionStorage.setItem("adminToken", token);
    sessionStorage.setItem("adminUsername", username);
    setAdminToken(token);
    setAdminUsername(username);
  }

  function handleLogout() {
    // Clear from sessionStorage
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminUsername");
    setAdminToken(null);
    setAdminUsername(null);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-civic-cream flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-civic-cream">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <header className="mb-6">
           <h1 className="p-6 text-center font-display text-3xl font-bold tracking-tight text-civic-green sm:text-4xl">
  🏙️ CIVIC ISSUE REPORTER
</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">
              Report problems in your community — roads, water, electricity, waste, and more.
            </p>
          </header>

          <nav className="flex flex-wrap gap-1 border-b border-gray-300">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={
                  "rounded-t-md px-3 py-2 text-sm font-semibold transition-colors sm:px-4 " +
                  (view === tab.id
                    ? "bg-civic-green text-black"
                    : "text-gray-600 hover:bg-civic-green/10 hover:text-civic-green")
                }
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <main className="mt-6">
            {view === "report" && <ReportForm />}
            {view === "track" && <TrackReport />}
            {view === "map" && <PublicMap />}
            {view === "admin" &&
              (adminToken ? (
                <AdminDashboard token={adminToken} username={adminUsername} onLogout={handleLogout} />
              ) : (
                <AdminLogin onLoginSuccess={handleLoginSuccess} />
              ))}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
