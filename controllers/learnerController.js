const Enrollment = require("../models/Enrollment")
const Course = require("../models/Course")
const Section = require("../models/Section")
const Unit = require("../models/Unit")
const Chapter = require("../models/Chapter")
const Question = require("../models/Question")
const Progress = require("../models/Progress")

// Get All Courses
exports.getAllCourses = async (req, res) => {
  try {
    console.log("Fetching all courses...")
    const courses = await Course.find()
      .populate({
        path: "sections",
        populate: {
          path: "units",
          populate: {
            path: "chapters",
            populate: { path: "questions" },
          },
        },
      })
      .exec()

    console.log("Courses fetched:", courses.length)
    if (!courses || courses.length === 0) {
      console.log("No courses found in the database.")
      return res.status(200).json([]) // Return empty array instead of 404
    }

    res.status(200).json(courses)
  } catch (error) {
    console.error("Error in getAllCourses:", error.message)
    console.error("Stack trace:", error.stack)
    res.status(500).json({ message: "Failed to fetch courses", error: error.message })
  }
}

// Enroll in a course
exports.enrollCourse = async (req, res) => {
  const { courseId } = req.body
  try {
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      learner: req.user.userId,
      course: courseId,
    })

    if (existingEnrollment) {
      return res.status(400).json({ message: "Already enrolled in this course" })
    }

    const enrollment = new Enrollment({
      learner: req.user.userId,
      course: courseId,
    })
    await enrollment.save()
    res.status(201).json({ message: "Enrolled in course", enrollment })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get enrolled courses
exports.getEnrolledCourses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ learner: req.user.userId }).populate({
      path: "course",
      populate: {
        path: "sections",
        populate: {
          path: "units",
          populate: {
            path: "chapters",
            populate: { path: "questions" },
          },
        },
      },
    })
    res.status(200).json(enrollments)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get course content
exports.getCourseContent = async (req, res) => {
  const { courseId } = req.params
  try {
    const course = await Course.findById(courseId).populate({
      path: "sections",
      populate: {
        path: "units",
        populate: {
          path: "chapters",
          populate: { path: "questions" },
        },
      },
    })

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    res.status(200).json(course)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Submit answer to a question
exports.submitAnswer = async (req, res) => {
  const { courseId, sectionId, unitId, chapterId, questionId, answer } = req.body
  try {
    const question = await Question.findById(questionId)

    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    const isCorrect = question.correctAnswer === answer

    let progress = await Progress.findOne({
      learner: req.user.userId,
      course: courseId,
      section: sectionId,
      unit: unitId,
      chapter: chapterId,
    })

    if (!progress) {
      progress = new Progress({
        learner: req.user.userId,
        course: courseId,
        section: sectionId,
        unit: unitId,
        chapter: chapterId,
      })
    }

    progress.attempts.push({
      question: questionId,
      answer,
      isCorrect,
    })

    const chapter = await Chapter.findById(chapterId).populate("questions")
    const totalQuestions = chapter.questions.length
    const correctAnswers = progress.attempts.filter((a) => a.isCorrect).length
    progress.score = (correctAnswers / totalQuestions) * 100
    progress.completed = progress.attempts.length === totalQuestions
    progress.lastUpdated = new Date()

    await progress.save()
    res.status(200).json({ message: "Answer submitted", isCorrect, score: progress.score })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get progress for a course
exports.getProgress = async (req, res) => {
  const { courseId } = req.params
  try {
    const progress = await Progress.find({
      learner: req.user.userId,
      course: courseId,
    }).populate("section unit chapter")

    const lastProgress = progress.sort((a, b) => b.lastUpdated - a.lastUpdated)[0] || null

    res.status(200).json({ progress, lastProgress })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get score summary for a chapter
exports.getScoreSummary = async (req, res) => {
  const { chapterId } = req.params
  try {
    const progress = await Progress.findOne({
      learner: req.user.userId,
      chapter: chapterId,
    }).populate("attempts.question")

    if (!progress || progress.attempts.length === 0) {
      return res.status(400).json({ message: "No attempts made for this chapter" })
    }

    res.status(200).json({
      score: progress.score,
      attempts: progress.attempts,
      totalQuestions: progress.attempts.length,
      correctAnswers: progress.attempts.filter((a) => a.isCorrect).length,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
