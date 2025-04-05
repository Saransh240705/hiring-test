const express=require('express');
const cors=require('cors');
const dotenv=require('dotenv');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const sqlite3=require('sqlite3').verbose();
const { open }=require('sqlite');

dotenv.config();

const app=express();
app.use(cors());
app.use(express.json());

let db;
const initializeDatabase=async () => {
    db=await open({
        filename: __dirname+'/database.sqlite',
        driver: sqlite3.Database
    });


    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      completed BOOLEAN DEFAULT 0,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      todo_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (todo_id) REFERENCES todos (id)
    );
  `);

    console.log('Database initialized');
};

const authenticateToken=(req, res, next) => {
    const authHeader=req.headers['authorization'];
    const token=authHeader&&authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
        const verified=jwt.verify(token, process.env.JWT_SECRET);
        req.user=verified;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password }=req.body;


        const existingUser=await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }


        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password, salt);


        const result=await db.run(
            'INSERT INTO users (email, password) VALUES (?, ?)',
            [email, hashedPassword]
        );

        const userId=result.lastID;
        const newUser={ id: userId, email };


        const token=jwt.sign({ id: userId }, process.env.JWT_SECRET);
        res.status(201).json({ token, user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password }=req.body;


        const user=await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }


        const validPassword=await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }


        const token=jwt.sign({ id: user.id }, process.env.JWT_SECRET);
        res.status(200).json({ token, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/todos', authenticateToken, async (req, res) => {
    try {
        const todos=await db.all('SELECT * FROM todos WHERE user_id = ?', [req.user.id]);
        res.status(200).json(todos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/todos', authenticateToken, async (req, res) => {
    try {
        const { title, description }=req.body;
        const newTodo={
            title,
            description,
            completed: 0,
            user_id: req.user.id
        };

        const result=await db.run(
            `INSERT INTO todos (title, description, completed, user_id)
       VALUES (?, ?, ?, ?)`,
            [newTodo.title, newTodo.description, newTodo.completed, newTodo.user_id]
        );

        const todoId=result.lastID;
        
        // Add audit log for todo creation
        await db.run(
            `INSERT INTO audit_logs (user_id, todo_id, action, details)
             VALUES (?, ?, ?, ?)`,
            [req.user.id, todoId, 'CREATE', JSON.stringify({ title, description })]
        );

        const createdTodo=await db.get('SELECT * FROM todos WHERE id = ?', [todoId]);

        res.status(201).json(createdTodo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/todos/:id', authenticateToken, async (req, res) => {
    try {
        const { id }=req.params;
        const { title, description, completed }=req.body;

        const currentTodo=await db.get(
            'SELECT * FROM todos WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (!currentTodo) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        const updatedTodo={
            title: title!==undefined? title:currentTodo.title,
            description: description!==undefined? description:currentTodo.description,
            completed: completed!==undefined? (completed? 1:0):currentTodo.completed
        };

        // Track changes for audit log
        const changes = {};
        if (title !== undefined && title !== currentTodo.title) changes.title = { from: currentTodo.title, to: title };
        if (description !== undefined && description !== currentTodo.description) changes.description = { from: currentTodo.description, to: description };
        if (completed !== undefined && completed !== currentTodo.completed) changes.completed = { from: currentTodo.completed, to: completed };

        await db.run(
            `UPDATE todos SET title = ?, description = ?, completed = ?
       WHERE id = ? AND user_id = ?`,
            [updatedTodo.title, updatedTodo.description, updatedTodo.completed, id, req.user.id]
        );

        // Add audit log for todo update
        if (Object.keys(changes).length > 0) {
            await db.run(
                `INSERT INTO audit_logs (user_id, todo_id, action, details)
                 VALUES (?, ?, ?, ?)`,
                [req.user.id, id, 'UPDATE', JSON.stringify(changes)]
            );
        }

        const result=await db.get('SELECT * FROM todos WHERE id = ?', [id]);

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/todos/:id', authenticateToken, async (req, res) => {
    try {
        const { id }=req.params;

        const currentTodo=await db.get(
            'SELECT * FROM todos WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (!currentTodo) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        // Add audit log for todo deletion
        await db.run(
            `INSERT INTO audit_logs (user_id, todo_id, action, details)
             VALUES (?, ?, ?, ?)`,
            [req.user.id, id, 'DELETE', JSON.stringify({ title: currentTodo.title })]
        );

        await db.run(
            'DELETE FROM todos WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        res.status(200).json({ message: 'Todo deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add new endpoint to fetch audit logs
app.get('/api/audit-logs', authenticateToken, async (req, res) => {
    try {
        const logs = await db.all(
            `SELECT al.*, t.title as todo_title 
             FROM audit_logs al 
             LEFT JOIN todos t ON al.todo_id = t.id 
             WHERE al.user_id = ? 
             ORDER BY al.created_at DESC`,
            [req.user.id]
        );
        res.status(200).json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

const PORT=process.env.PORT||5000;
const startServer=async () => {
    await initializeDatabase();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});