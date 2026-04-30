# 更新日志

## 2026-04-30 (已上传)

### 本次更新内容

1. **注册功能修复**
   - 使用直接 fetch 调用 API，修复空响应处理
   - 修复 Better Auth 端点路径

2. **密码显示/隐藏**
   - 新增 `PasswordInput` 组件
   - 在 `icons.tsx` 中添加 Eye/EyeOff 图标
   - 登录/注册表单中支持切换密码显示

3. **数据库连接优化**
   - 添加 `DATABASE_SSL_MODE` 环境变量支持
   - 修复 ECONNRESET 连接问题
   - 配置：`DATABASE_SSL_MODE=disable`

4. **添加 CHANGELOG.md**

### 验证

- `/login` 页面：中英文切换正常
- `/pricing` 页面：中英文切换正常
- `/dashboard` 页面：中英文切换正常

### 使用方法

1. 确保 `.env.local` 中已设置 `DATABASE_SSL_MODE=disable`
2. 运行 `pnpm db:pull` 同步数据库表结构
3. 重启开发服务器 `pnpm dev`