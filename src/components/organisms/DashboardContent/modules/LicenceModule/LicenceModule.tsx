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

import * as React from 'react'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import moment from 'moment'

import StatusImage from '../../../../atoms/StatusImage'

import Palette from '../../../../styleUtils/Palette'
import StyleProps from '../../../../styleUtils/StyleProps'

import type { Licence } from '../../../../../@types/Licence'

const Wrapper = styled.div<any>`
  flex-grow: 1;
`
const Title = styled.div<any>`
  font-size: 24px;
  font-weight: ${StyleProps.fontWeights.light};
  margin-bottom: 12px;
`
const Module = styled.div<any>`
  background: ${Palette.grayscale[0]};
  display: flex;
  overflow: auto;
  border-radius: ${StyleProps.borderRadius};
  padding: 24px 16px 16px 16px;
  height: 232px;
`
const LicenceInfo = styled.div<any>``
const NoLicence = styled.div<any>``
const TopInfo = styled.div<any>`
  display: flex;
`
const TopInfoText = styled.div<any>`
  flex-grow: 1;
  margin-top: 8px;
`
const TopInfoDate = styled.div<any>`
  ${StyleProps.exactWidth('76px')}
  ${StyleProps.exactHeight('80px')}
  display: flex;
  flex-direction: column;
  margin-left: 24px;
  ${StyleProps.boxShadow}
  border-radius: ${StyleProps.borderRadius};
  overflow: hidden;
`
const TopInfoDateTop = styled.div<any>`
  width: 100%;
  height: 27px;
  background: linear-gradient(#007AE7, #0044CA);
  color: white;
  text-align: center;
  line-height: 27px;
`
const TopInfoDateBottom = styled.div<any>`
  background: white;
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${Palette.primary};
  font-size: 37px;
  font-weight: ${StyleProps.fontWeights.extraLight};
`
const Charts = styled.div<any>`
  margin-top: 32px;
`
const Chart = styled.div<any>`
  margin-top: 32px;
  &:first-child {
    margin-top: 0;
  }
`
const ChartHeader = styled.div<any>`
  display: flex;
  justify-content: space-between;
`
const ChartHeaderCurrent = styled.div<any>``
const ChartHeaderTotal = styled.div<any>`
  color: ${Palette.grayscale[4]};
`
const ChartBodyWrapper = styled.div<any>`
  height: 8px;
  background: ${Palette.grayscale[2]};
  border-radius: ${StyleProps.borderRadius};
  margin-top: 4px;
  overflow: hidden;
`
const ChartBody = styled.div<any>`
  width: ${props => props.width}%;
  background: ${props => props.color};
  height: 100%;
`
const LoadingWrapper = styled.div<any>`
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`

type Props = {
  licence: Licence | null,
  loading: boolean,
  style: any,
}
@observer
class LicenceModule extends React.Component<Props> {
  renderLicenceStatusText(info: Licence): React.ReactNode {
    const currentPeriod = moment(info.currentPeriodEnd)
    const days = currentPeriod.diff(new Date(), 'days')
    const graphData = [{
      color: Palette.alert,
      current: info.performedReplicas,
      total: info.totalReplicas,
      label: 'Replicas',
    }, {
      color: Palette.primary,
      current: info.performedMigrations,
      total: info.totalMigations,
      label: 'Migrations',
    }]
    return (
      <LicenceInfo>
        <TopInfo>
          <TopInfoText>
            Coriolis® Licence is active until&nbsp;
            {currentPeriod.format('DD MMM YYYY')}
            &nbsp;({days} days from now).
          </TopInfoText>
          <TopInfoDate>
            <TopInfoDateTop>{currentPeriod.format('MMM')} &#39;{currentPeriod.format('YY')}</TopInfoDateTop>
            <TopInfoDateBottom>{currentPeriod.format('DD')}</TopInfoDateBottom>
          </TopInfoDate>
        </TopInfo>
        <Charts>
          {graphData.map(data => (
            <Chart key={data.label}>
              <ChartHeader>
                <ChartHeaderCurrent>{data.current} {data.label}</ChartHeaderCurrent>
                <ChartHeaderTotal>{data.total}</ChartHeaderTotal>
              </ChartHeader>
              <ChartBodyWrapper>
                <ChartBody color={data.color} width={(data.current / data.total) * 100} />
              </ChartBodyWrapper>
            </Chart>
          ))}
        </Charts>
      </LicenceInfo>
    )
  }

  renderNoLicence() {
    return (
      <NoLicence>
        Please contact Cloudbase Solutions with your
        Appliance ID in order to obtain a Coriolis® licence.
      </NoLicence>
    )
  }

  renderLoading() {
    return (
      <LoadingWrapper>
        <StatusImage status="RUNNING" />
      </LoadingWrapper>
    )
  }

  render() {
    const licence = this.props.licence
    let days: number | null = null
    if (licence) {
      const currentPeriod = moment(licence.currentPeriodEnd)
      days = currentPeriod.diff(new Date(), 'days')
    }
    return licence || this.props.loading ? (
      <Wrapper style={this.props.style}>
        <Title>Licence</Title>
        <Module>
          {licence ? days && days > 0 ? this.renderLicenceStatusText(licence)
            : this.renderNoLicence() : this.props.loading ? this.renderLoading() : null}
        </Module>
      </Wrapper>
    ) : null
  }
}

export default LicenceModule
