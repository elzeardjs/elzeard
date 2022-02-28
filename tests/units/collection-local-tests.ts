import { expect } from 'chai';
import 'mocha';
import { Model, Collection, Joi } from '../../index'

export class PostModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        content: Joi.string().min(1).max(3000).required(),
        created_at: Joi.date().required().default('now'),
        user: Joi.number().positive().required().foreignKey('users2', 'id', 'post').deleteCascade()
    })

    constructor(initialState: any, options: any){
        super(initialState, PostModel, options)
    }

    ID = (): number => this.state.id as number
    content = (): string => this.state.content as string
    createdAt = (): Date => this.state.created_at as Date
    user = (): UserModel => this.state.user as UserModel
}

export class PostList extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [PostModel, PostList], options)
    }
}

export class UserModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey().group(['post']),
        username: Joi.string().min(3).max(20).lowercase().required().unique().group(['post']),
        created_at: Joi.date().required().default('now'),
        access_token: Joi.string().uuid().required().unique()
    })

    constructor(initialState: any, options: any){
        super(initialState, UserModel, options)
    }

    ID = (): number => this.state.id as number
    username = (): string => this.state.username as string
    createdAt = (): Date => this.state.created_at as Date
    accessToken = (): string => this.state.access_token as string
}

export class UserList extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [UserModel, UserList], options)
    }
}

export const posts = new PostList([], {table: 'posts2'})
export const users = new UserList([], {table: 'users2'})

