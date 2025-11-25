const statusClasses = {
  pending: 'badge badge-pending',
  approved: 'badge badge-approved',
  waitlisted: 'badge badge-waitlisted'
}

const EnrollmentTable = ({ enrollments, selectedId, onSelect }) => {
  if (!enrollments.length) {
    return (
      <div className="enrollment-table empty">
        <p>No applications match your filters yet.</p>
        <p className="supporting-text">Try widening the date range or clearing the search.</p>
      </div>
    )
  }

  return (
    <div className="enrollment-table">
      <table>
        <thead>
          <tr>
            <th>Child</th>
            <th>Parent</th>
            <th>Course</th>
            <th>Preferred Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((enrollment) => (
            <tr
              key={enrollment.id}
              className={selectedId === enrollment.id ? 'active' : ''}
              onClick={() => onSelect(enrollment.id)}
            >
              <td>
                <p className="cell-primary">{enrollment.childName}</p>
                <p className="cell-secondary">ID • {enrollment.id}</p>
              </td>
              <td>
                <p className="cell-primary">{enrollment.parentName}</p>
                <p className="cell-secondary">{enrollment.parentEmail}</p>
              </td>
              <td>
                <p className="cell-primary">{enrollment.course}</p>
                <p className="cell-secondary">Age {enrollment.childAge}</p>
              </td>
              <td>
                <p className="cell-primary">{enrollment.preferredTime}</p>
                <p className="cell-secondary">
                  Starts {enrollment.startDate 
                    ? new Date(enrollment.startDate).toLocaleDateString()
                    : 'TBD'}
                </p>
              </td>
              <td>
                <span className={statusClasses[enrollment.status]}>{enrollment.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default EnrollmentTable

