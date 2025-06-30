const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const util = require('util');
require('dotenv').config();

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET 

app.use(cors());
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ecommerce',
});

const query = util.promisify(db.query).bind(db);

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('✅ Connected to MySQL database.');
  }
});

// 🔐 JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// 🟦 Insert default products if table is empty
const insertDefaultData = async () => {
  try {
    const result = await query('SELECT COUNT(*) AS count FROM products');
    if (result[0].count === 0) {
      const insertQuery = `
        INSERT INTO products (name, tagline, description, image)
        VALUES 
          ('Eco Bottle', 'Hydrate Smartly', 'Eco-friendly bottle.', 'images/eco_bottle.jpg'),
          ('Smart Watch', 'Time Meets Tech', 'Fitness smartwatch.', 'images/smart_watch.jpg')
      `;
      await query(insertQuery);
      console.log('🟢 Default products inserted.');
    }
  } catch (err) {
    console.error('❌ Error inserting default data:', err.message);
  }
};
insertDefaultData();

// 🔐 Signup Route
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existingUser = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, NOW())',
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: 'User created successfully', userId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Signin Route
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Protected Product Routes
app.get('/products', authenticateToken, async (req, res) => {
  try {
    const products = await query('SELECT * FROM products');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', authenticateToken, async (req, res) => {
  const { name, tagline, description, image } = req.body;
  try {
    const result = await query(
      'INSERT INTO products (name, tagline, description, image) VALUES (?, ?, ?, ?)',
      [name, tagline, description, image]
    );
    res.status(201).json({ message: 'Product added', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, tagline, description, image } = req.body;
  try {
    await query(
      'UPDATE products SET name = ?, tagline = ?, description = ?, image = ? WHERE id = ?',
      [name, tagline, description, image, id]
    );
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Health Check
app.get('/', (req, res) => {
  res.send('API is working 🎉');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
