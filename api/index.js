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
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect("cluster name", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const secretKey = crypto.randomBytes(32).toString("hex");

const User = require("./models/user");
const Todo = require("./models/todo");

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
    console.log("Login attempt with:", { email, password }); // Debug log

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found"); // Debug log
      return res.status(401).json({ message: "Invalid Email" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Ensure `secretKey` is static
    const secretKey = process.env.JWT_SECRET || "your-static-secret-key";

    // ✅ Fix: Return userId along with the token
    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: "7d" });

    res.status(200).json({
      token,
      userId: user._id.toString(), // Convert ObjectId to string
      name: user.name, // Also send user name to store in AsyncStorage
    });

  } catch (error) {
    console.error("Login error details:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
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
    const userId = req.params.userId;

    const todos = await Todo.find({ userId }); // Filter todos by userId
    if (!todos) {
      return res.status(404).json({ error: "No todos found" });
    }

    res.status(200).json({ todos });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});
app.patch("/todos/:todoId/complete", async (req, res) => {
  try {
    const todoId = req.params.todoId;

    const updatedTodo = await Todo.findByIdAndUpdate(
      todoId,
      {
        status: "completed",
      },
      { new: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res
      .status(200)
      .json({ message: "Todo marked as complete", todo: updatedTodo });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
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
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const totalCompletedTodos = await Todo.countDocuments({
      userId: userId,
      status: "completed",
    }).exec();

    const totalPendingTodos = await Todo.countDocuments({
      userId: userId,
      status: "pending",
    }).exec();

    res.status(200).json({ totalCompletedTodos, totalPendingTodos });
  } catch (error) {
    res.status(500).json({ error: "Network error" });
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

const Diary = require("./models/diary");

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

// Add or update the archive endpoint
app.patch("/diary/:diaryId/archive", async (req, res) => {
  try {
    const { diaryId } = req.params;
    const { userId } = req.body;

    if (!diaryId || !userId) {
      return res.status(400).json({ error: "DiaryId and userId are required" });
    }
    
    const diary = await Diary.findOneAndUpdate(
      { _id: diaryId, userId: userId },
      {
        isArchived: true,
        archivedAt: new Date()
      },
      { new: true }
    );

    if (!diary) {
      return res.status(404).json({ error: "Diary not found" });
    }

    res.status(200).json({ 
      message: "Diary archived successfully", 
      diary 
    });
  } catch (error) {
    console.error("Error archiving diary:", error);
    res.status(500).json({ error: "Failed to archive diary" });
  }
});

// Add unarchive diary endpoint
app.patch("/diary/:diaryId/unarchive", async (req, res) => {
  try {
    const { diaryId } = req.params;
    
    const diary = await Diary.findByIdAndUpdate(
      diaryId,
      {
        isArchived: false,
        archivedAt: null
      },
      { new: true }
    );

    if (!diary) {
      return res.status(404).json({ error: "Diary not found" });
    }

    res.status(200).json({ message: "Diary unarchived successfully", diary });
  } catch (error) {
    console.error("Error unarchiving diary:", error);
    res.status(500).json({ error: "Failed to unarchive diary" });
  }
});

// Modify the POST endpoint
app.post("/diary", async (req, res) => {
  try {
    const { userId, title, content, category, date, images } = req.body;
    
    console.log("Received diary data:", req.body); // Debug log
    
    if (!userId || !title || !content) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        required: "userId, title, content" 
      });
    }

    const newDiary = new Diary({
      userId,
      title: title.trim(),
      content: content.trim(),
      category: category || 'Personal',
      date: date || new Date(),
      images: images || []
    });

    const savedDiary = await newDiary.save();
    console.log("Diary saved:", savedDiary); // Debug log

    res.status(201).json({ 
      message: "Diary saved successfully", 
      diary: savedDiary 
    });
  } catch (error) {
    console.error("Server error saving diary:", error);
    res.status(500).json({ 
      error: "Failed to save diary",
      details: error.message 
    });
  }
});

// Add this endpoint for updating diaries
app.put("/diary/:diaryId", async (req, res) => {
  try {
    const { diaryId } = req.params;
    const { userId, title, content, category } = req.body;
    
    const updatedDiary = await Diary.findByIdAndUpdate(
      diaryId,
      {
        title,
        content,
        category,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedDiary) {
      return res.status(404).json({ error: "Diary entry not found" });
    }
    
    res.status(200).json({ 
      message: "Diary updated successfully", 
      diary: updatedDiary 
    });
  } catch (error) {
    console.error("Error updating diary:", error);
    res.status(500).json({ error: "Failed to update diary" });
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

app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({ 
    message: "Internal server error", 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
