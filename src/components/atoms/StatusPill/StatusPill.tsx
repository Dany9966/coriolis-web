/*
Copyright (C) 2017  Cloudbase Solutions SRL
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import React from 'react'
import { observer } from 'mobx-react'
import styled, { css } from 'styled-components'

import Palette from '../../styleUtils/Palette'
import StyleProps from '../../styleUtils/StyleProps'
import runningImage from './images/running.svg'
import cancellingImage from './images/cancelling.svg'

const LABEL_MAP: { [status: string]: string } = {
  CANCELED_FOR_DEBUGGING: 'DEBUG',
  FORCE_CANCELED: 'CANCELED',
  STRANDED_AFTER_DEADLOCK: 'DEADLOCKED',
  CANCELED_AFTER_COMPLETION: 'CANCELED',
  CANCELLING_AFTER_COMPLETION: 'CANCELLING',
  FAILED_TO_SCHEDULE: 'UNSCHEDULABLE',
}

const statuses = (status: any) => {
  switch (status) {
    case 'COMPLETED':
      return css`
        background: ${Palette.success};
        color: white;
        border-color: transparent;
      `
    case 'FAILED_TO_SCHEDULE':
    case 'ERROR':
      return css`
        background: ${Palette.alert};
        color: white;
        border-color: transparent;
      `
    case 'CANCELED':
    case 'CANCELED_FOR_DEBUGGING':
    case 'CANCELED_AFTER_COMPLETION':
    case 'FORCE_CANCELED':
      return css`
        background: ${Palette.warning};
        color: ${Palette.black};
        border-color: transparent;
      `
    case 'PAUSED':
      return css`
        background: white;
        color: ${Palette.primary};
        border-color: ${Palette.primary};
      `
    case 'STARTING':
    case 'RUNNING':
    case 'PENDING':
      return css`
        background: url('${runningImage}');
        animation: bgMotion 1s infinite linear;
        color: white;
        border-color: transparent;
        @keyframes bgMotion {
          0% { background-position: -12px -1px; }
          100% { background-position: 0 -1px; }
        }
      `
    case 'CANCELLING':
    case 'CANCELLING_AFTER_COMPLETION':
      return css`
        background: url('${cancellingImage}');
        animation: bgMotion 1s infinite linear;
        color: ${Palette.black};
        border-color: transparent;
        @keyframes bgMotion {
          0% { background-position: -12px -1px; }
          100% { background-position: 0 -1px; }
        }
      `
    case 'STRANDED_AFTER_DEADLOCK':
    case 'DEADLOCKED':
      return css`
        background: #424242;
        color: white;
        border-color: transparent;
      `
    case 'UNSCHEDULED':
      return css`
        background: ${Palette.grayscale[2]};
        color: ${Palette.black};
        border-color: transparent;
      `
    case 'INFO':
    case 'SCHEDULED':
      return null
    default:
      return null
  }
}

const primaryColors = css`
  color: ${Palette.primary};
  border-color: ${Palette.primary};
  background: white;
`
const alertColors = css`
  color: ${Palette.alert};
  border-color: ${Palette.alert};
  background: white;
`
const secondaryColors = css`
  color: white;
  border-color: ${Palette.grayscale[8]};
  background: ${Palette.grayscale[8]};
`
const getInfoStatusColor = (props: any) => {
  if (props.alert) {
    return alertColors
  }

  if (props.secondary) {
    return secondaryColors
  }

  return primaryColors
}
const Wrapper = styled.div<any>`
  ${(props: any) => StyleProps.exactWidth(`${props.small ? 78 : 94}px`)}
  height: 14px;
  line-height: 14px;
  border: 1px solid;
  font-size: 9px;
  font-weight: ${StyleProps.fontWeights.medium};
  text-align: center;
  border-radius: 4px;
  ${(props: any) => statuses(props.status)}
  ${(props: any) => (props.status === 'INFO' ? getInfoStatusColor(props) : '')}
`

type Props = {
  status: string | null,
  label?: string,
  primary?: boolean,
  secondary?: boolean,
  alert?: boolean,
  small?: boolean,
  style?: React.CSSProperties
  'data-test-id'?: string,
}
@observer
class StatusPill extends React.Component<Props> {
  static defaultProps = {
    status: 'INFO',
  }

  render() {
    const dataTestId = this.props['data-test-id'] ? this.props['data-test-id'] : `statusPill-${this.props.status || 'null'}`
    let label = this.props.label || this.props.status
    const { status } = this.props

    label = LABEL_MAP[label || ''] || label

    return (
      <Wrapper
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...this.props}
        status={status}
        primary={this.props.primary}
        secondary={this.props.secondary}
        alert={this.props.alert}
        small={this.props.small}
        data-test-id={dataTestId}
      >
        {label}
      </Wrapper>
    )
  }
}

export default StatusPill
