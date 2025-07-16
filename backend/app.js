const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const util = require('util');
require('dotenv').config();

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret'; // ✅ fallback for safety

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
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Connected to MySQL database.');
  }
});

// 🔐 JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// 🟢 Insert default data
const insertDefaultData = async () => {
  try {
    const result = await query('SELECT COUNT(*) AS count FROM products');
    if (result[0].count === 0) {
      const insertQuery = `
        INSERT INTO products (name, tagline, description, image, category, price)
        VALUES 
          ('Eco Bottle', 'Hydrate Smartly', 'Eco-friendly bottle.', 'images/eco_bottle.jpg', 'Home', 399),
          ('Smart Watch', 'Time Meets Tech', 'Fitness smartwatch.', 'images/smart_watch.jpg', 'Electronics', 1999)
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
    console.error('Signup error:', err); // ✅ log exact error
    res.status(500).json({ error: 'Server error. Please try again later.' });
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

    // Include role in JWT and response
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || '',
      },
    });
  } catch (err) {
    console.error('Signin error:', err); // ✅ debug log
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// ✅ Get Products with Filter/Sort (public route)
// ✅ Get products by array of IDs (for wishlist)
app.get('/products/by-ids', async (req, res) => {
  try {
    let ids = req.query.ids;
    if (!ids) return res.json([]);
    if (typeof ids === 'string') ids = ids.split(',').map(id => Number(id)).filter(Boolean);
    if (!Array.isArray(ids) || ids.length === 0) return res.json([]);
    const placeholders = ids.map(() => '?').join(',');
    const products = await query(`SELECT * FROM products WHERE id IN (${placeholders})`, ids);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/products', async (req, res) => {
  try {
    const { category, sort } = req.query;
    let baseQuery = 'SELECT * FROM products';
    const params = [];

    if (category && category !== 'All') {
      baseQuery += ' WHERE category = ?';
      params.push(category);
    }

    if (sort === 'lowToHigh') {
      baseQuery += ' ORDER BY price ASC';
    } else if (sort === 'highToLow') {
      baseQuery += ' ORDER BY price DESC';
    }

    const products = await query(baseQuery, params);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all unique categories (public route)
app.get('/categories', async (req, res) => {
  try {
    const categories = await query('SELECT DISTINCT category FROM products ORDER BY category ASC');
    // Return as array of strings
    res.json(categories.map(row => row.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Add Product
app.post('/products', authenticateToken, async (req, res) => {
  const { name, tagline, description, image, category, price } = req.body;
  // Backend validation
  if (!name || !tagline || !description || !image || !category || price === undefined || price === null || price === "") {
    return res.status(400).json({ error: 'All fields are required (name, tagline, description, image, category, price)' });
  }
  if (isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ error: 'Price must be a valid non-negative number' });
  }
  try {
    const result = await query(
      'INSERT INTO products (name, tagline, description, image, category, price) VALUES (?, ?, ?, ?, ?, ?)',
      [name, tagline, description, image, category, price]
    );
    res.status(201).json({ message: 'Product added', id: result.insertId });
  } catch (err) {
    console.error('Add product error:', err); // Log full error for debugging
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Edit Product
app.put('/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, tagline, description, image, category, price } = req.body;
  try {
    await query(
      'UPDATE products SET name = ?, tagline = ?, description = ?, image = ?, category = ?, price = ? WHERE id = ?',
      [name, tagline, description, image, category, price, id]
    );
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Delete Product
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
// --- Wishlist Endpoints ---
// Get user's wishlist (returns array of product objects, compatible with localStorage)
app.get('/wishlist', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await query('SELECT product_id FROM wishlist WHERE user_id = ?', [userId]);
    if (!rows.length) return res.json([]);
    const ids = rows.map(r => r.product_id);
    if (!ids.length) return res.json([]);
    const placeholders = ids.map(() => '?').join(',');
    const products = await query(`SELECT * FROM products WHERE id IN (${placeholders})`, ids);
    // Format for localStorage compatibility (id, name, image, price, etc)
    const formatted = products.map(p => ({
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      image: p.image,
      category: p.category,
      price: p.price
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add product(s) to wishlist (accepts single or array of productIds)
app.post('/wishlist', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });
    if (!Array.isArray(productId)) productId = [productId];
    let added = 0;
    for (const pid of productId) {
      const exists = await query('SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, pid]);
      if (!exists.length) {
        await query('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [userId, pid]);
        added++;
      }
    }
    res.json({ message: `Added ${added} product(s) to wishlist` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove product(s) from wishlist (accepts single or array of productIds)
app.delete('/wishlist/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let productId = req.params.id;
    if (productId.includes(',')) productId = productId.split(',');
    else productId = [productId];
    let removed = 0;
    for (const pid of productId) {
      const result = await query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, pid]);
      if (result.affectedRows) removed++;
    }
    res.json({ message: `Removed ${removed} product(s) from wishlist` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
