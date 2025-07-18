const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const util = require('util'); // For promisifying db.query
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_please_change_this_in_production'; // Use a strong, unique secret in production

// Middleware setup
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable JSON body parsing

// MySQL Connection Pool (recommended for production applications)
// Using createConnection for simplicity as per original, but pool is better for high traffic
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'ecommerce',
});

// Promisify db.query to use async/await syntax
const query = util.promisify(db.query).bind(db);

// Connect to the database and initialize tables/data
db.connect(async (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    // In a real application, you might want to exit or retry
    process.exit(1); // Exit the process if database connection fails critically
  } else {
    console.log('✅ Connected to MySQL database.');
    await initializeDatabase(); // Initialize tables and insert default data
  }
});

/**
 * Initializes the database by creating necessary tables if they don't exist
 * and inserting default data for products, users, and orders.
 */
async function initializeDatabase() {
  try {
    // 1. Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user', -- 'user' or 'admin' or 'superadmin'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table ensured.');

    // 2. Create products table
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        tagline VARCHAR(255),
        description TEXT,
        image VARCHAR(255),
        category VARCHAR(100),
        price DECIMAL(10, 2) NOT NULL
      );
    `);
    console.log('✅ Products table ensured.');

    // 3. Create wishlist table
    await query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        PRIMARY KEY (user_id, product_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Wishlist table ensured.');

    // 4. Create orders table
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        delivery_date DATE,
        total_amount DECIMAL(10, 2) NOT NULL,
        shipped_to VARCHAR(500) NOT NULL, -- Increased length for full address
        status VARCHAR(50) DEFAULT 'Processing', -- e.g., 'Processing', 'Shipped', 'Delivered', 'Cancelled'
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Orders table ensured.');

    // 5. Create order_items table
    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price_at_purchase DECIMAL(10, 2) NOT NULL,
        product_name_at_purchase VARCHAR(255) NOT NULL,
        product_image_at_purchase VARCHAR(255),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Order_items table ensured.');

    // 6. Create user_addresses table
    await query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        zip_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ User_addresses table ensured.');


    // Insert default data into tables
    await insertDefaultData();
  } catch (err) {
    console.error('❌ Error during database initialization:', err.message);
  }
}

/**
 * Inserts default data into the users, products, and orders tables if they are empty.
 * This ensures the application has initial data for testing and demonstration.
 */
const insertDefaultData = async () => {
  try {
    // Insert default users if none exist
    const userCountResult = await query('SELECT COUNT(*) AS count FROM users');
    if (userCountResult[0].count === 0) {
      const hashedPasswordUser = await bcrypt.hash('password123', 10);
      const hashedPasswordAdmin = await bcrypt.hash('adminpass', 10); // A password for the admin user

      const insertUsersQuery = `
        INSERT INTO users (name, email, password, role)
        VALUES
          ('Khushank Arora', 'khushank@example.com', ?, 'user'),
          ('Admin User', 'admin@example.com', ?, 'superadmin');
      `;
      await query(insertUsersQuery, [hashedPasswordUser, hashedPasswordAdmin]);
      console.log('🟢 Default users inserted (including superadmin).');
    }

    // Insert default products if none exist
    const productCountResult = await query('SELECT COUNT(*) AS count FROM products');
    if (productCountResult[0].count === 0) {
      const insertProductsQuery = `
        INSERT INTO products (name, tagline, description, image, category, price)
        VALUES
          ('Eco Bottle', 'Hydrate Smartly', 'An eco-friendly reusable water bottle made from recycled materials, perfect for daily hydration.', 'https://placehold.co/300x300/A7C7E7/FFFFFF?text=Eco+Bottle', 'Home', 399.00),
          ('Smart Watch', 'Time Meets Tech', 'A feature-rich smartwatch with advanced health tracking, notifications, and long battery life.', 'https://placehold.co/300x300/F0E68C/FFFFFF?text=Smart+Watch', 'Electronics', 1999.50),
          ('Wireless Earbuds', 'Immersive Sound', 'High-fidelity wireless earbuds with active noise cancellation and comfortable fit for all-day listening.', 'https://placehold.co/300x300/DDA0DD/FFFFFF?text=Earbuds', 'Electronics', 899.00),
          ('Smart LED Bulb', 'Illuminate Your Life', 'An Alexa-enabled smart LED bulb with customizable colors and brightness, controllable via app or voice.', 'https://placehold.co/300x300/ADD8E6/FFFFFF?text=LED+Bulb', 'Home', 499.00),
          ('Portable Bluetooth Speaker', 'Sound On-The-Go', 'Compact and waterproof Bluetooth speaker, ideal for outdoor adventures and parties.', 'https://placehold.co/300x300/90EE90/FFFFFF?text=Speaker', 'Electronics', 1500.00),
          ('USB-C Fast Charger', 'Power Up Quickly', 'A powerful 65W USB-C fast charger compatible with most modern laptops and smartphones.', 'https://placehold.co/300x300/FFB6C1/FFFFFF?text=Charger', 'Electronics', 1000.00),
          ('Men\'s Casual T-Shirt', 'Comfort & Style', 'Soft, breathable cotton casual t-shirt for everyday wear, available in multiple sizes.', 'https://placehold.co/300x300/87CEEB/FFFFFF?text=T-Shirt', 'Apparel', 600.00),
          ('Designer Handbag', 'Elegance Redefined', 'A stylish and spacious designer handbag, perfect for any occasion.', 'https://placehold.co/300x300/F08080/FFFFFF?text=Handbag', 'Bags', 2500.00),
          ('Running Shoes', 'Stride with Comfort', 'Lightweight and comfortable running shoes designed for optimal performance.', 'https://placehold.co/300x300/8A2BE2/FFFFFF?text=Shoes', 'Footwear', 1800.00),
          ('Organic Coffee Beans', 'Rich Aroma', 'Premium organic coffee beans, freshly roasted for a rich and satisfying brew.', 'https://placehold.co/300x300/FFD700/FFFFFF?text=Coffee', 'Groceries', 750.00),
          ('Facial Cleanser', 'Fresh & Clean', 'Gentle facial cleanser for all skin types, removes impurities and leaves skin refreshed.', 'https://placehold.co/300x300/FFC0CB/FFFFFF?text=Cleanser', 'Beauty', 550.00);
      `;
      await query(insertProductsQuery);
      console.log('🟢 Default products inserted.');
    }

    // Insert default addresses if none exist
    const addressCountResult = await query('SELECT COUNT(*) AS count FROM user_addresses');
    if (addressCountResult[0].count === 0) {
      const khushankUsers = await query('SELECT id FROM users WHERE email = ?', ['khushank@example.com']);
      const adminUsers = await query('SELECT id FROM users WHERE email = ?', ['admin@example.com']);

      const khushankId = khushankUsers.length > 0 ? khushankUsers[0].id : null;
      const adminId = adminUsers.length > 0 ? adminUsers[0].id : null;

      if (khushankId) {
        await query(
          `INSERT INTO user_addresses (user_id, address_line1, address_line2, city, state, zip_code, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [khushankId, '123 Main Street', 'Apt 4B', 'New Delhi', 'Delhi', '110001', 'India', true]
        );
        console.log('🟢 Default address inserted for Khushank Arora.');
      }
      if (adminId) {
        await query(
          `INSERT INTO user_addresses (user_id, address_line1, address_line2, city, state, zip_code, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [adminId, '789 Admin Road', 'Suite 100', 'Mumbai', 'Maharashtra', '400001', 'India', true]
        );
        console.log('🟢 Default address inserted for Admin User.');
      }
    }


    // Insert default orders if none exist
    const orderCountResult = await query('SELECT COUNT(*) AS count FROM orders');
    if (orderCountResult[0].count === 0) {
      // Dynamically fetch user IDs after potential insertion
      const khushankUsers = await query('SELECT id FROM users WHERE email = ?', ['khushank@example.com']);
      const adminUsers = await query('SELECT id FROM users WHERE email = ?', ['admin@example.com']);

      const khushankId = khushankUsers.length > 0 ? khushankUsers[0].id : null;
      const adminId = adminUsers.length > 0 ? adminUsers[0].id : null;

      const productsData = await query('SELECT id, name, price, image, category FROM products');

      // Helper to find product by name
      const findProduct = (name) => productsData.find(p => p.name === name);

      if (khushankId) {
        // Order 1: Delivered Order for Khushank
        const order1Items = [
          { product: findProduct('Wireless Earbuds'), qty: 1 },
          { product: findProduct('Smart LED Bulb'), qty: 2 }
        ].filter(item => item.product); // Filter out null products if not found

        if (order1Items.length > 0) {
          const total1 = order1Items.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
          const order1Date = new Date('2025-07-15');
          const delivery1Date = new Date('2025-07-18');
          const order1Result = await query(
            'INSERT INTO orders (user_id, order_date, delivery_date, total_amount, shipped_to, status) VALUES (?, ?, ?, ?, ?, ?)',
            [khushankId, order1Date, delivery1Date.toISOString().split('T')[0], total1, 'Khushank Arora, 123 Main St, New Delhi, India', 'Delivered']
          );
          const order1Id = order1Result.insertId;

          for (const item of order1Items) {
            await query(
              'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, product_name_at_purchase, product_image_at_purchase) VALUES (?, ?, ?, ?, ?, ?)',
              [order1Id, item.product.id, item.qty, item.product.price, item.product.name, item.product.image]
            );
          }
          console.log('🟢 Default order 1 (Delivered) inserted for Khushank.');
        }

        // Order 2: Processing Order for Khushank
        const order2Items = [
          { product: findProduct('Eco Bottle'), qty: 1 },
          { product: findProduct('Smart Watch'), qty: 1 }
        ].filter(item => item.product);

        if (order2Items.length > 0) {
          const total2 = order2Items.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
          const order2Date = new Date('2025-07-20');
          const delivery2Date = new Date('2025-07-25');
          const order2Result = await query(
            'INSERT INTO orders (user_id, order_date, delivery_date, total_amount, shipped_to, status) VALUES (?, ?, ?, ?, ?, ?)',
            [khushankId, order2Date, delivery2Date.toISOString().split('T')[0], total2, 'Khushank Arora, 123 Main St, New Delhi, India', 'Processing']
          );
          const order2Id = order2Result.insertId;

          for (const item of order2Items) {
            await query(
              'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, product_name_at_purchase, product_image_at_purchase) VALUES (?, ?, ?, ?, ?, ?)',
              [order2Id, item.product.id, item.qty, item.product.price, item.product.name, item.product.image]
            );
          }
          console.log('🟢 Default order 2 (Processing) inserted for Khushank.');
        }
      }

      if (adminId) {
        // Order 3: Delivered Order for Admin (as a user)
        const order3Items = [
          { product: findProduct('Designer Handbag'), qty: 1 },
          { product: findProduct('Running Shoes'), qty: 1 }
        ].filter(item => item.product);

        if (order3Items.length > 0) {
          const total3 = order3Items.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
          const order3Date = new Date('2025-06-25');
          const delivery3Date = new Date('2025-06-30');
          const order3Result = await query(
            'INSERT INTO orders (user_id, order_date, delivery_date, total_amount, shipped_to, status) VALUES (?, ?, ?, ?, ?, ?)',
            [adminId, order3Date, delivery3Date.toISOString().split('T')[0], total3, 'Admin User, 789 Admin Rd, Mumbai, India', 'Delivered']
          );
          const order3Id = order3Result.insertId;

          for (const item of order3Items) {
            await query(
              'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, product_name_at_purchase, product_image_at_purchase) VALUES (?, ?, ?, ?, ?, ?)',
              [order3Id, item.product.id, item.qty, item.product.price, item.product.name, item.product.image]
            );
          }
          console.log('🟢 Default order 3 (Delivered) inserted for Admin User.');
        }
      }
    }
  } catch (err) {
    console.error('❌ Error inserting default data:', err.message);
  }
};


// 🔐 JWT Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user; // Attach user payload (id, email, role) to request
    next();
  });
};

// Middleware to check if user has 'superadmin' role
const authorizeSuperadmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next(); // User is superadmin, proceed
  } else {
    res.status(403).json({ error: 'Forbidden: Requires superadmin privileges' });
  }
};

// --- Authentication Routes ---

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
    // Default role for new signups is 'user'
    const result = await query(
      'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
      [name, email, hashedPassword, 'user']
    );

    res.status(201).json({ message: 'User created successfully', userId: result.insertId });
  } catch (err) {
    console.error('Signup error:', err);
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

    // Include user id, email, and role in JWT payload
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role, // Ensure role is sent to frontend
      },
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// --- Product Endpoints ---

// ✅ Get Products with Filter/Sort/Search (public route)
app.get('/products', async (req, res) => {
  try {
    const { category, sort, search } = req.query;
    let baseQuery = 'SELECT * FROM products';
    const params = [];
    const conditions = [];

    if (category && category !== 'All') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search && search.trim()) {
      conditions.push('(name LIKE ? OR description LIKE ? OR tagline LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    if (sort === 'lowToHigh') {
      baseQuery += ' ORDER BY price ASC';
    } else if (sort === 'highToLow') {
      baseQuery += ' ORDER BY price DESC';
    } else {
      baseQuery += ' ORDER BY id ASC'; // Default sort
    }

    const products = await query(baseQuery, params);
    res.json(products);
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get products by array of IDs (for wishlist and cart item details)
app.get('/products/by-ids', authenticateToken, async (req, res) => { // Added authenticateToken as this is often user-specific
  try {
    let ids = req.query.ids;
    if (!ids) return res.json([]);

    // Ensure ids is an array of numbers
    if (typeof ids === 'string') {
      ids = ids.split(',').map(id => Number(id)).filter(id => !isNaN(id));
    }
    if (!Array.isArray(ids) || ids.length === 0) return res.json([]);

    const placeholders = ids.map(() => '?').join(',');
    const products = await query(`SELECT * FROM products WHERE id IN (${placeholders})`, ids);
    res.json(products);
  } catch (err) {
    console.error('Get products by IDs error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all unique categories (public route)
app.get('/categories', async (req, res) => {
  try {
    const categories = await query('SELECT DISTINCT category FROM products ORDER BY category ASC');
    res.json(categories.map(row => row.category)); // Return as array of strings
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Add Product (Admin/Superadmin only)
app.post('/products', authenticateToken, authorizeSuperadmin, async (req, res) => {
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
    res.status(201).json({ message: 'Product added successfully', id: result.insertId });
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Edit Product (Admin/Superadmin only)
app.put('/products/:id', authenticateToken, authorizeSuperadmin, async (req, res) => {
  const { id } = req.params;
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
      'UPDATE products SET name = ?, tagline = ?, description = ?, image = ?, category = ?, price = ? WHERE id = ?',
      [name, tagline, description, image, category, price, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error('Edit product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Delete Product (Admin/Superadmin only)
app.delete('/products/:id', authenticateToken, authorizeSuperadmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Wishlist Endpoints ---

// 🔐 Get user's wishlist (returns array of product objects)
app.get('/wishlist', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await query('SELECT product_id FROM wishlist WHERE user_id = ?', [userId]);
    if (!rows.length) return res.json([]);

    const ids = rows.map(r => r.product_id);
    const placeholders = ids.map(() => '?').join(',');
    const products = await query(`SELECT * FROM products WHERE id IN (${placeholders})`, ids);

    // Format for frontend compatibility (id, name, image, price, etc)
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
    console.error('Get wishlist error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Add product(s) to wishlist (accepts single or array of productIds)
app.post('/wishlist', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let { productId } = req.body; // productId can be a single ID or an array of IDs

    if (!productId) {
      return res.status(400).json({ error: 'Product ID required' });
    }
    if (!Array.isArray(productId)) {
      productId = [productId]; // Ensure it's an array for consistent processing
    }

    let addedCount = 0;
    for (const pid of productId) {
      // Check if product exists before adding to wishlist
      const productExists = await query('SELECT id FROM products WHERE id = ?', [pid]);
      if (productExists.length === 0) {
        console.warn(`Product with ID ${pid} not found, skipping wishlist addition.`);
        continue; // Skip if product doesn't exist
      }

      const existsInWishlist = await query('SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, pid]);
      if (existsInWishlist.length === 0) { // Only add if not already in wishlist
        await query('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [userId, pid]);
        addedCount++;
      }
    }
    res.json({ message: `Added ${addedCount} product(s) to wishlist` });
  } catch (err) {
    console.error('Add to wishlist error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Remove product(s) from wishlist (accepts single or array of productIds)
app.delete('/wishlist/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let productIds = req.params.id; // Can be a single ID or comma-separated IDs

    if (typeof productIds === 'string') {
      productIds = productIds.split(',').map(id => Number(id)).filter(id => !isNaN(id));
    } else {
      productIds = [Number(productIds)].filter(id => !isNaN(id)); // Ensure it's an array of numbers
    }

    if (productIds.length === 0) {
      return res.status(400).json({ error: 'Valid Product ID(s) required' });
    }

    let removedCount = 0;
    for (const pid of productIds) {
      const result = await query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, pid]);
      if (result.affectedRows > 0) {
        removedCount++;
      }
    }
    res.json({ message: `Removed ${removedCount} product(s) from wishlist` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Order Endpoints ---

// 🔐 Create a new order
app.post('/orders', authenticateToken, async (req, res) => {
  // items should be an array of { productId, name, image, price, qty }
  const { items, shippedTo } = req.body;
  const userId = req.user.id;

  if (!items || !Array.isArray(items) || items.length === 0 || !shippedTo || !shippedTo.trim()) {
    return res.status(400).json({ error: 'Order items and shipping address are required' });
  }

  let connection;
  try {
    connection = db;
    await query('START TRANSACTION'); // Start transaction

    let totalAmount = 0;
    for (const item of items) {
      // Basic validation for order item structure
      if (!item.productId || !item.name || item.price === undefined || item.qty === undefined || item.qty <= 0) {
        throw new Error('Invalid order item structure or quantity.');
      }
      totalAmount += parseFloat(item.price) * parseInt(item.qty);
    }

    const orderDate = new Date();
    // Set delivery date 3-7 days from order date for a more realistic range
    const deliveryDate = new Date();
    deliveryDate.setDate(orderDate.getDate() + Math.floor(Math.random() * 5) + 3); // Random between 3 and 7 days

    // Insert into orders table
    const orderResult = await query(
      'INSERT INTO orders (user_id, order_date, delivery_date, total_amount, shipped_to, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, orderDate, deliveryDate.toISOString().split('T')[0], totalAmount.toFixed(2), shippedTo, 'Processing']
    );
    const orderId = orderResult.insertId;

    // Insert into order_items table for each item in the order
    for (const item of items) {
      await query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, product_name_at_purchase, product_image_at_purchase) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.productId, item.qty, parseFloat(item.price).toFixed(2), item.name, item.image]
      );
    }

    await query('COMMIT'); // Commit the transaction
    res.status(201).json({ message: 'Order created successfully', orderId });
  } catch (err) {
    if (connection) {
      await query('ROLLBACK'); // Rollback on error
    }
    console.error('Create order error:', err);
    res.status(500).json({ error: err.message || 'Failed to create order. Please try again.' });
  }
});

// 🔐 Get all orders for the authenticated user
app.get('/orders', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const orders = await query('SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC', [userId]);

    // Fetch items for each order and format dates
    for (const order of orders) {
      const items = await query(
        'SELECT product_id, quantity, price_at_purchase AS price, product_name_at_purchase AS name, product_image_at_purchase AS image, order_id FROM order_items WHERE order_id = ?',
        [order.id]
      );
      order.items = items;
      // Format dates for consistency with frontend mock data
      order.orderDate = new Date(order.order_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      order.deliveryDate = order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null; // Use null if no delivery date
      order.total = parseFloat(order.total_amount); // Ensure total is a number
      // Clean up backend-specific fields
      delete order.order_date;
      delete order.total_amount;
      delete order.user_id;
    }
    res.json(orders);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Get a specific order by ID for the authenticated user
app.get('/orders/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const orders = await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, userId]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found or you do not have permission to view it' });
    }
    const order = orders[0];

    const items = await query(
      'SELECT product_id, quantity, price_at_purchase AS price, product_name_at_purchase AS name, product_image_at_purchase AS image FROM order_items WHERE order_id = ?',
      [order.id]
    );
    order.items = items;
    // Format dates
    order.orderDate = new Date(order.order_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    order.deliveryDate = order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
    order.total = parseFloat(order.total_amount);
    // Clean up backend-specific fields
    delete order.order_date;
    delete order.total_amount;
    delete order.user_id;

    res.json(order);
  } catch (err) {
    console.error('Get single order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Update order status (Admin/Superadmin only)
app.put('/orders/:id/status', authenticateToken, authorizeSuperadmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || typeof status !== 'string' || status.trim() === '') {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  // Optional: Validate status against a predefined list (e.g., ['Processing', 'Shipped', 'Delivered', 'Cancelled'])
  const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const result = await query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order status updated successfully' });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- User Address Endpoints ---

// 🔐 Get user's primary shipping address (used by Dashboard and OrderPage)
app.get('/user/address', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    // Try to find the default address first
    let addresses = await query('SELECT * FROM user_addresses WHERE user_id = ? AND is_default = TRUE LIMIT 1', [userId]);

    // If no default, get any address
    if (addresses.length === 0) {
      addresses = await query('SELECT * FROM user_addresses WHERE user_id = ? LIMIT 1', [userId]);
    }

    if (addresses.length === 0) {
      return res.status(200).json({ address: null, message: 'No primary address found for this user.' });
    }

    const primaryAddress = addresses[0];
    // Format the address into a single string as expected by the frontend
    const formattedAddress = `${primaryAddress.address_line1}${primaryAddress.address_line2 ? ', ' + primaryAddress.address_line2 : ''}, ${primaryAddress.city}, ${primaryAddress.state} - ${primaryAddress.zip_code}, ${primaryAddress.country}`;

    res.json({ address: formattedAddress });
  } catch (err) {
    console.error('Get user address error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch user address.' });
  }
});

// 🔐 Get all addresses for the authenticated user
app.get('/user/addresses', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const addresses = await query('SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [userId]);
    // Ensure is_default is boolean for frontend
    const formattedAddresses = addresses.map(addr => ({
      ...addr,
      is_default: Boolean(addr.is_default) // Convert tinyint(1) to boolean
    }));
    res.json(formattedAddresses);
  } catch (err) {
    console.error('Get all user addresses error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch all user addresses.' });
  }
});

// 🔐 Add a new address for the user
app.post('/user/address', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { address_line1, address_line2, city, state, zip_code, country, is_default } = req.body;

  if (!address_line1 || !city || !state || !zip_code || !country) {
    return res.status(400).json({ error: 'Required address fields missing: address_line1, city, state, zip_code, country' });
  }

  let connection;
  try {
    connection = db;
    await query('START TRANSACTION');

    // If the new address is set as default, unset existing defaults for this user
    if (is_default) {
      await query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND is_default = TRUE', [userId]);
    }

    const result = await query(
      'INSERT INTO user_addresses (user_id, address_line1, address_line2, city, state, zip_code, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, address_line1, address_line2 || null, city, state, zip_code, country, is_default || false] // Use null for optional address_line2 if empty
    );

    await query('COMMIT');
    res.status(201).json({ message: 'Address added successfully', id: result.insertId });
  } catch (err) {
    if (connection) {
      await query('ROLLBACK');
    }
    console.error('Add user address error:', err);
    res.status(500).json({ error: err.message || 'Failed to add address.' });
  }
});

// 🔐 Update an existing address for the user
app.put('/user/address/:id', authenticateToken, async (req, res) => {
  const { id } = req.params; // Address ID
  const userId = req.user.id;
  const { address_line1, address_line2, city, state, zip_code, country, is_default } = req.body;

  if (!address_line1 || !city || !state || !zip_code || !country) {
    return res.status(400).json({ error: 'Required address fields missing: address_line1, city, state, zip_code, country' });
  }

  let connection;
  try {
    connection = db;
    await query('START TRANSACTION');

    // If the updated address is set as default, unset existing defaults for this user
    if (is_default) {
      await query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND is_default = TRUE', [userId]);
    }

    const result = await query(
      `UPDATE user_addresses SET
        address_line1 = ?,
        address_line2 = ?,
        city = ?,
        state = ?,
        zip_code = ?,
        country = ?,
        is_default = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?`,
      [address_line1, address_line2 || null, city, state, zip_code, country, is_default || false, id, userId]
    );

    if (result.affectedRows === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'Address not found or not owned by user.' });
    }

    await query('COMMIT');
    res.json({ message: 'Address updated successfully' });
  } catch (err) {
    if (connection) {
      await query('ROLLBACK');
    }
    console.error('Update user address error:', err);
    res.status(500).json({ error: err.message || 'Failed to update address.' });
  }
});

// 🔐 Delete an address for the user
app.delete('/user/address/:id', authenticateToken, async (req, res) => {
  const { id } = req.params; // Address ID
  const userId = req.user.id;

  let connection;
  try {
    connection = db;
    await query('START TRANSACTION');

    // Check if the address to be deleted is the last one and it's default
    const existingAddresses = await query('SELECT id, is_default FROM user_addresses WHERE user_id = ?', [userId]);
    const addressToDelete = existingAddresses.find(addr => addr.id === Number(id));

    if (addressToDelete && addressToDelete.is_default && existingAddresses.length > 1) {
      // If deleting the default address and there are other addresses, promote another one
      const otherAddresses = existingAddresses.filter(addr => addr.id !== Number(id));
      if (otherAddresses.length > 0) {
        // Set the first non-deleted address as default
        await query('UPDATE user_addresses SET is_default = TRUE WHERE id = ?', [otherAddresses[0].id]);
      }
    } else if (addressToDelete && addressToDelete.is_default && existingAddresses.length === 1) {
        // If it's the only address and it's default, it's okay to delete, no new default needed
    }


    const result = await query('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [id, userId]);

    if (result.affectedRows === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'Address not found or not owned by user.' });
    }

    await query('COMMIT');
    res.json({ message: 'Address deleted successfully' });
  } catch (err) {
    if (connection) {
      await query('ROLLBACK');
    }
    console.error('Delete user address error:', err);
    res.status(500).json({ error: err.message || 'Failed to delete address.' });
  }
});

// 🔐 Set an address as default for the user
app.put('/user/address/:id/set-default', authenticateToken, async (req, res) => {
  const { id } = req.params; // Address ID to set as default
  const userId = req.user.id;

  let connection;
  try {
    connection = db;
    await query('START TRANSACTION');

    // 1. Unset current default for this user
    await query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND is_default = TRUE', [userId]);

    // 2. Set the specified address as default
    const result = await query('UPDATE user_addresses SET is_default = TRUE WHERE id = ? AND user_id = ?', [id, userId]);

    if (result.affectedRows === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'Address not found or not owned by user.' });
    }

    await query('COMMIT');
    res.json({ message: 'Address set as default successfully' });
  } catch (err) {
    if (connection) {
      await query('ROLLBACK');
    }
    console.error('Set default address error:', err);
    res.status(500).json({ error: err.message || 'Failed to set default address.' });
  }
});


// --- Health Check ---
app.get('/', (req, res) => {
  res.send('API is working 🎉');
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
