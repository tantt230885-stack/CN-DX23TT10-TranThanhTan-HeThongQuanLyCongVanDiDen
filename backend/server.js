require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/categories', require('./src/routes/categories'));
app.use('/api/departments', require('./src/routes/departments'));
app.use('/api/documents', require('./src/routes/documents'));
app.use('/api/reports', require('./src/routes/reports'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  if (err && (err.message === 'Chỉ hỗ trợ file PDF' || err.code === 'LIMIT_FILE_SIZE')) {
    return res.status(400).json({
      message: err.code === 'LIMIT_FILE_SIZE' ? 'File vượt quá 10MB' : err.message
    });
  }
  next(err);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Lỗi server' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
