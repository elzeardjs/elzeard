import { expect } from 'chai';

import { TodoList, TodoModel, todos } from './data'

export default async () => {

    const CONTENT = 'content_1'
    const CONTENT_2 = 'content_2'
    const CONTENT_3 = 'content_3'
    const CONTENT_STUPID = 'STUPID'

    describe('SQL Methods', () => {
        it('Table', async () => {
            expect(todos.sql().table().name()).to.eq("todos")
            expect(await todos.sql().table().isCreated()).to.eq(true)
            await todos.sql().table().drop()
            expect(await todos.sql().table().isCreated()).to.eq(false)        
            await todos.sql().table().create()
            expect(await todos.sql().table().isCreated()).to.eq(true)        
            await todos.ctx().local().push({content: CONTENT_STUPID}).saveToDB()
            expect(await todos.sql().count().all()).to.eq(1)
            await todos.sql().table().truncate()
            expect(await todos.sql().count().all()).to.eq(0)
        })

        it('Count', () => {

        })

        it('Node', async () => {
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

        it('List', async () => {
            const list: TodoModel[] = []
            list.push(new TodoModel({ content: CONTENT}, {}))
            list.push(new TodoModel({ content: CONTENT_2}, {}))
            await todos.sql().list(list).insert()
            expect(await todos.sql().count().all()).to.eq(2)
            list[0].setState({content: CONTENT_STUPID})
            await todos.sql().list(list).update()
            expect(await todos.sql().count().all()).to.eq(2)
            const todosPulled = await todos.ctx().sql().pull().all().run() as TodoList
            expect(todosPulled.local().count()).to.eq(2)
            expect((todosPulled.local().nodeAt(0) as TodoModel).content()).to.eq(CONTENT_STUPID)
            expect((todosPulled.local().nodeAt(1) as TodoModel).content()).to.eq(CONTENT_2)
            list[0].setState({content: CONTENT})
            list[1].setState({content: CONTENT_STUPID})
            list.push(new TodoModel({ content: CONTENT_3}, {}))
            await todos.sql().list(list).update()
            expect(await todos.sql().count().all()).to.eq(3)
            expect(list[2].ID()).to.eq(4)

            const todosPulled2 = await todos.ctx().sql().pull().all().run() as TodoList
            expect(todosPulled2.local().count()).to.eq(3)
            expect((todosPulled2.local().nodeAt(0) as TodoModel).content()).to.eq(CONTENT)
            expect((todosPulled2.local().nodeAt(1) as TodoModel).content()).to.eq(CONTENT_STUPID)
            expect((todosPulled2.local().nodeAt(2) as TodoModel).content()).to.eq(CONTENT_3)

            const todosPulled3 = await todos.sql().list(list.slice(0, 2)).pull()
            expect(todosPulled3.local().count()).to.eq(2)
            expect((todosPulled3.local().nodeAt(0) as TodoModel).content()).to.eq(CONTENT)
            expect((todosPulled3.local().nodeAt(1) as TodoModel).content()).to.eq(CONTENT_STUPID)

            const count = await todos.sql().list(list.slice(0, 2)).remove()
            expect(count).to.eq(2)
            expect(await todos.sql().count().all()).to.eq(1)
            const todosPulled4 = await todos.ctx().sql().pull().all().run() as TodoList
            expect(todosPulled4.local().count()).to.eq(1)
            expect((todosPulled4.local().nodeAt(0) as TodoModel).content()).to.eq(CONTENT_3)
        })

        it('Update', async () => {
            expect(await todos.sql().count().all()).to.eq(1)
            await todos.sql().update({content: CONTENT }).all()
            const t = await todos.sql().find().where({content: CONTENT}) as TodoModel
            expect(t).to.not.eq(null)
            expect(t.content()).to.eq(CONTENT)
            await todos.sql().update({content: CONTENT_3 }).where({content: CONTENT})
            expect(await todos.sql().count().all()).to.eq(1)
            const t2 = await todos.sql().find().where({content: CONTENT}) as TodoModel
            expect(t2).to.eq(null)
            const t3 = await todos.sql().find().where({content: CONTENT_3}) as TodoModel
            expect(t3).to.not.eq(null)
            expect(t3.content()).to.eq(CONTENT_3)
        })

        it('Remove', async () => {
            expect(await todos.sql().count().all()).to.eq(1)
            await todos.sql().remove().all()
            expect(await todos.sql().count().all()).to.eq(0)
            await todos.quick().create({content: CONTENT_STUPID})
            expect(await todos.sql().count().all()).to.eq(1)
            await todos.sql().remove().where({ content: CONTENT})
            expect(await todos.sql().count().all()).to.eq(1)
            await todos.sql().remove().where({ content: CONTENT_STUPID})
        })
    })
}