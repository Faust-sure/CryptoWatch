<!-- 聊天消息气泡组件 -->
<template>
	<view class="message-item" :class="message.role === 'user' ? 'user-message' : 'assistant-message'">
		<view class="message-bubble">
			<text class="message-text">{{ message.content }}</text>
			<text class="message-time">{{ formatTime(message.timestamp) }}</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'MessageBubble',
	props: {
		message: {
			type: Object,
			required: true
		}
	},
	methods: {
		formatTime(timestamp) {
			const date = new Date(timestamp)
			const hours = date.getHours().toString().padStart(2, '0')
			const minutes = date.getMinutes().toString().padStart(2, '0')
			return `${hours}:${minutes}`
		}
	}
}
</script>

<style scoped>
.message-item {
	width: 100%;
	padding: 10rpx 20rpx;
	box-sizing: border-box;
}

.user-message {
	display: flex;
	justify-content: flex-end;
}

.assistant-message {
	display: flex;
	justify-content: flex-start;
}

.message-bubble {
	max-width: 70%;
	padding: 20rpx;
	border-radius: 20rpx;
	position: relative;
}

.user-message .message-bubble {
	background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
}

.assistant-message .message-bubble {
	background: linear-gradient(135deg, #2d4059 0%, #1a2332 100%);
}

.message-text {
	font-size: 28rpx;
	color: #fff;
	line-height: 1.5;
	word-break: break-word;
}

.message-time {
	display: block;
	margin-top: 8rpx;
	font-size: 20rpx;
	color: rgba(255, 255, 255, 0.6);
	text-align: right;
}
</style>
