import { useQuery } from '@apollo/react-hooks'
import { utils } from 'ethers'
import { useEffect, useState } from 'react'

import { GelatoSubmitted } from '../queries/gelato'
import { getLogger } from '../util/logger'
import { Status, TaskReceiptWrapper } from '../util/types'

import { ConnectedWeb3Context } from './connectedWeb3'
import { useContracts } from './useContracts'

const logger = getLogger('useGelatoSubmittedTasks')

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

export const useGelatoSubmittedTasks = (
  cpkAddress: string | null,
  marketMakerAddress: string,
  context: ConnectedWeb3Context,
) => {
  const { networkId } = context
  const { gelato } = useContracts(context)

  const [submittedTaskReceiptWrapper, setSubmittedTaskReceiptWrapper] = useState<TaskReceiptWrapper | null>(null)
  const [withdrawDate, setWithdrawDate] = useState<Date | null>(null)
  const [etherscanLink, setEtherscanLink] = useState<string | null>(null)
  const [needUpdate, setNeedUpdate] = useState<boolean>(false)
  const [taskLength, setTaskLength] = useState<number>(0)

  const { data: GelatoSubmittedData, error } = useQuery(GelatoSubmitted, {
    notifyOnNetworkStatusChange: true,
    variables: { user: cpkAddress != null ? cpkAddress.toLowerCase() : null },
  })

  const storeGelatoDataInState = async () => {
    if (cpkAddress) {
      const taskReceiptWrappers = GelatoSubmittedData.taskReceiptWrappers as TaskReceiptWrapper[]
      // For every TaskReceipt
      const wrappers = [] as TaskReceiptWrapper[]
      for (const wrapper of taskReceiptWrappers) {
        const taskData: string = wrapper.taskReceipt.tasks[0].actions[0].data
        const decodedData = await gelato.decodeSubmitTimeBasedWithdrawalTask(taskData)
        const dedcodedMarketMakerAddress = decodedData[1]
        if (utils.getAddress(dedcodedMarketMakerAddress) === utils.getAddress(marketMakerAddress)) {
          wrappers.push(wrapper)
        }
      }

      // Return the last task receipt
      if (wrappers.length > 0) {
        const lastWrapper = wrappers[wrappers.length - 1]
        setSubmittedTaskReceiptWrapper(lastWrapper)
        const timestamp = await gelato.decodeTimeConditionData(lastWrapper.taskReceipt.tasks[0].conditions[0].data)
        const date = new Date(parseInt(timestamp) * 1000)
        setWithdrawDate(date)

        if (lastWrapper.status === 'execSuccess') {
          const link = `https://${getEtherscanPrefix(networkId)}etherscan.io/tx/${lastWrapper.executionHash}`
          setEtherscanLink(link)
        }
      }
      setNeedUpdate(false)
    }
  }

  if (
    GelatoSubmittedData &&
    GelatoSubmittedData.taskReceiptWrappers &&
    GelatoSubmittedData.taskReceiptWrappers.length > 0
  ) {
    if (needUpdate) {
      try {
        storeGelatoDataInState()
      } catch (err) {
        logger.log(err.message)
      }
    } else {
      if (taskLength != GelatoSubmittedData.taskReceiptWrappers.length) {
        setTaskLength(GelatoSubmittedData.taskReceiptWrappers.length)
      }
    }
  }

  useEffect(() => {
    setNeedUpdate(true)
  }, [cpkAddress, taskLength])

  return {
    submittedTaskReceiptWrapper,
    etherscanLink,
    withdrawDate,
    status: error ? Status.Error : Status.Ready,
  }
}
