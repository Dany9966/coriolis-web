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

import { ConnectionSchemaPlugin, OptionsSchemaPlugin } from '../plugins/endpoint'
import type { Schema } from '../@types/Schema'
import type { Endpoint } from '../@types/Endpoint'
import { ProviderTypes } from '../@types/Providers'

class SchemaParser {
  static storedConnectionsSchemas: any = {}

  static connectionSchemaToFields(provider: ProviderTypes, schema: Schema) {
    if (!this.storedConnectionsSchemas[provider]) {
      this.storedConnectionsSchemas[provider] = schema
    }

    const parsers = ConnectionSchemaPlugin.for(provider)
    const fields = parsers.parseSchemaToFields(schema)

    return fields
  }

  static optionsSchemaToFields(provider: ProviderTypes, schema: any, dictionaryKey: string) {
    const parser = OptionsSchemaPlugin.for(provider)
    const schemaRoot = schema.oneOf ? schema.oneOf[0] : schema
    const fields = parser.parseSchemaToFields(schemaRoot, schema.definitions, dictionaryKey)
    fields.sort((a, b) => {
      if (a.required && !b.required) {
        return -1
      }

      if (!a.required && b.required) {
        return 1
      }

      return a.name.localeCompare(b.name)
    })
    return fields
  }

  static connectionInfoToPayload(data: { [prop: string]: any }) {
    const storedSchema = this.storedConnectionsSchemas[data.type]
      || this.storedConnectionsSchemas.general
    const parsers = ConnectionSchemaPlugin.for(data.type)
    const payload = parsers.parseConnectionInfoToPayload(data, storedSchema)

    return payload
  }

  static parseConnectionResponse(endpoint: Endpoint) {
    return ConnectionSchemaPlugin.for(endpoint.type).parseConnectionResponse(endpoint)
  }
}

export { SchemaParser }
