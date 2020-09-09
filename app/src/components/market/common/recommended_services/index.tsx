import React, { DOMAttributes } from 'react'
import styled from 'styled-components'

import { GelatoData, Token } from '../../../../util/types'
import { ButtonCircle } from '../../../button'
import { DateField, FormRow } from '../../../common'
import { IconAdd } from '../../../common/icons/IconAdd'
import { IconFilter } from '../../../common/icons/IconFilter'
import { IconGelato } from '../../../common/icons/IconGelato'
import { IconRemove } from '../../../common/icons/IconRemove'
import { GelatoConditions } from '../gelato_conditions'
import { ToggleTokenLockProps } from '../toggle_token_lock'

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
  border: 1px solid ${props => props.theme.borders.borderColorLighter};
  flex-direction: ${props => (props.isRow ? 'row' : 'column')};
  display: flex;
  padding: 21px 25px;
  align-items: stretch;
`

const Description = styled.p`
  color: ${props => props.theme.colors.textColorLightish};
  font-size: 14px;
  letter-spacing: 0.2px;
  line-height: 1.4;
  margin: 0 25px 0 0;
`

const ConditionDetails = styled.p`
  color: ${props => props.theme.colors.textColorLightish};
  font-size: 14px;
  letter-spacing: 0.2px;
  line-height: 1.4;
`

const TitleAndDescription = styled.div`
  margin-left: 8px;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
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

export type RecommendedServicesProps = DOMAttributes<HTMLDivElement> & {
  collateral: Token
  noMarginBottom: boolean
  resolution: Date
  gelatoCondition: GelatoData
  handleGelatoConditionChange: (gelatoCondition: GelatoData) => any
  handleGelatoConditionInputsChange: (newDate: Date | null) => any
}

export const RecommendedServices: React.FC<RecommendedServicesProps> = (props: RecommendedServicesProps) => {
  const {
    collateral,
    gelatoCondition,
    handleGelatoConditionChange,
    handleGelatoConditionInputsChange,
    noMarginBottom,
    resolution,
    ...restProps
  } = props

  const [active, setActive] = React.useState(false)
  const [customizable, setCustomizable] = React.useState(false)

  const resolutionDateCopy = new Date(resolution)
  if (gelatoCondition.inputs === null)
    gelatoCondition.inputs = new Date(resolutionDateCopy.setDate(resolutionDateCopy.getDate() - 3)) // Now - 3 days

  const daysBeforeWithdraw = Math.round(
    (Date.parse(resolution.toString()) - Date.parse(gelatoCondition.inputs.toString())) / 1000 / 60 / 60 / 24,
  )

  const toggleActive = () => {
    if (active) {
      console.log('deactivate ')
      const newGelatoCondition = {
        ...gelatoCondition,
      }
      newGelatoCondition.isSelectionEnabled = false
      handleGelatoConditionChange(newGelatoCondition)
      setActive(false)
    } else {
      console.log('activate')
      const newGelatoCondition = {
        ...gelatoCondition,
      }
      newGelatoCondition.isSelectionEnabled = true
      handleGelatoConditionChange(newGelatoCondition)
      setActive(true)
    }
  }

  const toggleCustomizable = () => {
    console.log('Toggle Customizable')
    setCustomizable(!customizable)
  }

  return (
    <Wrapper noMarginBottom={noMarginBottom} {...restProps}>
      <Title>Recommended Services</Title>
      <DescriptionWrapper isRow={true}>
        <ButtonCircleStyled active={true} disabled={false}>
          <IconGelato />
        </ButtonCircleStyled>
        <TitleAndDescription>
          <Description>Gelato</Description>
          <Description>{`Automatically withdraw liquidity ${daysBeforeWithdraw} days before market ends`}</Description>
        </TitleAndDescription>

        <ButtonCircleStyled
          active={active ? true : false}
          disabled={active ? false : true}
          onClick={toggleCustomizable}
        >
          <IconFilter />
        </ButtonCircleStyled>

        <ButtonCircleStyled active={true} disabled={false} onClick={toggleActive}>
          {active && <IconRemove />}
          {!active && <IconAdd />}
        </ButtonCircleStyled>
      </DescriptionWrapper>
      {customizable && (
        <DescriptionWrapper isRow={false}>
          <ServiceDetails>
            <ConditionDetails>Withdraw Condition</ConditionDetails>
            <FormRow
              formField={
                <GelatoConditions
                  disabled={false}
                  onChangeGelatoCondition={handleGelatoConditionChange}
                  value={gelatoCondition}
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
                  onChange={handleGelatoConditionInputsChange}
                  selected={gelatoCondition.inputs}
                />
              }
            />
          </ServiceDetails>
          <Description>
            {`Gelato will automatically withdraw your liquidity ${daysBeforeWithdraw} day(s) before the market will close on ${gelatoCondition.inputs}`}
          </Description>
        </DescriptionWrapper>
      )}
    </Wrapper>
  )
}
