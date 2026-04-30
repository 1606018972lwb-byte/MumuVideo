# 更新日志

## 2026-04-30

### 修复

1. **注册功能修复**
   - 修复了注册失败的问题
   - 现在可以通过邮箱和密码注册新账户

2. **密码显示/隐藏功能**
   - 在密码输入框中添加了小眼睛图标
   - 点击可以显示或隐藏密码

3. **数据库连接修复**
   - 修复了数据库连接问题（ECONNRESET）
   - 需要设置 `DATABASE_SSL_MODE=disable` 环境变量
   - 配置示例：
     ```
     DATABASE_URL='postgresql://admin:password@host:port/database'
     DATABASE_SSL_MODE=disable
     ```

### 验证

- `/login` 页面：中英文切换正常
- `/pricing` 页面：中英文切换正常
- `/dashboard` 页面：中英文切换正常

### 使用方法

1. 确保 `.env.local` 中已设置 `DATABASE_SSL_MODE=disable`
2. 运行 `pnpm db:pull` 同步数据库表结构
3. 重启开发服务器 `pnpm dev`