---
name: website-deploy-win
description: 公司网站制作·域名购买·部署上线全套流程指南（Windows 环境）。涵盖网页设计开发、中英文双语切换、域名注册（腾讯云）、GitHub 仓库管理、Vercel 部署、DNS 配置、Formspree 询价表单集成等完整流程。适用于 Windows 10/11 + PowerShell/CMD 环境。
---

# 公司网站制作与部署上线全流程（Windows 版）

本 Skill 提供从零开始制作公司网站到部署上线的完整流程指南，适用于 Windows 环境。

## 适用场景

- 用户需要制作公司网站/官网
- 用户需要购买域名并部署上线
- 用户需要中英文双语网站
- 用户需要询价表单发送到邮箱
- 用户使用 Windows 10/11 操作系统

## 全套流程概览

```
1. 需求确认 → 2. 网页开发 → 3. 购买域名 → 4. 上传 GitHub → 5. 部署 Vercel → 6. 绑定域名 → 7. 配置表单
```

---

## Windows 环境准备

### 必需软件安装

| 软件 | 下载地址 | 说明 |
|------|---------|------|
| Git | https://git-scm.com/download/win | 版本管理 |
| VS Code | https://code.visualstudio.com | 代码编辑器 |
| Node.js | https://nodejs.org | Vercel CLI 依赖（可选） |

### 安装后验证（PowerShell）

```powershell
git --version
node --version
```

### Git 配置

```powershell
git config --global user.name "你的用户名"
git config --global user.email "你的邮箱"
```

---

## 第一步：需求确认

使用 AskUserQuestion 确认以下信息：

| 确认项 | 选项示例 |
|--------|---------|
| 公司类型 | 科技/贸易/物流/教育/其他 |
| 页面数量 | 单页/3页/5-6页/多页面 |
| 设计风格 | 简约现代/科技感/专业稳重/有设计稿 |
| 响应式 | 需要/不需要 |
| 中英文 | 是否需要双语切换 |

同时确认公司信息：
- 公司名称（中文+英文）
- 联系电话
- 公司地址
- 电子邮箱
- WhatsApp（如有）

---

## 第二步：网页开发

### 文件结构

```
company-website\
├── index.html    ← 主页面（含 CSS + JS 内联）
├── logo.png      ← 公司 Logo
└── about-bg.png  ← 关于我们背景图（可选）
```

### 技术栈

- **纯静态 HTML/CSS/JS**，无需后端框架
- **CSS 变量** 管理主题色
- **CSS Grid + Flexbox** 响应式布局
- **data-i18n 属性 + JS 字典** 实现中英文切换
- **Formspree API** 询价表单提交

### 页面结构（单页应用）

```
导航栏（Logo + 导航 + 语言切换）
├── Hero 首屏（标语 + CTA + 数据统计）
├── 关于我们（图片 + 公司介绍 + 特点列表）
├── 服务项目（3×2 卡片网格）
├── 核心优势（4列图标卡片）
├── 联系方式（联系信息 + 询价表单）
└── 页脚（品牌信息 + 快速链接 + 联系方式）
```

### 中英文切换实现

```html
<!-- HTML 标记 -->
<span data-i18n="nav.about">关于我们</span>

<!-- JS 字典 -->
const translations = {
    zh: { 'nav.about': '关于我们', ... },
    en: { 'nav.about': 'About Us', ... }
};

// 切换函数
function applyLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.innerHTML = translations[lang][el.getAttribute('data-i18n')];
    });
    localStorage.setItem('lang', lang);
}
```

### 设计风格参考（专业稳重）

```css
:root {
    --primary: #1a365d;        /* 深蓝（主色） */
    --primary-light: #2c5282;  /* 中蓝 */
    --secondary: #3182ce;      /* 亮蓝 */
    --accent: #ed8936;         /* 橙色（强调） */
    --text-dark: #1a202c;
    --text-gray: #4a5568;
    --bg-light: #f7fafc;
}
```

### 询价表单集成（Formspree）

