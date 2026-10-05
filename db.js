const mongoose = require('mongoose');
require('dotenv').config();

// Luồng kết nối Chỉ Đọc (Read-Only)
const readConn = mongoose.createConnection(process.env.MONGO_READ_URI);
readConn.on('connected', () => console.log('Connected to MongoDB via Read-Only User'));

// Luồng kết nối Ghi (Write)
const writeConn = mongoose.createConnection(process.env.MONGO_WRITE_URI);
writeConn.on('connected', () => console.log('Connected to MongoDB via Write User'));

// Định nghĩa Schema Sách
const BookSchema = new mongoose.Schema({
  productCode: { type: String, required: true },
  title: { type: String, required: true },
  originalPrice: { type: Number, required: true },
  finalPrice: { type: Number, required: true },
  vatRate: { type: Number, required: true }
});

const BookReadModel = readConn.model('Book', BookSchema);
const BookWriteModel = writeConn.model('Book', BookSchema);

module.exports = { BookReadModel, BookWriteModel, writeConn };