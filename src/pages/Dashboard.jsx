import { useMemo, useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import StatsCard from '../components/StatsCard'
import EnrollmentFilters from '../components/EnrollmentFilters'
import EnrollmentTable from '../components/EnrollmentTable'
import EnrollmentDetail from '../components/EnrollmentDetail'
import { fetchEnrollments } from '../services/enrollmentService'

const defaultFilters = {
  search: '',
  course: 'all',
  status: 'all',
  timeRange: '30d'
}

const Dashboard = () => {
  const [filters, setFilters] = useState(defaultFilters)
  const [enrollments, setEnrollments] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  // Fetch enrollments from Firebase on component mount
  useEffect(() => {
    const unsubscribe = fetchEnrollments((enrollmentsData) => {
      setEnrollments(enrollmentsData)
    })

    // Cleanup subscription on unmount
    return () => {
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
        enrollment.childName.toLowerCase().includes(filters.search.toLowerCase()) ||
        enrollment.parentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        enrollment.id.toLowerCase().includes(filters.search.toLowerCase())

      const matchesCourse =
        filters.course === 'all' || enrollment.courseId === filters.course

      const matchesStatus =
        filters.status === 'all' || enrollment.status === filters.status

      return matchesSearch && matchesCourse && matchesStatus
    })
  }, [filters])

  const activeEnrollment = useMemo(() => {
    if (!filteredEnrollments.length) {
      return undefined
    }

    return filteredEnrollments.find((record) => record.id === selectedId) || filteredEnrollments[0]
  }, [filteredEnrollments, selectedId])

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
          new Date(enrollment.submittedAt).toLocaleDateString(),
          `"${enrollment.preferredTime}"`,
          enrollment.startDate,
          enrollment.childAge,
          `"${enrollment.interests.join(', ')}"`,
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
          <EnrollmentTable
            enrollments={filteredEnrollments}
            selectedId={activeEnrollment?.id}
            onSelect={setSelectedId}
          />
          <EnrollmentDetail enrollment={activeEnrollment} />
        </div>
      </section>
    </DashboardLayout>
  )
}

export default Dashboard

