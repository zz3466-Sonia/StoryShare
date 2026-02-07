# 🎮 CROWDSTORY - 快速开始指南

## 📋 项目介绍
**CROWDSTORY** 是一个互动式科幻故事游戏，3-8个玩家一起参加，通过投票选择故事方向，由AI生成续集故事。

---

## 🚀 安装和启动（只需一次）

### 第1步：安装依赖
打开**一个**终端，运行：
```bash
cd /Users/siqijiang/aigame
npm install
cd frontend && npm install && cd ..
```

---

## 💻 如何运行（每次玩都要做）

### 选项A：一键启动（推荐）
创建一个 shell 脚本文件 `start.sh`：
```bash
#!/bin/bash
# 启动后端
cd /Users/siqijiang/aigame
node server.js &
BACKEND_PID=$!

# 启动前端
cd /Users/siqijiang/aigame/frontend
npx vite --port 5173

# 清理
kill $BACKEND_PID
```

使用方式：
```bash
chmod +x start.sh
./start.sh
```

### 选项B：手动两个终端（传统方式）
**终端1 - 启动后端服务器：**
```bash
cd /Users/siqijiang/aigame
node server.js
```
看到这条消息说明成功：
```
🚀 Server running on http://localhost:3000
📡 Party system ready!
🎨 Story engine: Gemini API
```

**终端2 - 启动前端网页：**
```bash
cd /Users/siqijiang/aigame/frontend
npx vite --port 5173
```
看到这条消息说明成功：
```
  ➜  Local:   http://localhost:5173/
```

---

## 🎯 如何玩

### 步骤1：打开网页
在浏览器中访问：**http://localhost:5173**

### 步骤2：主持人创建派对
- 输入你的名字
- 点击「CREATE PARTY」
- 记住房间码（比如：`ABC123`）

### 步骤3：其他玩家加入
- 其他玩家访问同一个网址（http://localhost:5173）
- 点击「JOIN PARTY」
- 输入房间码
- 输入他们的名字
- 点击「JOIN」

### 步骤4：主持人开始游戏
- 所有玩家加入后，主持人点击「START GAME」

### 步骤5：玩游戏
每一轮：
1. 看 AI 生成的故事
2. 选择 A、B、C 三个选项之一
3. 票数和计时器会实时显示
4. 30秒后自动进入下一轮（或主持人手动点击「NEXT ROUND」）
5. **玩5轮后游戏结束**

---

## 💡 游戏特色

✨ **AI 故事生成**
- 使用 Google Gemini API 生成独特故事
- 如果 API 不可用，自动使用预设故事
- 故事会根据你的选择继续发展

🎯 **实时投票**
- 所有玩家的选择实时显示票数
- 最后一轮的胜者会影响下一轮故事

⏱️ **自动计时**
- 每轮30秒倒计时
- 时间到自动推进
- 主持人可以手动推进

👥 **支持3-8个玩家**
- 最多8个人一个派对
- 派对自动清理（所有玩家离开后删除）

---

## 🔧 故障排除

### 问题：端口已被占用
```bash
# macOS 查看占用 3000 端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或者直接杀死所有 node 进程
pkill -f "node server.js"
```

### 问题：API 配额已用完
- 系统会自动降级到离线故事
- 游戏照样可以正常玩

### 问题：网页显示 404
- 确保前端服务器在运行（终端2）
- 刷新浏览器（⌘+R）
- 清除缓存后重新加载

---

## 📱 多设备玩法
如果想让不同电脑上的人玩：
1. 后端需要部署到云端（Render、Railway 等）
2. 或者使用 `ngrok` 暴露本地服务器

```bash
# 安装 ngrok
brew install ngrok

# 暴露 3000 端口
ngrok http 3000

# 复制生成的公网 URL 给别人
```

---

## 📊 项目结构
```
/Users/siqijiang/aigame/
├── server.js              # 后端主文件
├── state/                 # 派对状态管理
├── game/                  # 游戏逻辑（故事、投票）
├── .env                   # API 密钥配置
└── frontend/              # React 前端
    ├── src/
    │   ├── App.jsx       # 游戏界面
    │   └── App.css       # 样式
    └── vite.config.js    # Vite 配置
```

---

## 🎪 Hackathon 演示建议
1. 提前启动后端和前端
2. 准备 3-4 个设备/浏览器标签来演示多人
3. 有备用名字和房间码
4. 展示 AI 生成的故事质量
5. 强调实时投票和自动推进的流畅性

---

## 📞 快速帮助
- **后端不响应？** → 检查终端1是否运行 `node server.js`
- **网页打不开？** → 检查终端2是否运行 `npx vite`
- **API 失败？** → 正常，会自动用本地故事
- **玩家进不来？** → 检查房间码、确保他们在同一网络

祝你 Hackathon 演示成功！🚀
