<template>
	<view class="container">
		<!-- 加密货币轮播区域 -->
		<view class="crypto-section">
			<CryptoCarousel :cryptoData="cryptoList" />
		</view>
		
		<!-- 聊天消息区域 -->
		<scroll-view class="chat-section" scroll-y :scroll-top="scrollTop" @scrolltoupper="onScrollToUpper">
			<view v-if="messages.length === 0" class="empty-chat">
				<text class="empty-text">按住下方按钮开始对话</text>
			</view>
			<MessageBubble v-for="(msg, index) in messages" :key="index" :message="msg" />
		</scroll-view>
		
		<!-- 语音控制区域 -->
		<view class="control-section">
			<!-- 状态指示器 -->
			<view class="status-indicator" :class="statusClass">
				<text class="status-text">{{ statusText }}</text>
			</view>
			
			<!-- 录音按钮 -->
			<view class="record-button-wrapper">
				<button 
					class="record-button" 
					:class="{ recording: isRecording }"
					@touchstart="startRecord" 
					@touchend="stopRecord"
					@touchcancel="cancelRecord">
					<text class="record-icon">{{ isRecording ? '🎙️' : '🎤' }}</text>
					<text class="record-text">{{ recordButtonText }}</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script>
import CryptoCarousel from '@/components/CryptoCarousel.vue'
import MessageBubble from '@/components/MessageBubble.vue'
import { getCryptoData, getMockCryptoData } from '@/api/crypto.js'
import { callTTS, callASR } from '@/api/voice.js'
import { callCozeAI, generateSessionId } from '@/api/ai.js'
import { COZE_CONFIG, UI_CONFIG } from '@/utils/config.js'

