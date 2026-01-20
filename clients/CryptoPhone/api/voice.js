// 语音服务API
import { request, uploadFile } from '../utils/request.js'
import { API_ENDPOINTS } from '../utils/config.js'

/**
 * 获取阿里云配置（AppKey和Token）
 */
export function getAliyunConfig() {
	console.log('[Voice API] 获取阿里云配置...')
	return request({
		url: API_ENDPOINTS.ALIYUN_CONFIG,
		method: 'GET'
	}).then(config => {
		console.log('[Voice API] 阿里云配置获取成功:', {
			hasAppKey: !!config.appKey,
			hasToken: !!config.token
		})
		return config
	}).catch(err => {
		console.error('[Voice API] 获取阿里云配置失败:', err)
		throw err
	})
}

/**
 * 调用TTS语音合成
 * @param {String} text - 要合成的文本
 * @param {String} voice - 发音人（默认：xiaoyun）
 */
export function callTTS(text, voice = 'xiaoyun') {
	console.log('[Voice API] TTS合成请求:', { text: text.substring(0, 50), voice })
	
	return new Promise((resolve, reject) => {
		getAliyunConfig().then(config => {
			// 使用兼容性参数名
			const appkey = config.appKey || config.appkey
			const token = config.token
			
			if (!appkey || !token) {
				console.error('[Voice API] 缺少必要参数:', { appkey: !!appkey, token: !!token })
				reject(new Error('缺少AppKey或Token'))
				return
			}
			
			const url = `${API_ENDPOINTS.ALIYUN_TTS}?text=${encodeURIComponent(text)}&voice=${voice}&appkey=${appkey}&token=${token}`
			console.log('[Voice API] TTS URL已生成')
			
			// 返回音频URL供uni.createInnerAudioContext播放
			resolve({
				audioUrl: url,
				config: config
			})
		}).catch(err => {
			console.error('[Voice API] TTS失败:', err)
			reject(err)
		})
	})
}

/**
 * 调用ASR语音识别
 * @param {String|Blob} filePathOrBlob - 录音文件路径或Blob对象（H5环境）
 */
export function callASR(filePathOrBlob) {
	console.log('[Voice API] ASR识别请求:', typeof filePathOrBlob)
	
	return new Promise((resolve, reject) => {
		getAliyunConfig().then(config => {
			// 使用兼容性参数名
			const appkey = config.appKey || config.appkey
			const token = config.token
			
			if (!appkey || !token) {
				console.error('[Voice API] 缺少必要参数:', { appkey: !!appkey, token: !!token })
				reject(new Error('缺少AppKey或Token'))
				return
			}
			
			// #ifdef H5
			// H5环境：使用原生fetch上传Blob
			if (filePathOrBlob instanceof Blob) {
				console.log('[Voice API] H5环境，使用fetch上传Blob, 类型:', filePathOrBlob.type, '大小:', (filePathOrBlob.size / 1024).toFixed(2), 'KB')
				
				// 直接上传WAV格式的原始PCM数据
				const url = `${API_ENDPOINTS.ALIYUN_ASR}?appkey=${encodeURIComponent(appkey)}&token=${encodeURIComponent(token)}&format=wav&sample_rate=16000`
				
				fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'audio/wav'
					},
					body: filePathOrBlob
				})
				.then(response => response.json())
				.then(res => {
					console.log('[Voice API] ASR响应:', res)
					if (res.status === 20000000) {
						console.log('[Voice API] ASR识别成功:', res.result)
						resolve({
							text: res.result || '',
							taskId: res.task_id
						})
					} else {
						console.error('[Voice API] ASR识别失败:', res)
						reject({
							code: res.status,
							message: res.message || res.status_text || '识别失败'
						})
					}
				})
				.catch(err => {
					console.error('[Voice API] ASR上传失败:', err)
					reject(err)
				})
				return
			}
			// #endif
			
			// 非H5环境：使用uni.uploadFile
			const formData = {
				appkey: appkey,
				token: token
			}
			console.log('[Voice API] ASR请求参数:', { hasAppkey: !!formData.appkey, hasToken: !!formData.token })
			
			uploadFile({
				url: `${API_ENDPOINTS.ALIYUN_ASR}?format=wav&sample_rate=16000`,
				filePath: filePathOrBlob,
				name: 'audio',
				formData: formData
			}).then(res => {
				console.log('[Voice API] ASR响应:', res)
				
				if (res.status === 20000000) {
					console.log('[Voice API] ASR识别成功:', res.result)
					resolve({
						text: res.result,
						taskId: res.task_id
					})
				} else {
					console.error('[Voice API] ASR识别失败:', res)
					reject({
						code: res.status,
						message: res.message || res.status_text || '识别失败'
					})
				}
			}).catch(err => {
				console.error('[Voice API] ASR上传失败:', err)
				reject(err)
			})
		}).catch(err => {
			console.error('[Voice API] ASR失败:', err)
			reject(err)
		})
	})
}

export default {
	getAliyunConfig,
	callTTS,
	callASR
}
