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

// @flow

import React from 'react'
import styled from 'styled-components'
import connectToStores from 'alt-utils/lib/connectToStores'

import DetailsTemplate from '../../templates/DetailsTemplate'
import { DetailsPageHeader } from '../../organisms/DetailsPageHeader'
import DetailsContentHeader from '../../organisms/DetailsContentHeader'
import ReplicaDetailsContent from '../../organisms/ReplicaDetailsContent'
import Modal from '../../molecules/Modal'
import ReplicaExecutionOptions from '../../organisms/ReplicaExecutionOptions'
import AlertModal from '../../organisms/AlertModal'
import ReplicaMigrationOptions from '../../organisms/ReplicaMigrationOptions'
import type { MainItem } from '../../../types/MainItem'
import type { Execution } from '../../../types/Execution'

import ReplicaStore from '../../../stores/ReplicaStore'
import UserStore from '../../../stores/UserStore'
import UserActions from '../../../actions/UserActions'
import ReplicaActions from '../../../actions/ReplicaActions'
import MigrationActions from '../../../actions/MigrationActions'
import EndpointStore from '../../../stores/EndpointStore'
import EndpointActions from '../../../actions/EndpointActions'
import ScheduleActions from '../../../actions/ScheduleActions'
import ScheduleStore from '../../../stores/ScheduleStore'
import { requestPollTimeout } from '../../../config'

import replicaImage from './images/replica.svg'

const Wrapper = styled.div``

type Props = {
  match: any,
  replicaStore: any,
  endpointStore: any,
  userStore: any,
  scheduleStore: any,
}
type State = {
  showOptionsModal: boolean,
  showMigrationModal: boolean,
  showDeleteExecutionConfirmation: boolean,
  showDeleteReplicaConfirmation: boolean,
  showDeleteReplicaDisksConfirmation: boolean,
  confirmationItem: ?MainItem | ?Execution,
  showCancelConfirmation: boolean,
}
class ReplicaDetailsPage extends React.Component<Props, State> {
  static getStores() {
    return [ReplicaStore, EndpointStore, UserStore, ScheduleStore]
  }

  static getPropsFromStores() {
    return {
      replicaStore: ReplicaStore.getState(),
      endpointStore: EndpointStore.getState(),
      userStore: UserStore.getState(),
      scheduleStore: ScheduleStore.getState(),
    }
  }

  pollTimeout: TimeoutID

  constructor() {
    super()

    this.state = {
      showOptionsModal: false,
      showMigrationModal: false,
      showDeleteExecutionConfirmation: false,
      showDeleteReplicaConfirmation: false,
      showDeleteReplicaDisksConfirmation: false,
      confirmationItem: null,
      showCancelConfirmation: false,
    }
  }

  componentDidMount() {
    document.title = 'Replica Details'

    ReplicaActions.getReplica(this.props.match.params.id)
    EndpointActions.getEndpoints()
    ScheduleActions.getSchedules(this.props.match.params.id)
    this.pollData()
  }

  componentWillUnmount() {
    ReplicaActions.clearDetails()
    ScheduleActions.clearUnsavedSchedules()
    clearTimeout(this.pollTimeout)
  }

  isActionButtonDisabled() {
    let originEndpoint = this.props.endpointStore.endpoints.find(e => e.id === this.props.replicaStore.replicaDetails.origin_endpoint_id)
    let targetEndpoint = this.props.endpointStore.endpoints.find(e => e.id === this.props.replicaStore.replicaDetails.destination_endpoint_id)
    let lastExecution = this.props.replicaStore.replicaDetails.executions && this.props.replicaStore.replicaDetails.executions.length
      && this.props.replicaStore.replicaDetails.executions[this.props.replicaStore.replicaDetails.executions.length - 1]
    let status = lastExecution && lastExecution.status

    return Boolean(!originEndpoint || !targetEndpoint || status === 'RUNNING')
  }

  handleUserItemClick(item) {
    switch (item.value) {
      case 'signout':
        UserActions.logout()
        return
      case 'profile':
        window.location.href = '/#/profile'
        break
      default:
    }
  }

  handleBackButtonClick() {
    window.location.href = '/#/replicas'
  }

