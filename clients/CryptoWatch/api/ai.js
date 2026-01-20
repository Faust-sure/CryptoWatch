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
	const agent = COZE_CONFIG[agentType]
	
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
	})
}

/**
 * 生成唯一会话ID
 */
export function generateSessionId() {
	return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

export default {
	callCozeAI,
	generateSessionId
}
