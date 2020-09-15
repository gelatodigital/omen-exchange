import { useInterval } from '@react-corekit/use-interval'
import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router'

import { FETCH_DETAILS_INTERVAL, MAX_MARKET_FEE } from '../../../common/constants'
import { useCheckContractExists, useContracts, useConnectedCPKContext, useMarketMakerData } from '../../../hooks'
import { useConnectedWeb3Context } from '../../../hooks/connectedWeb3'
// import { useGelatoSubmittedTasks } from '../../../hooks/useGelatoSubmittedTasks'
import { MarketBuyPage, MarketDetailsPage, MarketPoolLiquidityPage, MarketSellPage } from '../../../pages'
import { getLogger } from '../../../util/logger'
import { isAddress } from '../../../util/tools'
import { ThreeBoxComments } from '../../comments'
import { InlineLoading } from '../../loading'
import { MarketNotFound } from '../sections/market_not_found'

const logger = getLogger('Market::Routes')

interface RouteParams {
  address: string
}

interface Props {
  marketMakerAddress: string
}

// Add Gelato Condition Data Fetching here
const MarketValidation: React.FC<Props> = (props: Props) => {
  console.log('Market Routes')
  const context = useConnectedWeb3Context()
  const { account, library: provider } = context

  const { marketMakerAddress } = props

  // Validate contract REALLY exists
  const contractExists = useCheckContractExists(marketMakerAddress, context)

  const { fetchData, fetchGraphMarketMakerData, marketMakerData } = useMarketMakerData(marketMakerAddress.toLowerCase())

  useInterval(fetchData, FETCH_DETAILS_INTERVAL)
  if (!contractExists) {
    logger.log(`Market address not found`)
    return <MarketNotFound />
  }

  if (!marketMakerData) {
    return <InlineLoading />
  }

  // <Switch>
  // <Route
  //   exact
  //   path="/:address"
  //   render={props => (
  //     <>
  //       <MarketDetailsPage {...props} marketMakerData={marketMakerData} />
  //       <ThreeBoxComments threadName={marketMakerAddress} />
  //     </>
  //   )}
  // />
  // {!account ? (
  //   <Message text="Please connect to your wallet to open the market..." type={MessageType.warning} />
  // ) : (
  //   <Route
  //     exact
  //     path="/:address/pool-liquidity"
  //     render={props => (
  //       <MarketPoolLiquidityPage
  //         {...props}
  //         gelatoTask={
  //           submittedTaskReceipt !== null && withdrawDate !== null
  //             ? { submittedTaskReceipt, withdrawDate }
  //             : undefined
  //         }
  //         marketMakerData={marketMakerData}
  //       />
  //     )}
  //   />
  // )}
  // {!account ? (
  //   <Message text="Please connect to your wallet to open the market..." type={MessageType.warning} />
  // ) : isQuestionFinalized ? (
  //   <Message text="Market closed, question finalized..." type={MessageType.warning} />
  // ) : (

  return (
    <>
      <MarketDetailsPage
        {...props}
        fetchGraphMarketMakerData={fetchGraphMarketMakerData}
        marketMakerData={marketMakerData}
      />
      <ThreeBoxComments threadName={marketMakerAddress} />
    </>
  )
}

const MarketRoutes = (props: RouteComponentProps<RouteParams>) => {
  const marketMakerAddress = props.match.params.address

  if (!isAddress(marketMakerAddress)) {
    logger.log(`Contract address not valid`)
    return <Redirect to="/" />
  }

  return <MarketValidation marketMakerAddress={marketMakerAddress} />
}

export { MarketRoutes }
