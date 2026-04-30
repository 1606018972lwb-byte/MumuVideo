# 更新日志

## 2026-05-01 (已上传)

### 本次更新内容

1. **修复邮箱密码登录**
   - 使用直接 fetch 调用 `/api/auth/sign-in/email` API
   - 登录和注册功能正常工作

2. **修复数据库连接**
   - 在 DATABASE_URL 中添加 `sslmode=disable` 参数
   - 解决 ECONNRESET 连接错误

3. **Google 登录已启用**（默认显示）

3. **双语界面测试通过**
   - Login / 登录页面
   - Register / 注册页面
   - Dashboard / 仪表板
   - Pricing / 定价
   - Credits / 积分
   - My Creations / 我的作品

### GitHub 提交记录

```
fix: 修复登录错误，还原使用直接 fetch 调用

- 移除不存在的 emailPasswordClient 插件
- 恢复使用 /api/auth/sign-in/email API 调用
- 在 DATABASE_URL 添加 sslmode=disable 参数
- 登录/注册表单标签添加双语支持
```

### 验证结果

- ✅ 登录 API: 返回 token
- ✅ 注册 API: 返回 token
- ✅ 中英文界面切换正常