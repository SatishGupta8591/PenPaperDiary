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

mongoose
  .connect("mongodb+srv://satish:satish@cluster0.6vc0i.mongodb.net/", {
    dbName: 'PenPaperDiary'
  })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

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

// Modify the GET endpoint
app.get("/diary/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("Fetching diaries for userId:", userId);
    
    // Only fetch diaries for the specific user
    const diaries = await Diary.find({ userId: userId }).sort({ date: -1 });
    console.log("Found diaries:", diaries.length);
    
    res.status(200).json({ diaries });
  } catch (error) {
    console.error("Error fetching diaries:", error);
    res.status(500).json({ error: "Failed to fetch diaries" });
  }
});

// Modify the POST endpoint
app.post("/diary", async (req, res) => {
  try {
    const { userId, title, content, category } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    
    const newDiary = new Diary({
      userId,
      title,
      content,
      category,
      date: new Date()
    });
    
    await newDiary.save();
    res.status(200).json({ message: "Diary saved successfully", diary: newDiary });
  } catch (error) {
    console.error("Error saving diary:", error);
    res.status(500).json({ error: "Failed to save diary" });
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
