const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const cors = require("cors");

const app = express();
const port = 8000;

app.use(cors());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' })); // Increase payload limit

mongoose
  .connect("mongodb+srv://satish:satish@cluster0.6vc0i.mongodb.net/PenPaperDiary", {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected successfully");
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

const secretKey = crypto.randomBytes(32).toString("hex");

const User = require("./models/user");
const Todo = require("./models/todo");
const Diary = require("./models/diary");

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User already registered with this email'
      });
    }

    // Create new user if not exists
    const newUser = new User({
      name,
      email,
      password
    });
    await newUser.save();
    res.status(201).json({ 
      status: 'success',
      message: 'Registration successful' 
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration'
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt with:", { email, password });

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).maxTimeMS(5000); // Add timeout

    if (!user) {
      console.log("User not found");
      return res.status(401).json({ message: "Invalid Email" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: "7d" });

    res.status(200).json({
      token,
      userId: user._id.toString(),
      name: user.name,
    });

  } catch (error) {
    console.error("Login error details:", error);
    res.status(500).json({ 
      message: "Login failed", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post("/todos/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { title, category } = req.body;

    const newTodo = new Todo({
      title,
      category,
      userId, // Add userId when creating todo
      dueDate: moment().format("YYYY-MM-DD"),
    });

    await newTodo.save();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.todos.push(newTodo._id);
    await user.save();

    res.status(200).json({ message: "Todo added successfully", todo: newTodo });
  } catch (error) {
    res.status(500).json({ message: "Todo not added" });
  }
});

app.get("/users/:userId/todos", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const todos = await Todo.find(query).sort({ createdAt: -1 });
    res.status(200).json({ todos });
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

app.patch("/todos/:todoId/complete", async (req, res) => {
  try {
    const { todoId } = req.params;
    const { completedAt } = req.body;

    const updatedTodo = await Todo.findByIdAndUpdate(
      todoId,
      {
        status: "completed",
        completedAt: completedAt
      },
      { new: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.status(200).json({
      message: "Todo marked as completed",
      todo: updatedTodo
    });
  } catch (error) {
    console.error("Error completing todo:", error);
    res.status(500).json({ message: "Error completing todo", error: error.message });
  }
});

app.get("/todos/completed/:date", async (req, res) => {
  try {
    const date = req.params.date;

    const completedTodos = await Todo.find({
      status: "completed",
      completedAt: {
        $gte: new Date(`${date}T00:00:00.000Z`), // Start of the selected date
        $lt: new Date(`${date}T23:59:59.999Z`), // End of the selected date
      },
    }).exec();

    res.status(200).json({ completedTodos });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/todos/count", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const totalCompletedTodos = await Todo.countDocuments({
      userId,
      status: "completed"
    });

    const totalPendingTodos = await Todo.countDocuments({
      userId,
      status: "pending"
    });

    res.status(200).json({ totalCompletedTodos, totalPendingTodos });
  } catch (error) {
    console.error("Error getting todo counts:", error);
    res.status(500).json({ error: "Failed to get todo counts" });
  }
});

// Add the DELETE endpoint here
app.delete("/todos/:todoId", async (req, res) => {
  try {
    const todoId = req.params.todoId;

    const deletedTodo = await Todo.findByIdAndDelete(todoId);

    if (!deletedTodo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.status(200).json({ message: "Todo deleted successfully", todo: deletedTodo });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Add this endpoint after other routes
app.get("/user", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, secretKey);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      name: user.name,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user details" });
  }
});

// Modify the GET endpoint for diaries
app.get("/diary/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const date = req.query.date;
    console.log("Fetching diaries for userId:", userId, "and date:", date);

    let query = { userId: userId };

    if (date) {
      query.date = {
        $gte: new Date(`${date}T00:00:00.000Z`),
        $lt: new Date(`${date}T23:59:59.999Z`),
      };
    }

    const diaries = await Diary.find(query).sort({ date: -1 });
    res.status(200).json({ diaries });
  } catch (error) {
    console.error("Error fetching diaries:", error);
    res.status(500).json({ error: "Failed to fetch diaries" });
  }
});

// Add this new endpoint for archived diaries
app.get("/diary/:userId/archived", async (req, res) => {
  try {
    const userId = req.params.userId;
    const archivedDiaries = await Diary.find({
      userId: userId,
      isArchived: true
    }).sort({ date: -1 });
    
    res.status(200).json({ diaries: archivedDiaries });
  } catch (error) {
    console.error("Error fetching archived diaries:", error);
    res.status(500).json({ error: "Failed to fetch archived diaries" });
  }
});

// Get single diary entry
app.get("/diary/:diaryId", async (req, res) => {
  try {
    const { diaryId } = req.params;
    const diary = await Diary.findById(diaryId);
    
    if (!diary) {
      return res.status(404).json({ message: "Diary not found" });
    }

    res.status(200).json({ diary });
  } catch (error) {
    console.error("Error fetching diary:", error);
    res.status(500).json({ message: "Failed to fetch diary" });
  }
});

// Modify the POST endpoint
app.post("/diary", async (req, res) => {
  try {
    const { userId, title, content, category, date, images } = req.body;

    // Validation
    if (!userId || !title || !content || !category) {
      return res.status(400).json({ 
        message: "Missing required fields",
        required: ["userId", "title", "content", "category"]
      });
    }

    const newDiary = new Diary({
      userId,
      title,
      content,
      category,
      date: date || new Date(),
      images: Array.isArray(images) ? images : [], // Ensure images is an array
    });

    const savedDiary = await newDiary.save();
    console.log("Diary saved successfully:", {
      id: savedDiary._id,
      imageCount: savedDiary.images.length
    });

    res.status(200).json({ 
      message: "Diary added successfully", 
      diary: savedDiary 
    });
  } catch (error) {
    console.error("Error adding diary:", error);
    res.status(500).json({ 
      message: "Failed to add diary",
      error: error.message 
    });
  }
});

// Add this endpoint for updating diaries
app.put("/diary/:diaryId", async (req, res) => {
  try {
    const { diaryId } = req.params;
    const { userId, title, content, category, date, images } = req.body;

    const updatedDiary = await Diary.findByIdAndUpdate(
      diaryId,
      {
        userId,
        title,
        content,
        category,
        date,
        images, // Update array of images
      },
      { new: true }
    );

    if (!updatedDiary) {
      return res.status(404).json({ error: "Diary not found" });
    }

    res
      .status(200)
      .json({ message: "Diary updated successfully", diary: updatedDiary });
  } catch (error) {
    console.error("Error updating diary:", error);
    res.status(500).json({ message: "Failed to update diary" });
  }
});

// Archive diary endpoint
app.patch("/diary/:diaryId/archive", async (req, res) => {
  try {
    const { diaryId } = req.params;

    const updatedDiary = await Diary.findByIdAndUpdate(
      diaryId,
      {
        isArchived: true,
        archivedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedDiary) {
      return res.status(404).json({ error: "Diary not found" });
    }

    res.status(200).json({
      message: "Diary archived successfully",
      diary: updatedDiary,
    });
  } catch (error) {
    console.error("Error archiving diary:", error);
    res.status(500).json({ error: "Failed to archive diary" });
  }
});

// Unarchive diary endpoint
app.patch("/diary/:diaryId/unarchive", async (req, res) => {
  try {
    const { diaryId } = req.params;

    const updatedDiary = await Diary.findByIdAndUpdate(
      diaryId,
      {
        isArchived: false,
        archivedAt: null,
      },
      { new: true }
    );

    if (!updatedDiary) {
      return res.status(404).json({ error: "Diary not found" });
    }

    res.status(200).json({
      message: "Diary unarchived successfully",
      diary: updatedDiary,
    });
  } catch (error) {
    console.error("Error unarchiving diary:", error);
    res.status(500).json({ error: "Failed to unarchive diary" });
  }
});

// Delete diary endpoint
app.delete("/diary/:diaryId", async (req, res) => {
  try {
    const { diaryId } = req.params;
    
    const deletedDiary = await Diary.findByIdAndDelete(diaryId);

    if (!deletedDiary) {
      return res.status(404).json({ error: "Diary not found" });
    }

    res.status(200).json({ 
      message: "Diary deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting diary:", error);
    res.status(500).json({ error: "Failed to delete diary" });
  }
});

// Remove the duplicate routes and keep only this one
app.post("/todos/:todoId/subtasks", async (req, res) => {
  try {
    const { todoId } = req.params;
    const { title } = req.body;

    console.log("Received request to add subtask:", { todoId, title }); // Debug log

    if (!title) {
      return res.status(400).json({ message: "Subtask title is required" });
    }

    const todo = await Todo.findById(todoId);
    
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    todo.subtasks.push({ title, completed: false });
    await todo.save();

    console.log("Subtask added successfully"); // Debug log

    res.status(200).json({
      message: "Subtask added successfully",
      todo: todo
    });
  } catch (error) {
    console.error("Error adding subtask:", error);
    res.status(500).json({ 
      message: "Failed to add subtask",
      error: error.message 
    });
  }
});

// Mark subtask as completed
app.patch("/todos/:todoId/subtasks/:subtaskId/complete", async (req, res) => {
  try {
    const { todoId, subtaskId } = req.params;

    const todo = await Todo.findById(todoId);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    const subtask = todo.subtasks.id(subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    subtask.completed = true;
    await todo.save();

    res.status(200).json({ message: "Subtask marked as completed", todo });
  } catch (error) {
    console.error("Error marking subtask as completed:", error);
    res.status(500).json({ message: "Failed to mark subtask as completed" });
  }
});

// Edit subtask
app.patch("/todos/:todoId/subtasks/:subtaskId", async (req, res) => {
  try {
    const { todoId, subtaskId } = req.params;
    const { title } = req.body;

    const todo = await Todo.findById(todoId);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    const subtask = todo.subtasks.id(subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    subtask.title = title;
    await todo.save();

    res.status(200).json({ message: "Subtask edited successfully", todo });
  } catch (error) {
    console.error("Error editing subtask:", error);
    res.status(500).json({ message: "Failed to edit subtask" });
  }
});

// Delete subtask
app.delete("/todos/:todoId/subtasks/:subtaskId", async (req, res) => {
  try {
    const { todoId, subtaskId } = req.params;

    const todo = await Todo.findById(todoId);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    const subtask = todo.subtasks.id(subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    todo.subtasks.pull(subtaskId); // Use pull method to remove subtask
    await todo.save();

    res.status(200).json({ message: "Subtask deleted successfully", todo });
  } catch (error) {
    console.error("Error deleting subtask:", error);
    res.status(500).json({ message: "Failed to delete subtask" });
  }
});

// Keep this GET route for fetching todo with subtasks
app.get("/todos/:todoId", async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.todoId);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.status(200).json(todo);
  } catch (error) {
    console.error("Error fetching todo:", error);
    res.status(500).json({ message: "Error fetching todo" });
  }
});

// Add the new endpoint for fetching completed todos by userId and date
app.get("/todos/:userId/completed", async (req, res) => {
  try {
    const userId = req.params.userId;
    const date = req.query.date;

    if (!userId || !date) {
      return res.status(400).json({ error: "userId and date are required" });
    }

    const completedTodos = await Todo.find({
      userId: userId,
      status: "completed",
      completedAt: {
        $gte: new Date(`${date}T00:00:00.000Z`),
        $lt: new Date(`${date}T23:59:59.999Z`)
      }
    }).sort({ completedAt: -1 });

    res.status(200).json({ completedTodos });
  } catch (error) {
    console.error("Error fetching completed todos:", error);
    res.status(500).json({ error: "Failed to fetch completed todos" });
  }
});

app.patch("/todos/:todoId/revert", async (req, res) => {
  try {
    const { todoId } = req.params;
    
    const updatedTodo = await Todo.findByIdAndUpdate(
      todoId,
      {
        $set: {
          status: "pending",
          completedAt: null
        }
      },
      { new: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.status(200).json({
      message: "Todo reverted to pending",
      todo: updatedTodo
    });
  } catch (error) {
    console.error("Error reverting todo:", error);
    res.status(500).json({ message: "Error reverting todo", error: error.message });
  }
});

app.get("/health", async (req, res) => {
  try {
    const status = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    res.json({ 
      status: states[status], 
      isConnected: status === 1 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({ 
    message: "Internal server error", 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Add to your User schema
const userSchema = new mongoose.Schema({
  // ...existing fields...
  securityPin: {
    type: String,
    minlength: 4,
    maxlength: 4
  }
});

// Add new endpoints for PIN management
app.post("/users/set-pin", async (req, res) => {
  try {
    const { userId, pin } = req.body;
    
    if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
      return res.status(400).json({ message: "PIN must be 4 digits" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { securityPin: pin },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "PIN set successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error setting PIN", error: error.message });
  }
});

app.post("/users/verify-pin", async (req, res) => {
  try {
    const { userId, pin } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.securityPin !== pin) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    res.status(200).json({ message: "PIN verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error verifying PIN", error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
