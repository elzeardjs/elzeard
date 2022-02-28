import { Model, Joi, Collection } from '../../index'
import { expect } from 'chai';
import 'mocha';


import { UserModel, UserList } from './collection-local-tests'


export class CommunityModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        name: Joi.string().min(3).max(30).required().unique().group(['yolo']),
        description: Joi.string().max(400),
        created_at: Joi.date().required().default('now'),
        user: Joi.number().positive().required().populate('users3', 'id', 'preview').group(['yolo'])
    })

    constructor(initialState: any, options: any){
        super(initialState, CommunityModel, options)
    }
    ID = () => this.state.id
    createdAt = () => this.state.created_at
    description = () => this.state.description
    name = () => this.state.name
    user = (): UserModel => this.state.user
}

export class TweetModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        content: Joi.string().min(1).max(3000).required(),
        created_at: Joi.date().required().default('now'),
        community: Joi.number().positive().required().foreignKey('communities', 'id').deleteCascade(),
        user: Joi.number().required().foreignKey('users3', 'id', 'preview').deleteCascade()
    })

    constructor(initialState: any, options: any){
        super(initialState, TweetModel, options)
    }

    ID = (): number => this.state.id as number
    content = (): string => this.state.content as string
    createdAt = (): Date => this.state.created_at as Date
    community = (): CommunityModel => this.state.community as CommunityModel
    user = (): UserModel => this.state.user as UserModel
}

export class LikeModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        created_at: Joi.date().required().default('now'),
        tweet: Joi.number().required().foreignKey('tweets', 'id').deleteCascade(),
        user: Joi.number().required().foreignKey('users3', 'id', 'preview').deleteCascade()
    })

    constructor(initialState: any, options: any){
        super(initialState, LikeModel, options)
    }

    ID = (): number => this.state.id as number
    createdAt = (): Date => this.state.created_at as Date
    community = (): CommunityModel => this.state.spot as CommunityModel
    user = (): UserModel => this.state.user as UserModel
}

export class CommunityList extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [CommunityModel, CommunityList], options)
    }
}

export class TweetList extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [TweetModel, TweetList], options)
    }
}

export class LikeList extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [LikeModel, LikeList], options)
    }
}

export const users = new UserList([], {table: 'users3'})
export const communities = new CommunityList([], {table: 'communities'})
export const tweets = new TweetList([], {table: 'tweets'})
export const likes = new LikeList([], {table: 'likes'})