export default {
	name: 'CryptoWatchIndex',
	components: { CryptoCarousel, MessageBubble },
	data() {
		return {
			// 加密货币数据
			cryptoList: [],
			cryptoTimer: null,
			
			// 聊天消息
			messages: [],
			sessionId: '',
			scrollTop: 0,
			
			// 录音状态
			isRecording: false,
			recorderManager: null,
			audioContext: null,
			recordFilePath: '',
			
			// 状态
			status: 'idle', // idle, recording, recognizing, thinking, speaking
			statusText: '就绪',
			statusClass: ''
		}
	},
	computed: {
		recordButtonText() {
			if (this.isRecording) {
				return '松开发送'
			}
			return '按住说话'
		}
	},
	onLoad() {
		this.init()
	},
	onUnload() {
		this.cleanup()
	},
	methods: {
		// 初始化
		async init() {
			console.log('CryptoWatch 初始化...')
			
			// 生成会话ID
			this.sessionId = generateSessionId()
			console.log('会话ID:', this.sessionId)
			
			// 请求录音权限
			await this.requestRecordPermission()
			
			// 添加欢迎消息
			this.addMessage('assistant', COZE_CONFIG.SATOSHI.welcomeMessage)
			
			// 初始化录音管理器（H5环境兼容）
			// #ifdef H5
			// H5环境下使用浏览器原生MediaRecorder
			this.recorderManager = null
			this.mediaRecorder = null
			this.audioChunks = []
			console.log('[H5] 将使用浏览器MediaRecorder')
			// #endif
			
			// #ifndef H5
			this.recorderManager = uni.getRecorderManager()
			this.setupRecorderEvents()
			// #endif
			
			// 初始化音频播放器
			this.audioContext = uni.createInnerAudioContext()
			this.setupAudioEvents()
			
			// 加载加密货币数据
			await this.loadCryptoData()
			
			// 启动定时刷新
			this.startCryptoRefresh()
		},
		
		// 设置录音事件
		setupRecorderEvents() {
			this.recorderManager.onStart(() => {
				console.log('录音开始')
				this.updateStatus('recording', '正在录音...')
			})
			
			this.recorderManager.onStop((res) => {
				console.log('录音结束:', res)
				this.recordFilePath = res.tempFilePath
				this.handleRecordComplete()
			})
			
			this.recorderManager.onError((err) => {
				console.error('录音错误:', err)
				uni.showToast({
					title: '录音失败',
					icon: 'none'
				})
				this.updateStatus('idle', '就绪')
			})
		},
		
		// 设置音频播放事件
		setupAudioEvents() {
			this.audioContext.onPlay(() => {
				console.log('音频播放开始')
				this.updateStatus('speaking', 'AI回答中...')
			})
			
			this.audioContext.onEnded(() => {
				console.log('音频播放结束')
				this.updateStatus('idle', '就绪')
			})
			
			this.audioContext.onError((err) => {
				console.error('音频播放错误:', err)
				this.updateStatus('idle', '就绪')
			})
		},
		
		// 请求录音权限（H5环境兼容）
		requestRecordPermission() {
			return new Promise((resolve) => {
				// #ifdef H5
				// H5环境下，权限会在实际使用麦克风时请求
				console.log('[H5] 麦克风权限将在录音时请求')
				resolve(true)
				// #endif
				
				// #ifndef H5
				uni.authorize({
					scope: 'scope.record',
					success: () => {
						console.log('录音权限已授予')
						resolve(true)
					},
					fail: () => {
						console.log('录音权限被拒绝，引导用户设置')
						uni.showModal({
							title: '需要录音权限',
							content: '请在设置中开启录音权限，以使用语音对话功能',
							success: (res) => {
								if (res.confirm) {
									uni.openSetting()
								}
							}
						})
						resolve(false)
					}
				})
				// #endif
			})
		},
		
		// 开始录音（H5环境兼容）
		async startRecord() {
			if (this.isRecording) return
			
			console.log('[Main] 准备开始录音')
			this.isRecording = true
			
			// #ifdef H5
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ 
					audio: {
						sampleRate: 16000,
						channelCount: 1,
						echoCancellation: true,
						noiseSuppression: true
					}
				})
				
				this.audioChunks = []
				this.audioStream = stream
				
				// 保存AudioContext用于后续转换
				this.audioContext_web = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 })
				
				// 使用MediaRecorder录制（用于实时采集）
				this.mediaRecorder = new MediaRecorder(stream, {
					mimeType: 'audio/webm;codecs=opus'
				})
				
				this.mediaRecorder.ondataavailable = (event) => {
					if (event.data.size > 0) {
						this.audioChunks.push(event.data)
					}
				}
				
				this.mediaRecorder.onstop = async () => {
					console.log('[H5] 录音结束，准备处理')
					const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
					console.log('[H5] 音频大小:', (audioBlob.size / 1024).toFixed(2), 'KB')
					await this.handleRecordComplete(audioBlob)
					// 停止所有音频轨道
					stream.getTracks().forEach(track => track.stop())
				}
				
				this.mediaRecorder.start()
				this.updateStatus('recording', '正在录音...')
				console.log('[H5] 录音开始')
			} catch (error) {
				console.error('[H5] 麦克风权限被拒绝:', error)
				uni.showToast({
					title: '请允许麦克风权限',
					icon: 'none'
				})
				this.isRecording = false
				this.updateStatus('idle', '就绪')
			}
			// #endif
			
			// #ifndef H5
			this.recorderManager.start({
				duration: 60000,
				sampleRate: 16000,
				numberOfChannels: 1,
				encodeBitRate: 48000,
				format: 'wav'
			})
			// #endif
		},
		
		// 停止录音（H5环境兼容）
		stopRecord() {
			if (!this.isRecording) return
			
			console.log('[Main] 停止录音')
			this.isRecording = false
			
			// #ifdef H5
			if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
				this.mediaRecorder.stop()
			}
			// #endif
			
			// #ifndef H5
			this.recorderManager.stop()
			// #endif
		},
		
		// 取消录音（H5环境兼容）
		cancelRecord() {
			if (!this.isRecording) return
			
			console.log('[Main] 取消录音')
			this.isRecording = false
			
			// #ifdef H5
			if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
				this.mediaRecorder.stop()
			}
			// #endif
			
			// #ifndef H5
			this.recorderManager.stop()
			// #endif
			
			this.updateStatus('idle', '已取消')
			setTimeout(() => {
				this.updateStatus('idle', '就绪')
			}, 1000)
		},
		
		// 处理录音完成（H5环境兼容）
		async handleRecordComplete(audioData) {
			try {
				// 1. 调用ASR识别
				this.updateStatus('recognizing', '识别中...')
				console.log('[Main] 开始ASR识别...')
				
				// #ifdef H5
				// H5环境：先转换WebM为WAV/PCM格式
				if (audioData instanceof Blob) {
					console.log('[Main] 转换音频格式为WAV...')
					audioData = await this.convertToWAV(audioData)
					console.log('[Main] 转换后音频大小:', (audioData.size / 1024).toFixed(2), 'KB')
				}
				// #endif
				
				// H5环境下audioData是Blob，非H5是文件路径
				const asrResult = await callASR(audioData || this.recordFilePath)
				console.log('[Main] ASR识别结果:', asrResult.text)
				
				if (!asrResult.text || asrResult.text.trim() === '') {
					console.warn('[Main] ASR识别结果为空')
					uni.showToast({
						title: '没有识别到语音',
						icon: 'none'
					})
					this.updateStatus('idle', '就绪')
					return
				}
				
				// 2. 添加用户消息
				this.addMessage('user', asrResult.text)
				
				// 3. 调用AI对话
				this.updateStatus('thinking', 'AI思考中...')
				console.log('[Main] 开始AI对话...')
				
				const aiResponse = await callCozeAI(asrResult.text, this.sessionId, 'SATOSHI')
				console.log('[Main] AI响应类型:', typeof aiResponse)
				
				// 4. 解析AI响应（处理SSE流式返回）
				const aiText = this.parseCozeResponse(aiResponse)
				
				if (!aiText || aiText.trim() === '') {
					console.warn('[Main] AI响应为空')
					this.addMessage('assistant', '抱歉，我没有理解你的问题。')
				} else {
					console.log('[Main] AI响应文本:', aiText.substring(0, 100))
					this.addMessage('assistant', aiText)
				}
				
				// 5. 调用TTS语音合成
				this.updateStatus('speaking', '播放中...')
				console.log('[Main] 开始TTS合成...')
				
				const ttsResult = await callTTS(aiText || '抱歉，我没有理解你的问题。', 'xiaoyun')
				console.log('[Main] TTS合成成功，准备播放')
				
				// 6. 播放语音
				this.audioContext.src = ttsResult.audioUrl
				this.audioContext.play()
				
			} catch (error) {
				console.error('[Main] 处理失败:', error)
				
				// 显示具体错误信息
				let errorMsg = '处理失败'
				if (error.message) {
					errorMsg = error.message
				} else if (error.code) {
					errorMsg = `错误代码: ${error.code}`
				}
				
				uni.showToast({
					title: errorMsg,
					icon: 'none',
					duration: 3000
				})
				
				// 添加错误消息到聊天
				this.addMessage('system', `系统错误: ${errorMsg}`)
				this.updateStatus('idle', '就绪')
			}
		},
		
		// 解析扣子AI响应（参考voice_chat_complete.html的正确实现）
		parseCozeResponse(response) {
			console.log('[ParseCoze] 开始解析响应，类型:', typeof response)
			
			// 如果是字符串，按行解析SSE格式
			if (typeof response === 'string') {
				const lines = response.split('\n')
				let fullAnswer = ''
				
				console.log('[ParseCoze] SSE行数:', lines.length)
				
				for (const line of lines) {
					// SSE格式：data: {json}
					if (line.startsWith('data: ')) {
						try {
							const jsonStr = line.substring(6) // 去掉 "data: " 前缀
							const data = JSON.parse(jsonStr)
							
							// 提取 type 为 "answer" 的内容
							if (data.type === 'answer' && data.content && data.content.answer) {
								fullAnswer += data.content.answer
								console.log('[ParseCoze] 提取answer片段:', data.content.answer.substring(0, 30))
							}
						} catch (e) {
							// 跳过无法解析的行
							console.warn('[ParseCoze] 解析行失败:', line.substring(0, 50))
						}
					}
				}
				
				if (fullAnswer) {
					console.log('[ParseCoze] 完整回答长度:', fullAnswer.length)
					return fullAnswer
				}
				
				console.warn('[ParseCoze] 未能提取到answer内容')
				return '抱歉，我没有理解你的问题。'
			}
			
			// 如果是对象，直接提取
			console.log('[ParseCoze] 响应是对象，尝试直接提取')
			return response.content?.answer || response.answer || response.content || '收到你的消息了。'
		},
		
		// 添加消息
		addMessage(role, content) {
			this.messages.push({
				role: role,
				content: content,
				timestamp: Date.now()
			})
			
			// 滚动到底部
			this.$nextTick(() => {
				this.scrollTop = 999999
			})
		},
		
		// 更新状态
		updateStatus(status, text) {
			this.status = status
			this.statusText = text
			
			// 更新状态样式
			const classMap = {
				idle: 'status-idle',
				recording: 'status-recording',
				recognizing: 'status-processing',
				thinking: 'status-processing',
				speaking: 'status-speaking'
			}
			this.statusClass = classMap[status] || ''
		},
		
		// 加载加密货币数据
		async loadCryptoData() {
			try {
				console.log('[Main] 开始加载加密货币数据...')
				// 调用改进的API（自动Fallback到Mock数据）
				const result = await getCryptoData()
				
				if (result && result.data && Array.isArray(result.data)) {
					this.cryptoList = result.data.map(item => ({
						...item,
						timestamp: result.timestamp
					}))
					console.log('[Main] 加密货币数据加载成功:', this.cryptoList.length, '条', result.source ? `(来源:${result.source})` : '')
				} else {
					console.warn('[Main] 数据格式异常，使用空列表')
					this.cryptoList = []
				}
			} catch (error) {
				console.error('[Main] 加载加密货币数据失败:', error)
				// 最终Fallback：空列表或使用本地Mock
				try {
					const fallback = await getMockCryptoData()
					this.cryptoList = fallback.data
					console.log('[Main] 使用Fallback数据:', this.cryptoList.length, '条')
				} catch (e) {
					console.error('[Main] Fallback也失败了:', e)
					this.cryptoList = []
				}
			}
		},
		
		// 转换WebM音频为WAV格式（H5环境）
		async convertToWAV(webmBlob) {
			return new Promise((resolve, reject) => {
				const fileReader = new FileReader()
				
				fileReader.onload = async (event) => {
					try {
						const arrayBuffer = event.target.result
						const audioContext = new (window.AudioContext || window.webkitAudioContext)()
						
						// 解码WebM音频
						const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
						console.log('[Convert] 音频解码成功:', {
							duration: audioBuffer.duration.toFixed(2) + 's',
							sampleRate: audioBuffer.sampleRate,
							channels: audioBuffer.numberOfChannels
						})
						
						// 获取PCM数据（单声道，16kHz）
						const pcmData = this.resampleAudio(audioBuffer, 16000)
						
						// 创建WAV格式
						const wavBlob = this.createWAVBlob(pcmData, 16000)
						console.log('[Convert] WAV转换完成')
						
						resolve(wavBlob)
					} catch (error) {
						console.error('[Convert] 音频转换失败:', error)
						reject(error)
					}
				}
				
				fileReader.onerror = (error) => {
					console.error('[Convert] 文件读取失败:', error)
					reject(error)
				}
				
				fileReader.readAsArrayBuffer(webmBlob)
			})
		},
		
		// 重采样音频到指定采样率
		resampleAudio(audioBuffer, targetSampleRate) {
			const channelData = audioBuffer.getChannelData(0) // 取单声道
			const sourceSampleRate = audioBuffer.sampleRate
			
			if (sourceSampleRate === targetSampleRate) {
				return channelData
			}
			
			// 简单线性插值重采样
			const ratio = sourceSampleRate / targetSampleRate
			const newLength = Math.round(channelData.length / ratio)
			const result = new Float32Array(newLength)
			
			for (let i = 0; i < newLength; i++) {
				const position = i * ratio
				const index = Math.floor(position)
				const fraction = position - index
				
				if (index + 1 < channelData.length) {
					result[i] = channelData[index] * (1 - fraction) + channelData[index + 1] * fraction
				} else {
					result[i] = channelData[index]
				}
			}
			
			console.log('[Convert] 重采样:', sourceSampleRate, 'Hz →', targetSampleRate, 'Hz')
			return result
		},
		
		// 创建WAV格式Blob
		createWAVBlob(pcmData, sampleRate) {
			const numChannels = 1
			const bitsPerSample = 16
			const bytesPerSample = bitsPerSample / 8
			const blockAlign = numChannels * bytesPerSample
			const byteRate = sampleRate * blockAlign
			const dataSize = pcmData.length * bytesPerSample
			const bufferSize = 44 + dataSize
			
			const buffer = new ArrayBuffer(bufferSize)
			const view = new DataView(buffer)
			
			// WAV文件头（44字节）
			const writeString = (offset, string) => {
				for (let i = 0; i < string.length; i++) {
					view.setUint8(offset + i, string.charCodeAt(i))
				}
			}
			
			writeString(0, 'RIFF')
			view.setUint32(4, bufferSize - 8, true)
			writeString(8, 'WAVE')
			writeString(12, 'fmt ')
			view.setUint32(16, 16, true) // fmt chunk size
			view.setUint16(20, 1, true) // PCM format
			view.setUint16(22, numChannels, true)
			view.setUint32(24, sampleRate, true)
			view.setUint32(28, byteRate, true)
			view.setUint16(32, blockAlign, true)
			view.setUint16(34, bitsPerSample, true)
			writeString(36, 'data')
			view.setUint32(40, dataSize, true)
			
			// 写入PCM数据（Float32转Int16）
			let offset = 44
			for (let i = 0; i < pcmData.length; i++) {
				const sample = Math.max(-1, Math.min(1, pcmData[i]))
				const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
				view.setInt16(offset, int16, true)
				offset += 2
			}
			
			return new Blob([buffer], { type: 'audio/wav' })
		},
		
		// 启动定时刷新
		startCryptoRefresh() {
			this.cryptoTimer = setInterval(() => {
				this.loadCryptoData()
			}, UI_CONFIG.cryptoRefreshInterval)
		},
		
		// 滚动到顶部事件
		onScrollToUpper() {
			// 可以实现加载历史消息
		},
		
		// 清理资源
		cleanup() {
			if (this.cryptoTimer) {
				clearInterval(this.cryptoTimer)
			}
			if (this.audioContext) {
				this.audioContext.destroy()
			}
		}
	}
}
</script>

