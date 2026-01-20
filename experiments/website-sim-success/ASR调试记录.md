# ASR调试记录与下一步方案

> 创建时间：2026年1月13日 19:15  
> 状态：message_id验证失败，待解决

---

## 🔍 问题现象

WebSocket连接成功，但服务端返回错误：
```
Gateway:MESSAGE_INVALID:Invalid message id 'xxx'
```

## 🧪 已尝试的方案

| 方案 | ID格式示例 | 结果 |
|------|-----------|------|
| 标准UUID v4 | `3c6d6707-502e-48c2-8df7-7b3aa8db0eec` | ❌ 失败 |
| 无短横线UUID | `3c6d6707502e48c28df77b3aa8db0eec` | ❌ 失败 |
| 时间戳+计数器 | `17683020651388856-1` | ❌ 失败 |
| crypto.randomUUID() | RFC 4122标准UUID | ❌ 失败 |

## 🤔 可能的原因

1. **协议版本不匹配**：浏览器WebSocket实现与阿里云期望的格式不同
2. **字段缺失**：可能需要其他必填字段（如namespace版本号）
3. **SDK封装**：Java SDK可能在底层做了额外处理
4. **Token权限**：Token可能没有ASR权限（仅有TTS权限）
5. **AppKey错误**：实际使用的AppKey与申请的不一致

## 💡 待尝试方案

### 方案1：使用一句话识别API（推荐）
- 改用RESTful API代替WebSocket
- 录制完整音频后一次性发送
- 避免实时流式传输的复杂性

### 方案2：运行Java SDK抓包
1. 安装Maven
2. 运行Java示例代码
3. 使用Wireshark抓包分析实际消息格式
4. 对比浏览器发送的消息

### 方案3：联系阿里云技术支持
- 提供AppKey和失败的message_id
- 请求WebSocket协议详细文档
- 确认Token是否包含ASR权限

### 方案4：先开发uni-app（跳过ASR）
- 使用TTS功能（已测试成功）
- ASR功能暂时使用录音文件上传
- 后续再解决实时识别问题

## 📋 调试检查清单

- [x] Token有效性验证
- [x] AppKey正确性验证
- [x] WebSocket连接成功
- [x] 消息JSON格式正确
- [ ] message_id格式验证
- [ ] Token权限范围确认
- [ ] 阿里云控制台服务开通状态

## 🎯 推荐下一步

**选项A（继续调试ASR）**：
1. 在阿里云控制台查看服务开通状态
2. 尝试一句话识别API
3. 联系技术支持

**选项B（先开发应用）**：
1. 使用已成功的TTS功能
2. 开发uni-app手表应用UI
3. 集成扣子智能体对话
4. ASR功能后续补充

## 📞 技术支持联系方式

阿里云智能语音交互：
- 工单系统：https://selfservice.console.aliyun.com/ticket
- 技术文档：https://help.aliyun.com/product/30413.html
- 开发者社区：https://developer.aliyun.com/ask/
