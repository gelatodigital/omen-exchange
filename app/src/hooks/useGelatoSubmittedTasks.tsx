import { utils } from 'ethers'
import { BigNumber } from 'ethers/utils'
import { useEffect, useState } from 'react'

import { CPKService } from '../services'
import { Status, TaskReceipt } from '../util/types'

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
  console.log('useGelatoSubmittedTasks')
  const { account, library: provider, networkId } = context
  const { gelatoAddressStorage } = useContracts(context)

  // const { buildMarketMaker } = useContracts(context)

  const [submittedTaskReceipt, setSubmittedTaskReceipt] = useState<TaskReceipt | null>(null)
  const [withdrawDate, setWithdrawDate] = useState<Date | null>(null)
  const [error, setError] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  const storeGelatoDataInState = async () => {
    console.log('Calling storeGelatoDataInState')
    try {
      const result = await fetchGelatoSubgraph(networkId, cpkAddress.toLowerCase(), 0)
      const taskReceiptWrappers = result.data.taskReceiptWrappers

      // For every TaskReceipt
      for (const wrapper of taskReceiptWrappers) {
        const taskData: string = wrapper.taskReceipt.tasks[0].actions[0].data

        const decodedData = await gelatoAddressStorage.decodeSubmitTimeBasedWithdrawalTask(taskData)
        const dedcodedMarketMakerAddress = decodedData[1]

        if (utils.getAddress(dedcodedMarketMakerAddress) === utils.getAddress(marketMakerAddress)) {
          setSubmittedTaskReceipt(wrapper.taskReceipt as TaskReceipt)
          const timestamp = await gelatoAddressStorage.decodeTimeConditionData(
            wrapper.taskReceipt.tasks[0].conditions[0].data,
          )

          const date = new Date(parseInt(timestamp) * 1000)

          setWithdrawDate(date)
        }
      }
      setLoading(true)
    } catch (error) {
      setError(true)
      setLoading(false)
    }
  }

  useEffect(() => {
    storeGelatoDataInState()
  }, [storeGelatoDataInState])

  return {
    submittedTaskReceipt,
    withdrawDate,
    status: error ? Status.Error : loading ? Status.Loading : Status.Ready,
  }
}
