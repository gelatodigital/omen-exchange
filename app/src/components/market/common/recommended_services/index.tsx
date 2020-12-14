import React, { DOMAttributes } from 'react'
import styled from 'styled-components'

import { formatDate } from '../../../../util/tools'
import { GelatoData } from '../../../../util/types'
import { ButtonCircle } from '../../../button'
import { DateField, FormRow } from '../../../common'
import { IconAlert } from '../../../common/icons/IconAlert'
import { IconCheckmark } from '../../../common/icons/IconCheckmark'
import { IconCheckmarkFilled } from '../../../common/icons/IconCheckmarkFilled'
import { IconClock } from '../../../common/icons/IconClock'
import { IconFilter } from '../../../common/icons/IconFilter'
import { IconGelato } from '../../../common/icons/IconGelato'
import { GelatoConditions } from '../gelato_conditions'

const Wrapper = styled.div<{ noMarginBottom: boolean }>`
  ${props => (props.noMarginBottom ? 'margin-bottom: 0;' : 'margin-bottom: 24px')};
`

// const GridTransactionDetailsStyled = styled(GridTransactionDetails)<{ noMarginTop: boolean }>`
//   ${props => (props.noMarginTop ? 'margin-top: 0;' : '')};
// `

const Title = styled.h2`
  color: ${props => props.theme.colors.textColorDarker};
  font-size: 16px;
  letter-spacing: 0.4px;
  line-height: 1.2;
  margin: 0 0 20px;
  font-weight: 400;
`

const DescriptionWrapper = styled.div<{ isRow: boolean }>`
  align-items: center;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.borders.borderDisabled};
  padding: 21px 25px;
  flex-direction: ${props => (props.isRow ? 'row' : 'column')};
  display: flex;
  align-items: stretch;
`

const Description = styled.p<{ textAlignRight: boolean }>`
  color: ${props => props.theme.colors.textColorLightish};
  font-size: 14px;
  letter-spacing: 0.2px;
  line-height: 1.4;
  margin: 0 25px 0 0;
  text-align: ${props => (props.textAlignRight ? 'right' : 'left')};
  vertical-align: middle;
  display: inline-block;
`

const SubDescription = styled.p<{ textAlignRight: boolean }>`
  color: ${props => props.theme.colors.textColorLightish};
  font-size: 14px;
  letter-spacing: 0.2px;
  line-height: 1.4;
  margin: 2px 0 0 0;
  text-align: ${props => (props.textAlignRight ? 'right' : 'left')};
  vertical-align: middle;
  display: inline-block;
`

const TaskStatusBox = styled.div`
  display: flex;
  align-items: start;
  flex-direction: row;
`

const TaskStatus = styled.p<{ color: string }>`
  color: ${props => props.color};
  font-size: 14px;
  fontWeight: 500
  letter-spacing: 0.2px;
  line-height: 1.4;
  margin: 0 4px 0 0;
  text-align: right;
  vertical-align: middle;
  display: inline-block;
`

const ConditionDetails = styled.p`
  color: ${props => props.theme.colors.textColorLightish};
  font-size: 14px;
  letter-spacing: 0.2px;
  line-height: 1.4;
`

const TitleAndDescription = styled.div<{ alignItemsEnd: boolean }>`
  margin-left: 8px;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: ${props => (props.alignItemsEnd ? 'flex-end' : 'flex-start')};
  justify-content: center;
`

const ServiceDetails = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 8px;
`

const ButtonCircleStyled = styled(ButtonCircle)<{ disabled?: boolean }>`
  svg {
    filter: ${props =>
      props.disabled
        ? 'invert(46%) sepia(0%) saturate(1168%) hue-rotate(183deg) brightness(99%) contrast(89%)'
        : 'none'};
  }
  margin-right: 5px;
`
// ${props => props.theme.colors.secondary}
const ButtonCircleStyledFilled = styled(ButtonCircle)`
  svg {
    fill: 'white';
  }
  background-color: #7986cb;
  margin-right: 5px;
`

// filter: invert(100%)
// vertical-align: middle;
const IconStyled = styled.div<{ color?: string }>`
  line-height: 1;
  svg {
    fill: ${props => props.color};
    width: 0.9rem;
    height: 0.9rem;
    vertical-align: inherit;
  }
