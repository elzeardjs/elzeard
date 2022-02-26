import { expect } from 'chai';

import { todos } from './data'

export default async () => {

    describe('SQL Methods', () => {
        it('Table', async () => {
            expect(todos.sql().table().name()).to.eq("todos")
            let isCreated = await todos.sql().table().isCreated()
            expect(isCreated).to.eq(true)
            await todos.sql().table().drop()
            isCreated = await todos.sql().table().isCreated()
            expect(isCreated).to.eq(false)        
            await todos.sql().table().create()
            isCreated = await todos.sql().table().isCreated()
            expect(isCreated).to.eq(true)        
            await todos.ctx().local().push({content: 'hey'}).saveToDB()
            expect(await todos.sql().count().all()).to.eq(1)
            await todos.sql().table().truncate()
            expect(await todos.sql().count().all()).to.eq(0)
        })
    })
}