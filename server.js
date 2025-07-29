const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_deutDa34oNlI@ep-shy-sky-admh28ff-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Initialize database tables
async function initializeDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                is_premium BOOLEAN DEFAULT FALSE,
                premium_requested BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS movies (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                google_drive_url VARCHAR(500) NOT NULL,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS vouchers (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                is_used BOOLEAN DEFAULT FALSE,
                used_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                used_at TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                message TEXT NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_balances (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) UNIQUE,
                balance DECIMAL(10,2) DEFAULT 0.00,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Initialize database on startup
initializeDatabase();

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// User registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );

        // Create user balance record
        await pool.query(
            'INSERT INTO user_balances (user_id) VALUES ($1)',
            [result.rows[0].id]
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_premium: user.is_premium
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin login
app.post('/api/admin-login', async (req, res) => {
    try {
        const { code } = req.body;

        if (code !== '011090') {
            return res.status(401).json({ error: 'Invalid admin code' });
        }

        // Generate admin token
        const token = jwt.sign(
            { userId: 0, username: 'admin', isAdmin: true },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Admin login successful',
            token,
            user: {
                id: 0,
                username: 'admin',
                isAdmin: true
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        if (req.user.isAdmin) {
            return res.json({
                id: 0,
                username: 'admin',
                isAdmin: true
            });
        }

        const result = await pool.query(
            'SELECT u.*, ub.balance FROM users u LEFT JOIN user_balances ub ON u.id = ub.user_id WHERE u.id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            is_premium: user.is_premium,
            premium_requested: user.premium_requested,
            balance: user.balance || 0
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Request premium
app.post('/api/request-premium', authenticateToken, async (req, res) => {
    try {
        if (req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin cannot request premium' });
        }

        await pool.query(
            'UPDATE users SET premium_requested = TRUE WHERE id = $1',
            [req.user.userId]
        );

        res.json({ message: 'Premium request submitted successfully' });
    } catch (error) {
        console.error('Premium request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin routes

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const result = await pool.query(
            'SELECT u.*, ub.balance FROM users u LEFT JOIN user_balances ub ON u.id = ub.user_id ORDER BY u.created_at DESC'
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Approve premium request (admin only)
app.post('/api/admin/approve-premium/:userId', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        await pool.query(
            'UPDATE users SET is_premium = TRUE, premium_requested = FALSE WHERE id = $1',
            [req.params.userId]
        );

        res.json({ message: 'Premium status approved successfully' });
    } catch (error) {
        console.error('Approve premium error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add movie (admin only)
app.post('/api/admin/movies', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { title, description, googleDriveUrl, category = 'umum' } = req.body;

        if (!title || !googleDriveUrl) {
            return res.status(400).json({ error: 'Title and Google Drive URL are required' });
        }

        const result = await pool.query(
            'INSERT INTO movies (title, description, google_drive_url, category, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, googleDriveUrl, category, null]
        );

        res.status(201).json({
            message: 'Movie added successfully',
            movie: result.rows[0]
        });
    } catch (error) {
        console.error('Add movie error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get movies with category filter
app.get('/api/movies', authenticateToken, async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT * FROM movies';
        let params = [];
        
        if (category && category !== 'all') {
            query += ' WHERE category = $1';
            params.push(category);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error('Get movies error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create voucher (admin only)
app.post('/api/admin/vouchers', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { code, amount } = req.body;

        if (!code || !amount) {
            return res.status(400).json({ error: 'Code and amount are required' });
        }

        const result = await pool.query(
            'INSERT INTO vouchers (code, amount) VALUES ($1, $2) RETURNING *',
            [code, amount]
        );

        res.status(201).json({
            message: 'Voucher created successfully',
            voucher: result.rows[0]
        });
    } catch (error) {
        console.error('Create voucher error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Redeem voucher
app.post('/api/redeem-voucher', authenticateToken, async (req, res) => {
    try {
        if (req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin cannot redeem vouchers' });
        }

        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Voucher code is required' });
        }

        // Check if voucher exists and is not used
        const voucherResult = await pool.query(
            'SELECT * FROM vouchers WHERE code = $1 AND is_used = FALSE',
            [code]
        );

        if (voucherResult.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid or already used voucher code' });
        }

        const voucher = voucherResult.rows[0];

        // Update voucher as used
        await pool.query(
            'UPDATE vouchers SET is_used = TRUE, used_by = $1, used_at = CURRENT_TIMESTAMP WHERE id = $2',
            [req.user.userId, voucher.id]
        );

        // Update user balance
        await pool.query(
            'UPDATE user_balances SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
            [voucher.amount, req.user.userId]
        );

        res.json({
            message: 'Voucher redeemed successfully',
            amount: voucher.amount
        });
    } catch (error) {
        console.error('Redeem voucher error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Chat messages
app.get('/api/chat', authenticateToken, async (req, res) => {
    try {
        let query, params;

        if (req.user.isAdmin) {
            // Admin can see all messages
            query = `
                SELECT cm.*, u.username 
                FROM chat_messages cm 
                LEFT JOIN users u ON cm.user_id = u.id 
                ORDER BY cm.created_at ASC
            `;
            params = [];
        } else {
            // Users can only see their own messages and admin responses
            query = `
                SELECT cm.*, u.username 
                FROM chat_messages cm 
                LEFT JOIN users u ON cm.user_id = u.id 
                WHERE cm.user_id = $1 OR cm.is_admin = TRUE 
                ORDER BY cm.created_at ASC
            `;
            params = [req.user.userId];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get chat messages error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send chat message
app.post('/api/chat', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const result = await pool.query(
            'INSERT INTO chat_messages (user_id, message, is_admin) VALUES ($1, $2, $3) RETURNING *',
            [req.user.isAdmin ? null : req.user.userId, message, req.user.isAdmin]
        );

        res.status(201).json({
            message: 'Message sent successfully',
            chatMessage: result.rows[0]
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Top up balance
app.post('/api/topup', authenticateToken, async (req, res) => {
    try {
        if (req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin cannot top up balance' });
        }

        const { amount } = req.body;

        if (!amount || amount < 5000 || amount > 1000000) {
            return res.status(400).json({ error: 'Invalid top up amount (min: 5000, max: 1000000)' });
        }

        // Insert or update user balance
        await pool.query(`
            INSERT INTO user_balances (user_id, balance, updated_at) 
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) 
            DO UPDATE SET balance = user_balances.balance + $2, updated_at = CURRENT_TIMESTAMP
        `, [req.user.userId, amount]);

        // Get new balance
        const balanceResult = await pool.query(
            'SELECT balance FROM user_balances WHERE user_id = $1',
            [req.user.userId]
        );

        const newBalance = balanceResult.rows[0].balance;

        res.json({
            message: 'Top up successful',
            amount: amount,
            newBalance: newBalance
        });
    } catch (error) {
        console.error('Top up error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
