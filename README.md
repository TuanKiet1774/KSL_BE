# KSL_BE - Backend API

## 📋 Mô Tả Dự Án

**KSL_BE** là một backend API được xây dựng với **Node.js** và **Express**, cung cấp các dịch vụ toàn diện cho nền tảng học tập trực tuyến. Dự án hỗ trợ quản lý người dùng, học từ vựng, làm bài kiểm tra, theo dõi tiến độ học tập và thống kê hiệu suất.

## ✨ Tính Năng Chính

- 🔐 **Xác thực & Bảo mật**: JWT Token, mã hóa mật khẩu với bcryptjs
- 👥 **Quản lý Người Dùng**: Đăng ký, đăng nhập, quản lý hồ sơ
- 📚 **Quản lý Chủ Đề & Câu Hỏi**: Tạo và quản lý chủ đề học tập và bài tập
- 📖 **Từ Vựng**: Thêm, chỉnh sửa, học từ với hình ảnh/video minh họa
- 📊 **Theo Dõi Tiến Độ**: Lưu trữ tiến độ học tập của người dùng
- 🎯 **Hệ Thống Bài Thi**: Tạo bài kiểm tra, lưu kết quả
- ⭐ **Từ Yêu Thích**: Lưu lại các từ vựng yêu thích
- ✅ **Từ Đã Học**: Theo dõi các từ đã hoàn thành
- 💬 **Phản Hồi**: Thu thập feedback từ người dùng
- 📈 **Thống Kê**: Phân tích dữ liệu học tập và hiệu suất

## 🛠 Công Nghệ Sử Dụng

| Công Nghệ                  | Phiên Bản | Mục Đích                      |
| -------------------------- | --------- | ----------------------------- |
| **Node.js**                | -         | Runtime JavaScript            |
| **Express**                | ^4.22.1   | Web framework                 |
| **MongoDB**                | ^7.1.0    | Database NoSQL                |
| **Mongoose**               | ^9.2.1    | ODM MongoDB                   |
| **JWT**                    | ^9.0.3    | Xác thực Token                |
| **bcryptjs**               | ^3.0.3    | Mã hóa mật khẩu               |
| **Helmet**                 | ^8.1.0    | Bảo mật HTTP headers          |
| **CORS**                   | ^2.8.6    | Cross-Origin Requests         |
| **Dotenv**                 | ^17.3.1   | Quản lý environment variables |
| **Express Rate Limit**     | ^8.2.1    | Giới hạn requests             |
| **Express Mongo Sanitize** | ^2.2.0    | Chống NoSQL injection         |
| **Nodemon**                | ^3.1.14   | Dev: Auto restart             |

## 📁 Cấu Trúc Dự Án

```
KSL_BE/
├── src/
│   ├── app.js                 # Cấu hình Express
│   ├── config/
│   │   └── db.js             # Kết nối MongoDB
│   ├── models/               # Mongoose Schemas
│   │   ├── User.js
│   │   ├── Topic.js
│   │   ├── Question.js
│   │   ├── Word.js
│   │   ├── Exam.js
│   │   ├── ExamResult.js
│   │   ├── Progress.js
│   │   ├── LearnedWord.js
│   │   ├── FavoriteWord.js
│   │   ├── FeedBack.js
│   │   └── Stastic.js
│   ├── controllers/          # Business Logic
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── topic.controller.js
│   │   ├── question.controller.js
│   │   ├── word.controller.js
│   │   ├── progress.controller.js
│   │   ├── exam.controller.js
│   │   ├── learnedWord.controller.js
│   │   ├── favoriteWord.controller.js
│   │   ├── feedback.controller.js
│   │   ├── stastic.controller.js
│   │   └── user.controller.js
│   ├── routes/               # API Endpoints
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── topic.routes.js
│   │   ├── question.routes.js
│   │   ├── word.routes.js
│   │   ├── progress.routes.js
│   │   ├── exam.routes.js
│   │   ├── learnedWord.routes.js
│   │   ├── favoriteWord.routes.js
│   │   ├── feedback.routes.js
│   │   └── stastic.routes.js
│   ├── middleware/
│   │   └── authMiddleware.js # Xác thực JWT
│   └── utils/
│       ├── pagination.js     # Utility phân trang
│       └── stasticManager.js # Quản lý thống kê
├── server.js                 # Entry point
├── package.json
├── .env                      # Environment variables (local)
└── README.md
```

## 🚀 Bắt Đầu Nhanh

### Cài Đặt

1. **Clone repository:**

   ```bash
   git clone https://github.com/TuanKiet1774/KSL_BE.git
   cd KSL_BE
   ```

2. **Cài đặt dependencies:**

   ```bash
   npm install
   ```

3. **Tạo file `.env` tại thư mục gốc:**

   ```env
   # Server
   PORT=3000
   NODE_ENV=development

   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/ksl_db

   # JWT Secrets
   JWT_SECRET=your_jwt_secret_key_here
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
   JWT_EXPIRE=15m

   ```

4. **Khởi động server:**

   ```bash
   node server.js
   ```


## 📝 Quy Ước Code

- **Controllers**: Xử lý logic, trả về response
- **Models**: Định nghĩa schema MongoDB
- **Routes**: Định nghĩa endpoints
- **Middleware**: Xác thực, validation
- **Utils**: Hàm tiện ích

## 📚 Tham Khảo Thêm

- [Express Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT.io](https://jwt.io/)
- [MongoDB Documentation](https://docs.mongodb.com/)
