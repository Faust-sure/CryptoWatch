// CryptoWatch 配置文件

// 服务器配置
export const SERVER_CONFIG = {
	// 本地测试
	LOCAL: 'http://localhost:8080',
	// 局域网测试
	LAN: 'http://10.168.96.167:8080',
	// 阿里云服务器
	PRODUCTION: 'http://47.97.121.208:8080',
	// 当前环境（浏览器测试用LOCAL，手机测试改为LAN，部署改为PRODUCTION）
	CURRENT: 'http://10.168.96.167:8080'
}

// API端点
export const API_ENDPOINTS = {
	// 阿里云语音服务
	ALIYUN_CONFIG: '/api/aliyun/config',
	ALIYUN_TTS: '/api/aliyun/tts',
	ALIYUN_ASR: '/api/aliyun/asr',
	// 扣子AI
	COZE_AI: '/api/coze',
	// CoinMarketCap
	CRYPTO_DATA: '/api/crypto/latest'
}

// 扣子智能体配置
export const COZE_CONFIG = {
	// 中本聪智能体
	SATOSHI: {
		projectId: '7594865794518106153',
		welcomeMessage: '你好，我是中本聪，比特币的创造者。我在2008年发布了比特币白皮书，开启了去中心化数字货币的新时代。我对加密货币的技术原理和市场走势有深入的见解，可以为你分析当前市场的恐慌指数、资金流向以及未来趋势。有什么问题尽管问我。'
	},
	// 巴菲特智能体（待配置）
	BUFFETT: {
		projectId: '',
		welcomeMessage: '你好，我是沃伦·巴菲特，伯克希尔·哈撒韦的董事长。我专注于价值投资，擅长通过分析K线图、市盈率、成交量等指标来判断A股市场的投资机会。我会结合最新数据和长期趋势，为你提供理性的投资建议。有什么想了解的吗？'
	}
}

// 录音配置
export const AUDIO_CONFIG = {
	sampleRate: 16000,
	numberOfChannels: 1,
	encodeBitRate: 48000,
	format: 'wav',
	frameSize: 50
}

// UI配置
export const UI_CONFIG = {
	// 手表屏幕尺寸（根据实际调整）
	screenWidth: 400,
	screenHeight: 400,
	// 加密货币刷新间隔（毫秒）
	cryptoRefreshInterval: 30000,
	// A股刷新间隔（毫秒）
	stockRefreshInterval: 30000
}

export default {
	SERVER_CONFIG,
	API_ENDPOINTS,
	COZE_CONFIG,
	AUDIO_CONFIG,
	UI_CONFIG
}
