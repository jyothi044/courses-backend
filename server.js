const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const authRoutes = require("./routes/auth")
const learnerRoutes = require("./routes/learner")
const adminRoutes = require("./routes/admin")

const app = express()

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)
app.use(express.json())

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/learning_platform", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB")
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error)
    process.exit(1) // Exit if MongoDB connection fails
  })

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/learner", learnerRoutes)
app.use("/api/admin", adminRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack)
  res.status(500).json({ message: "Something went wrong!", error: err.message })
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
