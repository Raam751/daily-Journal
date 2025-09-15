const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const userModel = require('./models/user');
const Entry = require('./models/entry');



dotenv.config();

const app = express();


app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const methodOverride = require('method-override');
app.use(methodOverride('_method'));


// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

//  Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.post('/create', async (req, res) => {
    try {
      let { username, email, password, age } = req.body;
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const createdUser = await userModel.create({
        username,
        email,
        password: hashedPassword,
        age
      });
  
      // ✅ Redirect to the new user's journal page
      res.redirect(`/journal/${createdUser._id}`);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "User creation failed" });
    }
});
  

app.get('/journal/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const entries = await Entry.find({ userId }).sort({ date: -1 });
  
      res.render('journal', { entries, userId });
    } catch (err) {
      console.error(err);
      res.redirect('/');
    }
});
  
  

app.post('/entries', async (req, res) => {
    try {
      const { userId, date, content } = req.body;
  
      await Entry.create({ userId, date, content });
  
      // Redirect back to the journal page for this user
      res.redirect(`/journal/${userId}`);
    } catch (err) {
      console.error(err);
      res.status(500).send("Failed to create entry");
    }
});
  

app.get('/entries/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
  
      const entries = await Entry.find({ userId }).sort({ date: -1 }); // newest first
      res.json(entries);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

app.patch('/entries/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
  
      const updatedEntry = await Entry.findByIdAndUpdate(
        id,
        { content },
        { new: true }
      );
  
      res.json(updatedEntry);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update entry' });
    }
});

app.delete('/entries/:id', async (req, res) => {
    try {
      const { id } = req.params;
  
      await Entry.findByIdAndDelete(id);
      res.json({ message: 'Entry deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete entry' });
    }
});



// POST /login - authenticate user
app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await userModel.findOne({ email });
  
      if (!user) return res.redirect('/login?error=User not found');
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.redirect('/login?error=Invalid credentials');
  
      // ✅ Redirect to journal page for this user
      return res.redirect(`/journal/${user._id}`);
    } catch (err) {
      console.error(err);
      return res.redirect('/login?error=Login failed');
    }
});
  
  
  

app.get('/login', (req, res) => {
  res.render('login');
});

// Start server
const PORT = 3007 || process.env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
