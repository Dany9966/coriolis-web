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
import { Link } from 'react-router-dom'
import { observer } from 'mobx-react'
import styled, { css } from 'styled-components'

import EndpointLogos from '../../atoms/EndpointLogos'
import CopyValue from '../../atoms/CopyValue'
import StatusIcon from '../../atoms/StatusIcon'
import StatusImage from '../../atoms/StatusImage'
import MainDetailsTable from '../../molecules/MainDetailsTable'
import CopyMultilineValue from '../../atoms/CopyMultilineValue'
import PasswordValue from '../../atoms/PasswordValue'

import type { Instance } from '../../../@types/Instance'
import type { MainItem } from '../../../@types/MainItem'
import type { Endpoint } from '../../../@types/Endpoint'
import type { Network } from '../../../@types/Network'
import type { Field as FieldType } from '../../../@types/Field'
import fieldHelper from '../../../@types/Field'

import StyleProps from '../../styleUtils/StyleProps'
import Palette from '../../styleUtils/Palette'
import DateUtils from '../../../utils/DateUtils'
import LabelDictionary from '../../../utils/LabelDictionary'
import { OptionsSchemaPlugin } from '../../../plugins/endpoint'

import arrowImage from './images/arrow.svg'

const Wrapper = styled.div<any>`
  display: flex;
  flex-direction: column;
  padding-bottom: 48px;
`
const ColumnsLayout = styled.div<any>`
  display: flex;
`
const Column = styled.div<any>`
  ${props => StyleProps.exactWidth(props.width)}
`
const Arrow = styled.div<any>`
  width: 34px;
  height: 24px;
  background: url('${arrowImage}') center no-repeat;
  margin-top: 84px;
`
const Row = styled.div<any>`
  margin-bottom: 32px;
  &:last-child {
    margin-bottom: 16px;
  }
`
const Field = styled.div<any>`
  display: flex;
  flex-direction: column;
`
const Label = styled.div<any>`
  font-size: 10px;
  color: ${Palette.grayscale[3]};
  font-weight: ${StyleProps.fontWeights.medium};
  text-transform: uppercase;
  display: flex;
  align-items: center;
`
const StatusIconStub = styled.div<any>`
  ${StyleProps.exactSize('16px')}
`
const Value = styled.div<any>`
  display: ${props => (props.flex ? 'flex' : props.block ? 'block' : 'inline-table')};
  margin-top: 3px;
  ${props => (props.capitalize ? 'text-transform: capitalize;' : '')}
`
const ValueLink = styled(Link)`
  display: flex;
  margin-top: 3px;
  color: ${Palette.primary};
  text-decoration: none;
  cursor: pointer;
`
const Loading = styled.div<any>`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`
const PropertiesTable = styled.div<any>``
const PropertyRow = styled.div<any>`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
`
const PropertyText = css``
const PropertyName = styled.div<any>`
  ${PropertyText}
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 50%;
`
const PropertyValue = styled.div<any>`
  ${PropertyText}
  color: ${Palette.grayscale[4]};
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(50% + 16px);
  margin-right: -16px;
`

type Props = {
  item?: MainItem | null,
  destinationSchema: FieldType[],
  destinationSchemaLoading: boolean,
  sourceSchema: FieldType[],
  sourceSchemaLoading: boolean,
  instancesDetails: Instance[],
  instancesDetailsLoading: boolean,
  endpoints: Endpoint[],
  networks?: Network[],
  bottomControls: React.ReactNode,
  loading: boolean,
}
type State = {
  showPassword: string[]
}
@observer
class MainDetails extends React.Component<Props, State> {
  state = {
    showPassword: [],
  }

  getSourceEndpoint(): Endpoint | undefined {
    const endpoint = this.props.endpoints
      .find(e => this.props.item && e.id === this.props.item.origin_endpoint_id)
    return endpoint
  }

  getDestinationEndpoint(): Endpoint | undefined {
    const endpoint = this.props.endpoints
      .find(e => this.props.item && e.id === this.props.item.destination_endpoint_id)
    return endpoint
  }

  getLastExecution() {
    if (this.props.item?.executions && this.props.item.executions.length) {
      return this.props.item.executions[this.props.item.executions.length - 1]
    }

    return null
  }

