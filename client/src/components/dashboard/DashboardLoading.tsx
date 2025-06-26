
export default function DashboardLoading() {
  return (
    <div className="dashboard-loading-container">
      <div className="dashboard-loading-card">
        <div className="dashboard-loading-content">
          <div className="dashboard-loading-spinner"></div>
          <span className="dashboard-loading-text">Loading dashboard...</span>
        </div>
      </div>
    </div>
  );
}