```javascript
fetch('https://formspree.io/f/{FORM_ID}', {
    method: 'POST',
    body: formData,
    headers: { 'Accept': 'application/json' }
})
.then(response => {
    if (response.ok) {
        alert('感谢您的咨询！');
        form.reset();
    }
})
.catch(error => {
    // 降级方案：打开邮件客户端
    window.location.href = 'mailto:xxx@xxx.com?subject=...&body=...';
});
```

### 本地预览（Windows PowerShell）

```powershell
# 进入项目目录
cd C:\Users\你的用户名\company-website

# 方法 1：Python（如已安装 Python）
python -m http.server 8000

# 方法 2：Node.js（如已安装 Node.js）
npx serve

# 方法 3：VS Code Live Server 插件
# 安装 Live Server 扩展 → 右键 index.html → Open with Live Server
```

浏览器访问 http://localhost:8000 预览

---

## 第三步：购买域名

### 推荐平台

| 平台 | 价格 | 特点 |
|------|------|------|
| 腾讯云 DNSPod | ¥30-60/年 | 中文界面，国内推荐 |
| 阿里云（万网） | ¥50-80/年 | 国内老牌 |
| Cloudflare | ~$5-8/年 | 最便宜，无附加销售 |
| Namecheap | ~$8-12/年 | 海外老牌 |

### 腾讯云购买流程（指导用户）

1. 访问 https://dnspod.cloud.tencent.com
2. 搜索域名（如 `baotongtrade.com`）
3. 加入购物车并结算
4. 完成实名认证

---

## 第四步：上传到 GitHub

### 创建 GitHub 仓库（用户操作）

1. 打开 https://github.com/new
2. Repository name 填写（如 `baotong-trade`）
3. 选择 **Public**
4. **不要勾选** "Add a README file"
5. 点击 **Create repository**

### 推送代码（Windows PowerShell）

```powershell
# 进入项目目录
cd C:\Users\你的用户名\company-website

# 初始化 Git
git init
git add .
git commit -m "公司官网部署"

# 关联远程仓库并推送（替换用户名和仓库名）
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

> 💡 首次推送时 GitHub 会弹出登录窗口，按提示登录即可

### 手动上传降级方案

如果 Git 命令推送失败：

1. 下载文件到本地
2. 打开 GitHub 仓库 → **Add file** → **Upload files**
3. 拖入文件（**注意：直接拖到根目录，不要创建子文件夹**）
4. 点击 **Commit changes**

> ⚠️ 常见错误：文件上传到了子文件夹导致 Vercel 404。必须确保 `index.html` 在仓库**根目录**。

---

## 第五步：部署到 Vercel

### 方式 A：GitHub 关联部署（推荐）

1. 打开 https://vercel.com/dashboard
2. 点击 **Add New...** → **Project**
3. 在 **Import Git Repository** 列表中选择对应仓库
4. 点击 **Import**
5. 配置：
   - Framework Preset: **Other**
   - Build Command: 留空
   - Output Directory: `./`
6. 点击 **Deploy**

> 💡 如果看不到仓库，点击 **Adjust GitHub App Permissions** 授权

### 方式 B：直接上传文件

1. 打开 https://vercel.com/dashboard
2. **Add New...** → **Project**
3. 页面底部点击 **Deploy Static File**
4. 拖入所有文件
5. 点击 **Deploy**

### 方式 C：Vercel CLI（Windows PowerShell）

```powershell
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 进入项目目录部署
cd C:\Users\你的用户名\company-website
vercel

# 部署到生产环境
vercel --prod
```

### GitHub 关联的好处

| 优势 | 说明 |
|------|------|
| 自动部署 | Git push 后 Vercel 自动重新部署 |
| 版本管理 | 有完整提交历史 |
| 一键回滚 | 可回退到任意历史版本 |

---

## 第六步：绑定域名

### 在 Vercel 添加域名

1. 进入项目 → **Settings** → **Domains**
2. 输入 `www.域名.com` → 点击 **Add**
3. 勾选 **Redirect apex domains to www**
4. 环境选择 **Production**
5. 点击 **Add Domain**
6. 同样方式添加 `域名.com`（不带 www）

### 在腾讯云配置 DNS

登录 https://dnspod.cloud.tencent.com → 进入域名管理 → 添加记录：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|--------|-----|
| CNAME | @ | `cname.vercel-dns.com` | 600 |
| CNAME | www | `cname.vercel-dns.com` | 600 |

> ⚠️ 如果 `@` 记录已存在，先删除原有的 A 记录再添加 CNAME

### 验证生效

- DNS 生效时间：5-10 分钟
- 回到 Vercel Domains 页面点击 **Refresh**
- 状态从 ❌ Invalid → ✅ Valid 表示配置成功
- 访问 `https://www.域名.com` 确认网站正常

