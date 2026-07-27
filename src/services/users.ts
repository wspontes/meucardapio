import { FirestoreService } from './firestore'
import type { User } from '@/types'

class UsersService extends FirestoreService<User> {
  constructor() {
    super('users')
  }
}

export const usersService = new UsersService()
