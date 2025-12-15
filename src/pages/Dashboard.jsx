import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import StatsCard from '../components/StatsCard'
import EnrollmentFilters from '../components/EnrollmentFilters'
import EnrollmentTable from '../components/EnrollmentTable'
import EnrollmentDetail from '../components/EnrollmentDetail'
import { fetchEnrollments, updateEnrollmentStatus } from '../services/enrollmentService'
import { fetchCourses, saveCourse, deleteCourse } from '../services/courseService'

const defaultFilters = {
  search: '',
  course: 'all',
  status: 'all',
  timeRange: '30d'
}

const MAX_COURSES = 4

const createEmptyCourse = () => ({
  title: '',
  ageRange: '',
  thumbnailUrl: '',
  shortDescription: '',
  whatYouWillLearn: [
    {
      title: '',
      description: '',
      subtopicTitle: '',
      subtopicPoints: ['']
    }
  ],
  learningOutcomes: '',
  duration: '',
  schedule: '',
  sessionLength: '',
  prerequisites: ''
})

const Dashboard = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState(defaultFilters)
  const [enrollments, setEnrollments] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [statusUpdateState, setStatusUpdateState] = useState({
    loading: false,
    error: null
  })
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false)
  const [isCoursesListOpen, setIsCoursesListOpen] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState(null)
  const [courses, setCourses] = useState([])
  const [newCourse, setNewCourse] = useState(createEmptyCourse)

  // Fetch enrollments from Firebase on component mount
  useEffect(() => {
    console.log('Dashboard: Setting up Firebase listener...')
    const unsubscribe = fetchEnrollments((enrollmentsData) => {
      console.log('Dashboard: Received enrollments data:', enrollmentsData)
      console.log('Dashboard: Number of enrollments:', enrollmentsData.length)
      setEnrollments(enrollmentsData)
    })

    // Cleanup subscription on unmount
    return () => {
      console.log('Dashboard: Cleaning up Firebase listener')
      unsubscribe()
    }
  }, [])

  // Fetch courses from Firebase on component mount
  useEffect(() => {
    const unsubscribe = fetchCourses((coursesData) => {
      setCourses(coursesData)
    })

    return () => {
      unsubscribe && unsubscribe()
    }
  }, [])

  // Auto-select first enrollment when enrollments are loaded
  useEffect(() => {
    if (enrollments.length > 0 && !selectedId) {
      setSelectedId(enrollments[0].id)
    }
  }, [enrollments, selectedId])

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((enrollment) => {
      const matchesSearch =
        enrollment.childName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        enrollment.parentName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        enrollment.id?.toLowerCase().includes(filters.search.toLowerCase())

      const matchesCourse =
        filters.course === 'all' || enrollment.courseId === filters.course

      const matchesStatus =
        filters.status === 'all' || enrollment.status === filters.status

      return matchesSearch && matchesCourse && matchesStatus
    })
  }, [enrollments, filters])

  const activeEnrollment = useMemo(() => {
    if (!filteredEnrollments.length) {
      return undefined
    }

    return filteredEnrollments.find((record) => record.id === selectedId) || filteredEnrollments[0]
  }, [filteredEnrollments, selectedId])

  const handleStatusChange = async (enrollmentId, nextStatus) => {
    if (!enrollmentId || !nextStatus) {
      return
    }

    setStatusUpdateState({ loading: true, error: null })
    try {
      await updateEnrollmentStatus(enrollmentId, nextStatus)
    } catch (error) {
      console.error('Failed to update enrollment status:', error)
      setStatusUpdateState({
        loading: false,
        error: 'Something went wrong while updating status.'
      })
      return
    }

    setStatusUpdateState({ loading: false, error: null })
  }

  const overviewStats = useMemo(() => {
    const total = filteredEnrollments.length
    const pending = filteredEnrollments.filter((item) => item.status === 'pending').length
    const approved = filteredEnrollments.filter((item) => item.status === 'approved').length
    const waitlisted = filteredEnrollments.filter((item) => item.status === 'waitlisted').length

    return [
      {
        label: 'Total Applications',
        value: total.toString().padStart(2, '0'),
        trend: '+18%',
        helper: 'last 30 days'
      },
      {
        label: 'Pending Reviews',
        value: pending.toString().padStart(2, '0'),
        trend: '+6 new',
        helper: 'action needed'
      },
      {
        label: 'Approved Students',
        value: approved.toString().padStart(2, '0'),
        trend: '+12%',
        helper: 'ready to onboard'
      },
      {
        label: 'Waitlist',
        value: waitlisted.toString().padStart(2, '0'),
        trend: '-3%',
        helper: 'monitor capacity'
      }
    ]
  }, [filteredEnrollments])

  const handleDownloadCSV = () => {
    // CSV headers
    const headers = [
      'ID',
      'Child Name',
      'Parent Name',
      'Parent Email',
      'Course',
      'Status',
      'Submitted At',
      'Preferred Time',
      'Start Date',
      'Child Age',
      'Interests',
      'Notes'
    ]

    // Convert enrollments to CSV rows
    const csvRows = [
      headers.join(','),
      ...filteredEnrollments.map((enrollment) => {
        const row = [
          enrollment.id,
          `"${enrollment.childName}"`,
          `"${enrollment.parentName}"`,
          enrollment.parentEmail,
          `"${enrollment.course}"`,
          enrollment.status,
          enrollment.submittedAt 
            ? (typeof enrollment.submittedAt === 'number' 
                ? new Date(enrollment.submittedAt).toLocaleDateString()
                : new Date(enrollment.submittedAt).toLocaleDateString())
            : '',
          `"${enrollment.preferredTime}"`,
          enrollment.startDate || '',
          enrollment.childAge,
          `"${(enrollment.interests || []).join(', ')}"`,
          `"${enrollment.notes || ''}"`
        ]
        return row.join(',')
      })
    ]

    // Create CSV content
    const csvContent = csvRows.join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `enrollments-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenAddCourse = () => {
    // Only enforce the max limit when creating a brand new course
    if (!editingCourseId && courses.length >= MAX_COURSES) {
      window.alert(
        `You already have ${MAX_COURSES} available courses. ` +
          'Please edit or delete one of the existing courses to make room for a new one.'
      )
      return
    }

    setEditingCourseId(null)
    setNewCourse(createEmptyCourse())
    setIsAddCourseOpen(true)
  }

  const handleCloseAddCourse = () => {
    setIsAddCourseOpen(false)
  }

  const handleNewCourseChange = (field, value) => {
    setNewCourse((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleOpenCoursesList = () => {
    setIsCoursesListOpen(true)
  }

  const handleCloseCoursesList = () => {
    setIsCoursesListOpen(false)
  }

  const handleEditCourse = (courseId) => {
    const course = courses.find((item) => item.id === courseId)
    if (!course) {
      return
    }

    setIsCoursesListOpen(false)
    setEditingCourseId(courseId)
    setNewCourse({
      ...createEmptyCourse(),
      ...course
    })
    setIsAddCourseOpen(true)
  }

  const handleDeleteCourse = async (courseId) => {
    if (!courseId) return

    const confirmed = window.confirm('Are you sure you want to delete this course?')
    if (!confirmed) {
      return
    }

    await deleteCourse(courseId)
  }

  const handleAddLearningPoint = () => {
    setNewCourse((prev) => ({
      ...prev,
      whatYouWillLearn: [
        ...prev.whatYouWillLearn,
        {
          title: '',
          description: '',
          subtopicTitle: '',
          subtopicPoints: ['']
        }
      ]
    }))
  }

  const handleRemoveLearningPoint = (index) => {
    setNewCourse((prev) => {
      if (prev.whatYouWillLearn.length === 1) {
        return prev
      }

      const next = prev.whatYouWillLearn.slice()
      next.splice(index, 1)

      return {
        ...prev,
        whatYouWillLearn: next
      }
    })
  }

  const handleSubtopicTitleChange = (index, value) => {
    handleLearningPointChange(index, 'subtopicTitle', value)
  }

  const handleSubtopicPointChange = (index, pointIndex, value) => {
    setNewCourse((prev) => {
      const next = prev.whatYouWillLearn.slice()
      const currentPoint = next[index] || {}
      const existingSubPoints = Array.isArray(currentPoint.subtopicPoints)
        ? currentPoint.subtopicPoints.slice()
        : []

      existingSubPoints[pointIndex] = value

      next[index] = {
        ...currentPoint,
        subtopicPoints: existingSubPoints
      }

      return {
        ...prev,
        whatYouWillLearn: next
      }
    })
  }

  const handleAddSubtopicPoint = (index) => {
    setNewCourse((prev) => {
      const next = prev.whatYouWillLearn.slice()
      const currentPoint = next[index] || {}
      const existingSubPoints = Array.isArray(currentPoint.subtopicPoints)
        ? currentPoint.subtopicPoints.slice()
        : []

      existingSubPoints.push('')

      next[index] = {
        ...currentPoint,
        subtopicPoints: existingSubPoints
      }

      return {
        ...prev,
        whatYouWillLearn: next
      }
    })
  }

  const handleRemoveSubtopicPoint = (index, pointIndex) => {
    setNewCourse((prev) => {
      const next = prev.whatYouWillLearn.slice()
      const currentPoint = next[index] || {}
      const existingSubPoints = Array.isArray(currentPoint.subtopicPoints)
        ? currentPoint.subtopicPoints.slice()
        : []

      if (existingSubPoints.length <= 1) {
        return prev
      }

      existingSubPoints.splice(pointIndex, 1)

      next[index] = {
        ...currentPoint,
        subtopicPoints: existingSubPoints
      }

      return {
        ...prev,
        whatYouWillLearn: next
      }
    })
  }

  const handleLearningPointChange = (index, field, value) => {
    setNewCourse((prev) => {
      const next = prev.whatYouWillLearn.slice()
      next[index] = {
        ...next[index],
        [field]: value
      }

      return {
        ...prev,
        whatYouWillLearn: next
      }
    })
  }

  const handleSubmitNewCourse = async (event) => {
    event.preventDefault()

    // Safety check in case the modal was opened before the count reached the limit
    if (!editingCourseId && courses.length >= MAX_COURSES) {
      window.alert(
        `You already have ${MAX_COURSES} available courses. ` +
          'Please edit or delete one of the existing courses to make room for a new one.'
      )
      return
    }

    const savedId = await saveCourse(editingCourseId, newCourse)
    console.log(
      editingCourseId ? 'Updated course in Firebase:' : 'Created course in Firebase:',
      { id: savedId, ...newCourse }
    )

    // Clear and close the modal after "saving"
    setNewCourse(createEmptyCourse())
    setEditingCourseId(null)
    setIsAddCourseOpen(false)
  }

  const getLearningOutcomeLines = (text) => {
    if (!text) return []
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  }

  return (
    <DashboardLayout>
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Applications Dashboard</h1>
            <p className="header-subtitle">
              Review every parent submission, prioritize pending kids, and keep your cohorts balanced.
            </p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={handleDownloadCSV}>
              Download CSV
            </button>
            <button className="btn btn-outline" onClick={handleOpenCoursesList}>
              Available Courses
            </button>
            <button className="btn btn-primary" onClick={handleOpenAddCourse}>
              Add Course
            </button>
          </div>
        </div>
      </header>

      <div className="stats-section">
        <div className="stats-grid">
          {overviewStats.map((stat) => (
            <StatsCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      <section className="applications-section">
        <div className="section-header">
          <div>
            <h2>Latest Applications</h2>
            <p>Filter by course, status, or search by parent and child.</p>
          </div>
          <div className="time-range-filters">
            <button
              className={`chip ${filters.timeRange === '7d' ? 'active' : ''}`}
              onClick={() => setFilters((prev) => ({ ...prev, timeRange: '7d' }))}
            >
              7 days
            </button>
            <button
              className={`chip ${filters.timeRange === '30d' ? 'active' : ''}`}
              onClick={() => setFilters((prev) => ({ ...prev, timeRange: '30d' }))}
            >
              30 days
            </button>
            <button
              className={`chip ${filters.timeRange === '90d' ? 'active' : ''}`}
              onClick={() => setFilters((prev) => ({ ...prev, timeRange: '90d' }))}
            >
              90 days
            </button>
          </div>
        </div>

        <EnrollmentFilters
          filters={filters}
          onChange={(nextFilters) => setFilters((prev) => ({ ...prev, ...nextFilters }))}
        />

        <div className="applications-content">
          <div className="applications-table-wrapper">
            <EnrollmentTable
              enrollments={filteredEnrollments.slice(0, 5)}
              selectedId={activeEnrollment?.id}
              onSelect={setSelectedId}
            />
            <div className="see-more-container">
              <button 
                className="btn btn-secondary see-more-btn"
                onClick={() => navigate('/applications')}
              >
                See More
              </button>
            </div>
          </div>
          <EnrollmentDetail
            enrollment={activeEnrollment}
            onStatusChange={(nextStatus) => handleStatusChange(activeEnrollment?.id, nextStatus)}
            statusUpdating={statusUpdateState.loading}
            statusError={statusUpdateState.error}
          />
        </div>
      </section>

      {isCoursesListOpen && (
        <div className="modal-backdrop" onClick={handleCloseCoursesList}>
          <div
            className="modal-panel"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <header className="modal-header">
              <div>
                <p className="eyebrow">Courses library</p>
                <h2>Available Courses</h2>
                <p className="supporting-text">
                  Review every course you've added for Polycrest Kids and quickly edit or remove entries.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline small"
                onClick={handleCloseCoursesList}
              >
                Close
              </button>
            </header>

            <div className="modal-body">
              {courses.length >= MAX_COURSES && (
                <p className="field-helper warning-text">
                  You have reached the maximum of {MAX_COURSES} available courses. To add a new
                  course, first edit or delete one of the current courses.
                </p>
              )}
              {courses.length === 0 ? (
                <p className="field-helper">
                  You haven't added any courses yet. Use the Add Course button to create your first one.
                </p>
              ) : (
                <ul className="courses-list">
                  {courses.map((course) => (
                    <li key={course.id} className="course-list-item">
                      <div className="course-list-main">
                        <h3>{course.title || 'Untitled course'}</h3>
                        <p className="field-helper">
                          {course.ageRange || 'Age range not set'}
                        </p>
                      </div>
                      <div className="course-list-actions">
                        <button
                          type="button"
                          className="btn btn-outline small"
                          onClick={() => handleEditCourse(course.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary small"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {isAddCourseOpen && (
        <div className="modal-backdrop" onClick={handleCloseAddCourse}>
          <div
            className="modal-panel"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <header className="modal-header">
              <div>
                <p className="eyebrow">Create new course</p>
                <h2>{editingCourseId ? 'Edit Course' : 'Add Course'}</h2>
                <p className="supporting-text">
                  Match the details used on the public website so cards and admin data stay in sync.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline small"
                onClick={handleCloseAddCourse}
              >
                Close
              </button>
            </header>

            <form className="modal-body" onSubmit={handleSubmitNewCourse}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Course title</label>
                  <input
                    type="text"
                    placeholder="Intro to Coding"
                    value={newCourse.title}
                    onChange={(event) => handleNewCourseChange('title', event.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Age range</label>
                  <input
                    type="text"
                    placeholder="Ages 10–12"
                    value={newCourse.ageRange}
                    onChange={(event) => handleNewCourseChange('ageRange', event.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Thumbnail image URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com/intro-to-coding-thumbnail.png or /kidcoding3.jpeg"
                    value={newCourse.thumbnailUrl}
                    onChange={(event) => handleNewCourseChange('thumbnailUrl', event.target.value)}
                    required
                  />
                </div>

                <div className="form-group full">
                  <label>Short description</label>
                  <textarea
                    rows="3"
                    placeholder="Hands-on labs that teach older kids core programming logic, block-based coding, and problem solving."
                    value={newCourse.shortDescription}
                    onChange={(event) =>
                      handleNewCourseChange('shortDescription', event.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group full">
                  <label>What you'll learn</label>
                  <div className="learning-points-list">
                    {newCourse.whatYouWillLearn.map((point, index) => (
                      <div key={index} className="learning-point-item">
                        <div className="learning-point-fields">
                          <input
                            type="text"
                            placeholder="Block-based programming fundamentals"
                            value={point.title}
                            onChange={(event) =>
                              handleLearningPointChange(index, 'title', event.target.value)
                            }
                          />
                          <textarea
                            rows="2"
                            placeholder="Explain this topic in one or two short sentences."
                            value={point.description}
                            onChange={(event) =>
                              handleLearningPointChange(index, 'description', event.target.value)
                            }
                          />

                          <div className="subtopic-section">
                            <label className="subtopic-label">Subtopic (optional)</label>
                            <input
                              type="text"
                              placeholder="What kids learn"
                              value={point.subtopicTitle || ''}
                              onChange={(event) =>
                                handleSubtopicTitleChange(index, event.target.value)
                              }
                            />

                            <div className="subtopic-points">
                              <p className="field-helper">
                                List what kids learn as bullet points (one point per line).
                              </p>
                              {(Array.isArray(point.subtopicPoints)
                                ? point.subtopicPoints
                                : ['']
                              ).map((subPoint, subIndex) => (
                                <div key={subIndex} className="subtopic-point-row">
                                  <span className="subtopic-bullet">•</span>
                                  <input
                                    type="text"
                                    placeholder="Build simple games using blocks"
                                    value={subPoint}
                                    onChange={(event) =>
                                      handleSubtopicPointChange(
                                        index,
                                        subIndex,
                                        event.target.value
                                      )
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-outline small subtopic-remove-btn"
                                    onClick={() =>
                                      handleRemoveSubtopicPoint(index, subIndex)
                                    }
                                    disabled={
                                      (Array.isArray(point.subtopicPoints)
                                        ? point.subtopicPoints.length
                                        : 1) === 1
                                    }
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}

                              <button
                                type="button"
                                className="btn btn-secondary small subtopic-add-btn"
                                onClick={() => handleAddSubtopicPoint(index)}
                              >
                                Add another bullet
                              </button>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline small remove-point-btn"
                          onClick={() => handleRemoveLearningPoint(index)}
                          disabled={newCourse.whatYouWillLearn.length === 1}
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="btn btn-secondary small"
                      onClick={handleAddLearningPoint}
                    >
                      Add another point
                    </button>
                  </div>

                  <div className="learning-points-preview">
                    <p className="field-helper">Preview</p>
                    {newCourse.whatYouWillLearn
                      .filter((point) => point.title)
                      .map((point, index) => (
                        <details key={index} className="learning-point-preview">
                          <summary>{point.title}</summary>
                          {point.description && <p>{point.description}</p>}
                          {point.subtopicTitle && (
                            <div className="learning-subtopic-preview">
                              <p className="learning-subtopic-title">{point.subtopicTitle}</p>
                              {Array.isArray(point.subtopicPoints) &&
                                point.subtopicPoints.filter(Boolean).length > 0 && (
                                  <ul>
                                    {point.subtopicPoints
                                      .filter(Boolean)
                                      .map((subPoint, i) => (
                                        <li key={i}>{subPoint}</li>
                                      ))}
                                  </ul>
                                )}
                            </div>
                          )}
                        </details>
                      ))}
                  </div>
                </div>

                <div className="form-group full">
                  <label>Learning outcomes (one item per line)</label>
                  <textarea
                    rows="3"
                    placeholder={`Understand core programming concepts\nCreate interactive projects\nDevelop logical thinking skills\nBuild confidence in technology`}
                    value={newCourse.learningOutcomes}
                    onChange={(event) =>
                      handleNewCourseChange('learningOutcomes', event.target.value)
                    }
                  />
                  <div className="learning-outcomes-preview">
                    <p className="field-helper">Preview</p>
                    <ul>
                      {getLearningOutcomeLines(newCourse.learningOutcomes).map((line, index) => (
                        <li key={index}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="form-group">
                  <label>Duration</label>
                  <input
                    type="text"
                    placeholder="12 weeks"
                    value={newCourse.duration}
                    onChange={(event) => handleNewCourseChange('duration', event.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Schedule</label>
                  <input
                    type="text"
                    placeholder="2 sessions per week"
                    value={newCourse.schedule}
                    onChange={(event) => handleNewCourseChange('schedule', event.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Session length</label>
                  <input
                    type="text"
                    placeholder="2 hours per session"
                    value={newCourse.sessionLength}
                    onChange={(event) =>
                      handleNewCourseChange('sessionLength', event.target.value)
                    }
                  />
                </div>

                <div className="form-group full">
                  <label>Prerequisites</label>
                  <textarea
                    rows="2"
                    placeholder="No prior coding experience required"
                    value={newCourse.prerequisites}
                    onChange={(event) =>
                      handleNewCourseChange('prerequisites', event.target.value)
                    }
                  />
                </div>
              </div>

              <footer className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCloseAddCourse}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Course
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Dashboard

