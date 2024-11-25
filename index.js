import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';

const app = express();
app.use(express.json());

mongoose.connect("mongodb+srv://antam823:XKmdpnJnGxLI00pk@web85.12gw8.mongodb.net/mern-app?retryWrites=true&w=majority")
.then(() => console.log("Kết nối MongoDB thành công!"))
.catch((err) => console.error("Kết nối MongoDB thất bại:", err));

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  apiKey: { type: String },
});

const postSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Post = mongoose.model("Post", postSchema);

const authenticate = async (req, res, next) => {
  const { apiKey } = req.query;

  if (!apiKey) {
    return res.status(401).json({ error: "apiKey là bắt buộc!" });
  }

  const user = await User.findOne({ apiKey });
  if (!user) {
    return res.status(403).json({ error: "apiKey không hợp lệ!" });
  }

  req.user = user;
  next();
};

// câu 1
app.post("/users/register", async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
      return res.status(400).json({ error: "userName, email và password là bắt buộc!" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email đã tồn tại!" });
    }

    const newUser = new User({ userName, email, password });
    await newUser.save();

    res.status(201).json({ message: "Đăng ký thành công!", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Có lỗi xảy ra. Vui lòng thử lại!" });
  }
});

// Câu 2
app.post("/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email và password là bắt buộc!" });
    }

    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ error: "Email hoặc password không đúng!" });
    }

    const randomString = crypto.randomUUID();
    const apiKey = `mern-${user._id}-${email}-${randomString}`;
    user.apiKey = apiKey;
    await user.save();

    res.status(200).json({ message: "Đăng nhập thành công!", apiKey });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Có lỗi xảy ra. Vui lòng thử lại!" });
  }
});

// Câu 3
app.post("/posts", authenticate, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content là bắt buộc!" });
    }

    const newPost = new Post({
      userId: req.user._id,
      content,
    });

    await newPost.save();

    res.status(201).json({ message: "Tạo bài post thành công!", post: newPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Có lỗi xảy ra. Vui lòng thử lại!" });
  }
});

// Câu 4
app.put("/posts/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content là bắt buộc để cập nhật bài post!" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Bài post không tồn tại!" });
    }

    if (post.userId !== req.user._id.toString()) {
      return res.status(403).json({ error: "Bạn không có quyền cập nhật bài post này!" });
    }

    post.content = content;
    post.updatedAt = new Date();
    await post.save();

    res.status(200).json({ message: "Cập nhật bài post thành công!", post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Có lỗi xảy ra. Vui lòng thử lại!" });
  }
});

// Chạy server
const PORT = 8081;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});