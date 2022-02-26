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

    })
}
