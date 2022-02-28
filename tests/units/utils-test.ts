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
        content: Joi.string().min(1).max(3000).required().group(['yolo']),
        created_at: Joi.date().required().default('now'),
        community: Joi.number().positive().required().foreignKey('communities', 'id').deleteCascade().group(['yolo']),
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
        tweet: Joi.number().required().foreignKey('tweets', 'id', 'yolo').deleteCascade(),
        user: Joi.number().required().foreignKey('users3', 'id', 'preview').deleteCascade()
    })

    constructor(initialState: any, options: any){
        super(initialState, LikeModel, options)
    }

    ID = (): number => this.state.id as number
    createdAt = (): Date => this.state.created_at as Date
    tweet = (): TweetModel => this.state.tweet 
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
            expect(c.createdAt() instanceof Date ).to.eq(true)
            expect(typeof c.user()).to.eq('object')
            expect(c.user().ID()).to.eq(1)
            expect(c.user().username()).to.eq('fantasim')
            expect(c.user().createdAt() instanceof Date ).to.eq(true)
            expect(c.user().accessToken()).to.eq('9e163f1d-5d54-4198-a614-32798ace74d5')

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
            expect(c.createdAt() instanceof Date ).to.eq(true)
            expect(typeof c.user()).to.eq('number')
            expect(c.user()).to.eq(1)

            await c.populate()
            expect(c.super().is().populated()).to.eq(true)
            expect(c.super().is().populatable()).to.eq(true)
            expect(c.super().is().unpopulated()).to.eq(false)

            expect(c.ID()).to.eq(1)
            expect(c.name()).to.eq('elzeard')
            expect(c.description()).to.eq('OOP Data Manager based on Knex and Joi')
            expect(c.createdAt() instanceof Date ).to.eq(true)
            expect(typeof c.user()).to.eq('object')
            expect(c.user().ID()).to.eq(1)
            expect(c.user().username()).to.eq('fantasim')
            expect(c.user().createdAt() instanceof Date ).to.eq(true)
            expect(c.user().accessToken()).to.eq('9e163f1d-5d54-4198-a614-32798ace74d5')
        })

        it('Model 2 : populate/unpopulate/plain/group', async () => {
            const t = await tweets.quick().find(1) as TweetModel

            expect(t.super().is().populated()).to.eq(true)
            expect(t.super().is().populatable()).to.eq(true)
            expect(t.super().is().unpopulated()).to.eq(false)

            expect(t.ID()).to.eq(1)
            expect(t.content()).to.eq('I love elzeard')
            expect(t.createdAt() instanceof Date ).to.eq(true)
            expect(typeof t.user()).to.eq('object')
            expect(t.user().ID()).to.eq(1)
            expect(t.user().username()).to.eq('fantasim')
            expect(t.user().createdAt() instanceof Date ).to.eq(true)
            expect(t.user().accessToken()).to.eq('9e163f1d-5d54-4198-a614-32798ace74d5')
            expect(typeof t.community()).to.eq('object')

            expect(t.community().ID()).to.eq(1)
            expect(t.community().name()).to.eq('elzeard')
            expect(t.community().description()).to.eq('OOP Data Manager based on Knex and Joi')
            expect(t.community().createdAt() instanceof Date ).to.eq(true)
            expect(typeof t.community().user()).to.eq('object')
            expect(t.community().user().ID()).to.eq(1)
            expect(t.community().user().username()).to.eq('fantasim')
            expect(t.community().user().createdAt() instanceof Date ).to.eq(true)
            expect(t.community().user().accessToken()).to.eq('9e163f1d-5d54-4198-a614-32798ace74d5')


            const plain = t.to().plain()
            expect(plain.id).to.eq(1)
            expect(plain.content).to.eq('I love elzeard')
            expect(plain.created_at instanceof Date).to.eq(true)

            expect(plain.user.id).to.eq(1)
            expect(plain.user.username).to.eq('fantasim')
            expect(plain.user.created_at).to.eq(undefined)
            expect(plain.user.access_token).to.eq(undefined)

            expect(plain.community.id).to.eq(1)
            expect(plain.community.name).to.eq('elzeard')
            expect(plain.community.description).to.eq('OOP Data Manager based on Knex and Joi')
            expect(plain.community.created_at instanceof Date).to.eq(true)

            expect(plain.community.user.id).to.eq(1)
            expect(plain.community.user.username).to.eq('fantasim')
            expect(plain.community.user.created_at).to.eq(undefined)
            expect(plain.community.user.access_token).to.eq(undefined)

            const plain2 = t.to().filterGroup('yolo').plain()
            expect(plain2.id).to.eq(undefined)
            expect(plain2.content).to.eq('I love elzeard')
            expect(plain2.user).to.eq(undefined)
            expect(plain2.created_at).to.eq(undefined)
            
            expect(plain2.community.id).to.eq(1)
            expect(plain2.community.name).to.eq('elzeard')
            expect(plain2.community.description).to.eq('OOP Data Manager based on Knex and Joi')
            expect(plain2.community.created_at instanceof Date).to.eq(true)

            expect(plain2.community.user.id).to.eq(1)
            expect(plain2.community.user.username).to.eq('fantasim')
            expect(plain2.community.user.created_at).to.eq(undefined)
            expect(plain2.community.user.access_token).to.eq(undefined)


            t.unpopulate()
            expect(t.super().is().populated()).to.eq(false)
            expect(t.super().is().populatable()).to.eq(true)
            expect(t.super().is().unpopulated()).to.eq(true)
            expect(t.ID()).to.eq(1)
            expect(t.content()).to.eq('I love elzeard')
            expect(t.createdAt() instanceof Date ).to.eq(true)
            expect(typeof t.user()).to.eq('number')
            expect(t.user()).to.eq(1)
            expect(typeof t.community()).to.eq('number')
            expect(t.community()).to.eq(1)

            await t.populate()

            expect(t.super().is().populated()).to.eq(true)
            expect(t.super().is().populatable()).to.eq(true)
            expect(t.super().is().unpopulated()).to.eq(false)

            expect(t.ID()).to.eq(1)
            expect(t.content()).to.eq('I love elzeard')
            expect(t.createdAt() instanceof Date ).to.eq(true)
            expect(typeof t.user()).to.eq('object')
            expect(t.user().ID()).to.eq(1)
            expect(t.user().username()).to.eq('fantasim')
            expect(t.user().createdAt() instanceof Date ).to.eq(true)
            expect(t.user().accessToken()).to.eq('9e163f1d-5d54-4198-a614-32798ace74d5')
            expect(typeof t.community()).to.eq('object')

            expect(t.community().ID()).to.eq(1)
            expect(t.community().name()).to.eq('elzeard')
            expect(t.community().description()).to.eq('OOP Data Manager based on Knex and Joi')
            expect(t.community().createdAt() instanceof Date ).to.eq(true)
            expect(typeof t.community().user()).to.eq('object')
            expect(t.community().user().ID()).to.eq(1)
            expect(t.community().user().username()).to.eq('fantasim')
            expect(t.community().user().createdAt() instanceof Date ).to.eq(true)
            expect(t.community().user().accessToken()).to.eq('9e163f1d-5d54-4198-a614-32798ace74d5')
        })

        it('Model 3 : populate/unpopulate/plain/group', async () => {
            const l = await likes.quick().find(1) as LikeModel

            expect(l.super().is().populated()).to.eq(true)
            expect(l.super().is().populatable()).to.eq(true)
            expect(l.super().is().unpopulated()).to.eq(false)

            expect(l.ID()).to.eq(1)
            expect(l.createdAt() instanceof Date ).to.eq(true)
            expect(typeof l.user()).to.eq('object')
            expect(l.user().ID()).to.eq(1)
            expect(l.user().username()).to.eq('fantasim')
            expect(l.user().createdAt() instanceof Date ).to.eq(true)
            expect(l.user().accessToken()).to.eq('9e163f1d-5d54-4198-a614-32798ace74d5')
            expect(typeof l.tweet()).to.eq('object')

            expect(l.tweet().ID()).to.eq(1)
            expect(l.tweet().content()).to.eq('I love elzeard')
            expect(l.tweet().createdAt() instanceof Date ).to.eq(true)
            expect(typeof l.tweet().user()).to.eq('object')
            expect(l.tweet().user().ID()).to.eq(1)
            expect(l.tweet().user().username()).to.eq('fantasim')
            expect(l.tweet().user().createdAt() instanceof Date ).to.eq(true)
            expect(l.tweet().user().accessToken()).to.eq('9e163f1d-5d54-4198-a614-32798ace74d5')
            expect(typeof l.tweet().community()).to.eq('object')

            expect(l.tweet().community().ID()).to.eq(1)
            expect(l.tweet().community().name()).to.eq('elzeard')
            expect(l.tweet().community().description()).to.eq('OOP Data Manager based on Knex and Joi')
            expect(l.tweet().community().createdAt() instanceof Date ).to.eq(true)
            expect(typeof l.tweet().community().user()).to.eq('object')
            expect(l.tweet().community().user().ID()).to.eq(1)
            expect(l.tweet().community().user().username()).to.eq('fantasim')
            expect(l.tweet().community().user().createdAt() instanceof Date ).to.eq(true)
            expect(l.tweet().community().user().accessToken()).to.eq('9e163f1d-5d54-4198-a614-32798ace74d5')


            const plain = l.to().plain()
            expect(plain.id).to.eq(1)
            expect(plain.created_at instanceof Date).to.eq(true)

            expect(plain.user.id).to.eq(1)
            expect(plain.user.username).to.eq('fantasim')
            expect(plain.user.created_at).to.eq(undefined)
            expect(plain.user.access_token).to.eq(undefined)

            expect(plain.tweet.id).to.eq(undefined)
            expect(plain.tweet.content).to.eq('I love elzeard')
            expect(plain.tweet.user).to.eq(undefined)
            expect(plain.tweet.created_at).to.eq(undefined)
            
            expect(plain.tweet.community.id).to.eq(1)
            expect(plain.tweet.community.name).to.eq('elzeard')
            expect(plain.tweet.community.description).to.eq('OOP Data Manager based on Knex and Joi')
            expect(plain.tweet.community.created_at instanceof Date).to.eq(true)

            expect(plain.tweet.community.user.id).to.eq(1)
            expect(plain.tweet.community.user.username).to.eq('fantasim')
            expect(plain.tweet.community.user.created_at).to.eq(undefined)
            expect(plain.tweet.community.user.access_token).to.eq(undefined)

            l.unpopulate()
            expect(l.super().is().populated()).to.eq(false)
            expect(l.super().is().populatable()).to.eq(true)
            expect(l.super().is().unpopulated()).to.eq(true)
            expect(l.ID()).to.eq(1)
            expect(l.createdAt() instanceof Date ).to.eq(true)
            expect(typeof l.user()).to.eq('number')
            expect(l.user()).to.eq(1)
            expect(typeof l.tweet()).to.eq('number')
            expect(l.tweet()).to.eq(1)

            await l.populate()

            expect(l.super().is().populated()).to.eq(true)
            expect(l.super().is().populatable()).to.eq(true)
            expect(l.super().is().unpopulated()).to.eq(false)

            expect(l.ID()).to.eq(1)
            expect(l.createdAt() instanceof Date ).to.eq(true)
            expect(typeof l.user()).to.eq('object')
            expect(l.user().ID()).to.eq(1)
            expect(l.user().username()).to.eq('fantasim')
            expect(l.user().createdAt() instanceof Date ).to.eq(true)
            expect(l.user().accessToken()).to.eq('9e163f1d-5d54-4198-a614-32798ace74d5')
            expect(typeof l.tweet()).to.eq('object')

            expect(l.tweet().ID()).to.eq(1)
            expect(l.tweet().content()).to.eq('I love elzeard')
            expect(l.tweet().createdAt() instanceof Date ).to.eq(true)
            expect(typeof l.tweet().user()).to.eq('object')
            expect(l.tweet().user().ID()).to.eq(1)
            expect(l.tweet().user().username()).to.eq('fantasim')
            expect(l.tweet().user().createdAt() instanceof Date ).to.eq(true)
            expect(l.tweet().user().accessToken()).to.eq('9e163f1d-5d54-4198-a614-32798ace74d5')
            expect(typeof l.tweet().community()).to.eq('object')

            expect(l.tweet().community().ID()).to.eq(1)
            expect(l.tweet().community().name()).to.eq('elzeard')
            expect(l.tweet().community().description()).to.eq('OOP Data Manager based on Knex and Joi')
            expect(l.tweet().community().createdAt() instanceof Date ).to.eq(true)
            expect(typeof l.tweet().community().user()).to.eq('object')
            expect(l.tweet().community().user().ID()).to.eq(1)
            expect(l.tweet().community().user().username()).to.eq('fantasim')
            expect(l.tweet().community().user().createdAt() instanceof Date ).to.eq(true)
            expect(l.tweet().community().user().accessToken()).to.eq('9e163f1d-5d54-4198-a614-32798ace74d5')
        })

        it('Test populate and unpopulate on Collection', async () => {
            await users.ctx().quick().create({
                username: 'second', access_token: 'df0ef1e9-c45f-4093-911f-741f4b222a1e'
            })
            await tweets.ctx().quick().create({
                content: 'I dont like elzeard', user: 2, community: 1
            })

            const list = await tweets.quick().pull().run()

            expect(list.super().is().populated()).to.eq(true)
            expect(list.super().is().populatable()).to.eq(true)
            expect(list.super().is().unpopulated()).to.eq(false)

            const plain = list.local().to().plain()
            expect(plain.length).to.eq(2)

            const p0 = plain[0]

            expect(p0.id).to.eq(1)
            expect(p0.content).to.eq('I love elzeard')
            expect(p0.created_at instanceof Date).to.eq(true)

            expect(p0.user.id).to.eq(1)
            expect(p0.user.username).to.eq('fantasim')
            expect(p0.user.created_at).to.eq(undefined)
            expect(p0.user.access_token).to.eq(undefined)

            expect(p0.community.id).to.eq(1)
            expect(p0.community.name).to.eq('elzeard')
            expect(p0.community.description).to.eq('OOP Data Manager based on Knex and Joi')
            expect(p0.community.created_at instanceof Date).to.eq(true)

            expect(p0.community.user.id).to.eq(1)
            expect(p0.community.user.username).to.eq('fantasim')
            expect(p0.community.user.created_at).to.eq(undefined)
            expect(p0.community.user.access_token).to.eq(undefined)

            const p1 = plain[1]

            expect(p1.id).to.eq(2)
            expect(p1.content).to.eq('I dont like elzeard')
            expect(p1.created_at instanceof Date).to.eq(true)

            expect(p1.user.id).to.eq(2)
            expect(p1.user.username).to.eq('second')
            expect(p1.user.created_at).to.eq(undefined)
            expect(p1.user.access_token).to.eq(undefined)

            expect(p1.community.id).to.eq(1)
            expect(p1.community.name).to.eq('elzeard')
            expect(p1.community.description).to.eq('OOP Data Manager based on Knex and Joi')
            expect(p1.community.created_at instanceof Date).to.eq(true)

            expect(p1.community.user.id).to.eq(1)
            expect(p1.community.user.username).to.eq('fantasim')
            expect(p1.community.user.created_at).to.eq(undefined)
            expect(p1.community.user.access_token).to.eq(undefined)

            list.local().unpopulate()
            expect(list.super().is().populated()).to.eq(false)
            expect(list.super().is().populatable()).to.eq(true)
            expect(list.super().is().unpopulated()).to.eq(true)

            const plain2 = list.local().to().plain()
            expect(plain2.length).to.eq(2)
            const p20 = plain2[0]

            expect(p20.id).to.eq(1)
            expect(p20.content).to.eq('I love elzeard')
            expect(p20.created_at instanceof Date).to.eq(true)
            expect(p20.user).to.eq(1)
            expect(p20.community).to.eq(1)

            const p21 = plain2[1]

            expect(p21.id).to.eq(2)
            expect(p21.content).to.eq('I dont like elzeard')
            expect(p21.created_at instanceof Date).to.eq(true)
            expect(p21.user).to.eq(2)
            expect(p21.community).to.eq(1)
        })

        it('saveToDB on Model', async () => {

        
        })

        it('saveToDB on Collection', async () => {

        })


    })
}