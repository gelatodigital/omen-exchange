import { OperationType } from 'contract-proxy-kit/lib/cjs/utils/constants'
import { Contract, Wallet, ethers, utils } from 'ethers'
import { TransactionReceipt } from 'ethers/providers'
import { BigNumber } from 'ethers/utils'

import { getLogger } from '../util/logger'
import { isAddress, isContract } from '../util/tools'
import { MarketData, Token } from '../util/types'

const logger = getLogger('Services::Erc20')

const gelatoAddressStorageAbi = [
  'function getAddress(string _key) external view returns (address)',
  'function batchGetAddress(string[] _keys) public view returns (tuple(string key, address value)[] result)',
]

const gelatoCoreAbi = [
  'function submitTask(tuple(address addr, address module) _provider, tuple(tuple(address inst, bytes data)[] conditions, tuple(address addr, bytes data, uint8 operation, uint8 dataFlow, uint256 value, bool termsOkCheck)[] actions, uint256 selfProviderGasLimit, uint256 selfProviderGasPriceCeil) _task, uint256 _expiryDate)',
  'function cancelTask(tuple(uint256 id, address userProxy, tuple(address addr, address module) provider, uint256 index, tuple(tuple(address inst, bytes data)[] conditions, tuple(address addr, bytes data, uint8 operation, uint8 dataFlow, uint256 value, bool termsOkCheck)[] actions, uint256 selfProviderGasLimit, uint256 selfProviderGasPriceCeil)[] tasks, uint256 expiryDate, uint256 cycleId, uint256 submissionsLeft) _TR)',
]

const actionWithdrawLiquidutyAbi = [
  'function action(address _conditionalTokens, address _fixedProductMarketMaker, uint256[] _positionIds, bytes32 _conditionId, bytes32 _parentCollectionId, address _collateralToken, address _receiver)',
]

const gnosisSafeAbi = [
  'function enableModule(address module) public',
  'function getModules() public view returns (address[])',
]

interface SubmitTimeBasedWithdrawalData {
  marketData: MarketData
  conditionalTokensAddress: string
  fpmmAddress: string
  positionIds: number[]
  conditionId: string
  collateralTokenAddress: string
  receiver: string
}

interface KeyValue {
  key: string
  value: string
}

class GelatoService {
  provider: any
  contract: Contract

  constructor(provider: any, signerAddress: Maybe<string>, gelatoAddressStorageAddress: string) {
    this.provider = provider
    if (signerAddress) {
      const signer: Wallet = provider.getSigner()
      this.contract = new ethers.Contract(gelatoAddressStorageAddress, gelatoAddressStorageAbi, provider).connect(
        signer,
      )
    } else {
      this.contract = new ethers.Contract(gelatoAddressStorageAddress, gelatoAddressStorageAbi, provider)
    }
  }

  get address(): string {
    return this.contract.address
  }

  getAddressFromAddressStorage = (addresses: any[], name: string): string => {
    const keyValue = addresses.find((keyValue: any) => keyValue.key === name)
    if (keyValue) return keyValue.value
    else throw Error('Address not Found in Gelato Address Storage')
  }

  /**
   * @returns The Address of the Gelato Core Contract
   */
  getGelatoCoreAddress = async (): Promise<string> => {
    return this.contract.getAddress('gelatoCore')
  }

  /**
   * @returns The Address of the Gelato Core Contract
   */
  getGnosisSafeModuleAddress = async (): Promise<string> => {
    return this.contract.getAddress('providerModuleGnosisSafe')
  }

  /**
   * @returns The Address of the Gelato Core Contract
   */
  getGelatoExecutorAddress = async (): Promise<string> => {
    return this.contract.getAddress('gelatoExecutor')
  }

  /**
   * @returns The Address of the Gelato Core Contract
   */
  getGelatoProviderAddress = async (): Promise<string> => {
    return this.contract.getAddress('gelatoProvider')
  }

  /**
   * @returns The Address of the Gelato Core Contract
   */
  getTimeConditionAddress = async (): Promise<string> => {
    return this.contract.getAddress('conditionTime')
  }

  /**
   * @returns The Address of the Gelato Core Contract
   */
  getActionWithdrawLiquidityAddress = async (): Promise<string> => {
    return this.contract.getAddress('actionWithdrawLiquidityOmen')
  }

  getAddressesFromStorage = async (keys: string[]): Promise<any> => {
    return this.contract.batchGetAddress(keys)
  }

