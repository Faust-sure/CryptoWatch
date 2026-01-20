<!-- 加密货币轮播卡片组件 -->
<template>
	<view class="crypto-carousel">
		<view v-if="!cryptoData || cryptoData.length === 0" class="empty-card">
			<text class="empty-text">数据加载中...</text>
		</view>
		<swiper v-else class="swiper" :indicator-dots="true" :autoplay="false" :circular="true" 
			indicator-color="rgba(255,255,255,0.3)" indicator-active-color="#00d4ff">
			<swiper-item v-for="(coin, index) in cryptoData" :key="index">
				<view class="coin-card" :class="coin.change24h >= 0 ? 'positive' : 'negative'">
					<view class="coin-header">
						<text class="coin-symbol">{{ coin.symbol }}</text>
						<text class="coin-name">{{ coin.name }}</text>
					</view>
					<view class="coin-price">
						<text class="price-value">${{ formatPrice(coin.price) }}</text>
					</view>
					<view class="coin-change">
						<text class="change-arrow">{{ coin.change24h >= 0 ? '↑' : '↓' }}</text>
						<text class="change-value">{{ formatChange(coin.change24h) }}</text>
						<text class="change-percent">({{ formatPercent(coin.changePercent) }}%)</text>
					</view>
					<view class="coin-time">
						<text class="time-text">{{ formatTime(coin.timestamp) }}</text>
					</view>
				</view>
			</swiper-item>
		</swiper>
	</view>
</template>

<script>
export default {
	name: 'CryptoCarousel',
	props: {
		cryptoData: {
			type: Array,
			default: () => []
		}
	},
	methods: {
		formatPrice(price) {
			if (price >= 1000) {
				return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
			}
			return price.toFixed(4)
		},
		formatChange(change) {
			return Math.abs(change).toFixed(2)
		},
		formatPercent(percent) {
			// percent已经是百分比（已乘以100），不需要再乘
			return Math.abs(percent).toFixed(2)
		},
		formatTime(timestamp) {
			if (!timestamp) return '实时数据'
			const date = new Date(timestamp)
			const hours = date.getHours().toString().padStart(2, '0')
			const minutes = date.getMinutes().toString().padStart(2, '0')
			const seconds = date.getSeconds().toString().padStart(2, '0')
			return `${hours}:${minutes}:${seconds}`
		}
	}
}
</script>

<style scoped>
.crypto-carousel {
	width: 100%;
	height: 200rpx;
	margin-bottom: 20rpx;
}

.empty-card {
	width: 90%;
	height: 90%;
	margin: 0 auto;
	border-radius: 20rpx;
	padding: 20rpx;
	background: rgba(255, 255, 255, 0.08);
	border: 1rpx solid rgba(255, 255, 255, 0.15);
	display: flex;
	align-items: center;
	justify-content: center;
}

.empty-text {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.7);
}

.swiper {
	width: 100%;
	height: 100%;
}

.coin-card {
	width: 90%;
	height: 90%;
	margin: 0 auto;
	border-radius: 20rpx;
	padding: 20rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.coin-card.positive {
	background: linear-gradient(135deg, #0f4c75 0%, #1b6ca8 100%);
}

.coin-card.negative {
	background: linear-gradient(135deg, #c94b4b 0%, #a83232 100%);
}

.coin-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.coin-symbol {
	font-size: 32rpx;
	font-weight: bold;
	color: #fff;
}

.coin-name {
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.7);
}

.coin-price {
	margin: 10rpx 0;
}

.price-value {
	font-size: 48rpx;
	font-weight: bold;
	color: #fff;
}

.coin-change {
	display: flex;
	align-items: baseline;
}

.change-arrow {
	font-size: 28rpx;
	margin-right: 8rpx;
	color: #fff;
}

.change-value {
	font-size: 24rpx;
	color: #fff;
	margin-right: 8rpx;
}

.change-percent {
	font-size: 20rpx;
	color: rgba(255, 255, 255, 0.8);
}

.coin-time {
	text-align: right;
}

.time-text {
	font-size: 20rpx;
	color: rgba(255, 255, 255, 0.6);
}
</style>
