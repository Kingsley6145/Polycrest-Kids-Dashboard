const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-container">
      <main className="dashboard-content">{children}</main>
    </div>
  )
}

export default DashboardLayout

