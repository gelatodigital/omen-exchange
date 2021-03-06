import React from 'react'

import { MarketMakerData, TaskReceipt } from '../../../../util/types'

import { MarketPoolLiquidity } from './market_pool_liquidity'

interface Props {
  marketMakerData: MarketMakerData
  gelatoTask?: {
    submittedTaskReceipt: TaskReceipt
    withdrawDate: Date
  }
  switchMarketTab: (arg0: string) => void
}

const MarketPoolLiquidityContainer: React.FC<Props> = (props: Props) => {
  const { marketMakerData, /*gelatoTask*/ switchMarketTab } = props

  return (
    <MarketPoolLiquidity
      /*gelatoTask={gelatoTask}*/ marketMakerData={marketMakerData}
      switchMarketTab={switchMarketTab}
    />
  )
}

export { MarketPoolLiquidityContainer }
