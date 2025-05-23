const Course = require("../models/Course");
const Section = require("../models/Section");
const Unit = require("../models/Unit");
const Chapter = require("../models/Chapter");
const Question = require("../models/Question");

// Create a Course
exports.createCourse = async (req, res) => {
  const { title, description } = req.body;
  try {
    const course = new Course({
      title,
      description,
      createdBy: req.user.userId,
    });
    await course.save();
    res.status(201).json({ message: "Course created", course });
  } catch (error) {
    console.error('Error in createCourse:', error);
    res.status(500).json({ message: `Failed to create course: ${error.message}` });
  }
};

// Get All Courses (Admin)
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ createdBy: req.user.userId }).populate({
      path: "sections",
      populate: {
        path: "units",
        populate: {
          path: "chapters",
          populate: { path: "questions" },
        },
      },
    });
    res.status(200).json(courses);
  } catch (error) {
    console.error('Error in getAllCourses:', error);
    res.status(500).json({ message: `Failed to fetch courses: ${error.message}` });
  }
};

// Get Course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate({
      path: "sections",
      populate: {
        path: "units",
        populate: {
          path: "chapters",
          populate: { path: "questions" },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to access this course" });
    }

    res.status(200).json(course);
  } catch (error) {
    console.error('Error in getCourseById:', error);
    res.status(500).json({ message: `Failed to fetch course: ${error.message}` });
  }
};

// Update Course
exports.updateCourse = async (req, res) => {
  const { title, description } = req.body;
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to update this course" });
    }

    course.title = title || course.title;
    course.description = description || course.description;

    await course.save();
    res.status(200).json({ message: "Course updated", course });
  } catch (error) {
    console.error('Error in updateCourse:', error);
    res.status(500).json({ message: `Failed to update course: ${error.message}` });
  }
};

// Delete Course
exports.deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`Attempting to delete course with ID: ${id}`);

    // Validate course ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.error(`Invalid course ID format: ${id}`);
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const course = await Course.findById(id);
    if (!course) {
      console.error(`Course not found: ${id}`);
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.createdBy.toString() !== req.user.userId) {
      console.error(`Unauthorized attempt to delete course ${id} by user ${req.user.userId}`);
      return res.status(403).json({ message: "Not authorized to delete this course" });
    }

    // Delete related data in bulk
    const sections = await Section.find({ course: id });
    const sectionIds = sections.map(s => s._id);

    if (sectionIds.length > 0) {
      const units = await Unit.find({ section: { $in: sectionIds } });
      const unitIds = units.map(u => u._id);

      if (unitIds.length > 0) {
        const chapters = await Chapter.find({ unit: { $in: unitIds } });
        const chapterIds = chapters.map(c => c._id);

        if (chapterIds.length > 0) {
          await Question.deleteMany({ chapter: { $in: chapterIds } });
          await Chapter.deleteMany({ unit: { $in: unitIds } });
        }
        await Unit.deleteMany({ section: { $in: sectionIds } });
      }
      await Section.deleteMany({ course: id });
    }

    // Delete the course
    await Course.deleteOne({ _id: id });

    console.log(`Successfully deleted course ${id} and all related content`);
    res.status(200).json({ message: "Course and all related content deleted" });
  } catch (error) {
    console.error(`Error in deleteCourse for ID ${id}:`, error);
    res.status(500).json({ message: `Failed to delete course: ${error.message}` });
  }
};

// Create a Section
exports.createSection = async (req, res) => {
  const { title, courseId } = req.body;
  try {
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to add sections to this course" });
    }

    const section = new Section({ title, course: courseId });
    await section.save();
    await Course.findByIdAndUpdate(courseId, { $push: { sections: section._id } });
    res.status(201).json({ message: "Section created", section });
  } catch (error) {
    console.error('Error in createSection:', error);
    res.status(500).json({ message: `Failed to create section: ${error.message}` });
  }
};

// Update Section
exports.updateSection = async (req, res) => {
  const { title } = req.body;
  try {
    const section = await Section.findById(req.params.id);

    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const course = await Course.findById(section.course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to update this section" });
    }

    section.title = title || section.title;

    await section.save();
    res.status(200).json({ message: "Section updated", section });
  } catch (error) {
    console.error('Error in updateSection:', error);
    res.status(500).json({ message: `Failed to update section: ${error.message}` });
  }
};

// Delete Section
exports.deleteSection = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);

    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const course = await Course.findById(section.course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to delete this section" });
    }

    const units = await Unit.find({ section: section._id });
    const unitIds = units.map(u => u._id);

    if (unitIds.length > 0) {
      const chapters = await Chapter.find({ unit: { $in: unitIds } });
      const chapterIds = chapters.map(c => c._id);

      if (chapterIds.length > 0) {
        await Question.deleteMany({ chapter: { $in: chapterIds } });
        await Chapter.deleteMany({ unit: { $in: unitIds } });
      }
      await Unit.deleteMany({ section: section._id });
    }

    await Course.findByIdAndUpdate(section.course, { $pull: { sections: section._id } });
    await Section.deleteOne({ _id: section._id });

    res.status(200).json({ message: "Section and all related content deleted" });
  } catch (error) {
    console.error('Error in deleteSection:', error);
    res.status(500).json({ message: `Failed to delete section: ${error.message}` });
  }
};

// Create a Unit
exports.createUnit = async (req, res) => {
  const { title, sectionId } = req.body;
  try {
    const section = await Section.findById(sectionId);

    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const course = await Course.findById(section.course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to add units to this section" });
    }

    const unit = new Unit({ title, section: sectionId });
    await unit.save();
    await Section.findByIdAndUpdate(sectionId, { $push: { units: unit._id } });
    res.status(201).json({ message: "Unit created", unit });
  } catch (error) {
    console.error('Error in createUnit:', error);
    res.status(500).json({ message: `Failed to create unit: ${error.message}` });
  }
};

