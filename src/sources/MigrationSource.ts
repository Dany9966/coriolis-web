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

import moment from 'moment'

import { OptionsSchemaPlugin } from '../plugins/endpoint'
import DefaultOptionsSchemaPlugin from '../plugins/endpoint/default/OptionsSchemaPlugin'
import { sortTasks } from './ReplicaSource'

import Api from '../utils/ApiCaller'
import type { MainItem } from '../@types/MainItem'
import type { InstanceScript } from '../@types/Instance'
import type { Field } from '../@types/Field'
import type { NetworkMap } from '../@types/Network'
import type { Endpoint, StorageMap } from '../@types/Endpoint'

import configLoader from '../utils/Config'
import { Task } from '../@types/Task'

class MigrationSourceUtils {
  static sortTaskUpdates(updates: any[]) {
    if (!updates) {
      return
    }
    updates.sort((a: any, b: any) => {
      const sortNull = !a && b ? 1 : a && !b ? -1 : !a && !b ? 0 : false
      if (sortNull !== false) {
        return sortNull
      }
      return moment(a.created_at).toDate().getTime() - moment(b.created_at).toDate().getTime()
    })
  }

  static sortMigrations(migrations: any[]) {
    migrations.sort((a: any, b: any) => moment(b.created_at).diff(moment(a.created_at)))

    migrations.forEach((migration: { tasks: Task[] }) => {
      sortTasks(migration.tasks, MigrationSourceUtils.sortTaskUpdates)
    })
  }
}

class MigrationSource {
  async getMigrations(skipLog?: boolean): Promise<MainItem[]> {
    const response = await Api.send({
      url: `${configLoader.config.servicesUrls.coriolis}/${Api.projectId}/migrations`,
      skipLog,
    })
    const migrations = response.data.migrations
    MigrationSourceUtils.sortMigrations(migrations)
    return migrations
  }

  async getMigration(migrationId: string, skipLog?: boolean): Promise<MainItem> {
    const response = await Api.send({
      url: `${configLoader.config.servicesUrls.coriolis}/${Api.projectId}/migrations/${migrationId}`,
      skipLog,
    })
    const migration = response.data.migration
    sortTasks(migration.tasks, MigrationSourceUtils.sortTaskUpdates)
    return migration
  }

  async recreateFullCopy(migration: MainItem): Promise<MainItem> {
    const {
      origin_endpoint_id, destination_endpoint_id, destination_environment,
      network_map, instances, storage_mappings, notes,
    } = migration

    const payload: any = {
      migration: {
        origin_endpoint_id,
        destination_endpoint_id,
        destination_environment,
        network_map,
        instances,
        storage_mappings,
        notes,
      },
    }

    if (migration.skip_os_morphing != null) {
      payload.migration.skip_os_morphing = migration.skip_os_morphing
    }

    if (migration.source_environment) {
      payload.migration.source_environment = migration.source_environment
    }

    payload.migration.shutdown_instances = Boolean(migration.shutdown_instances)
    payload.migration.replication_count = migration.replication_count || 2

    const response = await Api.send({
      url: `${configLoader.config.servicesUrls.coriolis}/${Api.projectId}/migrations`,
      method: 'POST',
      data: payload,
    })
    return response.data.migration
  }

