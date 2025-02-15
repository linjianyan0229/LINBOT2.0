# linBot2.0 使用指南

### 🤖 开发者：linjianyan0229 | 🛠️ 基于 NapCatQQ 框架开发

---

## 🛠️ 环境准备
1. **操作系统**：仅支持 Windows 系统
2. **运行环境**：
   - 安装 [Node.js v20.17 或更高版本](https://nodejs.org/)
   - 安装 PM2 进程管理工具：`npm install pm2 -g`

---

## 🚀 快速启动（分步图解）

### 步骤 1️⃣：部署 NapCatQQ 框架
1. 访问 [NapCatQQ 官方仓库](https://github.com/NapNeko/NapCatQQ)
2. 下载最新 Release 压缩包并解压
3. 按官方文档完成 QQ 机器人账号登录

### 步骤 2️⃣：配置 WebSocket 通信
1. 访问 NapCatQQ 的 Web UI（默认地址：`http://localhost:5500`）
2. 进入 `网络配置` → 点击 `新建`
3. 选择 `WebSocket 客户端` 类型 → 保持默认端口 `8080`
4. **重要**：开启 `启用` 开关 → 完成创建

### 步骤 3️⃣：部署 linBot2.0 项目
1. [下载项目压缩包](https://github.com/linjianyan0229/linBot2.0)
2. 解压后用 VSCode 打开项目文件夹
3. **打开两个终端窗口**：
   - 终端1（主目录）：用于后端服务
   - 终端2：执行 `cd ./web-admin/` 进入前端目录

### 步骤 4️⃣：安装依赖
```bash
# 在两个终端中分别执行（约需 2-5 分钟）
npm install
```

### 步骤 5️⃣：启动服务
```bash
# 后端服务（终端1）
npm i -g pm2
pm2 start ecosystem.config.js

# 前端服务（终端2）
npm run dev
```

### 步骤 6️⃣：访问控制台
1. 前端地址：终端2输出的 `Local: http://localhost:5173/`
2. 实时日志查看：`pm2 logs qq-bot`

---

## ⚙️ 核心配置说明

### 🔑 Deepseek AI 配置（可选）
1. 访问 [Deepseek 开放平台](https://api-docs.deepseek.com/zh-cn/) 申请 API Key
2. 修改 `plugins/config.js` 中的 `apiKey` 字段

### 👮 管理员配置（必须）
```javascript
// 修改 plugins/config.js
module.exports = {
  adminQQ: ["你的QQ号"] // 可配置多个管理员
}
```

---

## 📜 常用 PM2 指令速查
| 指令 | 功能描述 |
|------|----------|
| `pm2 start ecosystem.config.js` | 启动服务 |
| `pm2 stop qq-bot` | 停止服务 |
| `pm2 restart qq-bot` | 重启服务 |
| `pm2 logs qq-bot` | 查看实时日志 |

---

## ⚠️ 注意事项
1. **账号安全**：QQ 机器人账号可能触发社交限制，建议使用小号部署
2. **端口冲突**：WebSocket 默认使用 8080 端口，若修改需同步调整代码
3. **稳定运行**：请始终通过 PM2 管理进程，避免直接关闭终端窗口
4. **版本兼容**：Node.js 必须 ≥v20.17，低版本会导致运行异常

---

## 🆘 常见问题
❓ **无法连接 WebSocket**  
✅ 检查 NapCatQQ 的 WebSocket 服务是否启用  
✅ 确认 linBot 配置端口与 NapCat 一致  

❓ **插件权限不足**  
✅ 检查 `adminQQ` 配置是否包含当前操作 QQ 号  

❓ **AI 功能无响应**  
✅ 确认已正确配置 Deepseek API Key  
✅ 检查网络是否能访问海外 API 接口

---

> 💡 提示：本系统采用前后端分离架构，建议使用 Chrome 最新版浏览器访问控制台
