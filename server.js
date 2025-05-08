
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

// Connect to MongoDB (use your own URI if needed)
mongoose.connect('mongodb://localhost:27017/userAuth', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema and model
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});
const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
}));

// Routes
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.send('Email already registered. <a href="/register.html">Try again</a>');
  }
  const newUser = new User({ username, email, password });
  await newUser.save();
  res.send('Registration successful. <a href="/login.html">Login here</a>');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (user) {
    req.session.userId = user._id;
    res.redirect('/dashboard');
  } else {
    res.send('Invalid credentials. <a href="/login.html">Try again</a>');
  }
});

app.get('/dashboard', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login.html');
  const user = await User.findById(req.session.userId);
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/api/user', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  const user = await User.findById(req.session.userId);
  res.json({ username: user.username, email: user.email });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
