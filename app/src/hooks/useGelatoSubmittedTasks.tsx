import { BigNumber } from 'ethers/utils'
import { useEffect, useState } from 'react'

import { CPKService } from '../services'
import { TaskReceipt } from '../util/types'

import { ConnectedWeb3Context } from './connectedWeb3'
import { useContracts } from './useContracts'

const fetchGelatoSubgraph = async (networkId: number, cpkAddress: string, skipNum: number) => {
  const graphName = networkId === 1 ? '' : '-rinkeby'
  console.log(graphName)
  const response = await fetch(`https://api.thegraph.com/subgraphs/name/gelatodigital/gelato-network${graphName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `{
        taskReceiptWrappers(where: {user: "${cpkAddress}"}) {
          taskReceipt {
            id
            userProxy
            provider {
              addr
              module
            }
            index
            tasks {
              conditions {
                inst
                data
              }
              actions {
                addr
                data
                operation
                dataFlow
                value
                termsOkCheck
              }
              selfProviderGasLimit
              selfProviderGasPriceCeil
            }
            expiryDate
            cycleId
            submissionsLeft
          }
          submissionHash
          status
          submissionDate
          executionDate
          executionHash
          selfProvided
        }
    }
                `,
    }),
  })
  const json = await response.json()
  return json
}

export const useGelatoSubmittedTasks = (
  cpkAddress: string,
  marketMakerAddress: string,
  context: ConnectedWeb3Context,
) => {
  const { account, library: provider, networkId } = context
  const { gelatoAddressStorage } = useContracts(context)

  // const { buildMarketMaker } = useContracts(context)

  const [submittedTaskReceipt, setSubmittedTaskReceipt] = useState<TaskReceipt | null>(null)

  const storegeGelatoDataInState = async () => {
    const result = await fetchGelatoSubgraph(networkId, cpkAddress.toLowerCase(), 0)
    console.log('########')
    console.log(result)
    console.log('########')
    const taskReceiptWrappers = result.data.taskReceiptWrappers
    console.log(taskReceiptWrappers)

    // For every TaskReceipt
    for (const wrapper of taskReceiptWrappers) {
      const taskData: string = wrapper.taskReceipt.tasks[0].actions[0].data
      console.log(taskData)
      const decodedData = await gelatoAddressStorage.decodeSubmitTimeBasedWithdrawalTask(taskData)
    }
  }

  useEffect(() => {
    storegeGelatoDataInState()
  }, [storegeGelatoDataInState])

  // useEffect(() => {
  //   const fetchFundingBalance = async () => {
  //     let fundingBalance = new BigNumber(0)

  //     if (account) {
  //       const cpk = await CPKService.create(provider)
  //       const marketMaker = buildMarketMaker(marketMakerAddress)
  //       fundingBalance = await marketMaker.balanceOf(cpk.address)
  //     }

  //     setFundingBalance(fundingBalance)
  //   }
  //   fetchFundingBalance()
  // }, [account, provider, buildMarketMaker, marketMakerAddress])

  // return fundingBalance
}