  async recreate(opts: {
    sourceEndpoint: Endpoint,
    destEndpoint: Endpoint,
    instanceNames: string[],
    destEnv: { [prop: string]: any } | null,
    updatedDestEnv: { [prop: string]: any } | null,
    sourceEnv?: { [prop: string]: any } | null,
    updatedSourceEnv?: { [prop: string]: any } | null,
    storageMappings?: { [prop: string]: any } | null,
    updatedStorageMappings: StorageMap[] | null,
    defaultStorage?: string | null,
    updatedDefaultStorage?: string | null,
    networkMappings?: any,
    updatedNetworkMappings: NetworkMap[] | null,
    defaultSkipOsMorphing: boolean | null,
    replicationCount?: number | null,
  }): Promise<MainItem> {
    const getValue = (fieldName: string): string | null => {
      const updatedDestEnv = opts.updatedDestEnv && opts.updatedDestEnv[fieldName]
      return updatedDestEnv != null ? updatedDestEnv
        : (opts.destEnv && opts.destEnv[fieldName])
    }

    const sourceParser = OptionsSchemaPlugin.for(opts.sourceEndpoint.type)
    const destParser = OptionsSchemaPlugin.for(opts.destEndpoint.type)
    const payload: any = {}

    payload.migration = {
      origin_endpoint_id: opts.sourceEndpoint.id,
      destination_endpoint_id: opts.destEndpoint.id,
      destination_environment: {
        ...opts.destEnv,
        ...destParser.getDestinationEnv(opts.updatedDestEnv),
      },
      shutdown_instances: Boolean(opts.updatedDestEnv && opts.updatedDestEnv.shutdown_instances),
      replication_count: (opts.updatedDestEnv
        && opts.updatedDestEnv.replication_count) || opts.replicationCount || 2,
      instances: opts.instanceNames,
      notes: getValue('description') || '',
    }

    const skipOsMorphingValue = getValue('skip_os_morphing')
    if (skipOsMorphingValue != null) {
      payload.migration.skip_os_morphing = skipOsMorphingValue
    } else if (opts.defaultSkipOsMorphing != null) {
      payload.migration.skip_os_morphing = opts.defaultSkipOsMorphing
    }

    if (opts.networkMappings
      || (opts.updatedNetworkMappings && opts.updatedNetworkMappings.length)) {
      payload.migration.network_map = {
        ...opts.networkMappings,
        ...destParser.getNetworkMap(opts.updatedNetworkMappings),
      }
    }

    if ((opts.storageMappings && Object.keys(opts.storageMappings).length)
      || (opts.updatedStorageMappings && opts.updatedStorageMappings.length)) {
      payload.migration.storage_mappings = {
        ...opts.storageMappings,
        ...destParser
          .getStorageMap(opts.updatedDefaultStorage
            || opts.defaultStorage, opts.updatedStorageMappings),
      }
    }

    if (opts.sourceEnv || opts.updatedSourceEnv) {
      payload.migration.source_environment = {
        ...opts.sourceEnv,
        ...sourceParser.getDestinationEnv(opts.updatedSourceEnv),
      }
    }

    const response = await Api.send({
      url: `${configLoader.config.servicesUrls.coriolis}/${Api.projectId}/migrations`,
      method: 'POST',
      data: payload,
    })
    return response.data.migration
  }

  async cancel(migrationId: string, force?: boolean | null): Promise<string> {
    const data: any = { cancel: null }
    if (force) {
      data.cancel = { force: true }
    }
    await Api.send({
      url: `${configLoader.config.servicesUrls.coriolis}/${Api.projectId}/migrations/${migrationId}/actions`,
      method: 'POST',
      data,
    })
    return migrationId
  }

  async delete(migrationId: string): Promise<string> {
    await Api.send({
      url: `${configLoader.config.servicesUrls.coriolis}/${Api.projectId}/migrations/${migrationId}`,
      method: 'DELETE',
    })
    return migrationId
  }

  async migrateReplica(
    replicaId: string, options: Field[], userScripts: InstanceScript[],
  ): Promise<MainItem> {
    const payload: any = {
      migration: {
        replica_id: replicaId,
      },
    }
    options.forEach(o => {
      payload.migration[o.name] = o.value || o.default || false
    })

    if (userScripts.length) {
      payload.migration.user_scripts = DefaultOptionsSchemaPlugin.getUserScripts(userScripts)
    }

    const response = await Api.send({
      url: `${configLoader.config.servicesUrls.coriolis}/${Api.projectId}/migrations`,
      method: 'POST',
      data: payload,
    })
    return response.data.migration
  }
}

export default new MigrationSource()
