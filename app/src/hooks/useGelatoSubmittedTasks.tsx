import { utils } from 'ethers'
import { BigNumber } from 'ethers/utils'
import { useEffect, useState } from 'react'

import { CPKService } from '../services'
import { Status, TaskReceipt, TaskReceiptWrapper } from '../util/types'

import { ConnectedWeb3Context } from './connectedWeb3'
import { useContracts } from './useContracts'

const getEtherscanPrefix = (networkId: number) => {
  switch (networkId) {
    case 1:
      return ''
    case 3:
      return 'ropsten.'
    case 4:
      return 'rinkeby.'
    case 42:
      return 'kovan.'
  }
}

const fetchGelatoSubgraph = async (networkId: number, cpkAddress: string, skipNum: number) => {
  const graphName = networkId === 1 ? '' : '-rinkeby'
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
  cpkAddress: string | null,
  marketMakerAddress: string,
  context: ConnectedWeb3Context,
) => {
  const { account, library: provider, networkId } = context
  const { gelatoAddressStorage } = useContracts(context)

  // const { buildMarketMaker } = useContracts(context)

  const [submittedTaskReceiptWrapper, setSubmittedTaskReceiptWrapper] = useState<TaskReceiptWrapper | null>(null)
  const [withdrawDate, setWithdrawDate] = useState<Date | null>(null)
  const [etherscanLink, setEtherscanLink] = useState<string | null>(null)
  const [error, setError] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  const storeGelatoDataInState = async () => {
    try {
      if (cpkAddress) {
        const result = await fetchGelatoSubgraph(networkId, cpkAddress.toLowerCase(), 0)
        const taskReceiptWrappers = result.data.taskReceiptWrappers as TaskReceiptWrapper[]
        // For every TaskReceipt
        let wrappers = [] as TaskReceiptWrapper[]
        for (const wrapper of taskReceiptWrappers) {
          const taskData: string = wrapper.taskReceipt.tasks[0].actions[0].data
          const decodedData = await gelatoAddressStorage.decodeSubmitTimeBasedWithdrawalTask(taskData)
          const dedcodedMarketMakerAddress = decodedData[1]
          if (utils.getAddress(dedcodedMarketMakerAddress) === utils.getAddress(marketMakerAddress)) {
            wrappers.push(wrapper)
          }
        }

        // Return the last task receipt
        const lastWrapper = wrappers[wrappers.length - 1]
        setSubmittedTaskReceiptWrapper(lastWrapper)
        const timestamp = await gelatoAddressStorage.decodeTimeConditionData(
          lastWrapper.taskReceipt.tasks[0].conditions[0].data,
        )

        const date = new Date(parseInt(timestamp) * 1000)

        setWithdrawDate(date)

        if (lastWrapper.status === 'execSuccess') {
          const link = `https://${getEtherscanPrefix(networkId)}etherscan.io/tx/${lastWrapper.executionHash}`
          setEtherscanLink(link)
        }

        setLoading(true)
      }
    } catch (error) {
      setError(true)
      setLoading(false)
    }
  }

  useEffect(() => {
    storeGelatoDataInState()
  }, [cpkAddress])

  return {
    submittedTaskReceiptWrapper,
    etherscanLink,
    withdrawDate,
    status: error ? Status.Error : loading ? Status.Loading : Status.Ready,
  }
}
