/*
Copyright (C) 2018  Cloudbase Solutions SRL
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

export default {
  nodeServer: 'http://localhost:3000/',
  coriolisUrl: '',
  username: 'cypress',
  password: '',
  endpoints: {
    azure: {
      username: '',
      password: '',
      subscriptionId: '',
    },
    vmware: {
      username: '',
      password: '',
      host: '',
    },
    openstack: {
      userDomainName: 'Default',
      authUrl: '',
      projectName: 'admin',
      projectDomainName: '',
      password: '',
      username: 'admin',
      glanceApiVersion: 2,
      identityVersion: 3,
    },
    oci: {
      privateKeyData: '',
      region: '',
      tenancy: '',
      user: '',
      privateKeyPassphrase: '',
    },
  },
  wizard: {
    azure: {
      resourceGroup: { label: '', value: '' },
    },
    openstack: {
      network: '',
    },
    oci: {
      compartment: {
        label: '', value: '',
      },
      migrSubnetId: {
        label: '', value: '',
      },
      availabilityDomain: '',
    },
    instancesSearch: {
      vmwareSearchText: 'ubuntu 14.04',
      vmwareItemIndex: 1,
      ociSearchText: 'ubuntu',
      ociItemIndex: 0,
    },
  },
}
