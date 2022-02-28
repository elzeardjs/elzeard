import { Model, Joi, Collection } from '../../index'
import { expect } from 'chai';
import 'mocha';


import { UserModel, UserList } from './collection-local-tests'


export class CommunityModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        name: Joi.string().min(3).max(30).required().unique(),
        description: Joi.string().max(400),
        created_at: Joi.date().required().default('now'),
        user: Joi.number().positive().required()
    })

    constructor(initialState: any, options: any){
        super(initialState, CommunityModel, options)
    }
    ID = () => this.state.id
    createdAt = () => this.state.created_at
    description = () => this.state.description
    name = () => this.state.name
    user = (): number => this.state.user
}

export class TweetModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        content: Joi.string().min(1).max(3000).required(),
        created_at: Joi.date().required().default('now'),
        community: Joi.number().positive().required().foreignKey('communities', 'id').deleteCascade(),
        user: Joi.number().required().foreignKey('users3', 'id').deleteCascade()
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
        user: Joi.number().required().foreignKey('users3', 'id').deleteCascade()
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



    })

}