// Update Unit
exports.updateUnit = async (req, res) => {
  const { title } = req.body;
  try {
    const unit = await Unit.findById(req.params.id);

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const section = await Section.findById(unit.section);

    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const course = await Course.findById(section.course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to update this unit" });
    }

    unit.title = title || unit.title;

    await unit.save();
    res.status(200).json({ message: "Unit updated", unit });
  } catch (error) {
    console.error('Error in updateUnit:', error);
    res.status(500).json({ message: `Failed to update unit: ${error.message}` });
  }
};

// Delete Unit
exports.deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const section = await Section.findById(unit.section);

    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const course = await Course.findById(section.course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to delete this unit" });
    }

    const chapters = await Chapter.find({ unit: unit._id });
    const chapterIds = chapters.map(c => c._id);

    if (chapterIds.length > 0) {
      await Question.deleteMany({ chapter: { $in: chapterIds } });
      await Chapter.deleteMany({ unit: unit._id });
    }

    await Section.findByIdAndUpdate(unit.section, { $pull: { units: unit._id } });
    await Unit.deleteOne({ _id: unit._id });

    res.status(200).json({ message: "Unit and all related content deleted" });
  } catch (error) {
    console.error('Error in deleteUnit:', error);
    res.status(500).json({ message: `Failed to delete unit: ${error.message}` });
  }
};

// Create a Chapter
exports.createChapter = async (req, res) => {
  const { title, unitId } = req.body;
  try {
    const unit = await Unit.findById(unitId);

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const section = await Section.findById(unit.section);

    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const course = await Course.findById(section.course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to add chapters to this unit" });
    }

    const chapter = new Chapter({ title, unit: unitId });
    await chapter.save();
    await Unit.findByIdAndUpdate(unitId, { $push: { chapters: chapter._id } });
    res.status(201).json({ message: "Chapter created", chapter });
  } catch (error) {
    console.error('Error in createChapter:', error);
    res.status(500).json({ message: `Failed to create chapter: ${error.message}` });
  }
};

// Update Chapter
exports.updateChapter = async (req, res) => {
  const { title } = req.body;
  try {
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const unit = await Unit.findById(chapter.unit);

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const section = await Section.findById(unit.section);

    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const course = await Course.findById(section.course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to update this chapter" });
    }

    chapter.title = title || chapter.title;

    await chapter.save();
    res.status(200).json({ message: "Chapter updated", chapter });
  } catch (error) {
    console.error('Error in updateChapter:', error);
    res.status(500).json({ message: `Failed to update chapter: ${error.message}` });
  }
};

// Delete Chapter
exports.deleteChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const unit = await Unit.findById(chapter.unit);

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const section = await Section.findById(unit.section);

    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const course = await Course.findById(section.course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to delete this chapter" });
    }

    await Question.deleteMany({ chapter: chapter._id });
    await Unit.findByIdAndUpdate(chapter.unit, { $pull: { chapters: chapter._id } });
    await Chapter.deleteOne({ _id: chapter._id });

    res.status(200).json({ message: "Chapter and all related questions deleted" });
  } catch (error) {
    console.error('Error in deleteChapter:', error);
    res.status(500).json({ message: `Failed to delete chapter: ${error.message}` });
  }
};

// Create a Question
exports.createQuestion = async (req, res) => {
  const { chapterId, type, questionText, options, correctAnswer, media } = req.body;
  try {
    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const unit = await Unit.findById(chapter.unit);

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const section = await Section.findById(unit.section);

    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const course = await Course.findById(section.course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to add questions to this chapter" });
    }

    const question = new Question({
      chapter: chapterId,
      type,
      questionText,
      options: type === "mcq" ? options : [],
      correctAnswer,
      media,
    });
    await question.save();
    await Chapter.findByIdAndUpdate(chapterId, { $push: { questions: question._id } });
    res.status(201).json({ message: "Question created", question });
  } catch (error) {
    console.error('Error in createQuestion:', error);
    res.status(500).json({ message: `Failed to create question: ${error.message}` });
  }
};

// Update Question
exports.updateQuestion = async (req, res) => {
  const { type, questionText, options, correctAnswer, media } = req.body;
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const chapter = await Chapter.findById(question.chapter);

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const unit = await Unit.findById(chapter.unit);

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const section = await Section.findById(unit.section);

    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const course = await Course.findById(section.course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to update this question" });
    }

    question.type = type || question.type;
    question.questionText = questionText || question.questionText;

    if (type === "mcq" && options) {
      question.options = options;
    }

    question.correctAnswer = correctAnswer || question.correctAnswer;

    if (media) {
      question.media = media;
    }

    await question.save();
    res.status(200).json({ message: "Question updated", question });
  } catch (error) {
    console.error('Error in updateQuestion:', error);
    res.status(500).json({ message: `Failed to update question: ${error.message}` });
  }
};

// Delete Question
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const chapter = await Chapter.findById(question.chapter);

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const unit = await Unit.findById(chapter.unit);

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const section = await Section.findById(unit.section);

    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const course = await Course.findById(section.course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to delete this question" });
    }

    await Chapter.findByIdAndUpdate(question.chapter, { $pull: { questions: question._id } });
    await Question.deleteOne({ _id: question._id });

    res.status(200).json({ message: "Question deleted" });
  } catch (error) {
    console.error('Error in deleteQuestion:', error);
    res.status(500).json({ message: `Failed to delete question: ${error.message}` });
  }
};