const express = require("express")
const router = express.Router()
const adminController = require("../controllers/adminController")
const authMiddleware = require("../middleware/authMiddleware")
const restrictToAdmin = require("../middleware/restrictToAdmin")
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

// Course routes
router.post(
  "/courses",
  [
    authMiddleware,
    restrictToAdmin,
    body("title").notEmpty().withMessage("Course title is required"),
    body("description").optional().isString().withMessage("Description must be a string"),
    validate,
  ],
  adminController.createCourse,
)

router.get("/courses", [authMiddleware, restrictToAdmin], adminController.getAllCourses)

router.get("/courses/:id", [authMiddleware, restrictToAdmin], adminController.getCourseById)

router.put(
  "/courses/:id",
  [
    authMiddleware,
    restrictToAdmin,
    body("title").optional().notEmpty().withMessage("Course title cannot be empty"),
    body("description").optional().isString().withMessage("Description must be a string"),
    validate,
  ],
  adminController.updateCourse,
)

router.delete("/courses/:id", [authMiddleware, restrictToAdmin], adminController.deleteCourse)

// Section routes
router.post(
  "/sections",
  [
    authMiddleware,
    restrictToAdmin,
    body("title").notEmpty().withMessage("Section title is required"),
    body("courseId").isMongoId().withMessage("Invalid course ID"),
    validate,
  ],
  adminController.createSection,
)

router.put(
  "/sections/:id",
  [authMiddleware, restrictToAdmin, body("title").notEmpty().withMessage("Section title is required"), validate],
  adminController.updateSection,
)

router.delete("/sections/:id", [authMiddleware, restrictToAdmin], adminController.deleteSection)

// Unit routes
router.post(
  "/units",
  [
    authMiddleware,
    restrictToAdmin,
    body("title").notEmpty().withMessage("Unit title is required"),
    body("sectionId").isMongoId().withMessage("Invalid section ID"),
    validate,
  ],
  adminController.createUnit,
)

router.put(
  "/units/:id",
  [authMiddleware, restrictToAdmin, body("title").notEmpty().withMessage("Unit title is required"), validate],
  adminController.updateUnit,
)

router.delete("/units/:id", [authMiddleware, restrictToAdmin], adminController.deleteUnit)

// Chapter routes
router.post(
  "/chapters",
  [
    authMiddleware,
    restrictToAdmin,
    body("title").notEmpty().withMessage("Chapter title is required"),
    body("unitId").isMongoId().withMessage("Invalid unit ID"),
    validate,
  ],
  adminController.createChapter,
)

router.put(
  "/chapters/:id",
  [authMiddleware, restrictToAdmin, body("title").notEmpty().withMessage("Chapter title is required"), validate],
  adminController.updateChapter,
)

router.delete("/chapters/:id", [authMiddleware, restrictToAdmin], adminController.deleteChapter)

// Question routes
router.post(
  "/questions",
  [
    authMiddleware,
    restrictToAdmin,
    body("chapterId").isMongoId().withMessage("Invalid chapter ID"),
    body("questionText").notEmpty().withMessage("Question text is required"),
    body("type").isIn(["mcq", "fill-in-the-blank", "text-based", "audio-based"]).withMessage("Invalid question type"),
    body("options")
      .if(body("type").equals("mcq"))
      .isArray({ min: 2 })
      .withMessage("MCQ questions must have at least 2 options"),
    body("correctAnswer").notEmpty().withMessage("Correct answer is required"),
    validate,
  ],
  adminController.createQuestion,
)

router.put(
  "/questions/:id",
  [
    authMiddleware,
    restrictToAdmin,
    body("questionText").optional().notEmpty().withMessage("Question text cannot be empty"),
    body("type")
      .optional()
      .isIn(["mcq", "fill-in-the-blank", "text-based", "audio-based"])
      .withMessage("Invalid question type"),
    body("options")
      .optional()
      .if(body("type").equals("mcq"))
      .isArray({ min: 2 })
      .withMessage("MCQ questions must have at least 2 options"),
    body("correctAnswer").optional().notEmpty().withMessage("Correct answer cannot be empty"),
    validate,
  ],
  adminController.updateQuestion,
)

router.delete("/questions/:id", [authMiddleware, restrictToAdmin], adminController.deleteQuestion)

module.exports = router
