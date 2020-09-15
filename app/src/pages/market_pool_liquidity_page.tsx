import React from 'react'

import { MarketPoolLiquidityContainer } from '../components'
import { MarketMakerData, TaskReceipt } from '../util/types'

type Props = {
  marketMakerData: MarketMakerData
  // gelatoTask?: {
  //   submittedTaskReceipt: TaskReceipt
  //   withdrawDate: Date
  // }
}

const MarketPoolLiquidityPage: React.FC<Props> = props => {
  return <MarketPoolLiquidityContainer /*gelatoTask={props.gelatoTask}*/ marketMakerData={props.marketMakerData} />
}

export { MarketPoolLiquidityPage }
