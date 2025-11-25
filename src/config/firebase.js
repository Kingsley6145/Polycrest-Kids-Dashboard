import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

// Firebase configuration
const firebaseConfig = {
  databaseURL: 'https://polycrest-kids1-default-rtdb.firebaseio.com/'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Realtime Database
export const database = getDatabase(app)