  getConnectedVms(networkId: string) {
    if (this.props.instancesDetailsLoading) {
      return 'Loading...'
    }

    if (!this.props.item) {
      return '-'
    }

    const vms: string[] = []

    this.props.instancesDetails.forEach(instanceDet => {
      if (
        instanceDet.devices && instanceDet.devices.nics && instanceDet.devices.nics.find
        && instanceDet.devices.nics.find(n => n.network_name === networkId)
      ) {
        vms.push(instanceDet.instance_name || instanceDet.name)
      }
    })

    return vms.length === 0 ? 'Failed to read network configuration for the original instance' : vms.map(vm => <div data-test-id={`vm-${vm}`} style={{ marginBottom: '8px' }}>{vm}<br /></div>)
  }

  renderLastExecutionTime() {
    const lastExecution = this.getLastExecution()
    const lastUpdate = lastExecution?.updated_at || lastExecution?.created_at
    if (lastUpdate) {
      return this.renderValue(DateUtils.getLocalTime(lastUpdate).format('YYYY-MM-DD HH:mm:ss'))
    }

    return null
  }

  renderValue(value: string, dateTestId?: string) {
    return <CopyValue value={value} maxWidth="90%" data-test-id={dateTestId ? `mainDetails-${dateTestId}` : undefined} />
  }

  renderEndpointLink(type: string): React.ReactNode {
    const endpointIsMissing = (
      <Value flex data-test-id={`mainDetails-missing-${type}`}>
        <StatusIcon style={{ marginRight: '8px' }} status="ERROR" />Endpoint is missing
      </Value>
    )

    const endpoint = type === 'source' ? this.getSourceEndpoint() : this.getDestinationEndpoint()

    if (endpoint) {
      return <ValueLink data-test-id={`mainDetails-name-${type}`} to={`/endpoint/${endpoint.id}`}>{endpoint.name}</ValueLink>
    }

    return endpointIsMissing
  }

  renderPropertiesTable(propertyNames: string[], type: 'source' | 'destination') {
    const endpoint = type === 'source' ? this.getSourceEndpoint() : this.getDestinationEndpoint()

    const getValue = (name: string, value: any) => {
      if (value.join && value.length && value[0].destination && value[0].source) {
        return value.map((v: { source: any; destination: any }) => `${v.source}=${v.destination}`).join(', ')
      }
      const schema = type === 'source' ? this.props.sourceSchema : this.props.destinationSchema
      return fieldHelper.getValueAlias(name, value, schema, endpoint && endpoint.type)
    }

    let properties: any[] = []
    const plugin = endpoint && OptionsSchemaPlugin.for(endpoint.type)
    const migrationImageMapFieldName = plugin && plugin.migrationImageMapFieldName
    let dictionaryKey = ''
    if (endpoint) {
      dictionaryKey = `${endpoint.type}-${type}`
    }
    const environment = this.props.item && (type === 'source' ? this.props.item.source_environment : this.props.item.destination_environment)
    propertyNames.forEach(pn => {
      const value = environment ? environment[pn] : ''
      const label = LabelDictionary.get(pn, dictionaryKey)

      if (value && value.join) {
        value.forEach((v: any, i: number) => {
          const useLabel = i === 0 ? label : ''
          properties.push({ label: useLabel, value: v })
        })
      } else if (value && typeof value === 'object') {
        properties = properties.concat(Object.keys(value).map(p => {
          if (p === 'disk_mappings') {
            return null
          }
          let fieldName = pn
          if (migrationImageMapFieldName && fieldName === migrationImageMapFieldName) {
            fieldName = `${p}_os_image`
          }
          return {
            label: `${label} - ${LabelDictionary.get(p)}`,
            value: getValue(fieldName, value[p]),
          }
        }))
      } else {
        properties.push({ label, value: getValue(pn, value) })
      }
    })

    return (
      <PropertiesTable>
        {properties.filter(Boolean).filter(p => p.value != null && p.value !== '').map(prop => (
          <PropertyRow key={prop.label}>
            <PropertyName>{prop.label}</PropertyName>
            <PropertyValue>
              {prop.label.toLowerCase().indexOf('password') > -1 && !this.state.showPassword.find(f => f === `${prop.label}-${type}`)
                ? (
                  <PasswordValue
                    value={prop.value}
                    onShow={() => this.setState(prevState => ({ showPassword: [...prevState.showPassword, `${prop.label}-${type}`] }))}
                  />
                ) : <CopyValue value={prop.value} />}
            </PropertyValue>
          </PropertyRow>
        ))}
      </PropertiesTable>
    )
  }

