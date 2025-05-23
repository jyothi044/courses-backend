const express = require("express")
const router = express.Router()
const learnerController = require("../controllers/learnerController")
const authMiddleware = require("../middleware/authMiddleware")
const { body, validationResult } = require("express-validator")

// Middleware to validate request
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array())
    const errorMessages = errors
      .array()
      .map((err) => err.msg)
      .join(", ")
    return res.status(400).json({ message: `Validation failed: ${errorMessages}`, errors: errors.array() })
  }
  next()
}

// Get all courses
router.get("/courses", authMiddleware, learnerController.getAllCourses)

// Enroll in a course
router.post(
  "/enroll",
  [authMiddleware, body("courseId").isMongoId().withMessage("Invalid course ID"), validate],
  learnerController.enrollCourse,
)

// Get enrolled courses
router.get("/enrolled-courses", authMiddleware, learnerController.getEnrolledCourses)

// Get course content
router.get(
  "/course/:courseId",
  [
    authMiddleware,
    // Validate courseId as MongoDB ID
    (req, res, next) => {
      if (!req.params.courseId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid course ID format" })
      }
      next()
    },
  ],
  learnerController.getCourseContent,
)

// Submit answer to a question
router.post(
  "/submit-answer",
  [
    authMiddleware,
    body("courseId").isMongoId().withMessage("Invalid course ID"),
    body("sectionId").isMongoId().withMessage("Invalid section ID"),
    body("unitId").isMongoId().withMessage("Invalid unit ID"),
    body("chapterId").isMongoId().withMessage("Invalid chapter ID"),
    body("questionId").isMongoId().withMessage("Invalid question ID"),
    body("answer").notEmpty().withMessage("Answer is required"),
    validate,
  ],
  learnerController.submitAnswer,
)

// Get progress for a course
router.get(
  "/progress/:courseId",
  [
    authMiddleware,
    // Validate courseId as MongoDB ID
    (req, res, next) => {
      if (!req.params.courseId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid course ID format" })
      }
      next()
    },
  ],
  learnerController.getProgress,
)

// Get score summary for a chapter
router.get(
  "/score/:chapterId",
  [
    authMiddleware,
    // Validate chapterId as MongoDB ID
    (req, res, next) => {
      if (!req.params.chapterId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid chapter ID format" })
      }
      next()
    },
  ],
  learnerController.getScoreSummary,
)

module.exports = router
