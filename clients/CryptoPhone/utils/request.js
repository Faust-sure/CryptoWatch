// HTTP请求封装
import { SERVER_CONFIG } from './config.js'

/**
 * 发送HTTP请求
 * @param {Object} options - 请求配置
 * @returns {Promise}
 */
export function request(options) {
	return new Promise((resolve, reject) => {
		// 拼接完整URL
		const url = options.url.startsWith('http') 
			? options.url 
			: SERVER_CONFIG.CURRENT + options.url
		
		uni.request({
			url: url,
			method: options.method || 'GET',
			data: options.data || {},
			header: options.header || {
				'Content-Type': 'application/json'
			},
			timeout: options.timeout || 30000,
			success: (res) => {
				if (res.statusCode === 200) {
					resolve(res.data)
				} else {
					reject({
						code: res.statusCode,
						message: `请求失败: ${res.statusCode}`,
						data: res.data
					})
				}
			},
			fail: (err) => {
				reject({
					code: -1,
					message: err.errMsg || '网络请求失败',
					data: err
				})
			}
		})
	})
}

/**
 * 上传文件
 * @param {Object} options - 上传配置
 * @returns {Promise}
 */
export function uploadFile(options) {
	return new Promise((resolve, reject) => {
		const url = options.url.startsWith('http') 
			? options.url 
			: SERVER_CONFIG.CURRENT + options.url
		
		uni.uploadFile({
			url: url,
			filePath: options.filePath,
			name: options.name || 'file',
			formData: options.formData || {},
			header: options.header || {},
			success: (res) => {
				if (res.statusCode === 200) {
					try {
						const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
						resolve(data)
					} catch (e) {
						resolve(res.data)
					}
				} else {
					reject({
						code: res.statusCode,
						message: `上传失败: ${res.statusCode}`
					})
				}
			},
			fail: (err) => {
				reject({
					code: -1,
					message: err.errMsg || '上传失败'
				})
			}
		})
	})
}

export default {
	request,
	uploadFile
}
