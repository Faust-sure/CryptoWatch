// 加密货币数据API
import { request } from '../utils/request.js'
import { API_ENDPOINTS } from '../utils/config.js'

/**
 * 获取加密货币实时数据（带Fallback机制）
 * @param {Array} symbols - 货币符号列表，如 ['BTC', 'ETH', 'USDT']
 */
export function getCryptoData(symbols = ['BTC', 'ETH', 'USDT', 'BNB', 'XRP']) {
	console.log('[Crypto API] 开始获取加密货币数据:', symbols)
	
	return new Promise((resolve, reject) => {
		// 尝试从服务器获取真实数据
		request({
			url: API_ENDPOINTS.CRYPTO_DATA,
			method: 'GET',
			data: {
				symbols: symbols.join(',')
			}
		}).then(res => {
			console.log('[Crypto API] 服务器数据获取成功:', res)
			// 检查数据格式
			if (res && res.data && Array.isArray(res.data)) {
				resolve(res)
			} else {
				console.warn('[Crypto API] 服务器返回格式异常，使用Mock数据')
				resolve(getMockCryptoData())
			}
		}).catch(err => {
			console.error('[Crypto API] 服务器请求失败，使用Mock数据:', err)
			// Fallback到Mock数据
			resolve(getMockCryptoData())
		})
	})
}

/**
 * 模拟加密货币数据（使用真实市场价格范围）
 * 价格会有小幅波动，模拟真实市场
 */
export function getMockCryptoData() {
	console.log('[Crypto API] 使用Mock数据')
	
	// 基础价格（接近2026年1月真实价格）
	const basePrices = {
		BTC: 94960.00,  // 比特币约95K美元
		ETH: 3280.00,   // 以太坊约3.3K美元
		USDT: 1.0000,   // USDT稳定币
		BNB: 635.00,    // BNB约635美元
		XRP: 2.45       // XRP约2.45美元
	}
	
	// 生成带随机波动的数据
	const generateCryptoItem = (symbol, name, basePrice) => {
		// 随机波动 -0.5% 到 +0.5%
		const randomChange = (Math.random() - 0.5) * 0.01
		const changePercent = randomChange
		const price = basePrice * (1 + changePercent)
		const change24h = basePrice * changePercent
		
		return {
			symbol,
			name,
			price: parseFloat(price.toFixed(symbol === 'USDT' ? 4 : 2)),
			change24h: parseFloat(change24h.toFixed(2)),
			changePercent: parseFloat((changePercent * 100).toFixed(2))
		}
	}
	
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				data: [
					generateCryptoItem('BTC', 'Bitcoin', basePrices.BTC),
					generateCryptoItem('ETH', 'Ethereum', basePrices.ETH),
					generateCryptoItem('USDT', 'Tether', basePrices.USDT),
					generateCryptoItem('BNB', 'Binance Coin', basePrices.BNB),
					generateCryptoItem('XRP', 'Ripple', basePrices.XRP)
				],
				timestamp: Date.now(),
				source: 'mock' // 标记数据来源
			})
		}, 300) // 减少延迟
	})
}

export default {
	getCryptoData,
	getMockCryptoData
}