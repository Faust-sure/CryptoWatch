// AI对话服务API
import { request } from '../utils/request.js'
import { API_ENDPOINTS, COZE_CONFIG } from '../utils/config.js'

/**
 * 调用扣子AI对话
 * @param {String} message - 用户消息
 * @param {String} sessionId - 会话ID
 * @param {String} agentType - 智能体类型（SATOSHI / BUFFETT）
 */
export function callCozeAI(message, sessionId, agentType = 'SATOSHI') {
	console.log('[AI API] 调用扣子AI:', { message: message.substring(0, 50), sessionId, agentType })
	
	const agent = COZE_CONFIG[agentType]
	
	if (!agent || !agent.projectId) {
		console.error('[AI API] 智能体配置错误:', agentType)
		return Promise.reject(new Error(`智能体${agentType}未配置`))
	}
	
	return request({
		url: API_ENDPOINTS.COZE_AI,
		method: 'POST',
		header: {
			'Content-Type': 'application/json'
		},
		data: {
			content: {
				query: {
					prompt: [
						{
							type: 'text',
							content: {
								text: message
							}
						}
					]
				}
			},
			type: 'query',
			session_id: sessionId,
			project_id: agent.projectId
		}
	}).then(res => {
		console.log('[AI API] AI原始响应类型:', typeof res)
		console.log('[AI API] AI响应前100字符:', typeof res === 'string' ? res.substring(0, 100) : JSON.stringify(res).substring(0, 100))
		return res
	}).catch(err => {
		console.error('[AI API] AI调用失败:', err)
		throw err
	})
}

/**
 * 生成唯一会话ID
 */
export function generateSessionId() {
	const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
	console.log('[AI API] 生成会话ID:', sessionId)
	return sessionId
}

export default {
	callCozeAI,
	generateSessionId
}