  handleActionButtonClick() {
    this.setState({ showOptionsModal: true })
  }

  handleCloseOptionsModal() {
    this.setState({ showOptionsModal: false })
  }

  handleDeleteExecutionConfirmation() {
    if (!this.state.confirmationItem) {
      return
    }
    ReplicaActions.deleteExecution(this.props.replicaStore.replicaDetails.id, this.state.confirmationItem.id)
    this.handleCloseExecutionConfirmation()
  }

  handleDeleteExecutionClick(execution) {
    this.setState({
      showDeleteExecutionConfirmation: true,
      confirmationItem: execution,
    })
  }

  handleCloseExecutionConfirmation() {
    this.setState({
      showDeleteExecutionConfirmation: false,
      confirmationItem: null,
    })
  }

  handleDeleteReplicaClick() {
    this.setState({ showDeleteReplicaConfirmation: true })
  }

  handleDeleteReplicaDisksClick() {
    this.setState({ showDeleteReplicaDisksConfirmation: true })
  }

  handleDeleteReplicaConfirmation() {
    this.setState({ showDeleteReplicaConfirmation: false })
    window.location.href = '/#/replicas'
    ReplicaActions.delete(this.props.replicaStore.replicaDetails.id)
  }

  handleCloseDeleteReplicaConfirmation() {
    this.setState({ showDeleteReplicaConfirmation: false })
  }

  handleDeleteReplicaDisksConfirmation() {
    this.setState({ showDeleteReplicaDisksConfirmation: false })
    ReplicaActions.deleteDisks(this.props.replicaStore.replicaDetails.id)
    window.location.href = `/#/replica/executions/${this.props.replicaStore.replicaDetails.id}`
  }

  handleCloseDeleteReplicaDisksConfirmation() {
    this.setState({ showDeleteReplicaDisksConfirmation: false })
  }

  handleCloseMigrationModal() {
    this.setState({ showMigrationModal: false })
  }

  handleCreateMigrationClick() {
    this.setState({ showMigrationModal: true })
  }

  handleAddScheduleClick(schedule) {
    ScheduleActions.addSchedule(this.props.match.params.id, schedule)
  }

  handleScheduleChange(scheduleId, data, forceSave) {
    let oldData = this.props.scheduleStore.schedules.find(s => s.id === scheduleId)
    let unsavedData = this.props.scheduleStore.unsavedSchedules.find(s => s.id === scheduleId)
    ScheduleActions.updateSchedule(this.props.match.params.id, scheduleId, data, oldData, unsavedData, forceSave)
  }

  handleScheduleSave(schedule) {
    ScheduleActions.updateSchedule(this.props.match.params.id, schedule.id, schedule, schedule, schedule, true)
  }

  handleScheduleRemove(scheduleId) {
    ScheduleActions.removeSchedule(this.props.match.params.id, scheduleId)
  }

  handleCancelExecutionClick(confirmationItem) {
    this.setState({ confirmationItem, showCancelConfirmation: true })
  }

  handleCloseCancelConfirmation() {
    this.setState({ showCancelConfirmation: false })
  }

  handleCancelConfirmation() {
    if (!this.state.confirmationItem) {
      return
    }
    ReplicaActions.cancelExecution(this.props.replicaStore.replicaDetails.id, this.state.confirmationItem.id)
    this.setState({ showCancelConfirmation: false })
  }

  migrateReplica(options) {
    MigrationActions.migrateReplica(this.props.replicaStore.replicaDetails.id, options)
    this.handleCloseMigrationModal()
  }

  executeReplica(fields) {
    ReplicaActions.execute(this.props.replicaStore.replicaDetails.id, fields)
    this.handleCloseOptionsModal()
    window.location.href = `/#/replica/executions/${this.props.replicaStore.replicaDetails.id}`
  }

  pollData() {
    ReplicaActions.getReplicaExecutions(this.props.match.params.id).promise.then(() => {
      this.pollTimeout = setTimeout(() => { this.pollData() }, requestPollTimeout)
    })
  }