export default async () => {

    const CONTENT_SPECIAL = 'SPECIAL!'

    describe('Collection local methods', () => {
        it('Create users and posts', async () => {
            await users.ctx().sql().list([ 
                new UserModel({ username: 'fantasim', access_token: '9e163f1d-5d54-4198-a614-32798ace74d5'}, {}),
                new UserModel({ username: 'aleixo', access_token: 'e903b785-15ab-4a88-9016-1cd449b4cbe4'}, {}),
                new UserModel({ username: 'antonio', access_token: '288a96ee-d6ee-4294-ae90-131608c81cca'}, {}),
            ]).insert()
            await posts.ctx().sql().list([
                new PostModel({ content: '1_CONTENT_1', user: 1 }, {}),
                new PostModel({ content: '1_CONTENT_2', user: 1 }, {}),
                new PostModel({ content: '2_CONTENT_1', user: 2 }, {}),
                new PostModel({ content: '2_CONTENT_2', user: 2 }, {}),
                new PostModel({ content: '2_CONTENT_3', user: 2 }, {}),
                new PostModel({ content: '3_CONTENT_1', user: 3 }, {}),
            ]).insert()
        })

        it('arrayOf', async () => {
            const p = await posts.quick().pull().run()
            expect(p.local().arrayOf('id').toString() ).to.eq([1,2,3,4,5,6].toString())
        })

        it('append', async () => {
            const p = await posts.quick().pull().run()
            p.local().append({content: CONTENT_SPECIAL, user: 1})
            expect(p.local().count()).to.eq(7)
            expect((p.local().nodeAt(6) as PostModel).content()).to.eq(CONTENT_SPECIAL)
            expect(() => p.local().append({content: CONTENT_SPECIAL})).to.throw(Error)
            expect(() => p.local().append({content: '', user: 1})).to.throw(Error)
            expect(p.local().count()).to.eq(7)


            p.local().append({content: CONTENT_SPECIAL, user: 1}, {content: CONTENT_SPECIAL, user: 1})
            expect(p.local().count()).to.eq(9)
            expect(() => p.local().append({content: CONTENT_SPECIAL, user: 1}, {content: CONTENT_SPECIAL})).to.throw(Error)
            expect(p.local().count()).to.eq(9)
        })

        it('chunk', async () => {
            const p = await posts.quick().pull().run()
            const co1 = p.local().chunk(2)
            expect(co1.length).to.eq(3)
            expect(co1[0].local().count()).to.eq(2)
            expect(co1[1].local().count()).to.eq(2)
            expect(co1[2].local().count()).to.eq(2)

            const co2 = p.local().chunk(3)
            expect(co2.length).to.eq(2)
            expect(co2[0].local().count()).to.eq(3)
            expect(co2[1].local().count()).to.eq(3)

            const co3 = p.local().chunk(4)
            expect(co3.length).to.eq(2)
            expect(co3[0].local().count()).to.eq(4)
            expect(co3[1].local().count()).to.eq(2)
        })

        it('concat', async () => {
            const p = await posts.quick().pull().run()
            p.local().concat([{content: CONTENT_SPECIAL, user: 1}, {content: CONTENT_SPECIAL, user: 5}])
            expect(p.local().count()).to.eq(8)
            expect((p.local().nodeAt(6) as PostModel).content()).to.eq(CONTENT_SPECIAL)
            expect((p.local().nodeAt(7) as PostModel).content()).to.eq(CONTENT_SPECIAL)
            expect(() => p.local().concat([{content: CONTENT_SPECIAL}])).to.throw(Error)
            expect(() => p.local().append([{content: '', user: 1}])).to.throw(Error)
        })

        it('count', () => null)

        it('find', async () => {
            const p = await posts.quick().pull().run()

            const m = p.local().find((m: PostModel) => {
                return m.content() === '3_CONTENT_1'
            }) as PostModel
            expect(m.content()).to.eq('3_CONTENT_1')

            const m2 = p.local().find({content: '3_CONTENT_1'}) as PostModel
            expect(m2.content()).to.eq('3_CONTENT_1')

            const m3 = p.local().find((m: PostModel) => {
                return m.content() === 'bullshit'
            }) as PostModel
            expect(m3).to.eq(undefined)

            const m4 = p.local().find({content: 'bullshit'}) as PostModel
            expect(m4).to.eq(undefined)
        })

        it('findIndex', async () => {
            const p = await posts.quick().pull().run()
            
            const idx = p.local().findIndex((m: PostModel) => {
                return m.content() === '3_CONTENT_1'
            })
            expect(idx).to.eq(5)
            const idx2 = p.local().findIndex({content: '3_CONTENT_1'})
            expect(idx2).to.eq(5)
            const idx3 = p.local().findIndex({content: '2_CONTENT_2'})
            expect(idx3).to.eq(3)
            const idx4 = p.local().findIndex((m: PostModel) => {
                return m.content() === 'bullshit'
            })
            expect(idx4).to.eq(-1)
            const idx5 = p.local().findIndex({content: 'bullshit'})
            expect(idx5).to.eq(-1)
        })

        it('filter', async () => {
            const p = await posts.quick().pull().run()
            const res = p.local().filter((m: PostModel) => {
                return m.user().ID() === 2
            })
            expect(res.count()).to.eq(3)
            expect((res.nodeAt(0) as PostModel).content()).to.eq('2_CONTENT_1')
            expect((res.nodeAt(1) as PostModel).content()).to.eq('2_CONTENT_2')
            expect((res.nodeAt(2) as PostModel).content()).to.eq('2_CONTENT_3')

            const res2 = p.local().filter({content: '2_CONTENT_2'})
            expect(res2.count()).to.eq(1)
            expect((res2.nodeAt(0) as PostModel).content()).to.eq('2_CONTENT_2')

            const res3 = p.local().filter((m: PostModel) => {
                return m.user().ID() === 5
            })
            expect(res3.count()).to.eq(0)
            const res4 = p.local().filter({content: 'bullshit'})
            expect(res4.count()).to.eq(0)
        })

        it('filterIn', async () => {
            const p = await posts.quick().pull().run()
            const res = p.local().filterIn('content', ['2_CONTENT_1', '1_CONTENT_2', '3_CONTENT_1', 'bullshit'])
            expect(res.count()).to.eq(3)
            expect((res.nodeAt(0) as PostModel).content()).to.eq('1_CONTENT_2')
            expect((res.nodeAt(1) as PostModel).content()).to.eq('2_CONTENT_1')
            expect((res.nodeAt(2) as PostModel).content()).to.eq('3_CONTENT_1')

            const res2 = p.local().filterIn('content', ['bullshit', 'sbfwefew'])
            expect(res2.count()).to.eq(0)
        })

        it('first', async () => {
            const p = await posts.quick().pull().run()

            const m = p.local().first() as PostModel
            expect(m.content()).to.eq('1_CONTENT_1')
        })

        it('forEach', async () => {
            const p = await posts.quick().pull().run()
            const arr = [1,2,3,4,5,6]
            p.local().forEach((m: PostModel, i: number) => {
                expect(m.ID()).to.eq(arr[i])
            })
        })

        it('groupBy', async () => {
            const p = await posts.quick().pull().run()
            const o2 = p.local().groupBy((m: PostModel) => {
                return m.user().ID()
            })
            expect(Object.keys(o2).length).to.eq(3)
            expect(o2['1'].local().count()).to.eq(2)
            expect(o2['2'].local().count()).to.eq(3)
            expect(o2['3'].local().count()).to.eq(1)

            const o = p.local().groupBy('id')
            expect(Object.keys(o).length).to.eq(6)
            expect(o['1'].local().count()).to.eq(1)
            expect(o['2'].local().count()).to.eq(1)
            expect(o['3'].local().count()).to.eq(1)
            expect(o['4'].local().count()).to.eq(1)
            expect(o['5'].local().count()).to.eq(1)
            expect(o['6'].local().count()).to.eq(1)
        })

        it('last', async () => {
            const p = await posts.quick().pull().run()
            const m = p.local().last() as PostModel
            expect(m.content()).to.eq('3_CONTENT_1')
        })

        it('limit', async () => {
            const p = await posts.quick().pull().run()

            expect(p.local().limit(3).count()).to.eq(3)
            expect(p.local().limit(2).count()).to.eq(2)
            expect(p.local().limit(6).count()).to.eq(6)
            expect(p.local().limit(7).count()).to.eq(6)
        })

        it('map', async () => {
            const p = await posts.quick().pull().run()
            expect(p.local().map((m: PostModel) => m.ID()).toString()).to.eq([1,2,3,4,5,6].toString())
        })

        it('nodeAt', async () => {
            const p = await posts.quick().pull().run()
            expect((p.local().nodeAt(0) as PostModel).ID()).to.eq(1)
            expect((p.local().nodeAt(5) as PostModel).ID()).to.eq(6)
            expect((p.local().nodeAt(6))).to.eq(undefined)
        })

        it('nth', async () => {
            const p = await posts.quick().pull().run()

            expect((p.local().nth(1) as PostModel).ID()).to.eq(2)
            expect((p.local().nth(-1) as PostModel).ID()).to.eq(6)
            expect((p.local().nth(-2) as PostModel).ID()).to.eq(5)
            expect((p.local().nth(2) as PostModel).ID()).to.eq(3)
        })

        it('offset', async () => {
            const p = await posts.quick().pull().run()

            expect(p.local().offset(3).count()).to.eq(3)
            expect(p.local().offset(2).count()).to.eq(4)
            expect(p.local().offset(6).count()).to.eq(0)
            expect(p.local().offset(7).count()).to.eq(0)
        })

        it('orderBy', async () => {
            const p = await posts.quick().pull().run()

            expect(p.local().orderBy('id', 'asc').local().arrayOf('id').toString()).to.eq([1,2,3,4,5,6].toString())
            expect(p.local().orderBy('id', 'desc').local().arrayOf('id').toString()).to.eq([6,5,4,3,2,1].toString())
        })

        it('pop', async () => {
            const p = await posts.quick().pull().run()

            expect(p.local().count()).to.equal(6)
            expect((p.local().nodeAt(5) as PostModel).ID()).to.eq(6)
            p.local().pop()
            expect(p.local().count()).to.equal(5)
            expect((p.local().nodeAt(4) as PostModel).ID()).to.eq(5)
        })

        it('prepend', async () => {
            const p = await posts.quick().pull().run()
            p.local().prepend({content: CONTENT_SPECIAL, user: 1})
            expect(p.local().count()).to.eq(7)
            expect((p.local().nodeAt(0) as PostModel).content()).to.eq(CONTENT_SPECIAL)

            expect(() => p.local().prepend({content: CONTENT_SPECIAL})).to.throw(Error)
            expect(() => p.local().prepend({content: '', user: 1})).to.throw(Error)
            expect(p.local().count()).to.eq(7)

            p.local().prepend({content: CONTENT_SPECIAL, user: 1}, {content: CONTENT_SPECIAL, user: 1})
            expect(p.local().count()).to.eq(9)
            expect(() => p.local().prepend({content: CONTENT_SPECIAL, user: 1}, {content: CONTENT_SPECIAL})).to.throw(Error)
            expect(p.local().count()).to.eq(9)
        })

        it('push', async () => {
            const p = await posts.quick().pull().run()
            p.local().push({content: CONTENT_SPECIAL, user: 1})
            expect(p.local().count()).to.eq(7)
            expect((p.local().nodeAt(6) as PostModel).content()).to.eq(CONTENT_SPECIAL)
            expect(() => p.local().push({content: CONTENT_SPECIAL})).to.throw(Error)
            expect(() => p.local().push({content: '', user: 1})).to.throw(Error)
            expect(p.local().count()).to.eq(7)
        })

        it('reduce', async () => {
            const p = await posts.quick().pull().run()
            const ret = p.local().reduce((total: number, node: PostModel) => total += node.ID(), 0)
            expect(ret).to.eq(1+2+3+4+5+6)
        })

        it('remove', async () => {
            const p = await posts.quick().pull().run()
            
            expect(!!(p.local().find({content: '3_CONTENT_1'})) ).to.eq(true)
            p.local().remove((m: PostModel) => {
                return m.content() === '3_CONTENT_1'
            })
            expect(!!(p.local().find({content: '3_CONTENT_1'})) ).to.eq(false)
            expect(p.local().count()).to.eq(5)

            expect(!!(p.local().find({content: '1_CONTENT_1'})) ).to.eq(true)
            p.local().remove({content: '1_CONTENT_1'})
            expect(!!(p.local().find({content: '1_CONTENT_1'})) ).to.eq(false)
            expect(p.local().count()).to.eq(4)
            
            p.local().remove((m: PostModel) => {
                return m.content() === 'bullshit'
            })
            expect(p.local().count()).to.eq(4)
            p.local().remove({content: 'bullshit'})
            expect(p.local().count()).to.eq(4)
        })

        it('removeAll', async () => {
            const p = await posts.quick().pull().run()

            expect(p.local().count()).to.eq(6)
            expect(!!(p.local().find({content: '3_CONTENT_1'})) ).to.eq(true)
            expect(!!(p.local().find({content: '1_CONTENT_1'})) ).to.eq(true)
            p.local().removeAll([{ content: '3_CONTENT_1'}, {content:'1_CONTENT_1'}, {content: 'bullshit'}])
            expect(!!(p.local().find({content: '3_CONTENT_1'})) ).to.eq(false)
            expect(!!(p.local().find({content: '1_CONTENT_1'})) ).to.eq(false)
            expect(p.local().count()).to.eq(4)
        })

        it('removeBy', async () => {
            const p = await posts.quick().pull().run()
            
            expect(p.local().count()).to.eq(6)
            expect(!!(p.local().find({id: 1})) ).to.eq(true)
            expect(!!(p.local().find({id: 2})) ).to.eq(true)
            p.local().removeBy({ id: 1})
            p.local().removeBy({ id: 2})
            p.local().removeBy({ id: 7})
            expect(p.local().count()).to.eq(4)
            expect(!!(p.local().find({id: 1})) ).to.eq(false)
            expect(!!(p.local().find({id: 2})) ).to.eq(false)
        })

        it('removeIndex', async () => {
            const p = await posts.quick().pull().run()

            expect(p.local().count()).to.eq(6)
            expect((p.local().nodeAt(0) as PostModel).ID()).to.eq(1)
            p.local().removeIndex(0)
            expect(p.local().count()).to.eq(5)
            expect((p.local().nodeAt(0) as PostModel).ID()).to.eq(2)
            p.local().removeIndex(4)
            expect(p.local().count()).to.eq(4)
            expect((p.local().nodeAt(3) as PostModel).ID()).to.eq(5)
            p.local().removeIndex(6)
            expect(p.local().count()).to.eq(4)
        })

        it('reverse', async () => {
            const p = await posts.quick().pull().run()
            expect(p.local().arrayOf('id').toString() ).to.eq([1,2,3,4,5,6].toString())

            expect(p.local().reverse().arrayOf('id').toString() ).to.eq([6,5,4,3,2,1].toString())
        })

        it('shift', async () => {
            const p = await posts.quick().pull().run()

            expect(p.local().count()).to.equal(6)
            expect((p.local().nodeAt(0) as PostModel).ID()).to.eq(1)
            p.local().shift()
            expect(p.local().count()).to.equal(5)
            expect((p.local().nodeAt(0) as PostModel).ID()).to.eq(2)
        })

        it('slice', async () => {
            const p = await posts.quick().pull().run()

            expect(p.local().slice(0, 2).arrayOf('id').toString()).to.eq([1,2].toString())
            expect(p.local().slice(2, 4).arrayOf('id').toString()).to.eq([3,4].toString())
            expect(p.local().slice(5, 7).arrayOf('id').toString()).to.eq([6].toString())
        })

        it('splice', async () => {
            const p = await posts.quick().pull().run()

            p.local().splice(6)
            expect(p.local().count()).to.eq(6)
            p.local().splice(5)
            expect(p.local().count()).to.eq(5)
            expect(() => p.local().splice(0, -1, {content: '', user: 1})).to.throw(Error)
            expect(() => p.local().splice(0, -1, {content: 'Geg'})).to.throw(Error)
            p.local().splice(0, -1, {content: 'Yo', user: 1}, {content: 'Mike', user: 1})
            expect((p.local().nodeAt(0) as PostModel).content()).to.eq('Yo')
            expect((p.local().nodeAt(1) as PostModel).content()).to.eq('Mike')
            expect(p.local().count()).to.eq(7)
            p.local().splice(2, 3)
            expect(p.local().count()).to.eq(4)
        })

        it('updateAll', async () => {
            const p = await posts.quick().pull().run()

            expect(() => p.local().updateAll({ content: ''})).to.throw(Error)
            p.local().updateAll({content: 'YS!'})
            p.local().forEach((m: PostModel) => {
                expect(m.content()).to.eq("YS!")
            })
        })

        it('updateAt', async () => {
            const p = await posts.quick().pull().run()

            expect(() => p.local().updateAt({ content: ''}, 0)).to.throw(Error)
            p.local().updateAt({content: 'YS!', user: 1}, 0)
            expect((p.local().nodeAt(0) as PostModel).content()).to.eq('YS!')
        })

        it('updateWhere', async () => {
            const p = await posts.quick().pull().run()

            expect(!!(p.local().find({content: '2_CONTENT_1'})) ).to.eq(true)
            expect(!!(p.local().find({content: CONTENT_SPECIAL})) ).to.eq(false)
            p.local().updateWhere({
                content: '2_CONTENT_1'
            }, {content: CONTENT_SPECIAL})
            expect(!!(p.local().find({content: '2_CONTENT_1'})) ).to.eq(false)
            expect(!!(p.local().find({content:CONTENT_SPECIAL  })) ).to.eq(true)
            expect(() => p.local().updateWhere({
                content: CONTENT_SPECIAL
            }, {content: ''})).to.throw(Error)
            
            const bef = p.local().to().string()
            p.local().updateWhere({
                content: 'bullshit'
            }, {content: CONTENT_SPECIAL})
            expect(p.local().to().string()).to.eq(bef)
        })

        

    })

}
