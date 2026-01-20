// 加密货币数据API
import { request } from '../utils/request.js'
import { API_ENDPOINTS } from '../utils/config.js'

/**
 * 获取加密货币实时数据
 * @param {Array} symbols - 货币符号列表，如 ['BTC', 'ETH', 'USDT']
 */
export function getCryptoData(symbols = ['BTC', 'ETH', 'USDT', 'BNB', 'XRP']) {
	return request({
		url: API_ENDPOINTS.CRYPTO_DATA,
		method: 'GET',
		data: {
			symbols: symbols.join(',')
		}
	})
}

/**
 * 模拟加密货币数据（开发阶段使用）
 */
export function getMockCryptoData() {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				data: [
					{
						symbol: 'BTC',
						name: 'Bitcoin',
						price: 43256.78,
						change24h: 2.34,
						changePercent: 0.0054
					},
					{
						symbol: 'ETH',
						name: 'Ethereum',
						price: 2234.56,
						change24h: -45.23,
						changePercent: -0.0198
					},
					{
						symbol: 'USDT',
						name: 'Tether',
						price: 1.0002,
						change24h: 0.0002,
						changePercent: 0.0002
					},
					{
						symbol: 'BNB',
						name: 'Binance Coin',
						price: 312.45,
						change24h: 5.67,
						changePercent: 0.0185
					},
					{
						symbol: 'XRP',
						name: 'Ripple',
						price: 0.5234,
						change24h: -0.0123,
						changePercent: -0.0229
					}
				],
				timestamp: Date.now()
			})
		}, 500)
	})
}

export default {
	getCryptoData,
	getMockCryptoData
}
