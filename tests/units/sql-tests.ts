import { expect } from 'chai';

import { TodoModel, todos } from './data'

export default async () => {

    describe('SQL Methods', () => {
        it('Table', async () => {
            expect(todos.sql().table().name()).to.eq("todos")
            expect(await todos.sql().table().isCreated()).to.eq(true)
            await todos.sql().table().drop()
            expect(await todos.sql().table().isCreated()).to.eq(false)        
            await todos.sql().table().create()
            expect(await todos.sql().table().isCreated()).to.eq(true)        
            await todos.ctx().local().push({content: 'hey'}).saveToDB()
            expect(await todos.sql().count().all()).to.eq(1)
            await todos.sql().table().truncate()
            expect(await todos.sql().count().all()).to.eq(0)
        })

        it('Count', () => {

        })

        it('Node', async () => {
            const CONTENT = 'yep'
            const CONTENT_2 = 'YEP!'
            const m = new TodoModel({ content: CONTENT}, {})
            await todos.sql().node(m).insert()
            expect(await todos.sql().count().all()).to.eq(1)
            const t = await todos.sql().node(m).fetch() as TodoModel
            expect(t).to.not.eq(null)
            expect(t.content()).to.eq(CONTENT)
            t.setState({content: CONTENT_2})
            await todos.sql().node(t).update()
            const t2 = await todos.sql().node(t).fetch() as TodoModel
            expect(t2).to.not.eq(null)
            expect(t2.content()).to.eq(CONTENT_2)
            expect(await todos.sql().count().all()).to.eq(1)
            todos.sql().node(t2).delete()
            expect(await todos.sql().count().all()).to.eq(0)
        })  

        

    })
}