export default async () => {

    describe('Utility methods', () => {

        it('Create users, community, tweets and likes', async () => {
            await users.ctx().quick().create({
                username: 'fantasim', access_token: '9e163f1d-5d54-4198-a614-32798ace74d5'
            })
            await communities.ctx().quick().create({
                name: 'elzeard', description: 'OOP Data Manager based on Knex and Joi', user: 1
            })
            await tweets.ctx().quick().create({
                content: 'I love elzeard', user: 1, community: 1
            })
            await likes.ctx().quick().create({
                tweet: 1, user: 1
            })
        })

        it('Model 1 : populate/unpopulate/plain/group', async () => {
            const c = await communities.quick().find(1) as CommunityModel
          
            expect(c.super().is().populated()).to.eq(true)
            expect(c.super().is().populatable()).to.eq(true)
            expect(c.super().is().unpopulated()).to.eq(false)

            expect(c.ID()).to.eq(1)
            expect(c.name()).to.eq('elzeard')
            expect(c.description()).to.eq('OOP Data Manager based on Knex and Joi')
            expect(typeof c.user()).to.eq('object')
            expect(c.user().ID()).to.eq(1)
            expect(c.user().username()).to.eq('fantasim')

            const plain = c.to().plain()
            expect(plain.id).to.eq(1)
            expect(plain.name).to.eq('elzeard')
            expect(plain.description).to.eq('OOP Data Manager based on Knex and Joi')
            expect(plain.created_at instanceof Date).to.eq(true)

            expect(plain.user.id).to.eq(1)
            expect(plain.user.username).to.eq('fantasim')
            expect(plain.user.created_at).to.eq(undefined)
            expect(plain.user.access_token).to.eq(undefined)

            const plain2 = c.to().filterGroup('yolo').plain()
            expect(plain2.id).to.eq(undefined)
            expect(plain2.name).to.eq('elzeard')
            expect(plain2.description).to.eq(undefined)
            expect(plain2.created_at).to.eq(undefined)
            
            expect(plain2.user.id).to.eq(1)
            expect(plain2.user.username).to.eq('fantasim')
            expect(plain2.user.created_at).to.eq(undefined)
            expect(plain2.user.access_token).to.eq(undefined)

            c.unpopulate()
            expect(c.super().is().populated()).to.eq(false)
            expect(c.super().is().populatable()).to.eq(true)
            expect(c.super().is().unpopulated()).to.eq(true)

            expect(c.ID()).to.eq(1)
            expect(c.name()).to.eq('elzeard')
            expect(c.description()).to.eq('OOP Data Manager based on Knex and Joi')
            expect(typeof c.user()).to.eq('number')
            expect(c.user()).to.eq(1)

            await c.populate()
            expect(c.super().is().populated()).to.eq(true)
            expect(c.super().is().populatable()).to.eq(true)
            expect(c.super().is().unpopulated()).to.eq(false)

            expect(c.ID()).to.eq(1)
            expect(c.name()).to.eq('elzeard')
            expect(c.description()).to.eq('OOP Data Manager based on Knex and Joi')
            expect(typeof c.user()).to.eq('object')
            expect(c.user().ID()).to.eq(1)
            expect(c.user().username()).to.eq('fantasim')
            expect(c.user().createdAt() instanceof Date ).to.eq(true)
            expect(c.user().accessToken()).to.eq('9e163f1d-5d54-4198-a614-32798ace74d5')
        })
        return

        it('Model 2 : populate/unpopulate/plain/group', async () => {
            const t = await tweets.quick().find(1) as TweetModel

            expect(t.ID()).to.eq(1)
            expect(t.content()).to.eq('I love elzeard')
            expect(typeof t.user()).to.eq('object')
            expect(typeof t.community()).to.eq('object')
            expect(t.user().ID()).to.eq(1)
            expect(t.user().username()).to.eq('fantasim')
            expect(t.user().createdAt()).to.eq(undefined)
            expect(t.user().accessToken()).to.eq(undefined)

            expect(t.community().name()).to.eq('elzeard')
            expect(t.community().description()).to.eq('OOP Data Manager based on Knex and Joi')
            expect(typeof t.community().user()).to.eq('object')
            expect(t.community().user().ID()).to.eq(1)
            expect(t.community().user().username()).to.eq('fantasim')
            expect(t.community().user().createdAt()).to.eq(undefined)
            expect(t.community().user().accessToken()).to.eq(undefined)

            t.unpopulate()
            expect(t.ID()).to.eq(1)
            expect(t.content()).to.eq('I love elzeard')
            expect(typeof t.user()).to.eq('number')
            expect(t.user()).to.eq(1)
            expect(typeof t.community()).to.eq('number')
            expect(t.community()).to.eq(1)

            await t.populate()
            expect(t.ID()).to.eq(1)
            expect(t.content()).to.eq('I love elzeard')
            expect(typeof t.user()).to.eq('object')
            expect(typeof t.community()).to.eq('object')
            expect(t.user().ID()).to.eq(1)
            expect(t.user().username()).to.eq('fantasim')
            expect(t.user().createdAt()).to.eq(undefined)
            expect(t.user().accessToken()).to.eq(undefined)
            expect(t.community().name()).to.eq('elzeard')
            expect(t.community().description()).to.eq('OOP Data Manager based on Knex and Joi')
            expect(typeof t.community().user()).to.eq('object')
            expect(t.community().user().ID()).to.eq(1)
            expect(t.community().user().username()).to.eq('fantasim')
            expect(t.community().user().createdAt()).to.eq(undefined)
            expect(t.community().user().accessToken()).to.eq(undefined)
        })

        it('Model 3 : populate/unpopulate + group', async () => {
            const l = await likes.quick().find(1) as LikeModel
        })


    })

}