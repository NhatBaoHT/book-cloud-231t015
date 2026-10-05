const path = require('path');
const express = require('express');
const { engine } = require('express-handlebars');
const session = require('express-session');
const connectMongo = require('connect-mongo');
const MongoStore = connectMongo.default || connectMongo;
const { BookReadModel, BookWriteModel } = require('./src/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình View Engine Handlebars
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware phân tích dữ liệu form
app.use(express.urlencoded({ extended: true }));

// Stateless Session: Lưu trực tiếp trên MongoDB Atlas qua luồng Write
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret231T015',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_WRITE_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Route trang chủ hiển thị danh sách (Dùng kết nối Chỉ Đọc)
app.get('/', async (req, res) => {
  try {
    const books = await BookReadModel.find().lean();
    res.render('index', { 
      books, 
      error: req.session.error, 
      success: req.session.success 
    });
    // Xóa flash message sau khi render
    req.session.error = null;
    req.session.success = null;
  } catch (err) {
    res.status(500).send("Lỗi đọc dữ liệu: " + err.message);
  }
});

// Route thêm sách mới (Dùng kết nối Ghi)
app.post('/books/add', async (req, res) => {
  const { productCode, title, price } = req.body;
  const numPrice = Number(price);

  // 1. Kiểm tra tiền tố mã sản phẩm (Bắt buộc bắt đầu bằng '015')
  if (!productCode || !productCode.startsWith('015')) {
    req.session.error = "Lỗi bảo mật: Mã sản phẩm bắt buộc phải có tiền tố là 015!";
    return res.redirect('/');
  }

  // 2. Thuế suất động: VAT = (Chữ số cuối MSSV (5) + 5)% = 10%
  const vatRate = 5 + 5; 
  const finalPrice = numPrice + (numPrice * (vatRate / 100));

  try {
    await BookWriteModel.create({
      productCode,
      title,
      originalPrice: numPrice,
      finalPrice,
      vatRate
    });

    req.session.success = "Thêm sách thành công!";
    res.redirect('/');
  } catch (err) {
    req.session.error = "Lỗi ghi dữ liệu: " + err.message;
    res.redirect('/');
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});