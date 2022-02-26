import { expect } from 'chai';

import { TodoList, TodoModel, todos } from './data'

export default async () => {

    const CONTENT = 'content_1'
    const CONTENT_2 = 'content_2'
    const CONTENT_3 = 'content_3'
    const CONTENT_STUPID = 'STUPID'
    const CONTENT_WEIRD = 'weird.....'

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
            expect(await todos.sql().count().all()).to.eq(0)
        })

        it('Pull', async () => {
            await todos.ctx().local().append(
                { content: CONTENT },
                { content: CONTENT_2 },
                { content: CONTENT_3 },
                { content: CONTENT_STUPID },
                { content: CONTENT_STUPID },
            ).saveToDB()
            expect(await todos.sql().count().all()).to.eq(5)
            
            const pulledAll = await todos.ctx().sql().pull().all().run() as TodoList
            expect(pulledAll.local().count()).to.eq(5)
            const pulledOffset = await todos.ctx().sql().pull().all().offset(2).run() as TodoList
            expect(pulledOffset.local().count()).to.eq(3)
            const pulledLimit = await todos.ctx().sql().pull().all().limit(2).run() as TodoList
            expect(pulledLimit.local().count()).to.eq(2)
            const pulledOffsetAndLimit = await todos.ctx().sql().pull().all().limit(2).offset(4).run() as TodoList
            expect(pulledOffsetAndLimit.local().count()).to.eq(1)
            const pulledOffsetAndLimit2 = await todos.ctx().sql().pull().all().limit(3).offset(1).run() as TodoList
            expect(pulledOffsetAndLimit2.local().count()).to.eq(3)

            const pulledParam = await todos.ctx().sql().pull().where({content: CONTENT_STUPID}).run() as TodoList
            expect(pulledParam.local().count()).to.eq(2)
            const pulledParamOffset = await todos.ctx().sql().pull().where({content: CONTENT_STUPID}).offset(1).run() as TodoList
            expect(pulledParamOffset.local().count()).to.eq(1)
            const pulledParamOffset2 = await todos.ctx().sql().pull().where({content: CONTENT_STUPID}).offset(2).run() as TodoList
            expect(pulledParamOffset2.local().count()).to.eq(0)
            const pulledParamLimit = await todos.ctx().sql().pull().where({content: CONTENT_STUPID}).limit(1).run() as TodoList
            expect(pulledParamLimit.local().count()).to.eq(1)
            const pulledParamLimit2 = await todos.ctx().sql().pull().where({content: CONTENT_STUPID}).limit(3).run() as TodoList
            expect(pulledParamLimit2.local().count()).to.eq(2)

            const pulledParamOffsetAndLimit = await todos.ctx().sql().pull().where({content: CONTENT_STUPID}).offset(1).limit(2).run() as TodoList
            expect(pulledParamOffsetAndLimit.local().count()).to.eq(1)
        })

        it('Find', async () => {
            const f = await todos.sql().find().firstBy('created_at') as TodoModel
            expect(f).to.not.eq(null)
            expect(f.content()).to.eq(CONTENT)

            const l = await todos.sql().find().lastBy('id') as TodoModel
            expect(l).to.not.eq(null)
            expect(l.content()).to.eq(CONTENT_STUPID)

            const p = await todos.sql().find().byPrimary(4) as TodoModel
            expect(p).to.not.eq(null)
            expect(p.content()).to.eq(CONTENT_3)

            const w = await todos.sql().find().where({content: CONTENT_2}) as TodoModel
            expect(w).to.not.eq(null)
            expect(w.content()).to.eq(CONTENT_2)
        })

        it('Quick methods', async () => {
            await todos.sql().remove().all()
            expect(await todos.sql().count().all()).to.eq(0)
            await todos.quick().create({content: CONTENT_WEIRD})
            expect(await todos.sql().count().all()).to.eq(1)
    
            const l = await todos.quick().find({'content': CONTENT_WEIRD}) as TodoModel
            expect(l).to.not.eq(null)
            expect(l.content()).to.eq(CONTENT_WEIRD)
    
            await todos.quick().update({content: CONTENT}, {id: l.ID()})
            const l2 = await todos.quick().find({'content': CONTENT}) as TodoModel
            expect(l2).to.not.eq(null)
            expect(l2.content()).to.eq(CONTENT)

            await todos.quick().update({content: CONTENT_WEIRD})
            const l3 = await todos.quick().find({'content': CONTENT_WEIRD}) as TodoModel
            expect(l3).to.not.eq(null)
            expect(l3.content()).to.eq(CONTENT_WEIRD)

            expect(todos.quick().test({content: 'Hello'})).to.eq(undefined)

            const pulledAll = await todos.quick().pull().run() as TodoList
            expect(pulledAll.local().count()).to.eq(1)
            const pulledW = await todos.quick().pull({'content': CONTENT_WEIRD}).run() as TodoList
            expect(pulledW.local().count()).to.eq(1)
            const pulledW2 = await todos.quick().pull({'content': CONTENT}).run() as TodoList
            expect(pulledW2.local().count()).to.eq(0)


            

        })


    })
}