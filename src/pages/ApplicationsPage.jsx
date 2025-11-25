import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import EnrollmentFilters from '../components/EnrollmentFilters'
import EnrollmentTable from '../components/EnrollmentTable'
import EnrollmentDetail from '../components/EnrollmentDetail'
import { fetchEnrollments, updateEnrollmentStatus } from '../services/enrollmentService'

const defaultFilters = {
  search: '',
  course: 'all',
  status: 'all',
  timeRange: '30d'
}

const ApplicationsPage = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState(defaultFilters)
  const [enrollments, setEnrollments] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [statusUpdateState, setStatusUpdateState] = useState({
    loading: false,
    error: null
  })

  // Fetch enrollments from Firebase on component mount
  useEffect(() => {
    console.log('ApplicationsPage: Setting up Firebase listener...')
    const unsubscribe = fetchEnrollments((enrollmentsData) => {
      console.log('ApplicationsPage: Received enrollments data:', enrollmentsData)
      console.log('ApplicationsPage: Number of enrollments:', enrollmentsData.length)
      setEnrollments(enrollmentsData)
    })

    // Cleanup subscription on unmount
    return () => {
      console.log('ApplicationsPage: Cleaning up Firebase listener')
      unsubscribe()
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

  return (
    <DashboardLayout>
      <section className="applications-section full-view">
        <div className="section-header">
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
            <div className="applications-table-scroll">
              <EnrollmentTable
                enrollments={filteredEnrollments}
                selectedId={activeEnrollment?.id}
                onSelect={setSelectedId}
              />
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
    </DashboardLayout>
  )
}

export default ApplicationsPage