### Windows 命令验证 DNS

```powershell
# 检查 DNS 解析是否生效
nslookup www.你的域名.com

# 或使用 ping
ping www.你的域名.com
```

---

## 第七步：配置 Formspree 询价表单

### 注册 Formspree

1. 打开 https://formspree.io 注册
2. 点击 **+ New Form**
3. 填写表单名称，确认接收邮箱
4. 点击 **Create Form**
5. 获取表单 ID（URL 中 `https://formspree.io/f/` 后面的字符串）

### 集成到网站

将表单 ID 填入代码中：

```javascript
fetch('https://formspree.io/f/{表单ID}', {
    method: 'POST',
    body: formData,
    headers: { 'Accept': 'application/json' }
})
```

### 表单提交流程

```
用户填写表单 → 点击提交 → Formspree 接收 → 转发到邮箱
                                    ↓
                          若失败 → 降级打开邮件客户端 (mailto:)
```

---

## 后续更新流程

网站上线后，更新内容的流程（Windows PowerShell）：

```powershell
# 1. 修改代码后，进入项目目录
cd C:\Users\你的用户名\company-website

# 2. 提交更改
git add .
git commit -m "更新网站内容"

# 3. 推送到 GitHub
git push origin main

# 4. Vercel 自动检测更新并重新部署
# 5. 访问域名确认更新生效
```

---

## 常见问题排查

| 问题 | 原因 | 解决方法 |
|------|------|---------|
| Vercel 404 | index.html 不在根目录 | 确认文件在仓库根目录，非子文件夹 |
| DNS 不生效 | CNAME 记录错误 | 确认记录值为 `cname.vercel-dns.com` |
| @ 记录冲突 | 已存在 A 记录 | 先删除 A 记录再添加 CNAME |
| Git push 失败 | 未登录 GitHub | 运行 `git config --global credential.helper manager` |
| Git 推送 403 | Token 权限不足 | 重新授权 GitHub（需 repo 权限） |
| 表单提交无响应 | Formspree ID 未配置 | 替换代码中的 {FORM_ID} |
| 图片不显示 | 路径错误或未上传 | 确认图片文件与 index.html 同级 |
| 手机端排版错乱 | 响应式 CSS 问题 | 检查 @media 断点设置 |
| PowerShell 执行策略 | 无法运行脚本 | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| 中文乱码 | 编码问题 | 确保文件保存为 UTF-8 编码 |

---

## 检查清单

部署上线前逐项确认：

- [ ] index.html 在仓库根目录
- [ ] logo.png 已上传
- [ ] about-bg.png 已上传（如有）
- [ ] 中英文切换正常
- [ ] 询价表单 Formspree ID 已配置
- [ ] Vercel 部署成功（无报错）
- [ ] 域名已添加到 Vercel
- [ ] DNS CNAME 记录已配置
- [ ] HTTPS 证书已生效
- [ ] 手机端显示正常
- [ ] 文件编码为 UTF-8
- [ ] Git 已正确配置用户名和邮箱

---

## Windows 快捷操作参考

### 文件路径

| 项目 | Windows 路径 |
|------|-------------|
| 项目目录 | `C:\Users\用户名\company-website\` |
| Git 仓库 | `C:\Users\用户名\company-website\.git\` |
| VS Code 打开 | `code .`（在项目目录中执行） |

### 常用 PowerShell 命令

```powershell
# 查看当前目录
pwd

# 列出文件
dir
# 或
Get-ChildItem

# 创建目录
mkdir company-website

# 进入目录
cd company-website

# 复制文件
copy logo.png company-website\

# 删除文件
del old-file.html

# 启动本地服务器
python -m http.server 8000
```