<style scoped>
.container {
	width: 100%;
	height: 100vh;
	background: linear-gradient(180deg, #16213e 0%, #0f3460 100%);
	display: flex;
	flex-direction: column;
}

/* 加密货币区域 */
.crypto-section {
	flex-shrink: 0;
	padding: 20rpx 0;
}

/* 聊天区域 */
.chat-section {
	flex: 1;
	overflow-y: auto;
	padding: 20rpx 0;
}

.empty-chat {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;
}

.empty-text {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.4);
}

/* 控制区域 */
.control-section {
	flex-shrink: 0;
	padding: 20rpx;
	background: rgba(0, 0, 0, 0.3);
}

.status-indicator {
	text-align: center;
	margin-bottom: 20rpx;
	padding: 10rpx;
	border-radius: 10rpx;
}

.status-text {
	font-size: 24rpx;
	color: #fff;
}

.status-idle {
	background: rgba(255, 255, 255, 0.1);
}

.status-recording {
	background: rgba(255, 0, 0, 0.3);
	animation: pulse 1s infinite;
}

.status-processing {
	background: rgba(0, 150, 255, 0.3);
}

.status-speaking {
	background: rgba(0, 255, 150, 0.3);
}

@keyframes pulse {
	0%, 100% {
		opacity: 1;
	}
	50% {
		opacity: 0.6;
	}
}

.record-button-wrapper {
	display: flex;
	justify-content: center;
}

.record-button {
	width: 160rpx;
	height: 160rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(0, 212, 255, 0.4);
	transition: all 0.3s;
}

.record-button.recording {
	background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
	transform: scale(1.1);
	box-shadow: 0 12rpx 32rpx rgba(255, 68, 68, 0.6);
}

.record-icon {
	font-size: 64rpx;
	margin-bottom: 8rpx;
}

.record-text {
	font-size: 20rpx;
	color: #fff;
}
</style>
