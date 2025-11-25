const StatsCard = ({ label, value, trend, helper }) => {
  return (
    <article className="stats-card">
      <p className="stats-label">{label}</p>
      <div className="stats-value-row">
        <p className="stats-value">{value}</p>
        <span className="stats-trend">{trend}</span>
      </div>
      <p className="stats-helper">{helper}</p>
    </article>
  )
}

export default StatsCard

