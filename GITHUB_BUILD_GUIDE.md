# 车机投屏助手 · 上传 GitHub & 编译 APK 指南

> 本项目使用 **Expo EAS Build** 云端编译 Android APK，通过 GitHub Actions 自动触发。

---

## 前置准备

| 工具 | 说明 |
|------|------|
| [Git](https://git-scm.com/) | 代码版本管理 |
| [Expo 账号](https://expo.dev/signup) | 免费注册，EAS Build 每月30次免费额度 |
| GitHub 账号 | 存放代码仓库 |

---

## 第一步：获取 Expo Token

1. 登录 [expo.dev](https://expo.dev)
2. 点击右上角头像 → **Access Tokens**
3. 点击 **Create Token** → 命名为 `GITHUB_ACTIONS`
4. **复制 Token 值**（只显示一次！）

---

## 第二步：在 GitHub 仓库设置 Secret

1. 进入你的 GitHub 仓库页面
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 填写：
   - **Name**：`EXPO_TOKEN`
   - **Value**：粘贴第一步复制的 Expo Token
5. 点击 **Add secret**

---

## 第三步：上传代码到 GitHub

### 方法一：在本地执行（推荐）

```bash
# 1. 初始化 Git 仓库
git init
git add .
git commit -m "feat: 车机投屏助手初始化"

# 2. 在 GitHub 创建新仓库后，关联并推送
git remote add origin https://github.com/你的用户名/car-screen-cast.git
git branch -M main
git push -u origin main
```

### 方法二：GitHub 网页上传

1. 在 GitHub 创建新仓库（不要初始化 README）
2. 将项目文件夹打包为 ZIP
3. 通过网页拖拽上传（适合小项目）

---

## 第四步：触发编译

推送代码到 `main`/`master` 分支后，Actions 自动触发。

也可以**手动触发**：
1. 进入仓库 → **Actions** 标签
2. 选择 **Build Android APK**
3. 点击 **Run workflow**
4. 选择编译配置：`preview`（内测）或 `production`（正式）
5. 点击绿色 **Run workflow** 按钮

---

## 第五步：下载 APK

编译完成后（约 10-20 分钟），有两种方式获取 APK：

### 方式一：GitHub Artifacts
- Actions 运行页面 → 最下方 **Artifacts** → 下载 `car-screen-cast-apk`

### 方式二：Expo 官网
- 登录 [expo.dev](https://expo.dev) → 你的项目 → **Builds**
- 找到最新构建 → 点击 **Download**

---

## 编译配置说明

| 配置 | 用途 | 说明 |
|------|------|------|
| `preview` | 内测 APK | 直接安装，适合测试 |
| `production` | 正式 APK | 优化体积，适合发布 |

---

## 常见问题

**Q: 编译失败提示 "Not logged in"**
A: 检查 GitHub Secret `EXPO_TOKEN` 是否正确设置

**Q: 提示 "Project not found"**
A: 需要先在 Expo 平台初始化项目：本地运行 `npx eas init`

**Q: APK 安装提示"未知来源"**
A: Android 设置 → 安全 → 允许安装未知来源应用

**Q: 车机无法安装 APK**
A: 确认车机 Android 系统版本 ≥ 6.0，通过 U 盘或 ADB 传输安装
