const EnrollmentFilters = ({ filters, onChange }) => {
  const handleChange = (field) => (event) => {
    onChange({ [field]: event.target.value })
  }

  return (
    <div className="filter-row">
      <label className="filter-group search">
        <span>Search</span>
        <input
          type="text"
          placeholder="Search child, parent, or ID"
          value={filters.search}
          onChange={handleChange('search')}
        />
      </label>

      <label className="filter-group">
        <span>Course</span>
        <select value={filters.course} onChange={handleChange('course')}>
          <option value="all">All courses</option>
          <option value="playgroup">Intro to Coding</option>
          <option value="nursery">Web &amp; App Builders</option>
          <option value="junior">Game Dev Studio</option>
          <option value="senior">AI &amp; Future Tech Lab</option>
        </select>
      </label>

      <label className="filter-group">
        <span>Status</span>
        <select value={filters.status} onChange={handleChange('status')}>
          <option value="all">Any status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="waitlisted">Waitlisted</option>
        </select>
      </label>
    </div>
  )
}

export default EnrollmentFilters

