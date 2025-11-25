import { ref, onValue, get } from 'firebase/database'
import { database } from '../config/firebase'

/**
 * Fetch enrollments from Firebase Realtime Database
 * @param {Function} callback - Callback function that receives the enrollments array
 * @returns {Function} Unsubscribe function
 */
const processEnrollmentData = (data) => {
  if (!data) {
    console.log('No data found in enrollments path')
    return []
  }
  
  // Convert Firebase object to array and map field names
  // Firebase field names: kidName, kidAge, selectedCourse, etc.
  // Dashboard expects: childName, childAge, course, etc.
  const enrollmentsArray = Object.keys(data).map((key) => {
    const enrollment = data[key]
    
    // Convert kidInterests object to array if it exists
    let interests = []
    if (enrollment.kidInterests) {
      if (Array.isArray(enrollment.kidInterests)) {
        interests = enrollment.kidInterests
      } else if (typeof enrollment.kidInterests === 'object') {
        interests = Object.values(enrollment.kidInterests).filter(Boolean)
      }
    }
    
    // Map Firebase fields to dashboard fields
    return {
      id: key,
      childName: enrollment.kidName || '',
      childAge: enrollment.kidAge || '',
      childGender: enrollment.kidGender || '',
      parentName: enrollment.parentName || '',
      parentEmail: enrollment.parentEmail || '',
      parentPhone: enrollment.parentPhone || '',
      parentRelation: enrollment.parentRelation || '',
      course: enrollment.courseName || enrollment.selectedCourse || '',
      courseId: enrollment.selectedCourse || '',
      preferredTime: enrollment.preferredTime || '',
      startDate: enrollment.startDate || '',
      submittedAt: enrollment.submittedAt || enrollment.timestamp || '',
      interests: interests,
      status: enrollment.status || 'pending', // Default to pending if not set
      notes: enrollment.notes || '',
      // Keep original fields for reference
      ...enrollment
    }
  })
  
  console.log('Processed enrollments:', enrollmentsArray)
  return enrollmentsArray
}

export const fetchEnrollments = (callback) => {
  const enrollmentsRef = ref(database, 'enrollments')
  
  console.log('Fetching enrollments from Firebase...')
  console.log('Database reference:', enrollmentsRef)
  
  // First, try a one-time fetch to test connection
  get(enrollmentsRef)
    .then((snapshot) => {
      const data = snapshot.val()
      console.log('Initial Firebase fetch successful:', data)
      const enrollmentsArray = processEnrollmentData(data)
      callback(enrollmentsArray)
    })
    .catch((error) => {
      console.error('Error in initial fetch:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
    })
  
  // Then set up real-time listener
  const unsubscribe = onValue(
    enrollmentsRef,
    (snapshot) => {
      const data = snapshot.val()
      console.log('Firebase real-time update received:', data)
      const enrollmentsArray = processEnrollmentData(data)
      callback(enrollmentsArray)
    },
    (error) => {
      console.error('Error in real-time listener:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      // Don't call callback with empty array on error, let the initial fetch handle it
    }
  )
  
  return unsubscribe
}

