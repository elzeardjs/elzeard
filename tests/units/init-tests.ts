import { manager  } from '../../index'
import { todos, chats, messages, posts, devices, users, spots, specificUsers, } from './data'
import fs from 'fs'
import  { config } from '../../index'

export default async (HISTORY_FOLDER: string) => {

    describe('Init', () => {

        it('Remove history repository', async () => {
            fs.rmdirSync(HISTORY_FOLDER, {recursive: true})
            fs.mkdirSync(HISTORY_FOLDER)
            config.disableCriticalConfirmation()
            config.disableLog()
            config.disableMigrationRemovingOnError()
    
            await config.mysqlConnexion().raw('SET foreign_key_checks = 0;')
            await config.mysqlConnexion().schema.dropTableIfExists(chats.super().option().table())
            await config.mysqlConnexion().schema.dropTableIfExists(messages.super().option().table())
            await config.mysqlConnexion().schema.dropTableIfExists(posts.super().option().table())
            await config.mysqlConnexion().schema.dropTableIfExists(devices.super().option().table())
            await config.mysqlConnexion().schema.dropTableIfExists(users.super().option().table())
            await config.mysqlConnexion().schema.dropTableIfExists(todos.super().option().table())
            await config.mysqlConnexion().schema.dropTableIfExists(specificUsers.super().option().table())
            await config.mysqlConnexion().schema.dropTableIfExists(spots.super().option().table())
            await config.mysqlConnexion().raw('SET foreign_key_checks = 1;')
        })
    
        it('Create Tables', async () => {
            await manager.init()
        })
    })
}