  /**
   * Encode Submit Task Transaction.
   */
  encodeSubmitTimeBasedWithdrawalTask = async (taskData: SubmitTimeBasedWithdrawalData): Promise<string> => {
    // const gelatoCoreAddress = await this.getGelatoCoreAddress()

    // const providerAddress = await this.getGelatoProviderAddress()
    // const gnosisSafeModuleAddress = await this.getGnosisSafeModuleAddress()
    // const timeConditionAddress = await this.getTimeConditionAddress()
    // const actionWithdrawLiquidityAddress = await this.getTimeConditionAddress()
    const gAddresses = await this.getAddressesFromStorage([
      'gelatoCore',
      'gelatoProvider',
      'providerModuleGnosisSafe',
      'conditionTime',
      'actionWithdrawLiquidityOmen',
    ])

    console.log(gAddresses)

    const gelatoCoreAddress = this.getAddressFromAddressStorage(gAddresses, 'gelatoCore')
    console.log(gelatoCoreAddress)
    console.log(gAddresses[0].key)
    const gelatoCore = new ethers.Contract(gelatoCoreAddress, gelatoCoreAbi, this.provider)

    const gelatoProvider = {
      addr: this.getAddressFromAddressStorage(gAddresses, 'gelatoProvider'),
      module: this.getAddressFromAddressStorage(gAddresses, 'providerModuleGnosisSafe'),
    }

    if (taskData.marketData.gelatoCondition.inputs === null) throw Error('Need Date')

    const timestamp = Date.parse(taskData.marketData.gelatoCondition.inputs.toString()) / 1000
    console.log(`Timestamp: ${timestamp}`)
    const condition = {
      inst: this.getAddressFromAddressStorage(gAddresses, 'conditionTime'),
      data: ethers.utils.defaultAbiCoder.encode(['uint'], [timestamp]),
    }

    const actionWithdrawLiquidityInterface = new utils.Interface(actionWithdrawLiquidutyAbi)

    const actionWithdrawLiquidityData = actionWithdrawLiquidityInterface.functions.action.encode([
      taskData.conditionalTokensAddress,
      taskData.fpmmAddress,
      taskData.positionIds,
      taskData.conditionId,
      ethers.constants.HashZero,
      taskData.collateralTokenAddress,
      taskData.receiver,
    ])

    const action = {
      addr: this.getAddressFromAddressStorage(gAddresses, 'actionWithdrawLiquidityOmen'),
      data: actionWithdrawLiquidityData,
      operation: OperationType.DelegateCall,
      dataFlow: 0, // None,
      value: 0, // None,
      termsOkCheck: false,
    }

    console.log(condition)
    console.log(action)

    const task = {
      conditions: [condition],
      actions: [action],
      selfProviderGasLimit: 0, // not applicable
      selfProviderGasPriceCeil: 0, // not applicable
    }

    const expiryDate = 0 // Not expiring

    return gelatoCore.interface.functions.submitTask.encode([gelatoProvider, task, expiryDate])
  }

  encodeWhitelistGelatoAsModule = async (): Promise<string> => {
    const gelatoCoreAddress = await this.getGelatoCoreAddress()
    const gnosisSafeInterface = new ethers.utils.Interface(gnosisSafeAbi)
    return gnosisSafeInterface.functions.enableModule.encode([gelatoCoreAddress])
  }

  decodeSubmitTimeBasedWithdrawalTask = async (hexData: string): Promise<any> => {
    const data = ethers.utils.defaultAbiCoder.decode(
      ['address', 'address', 'uint256[]', 'bytes32', 'bytes32', 'address', 'address'],
      ethers.utils.hexDataSlice(hexData, 4),
    )
    console.log(data)
    return data
  }

  isGelatoWhitelistedModule = async (safeAddress: string): Promise<boolean> => {
    const gelatoCoreAddress = await this.getGelatoCoreAddress()
    const gnosisSafe = new ethers.Contract(safeAddress, gnosisSafeAbi, this.provider)
    const modules = await gnosisSafe.getModules()
    console.log(modules)
    let isModule = false
    modules.forEach((module: string) => {
      if (ethers.utils.getAddress(module) === ethers.utils.getAddress(gelatoCoreAddress)) isModule = true
    })
    console.log(isModule ? 'Gelato already Whitelisted' : 'Gelato not yet whitelited')
    return isModule
  }
}

export { GelatoService }
