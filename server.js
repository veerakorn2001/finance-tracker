const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure backend directory exists
const backendDir = path.join(__dirname, 'backend');
if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir);
}

// SQLite setup
const dbPath = path.join(backendDir, 'finance.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL
    )`);
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: Get all transactions
app.get('/api/transactions', (req, res) => {
    db.all('SELECT * FROM transactions ORDER BY date DESC, id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Add transaction
app.post('/api/transactions', (req, res) => {
    const { description, amount, type, category, date, status } = req.body;
    db.run(
        'INSERT INTO transactions (description, amount, type, category, date, status) VALUES (?, ?, ?, ?, ?, ?)',
        [description, amount, type, category, date, status],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// API: Delete transaction
app.delete('/api/transactions/:id', (req, res) => {
    db.run('DELETE FROM transactions WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// API: Get report summary
app.get('/api/report', (req, res) => {
    db.all('SELECT * FROM transactions', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const income = rows.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = rows.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expense;
        res.json({
            totalIncome: income,
            totalExpense: expense,
            balance,
            count: rows.length,
            transactions: rows
        });
    });
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 