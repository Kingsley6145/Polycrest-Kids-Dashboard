import { ref, onValue, get, push, set, update, remove } from 'firebase/database'
import { database } from '../config/firebase'

const COURSES_PATH = 'courses'

const processCourseData = (data) => {
  if (!data) {
    return []
  }

  return Object.keys(data).map((key) => {
    const course = data[key] || {}

    return {
      id: key,
      title: course.title || '',
      ageRange: course.ageRange || '',
      thumbnailUrl: course.thumbnailUrl || '',
      shortDescription: course.shortDescription || '',
      whatYouWillLearn: Array.isArray(course.whatYouWillLearn)
        ? course.whatYouWillLearn
        : course.whatYouWillLearn
          ? Object.values(course.whatYouWillLearn)
          : [],
      learningOutcomes: course.learningOutcomes || '',
      duration: course.duration || '',
      schedule: course.schedule || '',
      sessionLength: course.sessionLength || '',
      prerequisites: course.prerequisites || '',
      createdAt: course.createdAt || null,
      updatedAt: course.updatedAt || null
    }
  })
}

export const fetchCourses = (callback) => {
  const coursesRef = ref(database, COURSES_PATH)

  // Initial one-time fetch
  get(coursesRef)
    .then((snapshot) => {
      const data = snapshot.val()
      const coursesArray = processCourseData(data)
      callback(coursesArray)
    })
    .catch((error) => {
      console.error('Error fetching courses:', error)
    })

  // Real-time listener
  const unsubscribe = onValue(
    coursesRef,
    (snapshot) => {
      const data = snapshot.val()
      const coursesArray = processCourseData(data)
      callback(coursesArray)
    },
    (error) => {
      console.error('Error in courses real-time listener:', error)
    }
  )

  return unsubscribe
}

export const saveCourse = async (courseId, courseData) => {
  const now = Date.now()

  if (courseId) {
    const courseRef = ref(database, `${COURSES_PATH}/${courseId}`)
    await update(courseRef, {
      ...courseData,
      updatedAt: now
    })
    return courseId
  }

  const listRef = ref(database, COURSES_PATH)
  const newRef = push(listRef)
  await set(newRef, {
    ...courseData,
    createdAt: now,
    updatedAt: now
  })
  return newRef.key
}

export const deleteCourse = async (courseId) => {
  if (!courseId) return
  const courseRef = ref(database, `${COURSES_PATH}/${courseId}`)
  await remove(courseRef)
}


