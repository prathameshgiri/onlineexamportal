const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'online-exam-secret-key-2024';

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Data paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SCORES_FILE = path.join(DATA_DIR, 'scores.json');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

// Helper functions
function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return filePath.includes('users') || filePath.includes('scores') ? [] : {};
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const users = readJSON(USERS_FILE);
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeJSON(USERS_FILE, users);

    const token = jwt.sign({ id: newUser.id, name: newUser.name, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const users = readJSON(USERS_FILE);
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ==================== QUESTIONS ROUTES ====================

// Get all topics
app.get('/api/topics', (req, res) => {
  const questions = readJSON(QUESTIONS_FILE);
  const topics = Object.entries(questions).map(([key, value]) => ({
    id: key,
    name: value.name,
    icon: value.icon,
    color: value.color,
    description: value.description,
    totalQuestions: value.questions.length
  }));
  res.json(topics);
});

// Get questions for a topic
app.get('/api/questions/:topicId', authenticateToken, (req, res) => {
  const questions = readJSON(QUESTIONS_FILE);
  const topic = questions[req.params.topicId];
  if (!topic) {
    return res.status(404).json({ error: 'Topic not found' });
  }

  // Shuffle questions and send without answers
  const shuffled = [...topic.questions]
    .sort(() => Math.random() - 0.5)
    .map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
    }));

  res.json({
    topic: topic.name,
    icon: topic.icon,
    color: topic.color,
    questions: shuffled
  });
});

// ==================== EXAM ROUTES ====================

// Submit exam
app.post('/api/exam/submit', authenticateToken, (req, res) => {
  try {
    const { topicId, answers, timeTaken } = req.body;
    const questions = readJSON(QUESTIONS_FILE);
    const topic = questions[topicId];

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Calculate score
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;
    const details = [];

    topic.questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (userAnswer === undefined || userAnswer === null) {
        unanswered++;
        details.push({
          questionId: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.answer,
          userAnswer: null,
          isCorrect: false
        });
      } else if (userAnswer === q.answer) {
        correct++;
        details.push({
          questionId: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.answer,
          userAnswer,
          isCorrect: true
        });
      } else {
        wrong++;
        details.push({
          questionId: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.answer,
          userAnswer,
          isCorrect: false
        });
      }
    });

    const totalQuestions = topic.questions.length;
    const percentage = Math.round((correct / totalQuestions) * 100);

    const scoreEntry = {
      id: uuidv4(),
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      topicId,
      topicName: topic.name,
      topicIcon: topic.icon,
      totalQuestions,
      correct,
      wrong,
      unanswered,
      percentage,
      timeTaken: timeTaken || 0,
      details,
      submittedAt: new Date().toISOString()
    };

    const scores = readJSON(SCORES_FILE);
    scores.push(scoreEntry);
    writeJSON(SCORES_FILE, scores);

    res.json({
      scoreId: scoreEntry.id,
      correct,
      wrong,
      unanswered,
      totalQuestions,
      percentage,
      timeTaken: scoreEntry.timeTaken,
      details
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user scores
app.get('/api/scores', authenticateToken, (req, res) => {
  const scores = readJSON(SCORES_FILE);
  const userScores = scores
    .filter(s => s.userId === req.user.id)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  res.json(userScores);
});

// Get specific score details
app.get('/api/scores/:scoreId', authenticateToken, (req, res) => {
  const scores = readJSON(SCORES_FILE);
  const score = scores.find(s => s.id === req.params.scoreId && s.userId === req.user.id);
  if (!score) {
    return res.status(404).json({ error: 'Score not found' });
  }
  res.json(score);
});

// ==================== ADMIN ROUTES (PORT 3001) ====================

const adminApp = express();
const ADMIN_PORT = 3001;

adminApp.use(express.json());
adminApp.use(express.static(path.join(__dirname, 'public')));

// Admin login
adminApp.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const admin = readJSON(ADMIN_FILE);

  if (username === admin.username && password === admin.password) {
    const token = jwt.sign({ role: 'admin', username }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid admin credentials' });
});

// Admin auth middleware
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || decoded.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.admin = decoded;
    next();
  });
}

// Get all scores (admin)
adminApp.get('/api/admin/scores', authenticateAdmin, (req, res) => {
  const scores = readJSON(SCORES_FILE);
  const sorted = scores.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  res.json(sorted);
});

// Get dashboard stats (admin)
adminApp.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  const users = readJSON(USERS_FILE);
  const scores = readJSON(SCORES_FILE);
  const questions = readJSON(QUESTIONS_FILE);

  const totalUsers = users.length;
  const totalExams = scores.length;
  const totalTopics = Object.keys(questions).length;
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length)
    : 0;

  // Topic-wise stats
  const topicStats = {};
  Object.entries(questions).forEach(([key, value]) => {
    const topicScores = scores.filter(s => s.topicId === key);
    topicStats[key] = {
      name: value.name,
      icon: value.icon,
      color: value.color,
      totalAttempts: topicScores.length,
      avgScore: topicScores.length > 0
        ? Math.round(topicScores.reduce((sum, s) => sum + s.percentage, 0) / topicScores.length)
        : 0,
      highestScore: topicScores.length > 0
        ? Math.max(...topicScores.map(s => s.percentage))
        : 0
    };
  });

  // Recent activity
  const recentScores = scores
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 10);

  // Top performers
  const userBestScores = {};
  scores.forEach(s => {
    if (!userBestScores[s.userId] || s.percentage > userBestScores[s.userId].percentage) {
      userBestScores[s.userId] = s;
    }
  });
  const topPerformers = Object.values(userBestScores)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  res.json({
    totalUsers,
    totalExams,
    totalTopics,
    avgScore,
    topicStats,
    recentScores,
    topPerformers
  });
});

// Get all users (admin)
adminApp.get('/api/admin/users', authenticateAdmin, (req, res) => {
  const users = readJSON(USERS_FILE);
  const scores = readJSON(SCORES_FILE);

  const usersData = users.map(u => {
    const userScores = scores.filter(s => s.userId === u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      totalExams: userScores.length,
      avgScore: userScores.length > 0
        ? Math.round(userScores.reduce((sum, s) => sum + s.percentage, 0) / userScores.length)
        : 0
    };
  });

  res.json(usersData);
});

// Delete a score (admin)
adminApp.delete('/api/admin/scores/:scoreId', authenticateAdmin, (req, res) => {
  let scores = readJSON(SCORES_FILE);
  const index = scores.findIndex(s => s.id === req.params.scoreId);
  if (index === -1) {
    return res.status(404).json({ error: 'Score not found' });
  }
  scores.splice(index, 1);
  writeJSON(SCORES_FILE, scores);
  res.json({ message: 'Score deleted' });
});

adminApp.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve main app pages
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎓 Online Examination System`);
  console.log(`══════════════════════════════════`);
  console.log(`🌐 User Server running at: http://localhost:${PORT}`);
});

adminApp.listen(ADMIN_PORT, () => {
  console.log(`🔧 Admin Server running at: http://localhost:${ADMIN_PORT}/admin`);
  console.log(`══════════════════════════════════\n`);
});
