const EnrollmentDetail = ({ enrollment }) => {
  if (!enrollment) {
    return (
      <aside className="enrollment-detail empty">
        <h3>Select an application</h3>
        <p>Tap on any child record to review full details and leave internal notes.</p>
      </aside>
    )
  }

  return (
    <aside className="enrollment-detail">
      <header>
        <p className="eyebrow">Currently viewing</p>
        <h3>{enrollment.childName}</h3>
        <p className="supporting-text">
          Submitted {enrollment.submittedAt 
            ? (typeof enrollment.submittedAt === 'number' 
                ? new Date(enrollment.submittedAt).toLocaleString()
                : new Date(enrollment.submittedAt).toLocaleString())
            : 'Unknown date'}
        </p>
      </header>

      <div className="detail-card">
        <p className="detail-label">Parent / Guardian</p>
        <p className="detail-value">{enrollment.parentName}</p>
        <p className="detail-helper">{enrollment.parentEmail}</p>
      </div>

      <div className="detail-card">
        <p className="detail-label">Preferred course</p>
        <p className="detail-value">{enrollment.course}</p>
        <p className="detail-helper">
          Age {enrollment.childAge} • {enrollment.preferredTime}
        </p>
      </div>

      {enrollment.interests && enrollment.interests.length > 0 && (
        <div className="detail-card">
          <p className="detail-label">Interests</p>
          <div className="interest-chips">
            {enrollment.interests.map((interest) => (
              <span key={interest} className="chip filled">
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="detail-card">
        <p className="detail-label">Notes</p>
        <p className="detail-value copy">{enrollment.notes}</p>
      </div>

      <div className="detail-actions">
        <button className="btn btn-outline">Need more info</button>
        <button className="btn btn-secondary">Waitlist</button>
        <button className="btn btn-primary">Approve</button>
      </div>
    </aside>
  )
}

export default EnrollmentDetail

