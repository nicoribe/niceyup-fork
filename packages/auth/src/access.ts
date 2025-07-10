import { type Role, createAccessControl } from 'better-auth/plugins/access'
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from 'better-auth/plugins/organization/access'

type Roles = { [key in string]?: Role<any> }

const statement = {
  ...defaultStatements,
  project: ['create', 'update', 'delete', 'billing'],
} as const

const ac = createAccessControl(statement)

const owner = ac.newRole({
  ...ownerAc.statements,
  project: ['create', 'update', 'delete', 'billing'],
})

const admin = ac.newRole({
  ...adminAc.statements,
  project: ['create', 'update', 'billing'],
})

const billing = ac.newRole({
  ...memberAc.statements,
  project: ['create', 'billing'],
})

const member = ac.newRole({
  ...memberAc.statements,
  project: ['create'],
})

const roles: Roles = {
  owner,
  admin,
  billing,
  member,
}

export { statement, ac, roles }