  renderTable() {
    if (this.props.loading) {
      return null
    }
    const sourceEndpoint = this.getSourceEndpoint()
    const destinationEndpoint = this.getDestinationEndpoint()
    const lastUpdated = this.renderLastExecutionTime()

    const getPropertyNames = (type: 'source' | 'destination') => {
      const env = this.props.item && (type === 'source' ? this.props.item.source_environment : this.props.item.destination_environment)
      return env ? Object.keys(env).filter(k => k !== 'network_map' && (
        k !== 'storage_mappings'
          || (env[k] != null && typeof env[k] === 'object' && Object.keys(env[k]).length > 0)
      )) : []
    }

    return (
      <ColumnsLayout>
        <Column width="42.5%">
          <Row>
            <Field>
              <Label>Source</Label>
              {this.renderEndpointLink('source')}
            </Field>
          </Row>
          <Row>
            <EndpointLogos
              endpoint={sourceEndpoint ? sourceEndpoint.type : ''}
              data-test-id="mainDetails-sourceLogo"
            />
          </Row>
          {getPropertyNames('source').length > 0 ? (
            <Row>
              <Field>
                <Label>Properties{this.props.sourceSchemaLoading ? (
                  <StatusIcon status="RUNNING" style={{ marginLeft: '8px' }} />
                ) : <StatusIconStub />}
                </Label>
                <Value block>{this.renderPropertiesTable(getPropertyNames('source'), 'source')}</Value>
              </Field>
            </Row>
          ) : null}
          <Row>
            <Field>
              <Label>Id</Label>
              {this.renderValue(this.props.item ? this.props.item.id || '-' : '-', 'id')}
            </Field>
          </Row>
          <Row>
            <Field>
              <Label>Created</Label>
              {this.props.item && this.props.item.created_at ? this.renderValue(DateUtils.getLocalTime(this.props.item.created_at).format('YYYY-MM-DD HH:mm:ss'), 'created') : <Value>-</Value>}
            </Field>
          </Row>
          {this.props.item && this.props.item.notes
            ? (
              <Row>
                <Field>
                  <Label>Description</Label>
                  <CopyMultilineValue value={this.props.item.notes} data-test-id="mainDetails-description" />
                </Field>
              </Row>
            )
            : null}
          {lastUpdated ? (
            <Row>
              <Field>
                <Label>Last Updated</Label>
                <Value data-test-id="mainDetails-updated">{lastUpdated}</Value>
              </Field>
            </Row>
          ) : null}
          {this.props.item && this.props.item.replica_id ? (
            <Row>
              <Field>
                <Label>Created from Replica</Label>
                <ValueLink to={`/replica/${this.props.item.replica_id}`}>{this.props.item.replica_id}</ValueLink>
              </Field>
            </Row>
          ) : null}
        </Column>
        <Column width="9.5%">
          <Arrow />
        </Column>
        <Column width="48%" style={{ flexGrow: 1 }}>
          <Row>
            <Field>
              <Label>Target</Label>
              {this.renderEndpointLink('target')}
            </Field>
          </Row>
          <Row>
            <EndpointLogos
              endpoint={destinationEndpoint ? destinationEndpoint.type : ''}
              data-test-id="mainDetails-targetLogo"
            />
          </Row>
          {getPropertyNames('destination').length > 0 ? (
            <Row>
              <Field>
                <Label>Properties{this.props.destinationSchemaLoading ? (
                  <StatusIcon status="RUNNING" style={{ marginLeft: '8px' }} />
                ) : <StatusIconStub />}
                </Label>
                <Value block>{this.renderPropertiesTable(getPropertyNames('destination'), 'destination')}</Value>
              </Field>
            </Row>
          ) : null}
        </Column>
      </ColumnsLayout>
    )
  }

  renderBottomControls() {
    if (this.props.loading) {
      return null
    }

    return this.props.bottomControls
  }

  renderLoading() {
    if (!this.props.loading && !this.props.instancesDetailsLoading) {
      return null
    }

    return (
      <Loading>
        <StatusImage loading data-test-id="mainDetails-loading" />
      </Loading>
    )
  }

  render() {
    return (
      <Wrapper>
        {this.renderTable()}
        {this.props.instancesDetailsLoading || this.props.loading ? null : (
          <MainDetailsTable
            item={this.props.item}
            instancesDetails={this.props.instancesDetails}
            networks={this.props.networks}
          />
        )}
        {this.renderLoading()}
        {this.renderBottomControls()}
      </Wrapper>
    )
  }
}

export default MainDetails