  render() {
    return (
      <Wrapper>
        <DetailsTemplate
          pageHeaderComponent={<DetailsPageHeader
            user={this.props.userStore.user}
            onUserItemClick={item => { this.handleUserItemClick(item) }}
          />}
          contentHeaderComponent={<DetailsContentHeader
            item={this.props.replicaStore.replicaDetails}
            onBackButonClick={() => { this.handleBackButtonClick() }}
            onActionButtonClick={() => { this.handleActionButtonClick() }}
            onCancelClick={execution => { this.handleCancelExecutionClick(execution) }}
            actionButtonDisabled={this.isActionButtonDisabled()}
            typeImage={replicaImage}
            alertInfoPill
            buttonLabel="Execute Now"
          />}
          contentComponent={<ReplicaDetailsContent
            item={this.props.replicaStore.replicaDetails}
            endpoints={this.props.endpointStore.endpoints}
            scheduleStore={this.props.scheduleStore}
            detailsLoading={this.props.replicaStore.detailsLoading || this.props.endpointStore.loading}
            page={this.props.match.params.page || ''}
            onCancelExecutionClick={execution => { this.handleCancelExecutionClick(execution) }}
            onDeleteExecutionClick={execution => { this.handleDeleteExecutionClick(execution) }}
            onExecuteClick={() => { this.handleActionButtonClick() }}
            onCreateMigrationClick={() => { this.handleCreateMigrationClick() }}
            onDeleteReplicaClick={() => { this.handleDeleteReplicaClick() }}
            onDeleteReplicaDisksClick={() => { this.handleDeleteReplicaDisksClick() }}
            onAddScheduleClick={schedule => { this.handleAddScheduleClick(schedule) }}
            onScheduleChange={(scheduleId, data, forceSave) => { this.handleScheduleChange(scheduleId, data, forceSave) }}
            onScheduleRemove={scheduleId => { this.handleScheduleRemove(scheduleId) }}
            onScheduleSave={s => { this.handleScheduleSave(s) }}
          />}
        />
        <Modal
          isOpen={this.state.showOptionsModal}
          title="New Execution"
          onRequestClose={() => { this.handleCloseOptionsModal() }}
        >
          <ReplicaExecutionOptions
            onCancelClick={() => { this.handleCloseOptionsModal() }}
            onExecuteClick={fields => { this.executeReplica(fields) }}
          />
        </Modal>
        <Modal
          isOpen={this.state.showMigrationModal}
          title="Create Migration from Replica"
          onRequestClose={() => { this.handleCloseMigrationModal() }}
        >
          <ReplicaMigrationOptions
            onCancelClick={() => { this.handleCloseMigrationModal() }}
            onMigrateClick={options => { this.migrateReplica(options) }}
          />
        </Modal>
        <AlertModal
          isOpen={this.state.showDeleteExecutionConfirmation}
          title="Delete Execution?"
          message="Are you sure you want to delete this execution?"
          extraMessage="Deleting a Coriolis Execution is permanent!"
          onConfirmation={() => { this.handleDeleteExecutionConfirmation() }}
          onRequestClose={() => { this.handleCloseExecutionConfirmation() }}
        />
        <AlertModal
          isOpen={this.state.showDeleteReplicaConfirmation}
          title="Delete Replica?"
          message="Are you sure you want to delete this replica?"
          extraMessage="Deleting a Coriolis Replica is permanent!"
          onConfirmation={() => { this.handleDeleteReplicaConfirmation() }}
          onRequestClose={() => { this.handleCloseDeleteReplicaConfirmation() }}
        />
        <AlertModal
          isOpen={this.state.showDeleteReplicaDisksConfirmation}
          title="Delete Replica Disks?"
          message="Are you sure you want to delete this replica's disks?"
          extraMessage="Deleting Coriolis Replica Disks is permanent!"
          onConfirmation={() => { this.handleDeleteReplicaDisksConfirmation() }}
          onRequestClose={() => { this.handleCloseDeleteReplicaDisksConfirmation() }}
        />
        <AlertModal
          isOpen={this.state.showCancelConfirmation}
          title="Cancel Execution?"
          message="Are you sure you want to cancel the current execution?"
          extraMessage=" "
          onConfirmation={() => { this.handleCancelConfirmation() }}
          onRequestClose={() => { this.handleCloseCancelConfirmation() }}
        />
      </Wrapper>
    )
  }
}

export default connectToStores(ReplicaDetailsPage)
