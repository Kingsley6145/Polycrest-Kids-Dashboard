import { ref, onValue } from 'firebase/database'
import { database } from '../config/firebase'

/**
 * Fetch enrollments from Firebase Realtime Database
 * @param {Function} callback - Callback function that receives the enrollments array
 * @returns {Function} Unsubscribe function
 */
export const fetchEnrollments = (callback) => {
  const enrollmentsRef = ref(database, 'enrollments')
  
  // Listen for real-time updates
  const unsubscribe = onValue(enrollmentsRef, (snapshot) => {
    const data = snapshot.val()
    
    if (!data) {
      callback([])
      return
    }
    
    // Convert Firebase object to array
    // Firebase stores data as { key1: {...}, key2: {...} }
    // We need to convert it to [{ id: key1, ...data }, { id: key2, ...data }]
    const enrollmentsArray = Object.keys(data).map((key) => ({
      id: key,
      ...data[key]
    }))
    
    callback(enrollmentsArray)
  }, (error) => {
    console.error('Error fetching enrollments:', error)
    callback([])
  })
  
  return unsubscribe
}