`
const GelatoIconCircle = styled.button<{ active?: boolean }>`
  align-items: center;
  background-color: #fff;
  border-radius: 50%;
  border: 1px solid ${props => props.theme.colors.tertiary};
  display: flex;
  flex-shrink: 0;
  height: ${props => props.theme.buttonCircle.dimensions};
  justify-content: center;
  outline: none;
  padding: 0;
  transition: border-color 0.15s linear;
  user-select: none;
  width: ${props => props.theme.buttonCircle.dimensions};
`

export type RecommendedServicesProps = DOMAttributes<HTMLDivElement> & {
  noMarginBottom: boolean
  resolution: Date
  gelatoData: GelatoData
  isScheduled: boolean
  execSuccess?: boolean
  collateralToWithdraw?: string
  taskStatus?: string
  etherscanLink?: string
  handleGelatoDataChange: (gelatoData: GelatoData) => any
  handleGelatoDataInputsChange: (newDate: Date | null) => any
}

export const GelatoScheduler: React.FC<RecommendedServicesProps> = (props: RecommendedServicesProps) => {
  const {
    collateralToWithdraw,
    etherscanLink,
    gelatoData,
    handleGelatoDataChange,
    handleGelatoDataInputsChange,
    isScheduled,
    noMarginBottom,
    resolution,
    taskStatus,
    ...restProps
  } = props

  const [active, setActive] = React.useState(false)
  const [customizable, setCustomizable] = React.useState(false)

  // Set gelatoInputs default to resolution - 3 days
  const resolutionDateCopy = new Date(resolution)
  if (!gelatoData.inputs) gelatoData.inputs = new Date(resolutionDateCopy.setDate(resolutionDateCopy.getDate() - 3))

  const daysBeforeWithdraw = Math.round(
    (Date.parse(resolution.toString()) - Date.parse(gelatoData.inputs.toString())) / 1000 / 60 / 60 / 24,
  )

  const toggleActive = () => {
    if (active) {
      // deactivate
      const newGelatoCondition = {
        ...gelatoData,
      }
      newGelatoCondition.shouldSubmit = false
      handleGelatoDataChange(newGelatoCondition)
      setActive(false)
    } else {
      // activate
      const newGelatoCondition = {
        ...gelatoData,
      }
      newGelatoCondition.shouldSubmit = true
      handleGelatoDataChange(newGelatoCondition)
      setActive(true)
    }
  }

  const toggleCustomizable = () => {
    setCustomizable(!customizable)
  }

  const getCorrectTimeString = (withdrawalDate: Date) => {
    const daysUntilAutoWithdraw = Math.round(
      (Date.parse(withdrawalDate.toString()) - Date.parse(new Date().toString())) / 1000 / 60 / 60 / 24,
    )
    const hoursUntilAutoWithdraw = Math.round(
      (Date.parse(withdrawalDate.toString()) - Date.parse(new Date().toString())) / 1000 / 60 / 60,
    )

    const minUntilAutoWithdraw = Math.round(
      (Date.parse(withdrawalDate.toString()) - Date.parse(new Date().toString())) / 1000 / 60,
    )

    let displayText = `${daysUntilAutoWithdraw} days`
    if (daysUntilAutoWithdraw === 0)
      if (hoursUntilAutoWithdraw === 0)
        if (minUntilAutoWithdraw === 0) displayText = `now`
        else displayText = `${minUntilAutoWithdraw} minutes`
      else displayText = `${hoursUntilAutoWithdraw} hours`

    return displayText
  }

  const getTaskStatus = (status: string, withdrawalDate: Date) => {
    const displayText = getCorrectTimeString(withdrawalDate)
    switch (status) {
      case 'awaitingExec':
        return (
          <TaskStatusBox>
            <TaskStatus color="green">{`scheduled in ${displayText}`}</TaskStatus>
            <IconStyled color={'green'}>
              <IconClock></IconClock>
            </IconStyled>
          </TaskStatusBox>
        )
      case 'execSuccess':
        return (
          <TaskStatusBox>
            <TaskStatus color="green">{`successful`}</TaskStatus>
            <IconStyled color={'green'}>
              <IconCheckmarkFilled></IconCheckmarkFilled>
            </IconStyled>
          </TaskStatusBox>
        )
      case 'execReverted':
        return (
          <TaskStatusBox>
            <TaskStatus color="red">{`failed`}</TaskStatus>
            <IconStyled color={'red'}>
              <IconAlert></IconAlert>
            </IconStyled>
          </TaskStatusBox>
        )
    }
  }

  return (
    <Wrapper noMarginBottom={noMarginBottom} {...restProps}>
      <Title>Recommended Services</Title>
      <DescriptionWrapper isRow={true}>
        <GelatoIconCircle>
          <IconGelato />
        </GelatoIconCircle>
        {!isScheduled && (
          <React.Fragment>
            <TitleAndDescription alignItemsEnd={false}>
              <Description style={{ fontWeight: 500 }} textAlignRight={false}>
                Gelato
              </Description>
              <Description
                textAlignRight={false}
              >{`Automatically withdraw liquidity ${daysBeforeWithdraw} days before market ends`}</Description>
            </TitleAndDescription>

            <ButtonCircleStyled
              active={active ? true : false}
              disabled={active ? false : true}
              onClick={toggleCustomizable}
            >
              <IconFilter />
            </ButtonCircleStyled>

            {!active && (
              <ButtonCircleStyled
                active={true}
                disabled={false}
                onClick={toggleActive}
                style={{ backgroundColor: 'white' }}
              >
                <IconStyled color={'blue'}>
                  <IconCheckmark />
                </IconStyled>
              </ButtonCircleStyled>
            )}
            {active && (
              <ButtonCircleStyledFilled onClick={toggleActive}>
                <IconStyled color={'white'}>
                  <IconCheckmark />
                </IconStyled>
              </ButtonCircleStyledFilled>
            )}
          </React.Fragment>
        )}
        {isScheduled && taskStatus && (
          <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row', width: '100%' }}>
            <TitleAndDescription alignItemsEnd={false}>
              <Description textAlignRight={false}>{`Auto-Withdraw ${
                taskStatus === 'execSuccess' ? '' : collateralToWithdraw
              }`}</Description>
              <SubDescription textAlignRight={false}>{`Powered by Gelato Network`}</SubDescription>
            </TitleAndDescription>

            <TitleAndDescription alignItemsEnd={true}>
              {getTaskStatus(taskStatus, gelatoData.inputs)}

              <SubDescription textAlignRight={true}>{`${formatDate(gelatoData.inputs)}`}</SubDescription>
            </TitleAndDescription>
          </div>
        )}
      </DescriptionWrapper>
      {taskStatus === 'awaitingExec' && (
        <DescriptionWrapper isRow={false}>
          <Description textAlignRight={false}>
            {`Gelato will automatically withdraw your liquidity of ${collateralToWithdraw} on ${formatDate(
              gelatoData.inputs,
            )}. You cancel the auto-withdraw by manually withdrawing your liquidity.`}
          </Description>
        </DescriptionWrapper>
      )}
      {taskStatus === 'execReverted' && (
        <DescriptionWrapper isRow={false}>
          <Description textAlignRight={false}>
            {`Your provided liquidity was insufficient on ${formatDate(
              gelatoData.inputs,
            )} to pay for for the withdrawal transaction.`}
          </Description>
        </DescriptionWrapper>
      )}
      {taskStatus === 'execSuccess' && (
        <DescriptionWrapper isRow={false}>
          <Description textAlignRight={false}>
            {`Your provided liquidity was successfully withdrawn on ${formatDate(
              gelatoData.inputs,
            )}. Check out the transaction `}
            <span>
              <a href={etherscanLink} rel="noopener noreferrer" style={{ color: '#1E88E5' }} target="_blank">
                here
              </a>
            </span>
            {'.'}
          </Description>
        </DescriptionWrapper>
      )}
      {customizable && (
        <DescriptionWrapper isRow={false}>
          <ServiceDetails>
            <ConditionDetails>Withdraw Condition</ConditionDetails>
            <FormRow
              formField={
                <GelatoConditions
                  disabled={false}
                  onChangeGelatoCondition={handleGelatoDataChange}
                  value={gelatoData}
                />
              }
            />
          </ServiceDetails>
          <ServiceDetails>
            <ConditionDetails>Withdraw Date and Time</ConditionDetails>
            <FormRow
              formField={
                <DateField
                  disabled={false}
                  maxDate={resolution}
                  minDate={new Date()}
                  name="gelato-date"
                  onChange={handleGelatoDataInputsChange}
                  selected={gelatoData.inputs}
                />
              }
            />
          </ServiceDetails>
          <Description textAlignRight={false}>
            {`Gelato will automatically withdraw your liquidity ${daysBeforeWithdraw} day(s) before the market will close on ${formatDate(
              gelatoData.inputs,
            )}`}
          </Description>
        </DescriptionWrapper>
      )}
    </Wrapper>
  )
}
