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

const ITEMS_PER_PAGE = 7

const ApplicationsPage = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState(defaultFilters)
  const [enrollments, setEnrollments] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [statusUpdateState, setStatusUpdateState] = useState({
    loading: false,
    error: null
  })
  const [currentPage, setCurrentPage] = useState(1)

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

  // Reset to first page whenever filters change or new enrollments arrive
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, enrollments.length])

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

  const totalPages = useMemo(() => {
    if (!filteredEnrollments.length) return 1
    return Math.ceil(filteredEnrollments.length / ITEMS_PER_PAGE)
  }, [filteredEnrollments])

  const paginatedEnrollments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredEnrollments.slice(startIndex, endIndex)
  }, [filteredEnrollments, currentPage])

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

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
                enrollments={paginatedEnrollments}
                selectedId={activeEnrollment?.id}
                onSelect={setSelectedId}
              />
            </div>
            {filteredEnrollments.length > ITEMS_PER_PAGE && (
              <div className="table-pagination">
                <button
                  type="button"
                  className="btn btn-outline small"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="table-pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-outline small"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
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

