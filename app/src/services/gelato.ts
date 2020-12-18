import * as UNISWAP from '@uniswap/sdk'
import { Wallet, ethers, utils } from 'ethers'
import { BigNumber } from 'ethers/utils'

import { GelatoData, Operation, TaskReceipt } from '../util/types'

const GELATO_MIN_USD_THRESH = 500
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

const gelatoContracts = {
  abis: {
    gelatoCore: gelatoCoreAbi,
    actionWithdrawLiquidity: actionWithdrawLiquidutyAbi,
    gnosisSafe: gnosisSafeAbi,
  },
  addresses: {
    rinkeby: {
      gelatoCore: '0x733aDEf4f8346FD96107d8d6605eA9ab5645d632',
      gelatoProvider: '0x01056a4A95a88035af4fC9fD9fD4d4563dd284C3',
      providerModuleGnosisSafe: '0x2661B579243c49988D9eDAf114Bfac5c5E249287',
      conditionTime: '0xC92Bc7c905d52B4bC4d60719a8Bce3B643d77daF',
      actionWithdrawLiquidity: '0x101F34DD8B3B831E1579D5Cb62221bbdA11186A2',
      dai: '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa',
    },
    mainnet: {
      gelatoCore: '0x025030bdaa159f281cae63873e68313a703725a5',
      gelatoProvider: '0x5B753BF02a42bC73B5846dfd16a8F2e082b99a6a',
      providerModuleGnosisSafe: '0x2E87AD9BBdaa9113cd5cA1920c624E2749D7086B',
      conditionTime: '0x63129681c487d231aa9148e1e21837165f38deaf',
      actionWithdrawLiquidity: '0x301E130DAA16B2F8FAeB21E1a328EAB0d606AC12',
      dai: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    },
  },
}

interface SubmitTimeBasedWithdrawalData {
  gelatoData: GelatoData
  conditionalTokensAddress: string
  fpmmAddress: string
  positionIds: number[]
  conditionId: string
  collateralTokenAddress: string
  receiver: string
}

const getUniswapPrice = async (amountWei: number, fromCurrency: any, toCurrency: any, provider: any) => {
  const pair = await UNISWAP.Fetcher.fetchPairData(toCurrency, fromCurrency, provider)
  const route = new UNISWAP.Route([pair], fromCurrency)
  const trade = new UNISWAP.Trade(
    route,
    new UNISWAP.TokenAmount(fromCurrency, amountWei.toString()),
    UNISWAP.TradeType.EXACT_INPUT,
  )
  return trade.executionPrice.toSignificant(6)
}
// interface KeyValue {
//   key: string
//   value: string
// }

class GelatoService {
  provider: any
  signer: any
  addresses: any
  networkId: number

  constructor(provider: any, signerAddress: Maybe<string>, networkId: number) {
    this.provider = provider
    this.signer = null
    this.networkId = networkId
    if (networkId == 1) {
      this.addresses = gelatoContracts.addresses.mainnet
    } else if (networkId == 4) {
      this.addresses = gelatoContracts.addresses.rinkeby
    } else {
      throw Error(`unknown networkId: ${networkId}`)
    }
    if (signerAddress) {
      const mySigner: Wallet = provider.getSigner()
      this.signer = mySigner
    }
  }

  /**
   * Encode Submit Task Transaction.
   */
  encodeSubmitTimeBasedWithdrawalTask = async (taskData: SubmitTimeBasedWithdrawalData): Promise<string> => {
    const gelatoCoreInterface = new ethers.utils.Interface(gelatoCoreAbi)

    const gelatoProvider = {
      addr: this.addresses.gelatoProvider,
      module: this.addresses.providerModuleGnosisSafe,
    }

    if (taskData.gelatoData.inputs === null) throw Error('Need Date')

    const timestamp = Date.parse(taskData.gelatoData.inputs.toString()) / 1000

    const condition = {
      inst: this.addresses.conditionTime,
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
      addr: this.addresses.actionWithdrawLiquidity,
      data: actionWithdrawLiquidityData,
      operation: Operation.Delegatecall,
      dataFlow: 0, // None
      value: 0, // None
      termsOkCheck: false,
    }

    const task = {
      conditions: [condition],
      actions: [action],
      selfProviderGasLimit: 0, // not applicable
      selfProviderGasPriceCeil: 0, // not applicable
    }

    const expiryDate = 0 // Not expiring

    return gelatoCoreInterface.functions.submitTask.encode([gelatoProvider, task, expiryDate])
  }

  encodeCancelTask = (taskReceipt: TaskReceipt): string => {
    const gelatoCoreInterface = new ethers.utils.Interface(gelatoCoreAbi)
    return gelatoCoreInterface.functions.cancelTask.encode([taskReceipt])
  }

  encodeWhitelistGelatoAsModule = async (): Promise<string> => {
    const gnosisSafeInterface = new ethers.utils.Interface(gnosisSafeAbi)
    return gnosisSafeInterface.functions.enableModule.encode([this.addresses.gelatoCore])
  }

  decodeSubmitTimeBasedWithdrawalTask = async (hexData: string): Promise<any> => {
    const data = ethers.utils.defaultAbiCoder.decode(
      ['address', 'address', 'uint256[]', 'bytes32', 'bytes32', 'address', 'address'],
      ethers.utils.hexDataSlice(hexData, 4),
    )
    return data
  }

  decodeTimeConditionData = async (hexData: string): Promise<any> => {
    const data = ethers.utils.defaultAbiCoder.decode(['uint256'], hexData)
    return data
  }

  isGelatoWhitelistedModule = async (safeAddress: string): Promise<boolean> => {
    try {
      const gnosisSafe = new ethers.Contract(safeAddress, gnosisSafeAbi, this.provider)
      const modules = await gnosisSafe.getModules()
      let isModule = false
      modules.forEach((module: string) => {
        if (ethers.utils.getAddress(module) === ethers.utils.getAddress(this.addresses.gelatoCore)) isModule = true
      })
      return isModule
    } catch {
      return false
    }
  }

  /**
   * Check if transaction meets minimum threshold
   */
  meetsMinimumThreshold = async (amount: BigNumber, address: string, decimals: number): Promise<boolean> => {
    const nTokens = Number(ethers.utils.formatUnits(amount.toString(), decimals))
    console.log(`fund amount check: ${nTokens}`)
    let price = 1
    try {
      if (address.toLowerCase() !== this.addresses.dai.toLowerCase()) {
        price = await this.findTokenUsdPrice(address)
        console.log(`calculated price: ${price}`)
      }
      if (price * nTokens >= GELATO_MIN_USD_THRESH) {
        return true
      }
      return false
    } catch {
      return false
    }
  }

  findTokenUsdPrice = async (address: string): Promise<number> => {
    const tokenContract = new ethers.Contract(address, ['function decimals() pure returns (uint8)'], this.provider)
    const decimals = await tokenContract.decimals()
    const TOK = new UNISWAP.Token(this.networkId, address, Number(decimals))
    const DAI = new UNISWAP.Token(this.networkId, this.addresses.dai, Number(decimals))
    return Number(await getUniswapPrice(10 ** Number(decimals), TOK, DAI, this.provider))
  }
}

export { GelatoService }
