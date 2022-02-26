import { Model, Joi, Collection } from '../../index'
import Knex from 'knex'

export class DeviceModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement(),
        last_connexion: Joi.date().required().default('now'),
        count_connexion: Joi.number().positive().default(1).required(),
        created_at: Joi.date().required().default('now'),
        user: Joi.number().positive().required().foreignKey('users', 'id').deleteCascade()
    })

    constructor(initialState: any, options: any){
        super(initialState, DeviceModel, options)
    }

    ID = () => this.state.id
    lastConnexion = () => this.state.last_connexion
    countConnexion = () => this.state.count_connexion
    createdAt = () => this.state.created_at
    user = (): UserModel => this.state.user as UserModel
}

export class SpotModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        name: Joi.string().min(3).max(30).required().unique(),
        description: Joi.string().max(400),
        created_at: Joi.date().required().default('now'),
        user: Joi.number().positive().required().populate('users', 'id', 'post')
    })

    constructor(initialState: any, options: any){
        super(initialState, SpotModel, options)
    }

    ID = () => this.state.id
    createdAt = () => this.state.created_at
    description = () => this.state.description
    name = () => this.state.name
    user = (): UserModel => this.state.user as UserModel

    fetchPosts = async () => await posts.ctx().quick().pull({spot: this.ID()}).run() as PostList
}

export class PostModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        content: Joi.string().min(1).max(3000).required(),
        created_at: Joi.date().required().default('now'),
        spot: Joi.number().positive().required().foreignKey('spots', 'id').deleteCascade(),
        user: Joi.number().positive().required().foreignKey('users', 'id', 'post').deleteCascade()
    })

    constructor(initialState: any, options: any){
        super(initialState, PostModel, options)
    }

    ID = (): number => this.state.id as number
    content = (): string => this.state.content as string
    createdAt = (): Date => this.state.created_at as Date
    spot = (): SpotModel => this.state.spot as SpotModel
    user = (): UserModel => this.state.user as UserModel
}

export class UserModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey().group(['post']),
        username: Joi.string().min(3).max(20).lowercase().required().unique().group(['post']),
        created_at: Joi.date().required().default('now'),
        access_token: Joi.string().uuid().required().unique()
    }).with('username', 'access_token')

    constructor(initialState: any, options: any){
        super(initialState, UserModel, options)
    }

    ID = (): number => this.state.id as number
    username = (): string => this.state.username as string
    createdAt = (): Date => this.state.created_at as Date
    accessToken = (): string => this.state.access_token as string

    countOwnedSpot = async () => await spots.quick().count({ user: this.ID() })
    countDevices = async () => await devices.quick().count({ user: this.ID() })
    countAllPosts = async () => await posts.quick().count({ user: this.ID() })

    fetchDevices = async () => await devices.ctx().quick().pull({ user: this.ID() }).run() as DeviceList
    fetchSpots = async () => await spots.ctx().quick().pull({user: this.ID()}).run() as SpotList
    fetchPosts = async () => await posts.ctx().quick().pull({user: this.ID()}).run() as PostList
    fetchChats = async () => await chats.ctx().sql().pull().custom((q: Knex.QueryBuilder) => q.where({user_1: this.ID()}).orWhere({user_2: this.ID()}))
}

export class UserSpecificModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        username: Joi.string().min(3).max(20).lowercase().required().unique(),
        created_at: Joi.date().required().default('now'),
        access_token: Joi.string().uuid().required().unique()
    }).with('username', 'access_token')

    constructor(initialState: any, options: any){
        super(initialState, UserSpecificModel, options)
    }

    ID = (): number => this.state.id as number
    username = (): string => this.state.username as string
    createdAt = (): Date => this.state.created_at as Date
    accessToken = (): string => this.state.access_token as string
}


export class ChatModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        created_at: Joi.date().required().default('now'),
        user_1: Joi.number().positive().required().populate('users', 'id', 'post'),
        user_2: Joi.number().positive().required().populate('users', 'id', 'post'),
        last_message: Joi.number().positive().populate('messages', 'id')
    })

    constructor(initialState: any, options: any){
        super(initialState, ChatModel, options)
    }

    ID = (): number => this.state.id as number
    createdAt = (): Date => this.state.created_at as Date
    user1 = (): UserModel => this.state.spot as UserModel
    user2 = (): UserModel => this.state.user as UserModel
    lastMessage = (): MessageModel => this.state.user as MessageModel

    pullAllMessage = async () => await messages.ctx().quick().pull({chat: this.ID()}).run() as MessageList
}

export class MessageModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        content: Joi.string().required().min(1).max(4000),
        created_at: Joi.date().required().default('now'),
        user: Joi.number().positive().required().populate('users', 'id', 'post'),
        chat: Joi.number().positive().required()//.foreignKey('chats', 'id').deleteCascade().noPopulate(),
    })

    constructor(initialState: any, options: any){
        super(initialState, MessageModel, options)
    }

    ID = (): number => this.state.id as number
    content = (): string => this.state.content as string
    createdAt = (): Date => this.state.created_at as Date
    user = (): UserModel => this.state.user as UserModel
    chat = (): ChatModel => this.state.chat as ChatModel
}

export class TodoModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        content: Joi.string().min(1).max(400).default(''),
        created_at: Joi.date().default(() => new Date()),
    })

    constructor(initialState: any, options: any){
        super(initialState, TodoModel, options)
    }

    content = () => this.state.content
    ID = () => this.state.id
    createdAt = () => this.state.created_at

    updateContent = (content: string) => this.setState({content}).saveToDB()
}

export class ChatList extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [ChatModel, ChatList], options)
    }  

    pullWithUsers = async (userID_1: number, userID_2: number) => {
        return await chats.ctx().sql().pull().custom((q: Knex.QueryBuilder) => {
            return q.
                    whereIn('user_1', [userID_1, userID_2]).
                    and.
                    whereIn('user_2', [userID_1, userID_2])
        }) as ChatList
    }

    fetchWithUsers = async (userID_1: number, userID_2: number) => {
        return await chats.ctx().sql().find().custom((q: Knex.QueryBuilder) => {
            return q.
                    whereIn('user_1', [userID_1, userID_2]).
                    and.
                    whereIn('user_2', [userID_1, userID_2])
        }) as ChatModel
    }

}

export class MessageList extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [MessageModel, MessageList], options)
    }    
}

export class DeviceList extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [DeviceModel, DeviceList], options)
    }    
}

export class PostList extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [PostModel, PostList], options)
    }

    //create = async (d: any) => await spots.ctx().push(d).save()
}

export class SpotList extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [SpotModel, SpotList], options)
    }

    //create = async (d: any) => await spots.ctx().push(d).save()
}

export class TodoList extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [TodoModel, TodoList], options)
    }
}

export class UserList extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [UserModel, UserList], options)
    }

    //update
    //create = async (d: any) => await this.ctx().push(d).save()

    //fetch
    fetchByUsername = async (username: string) => await this.quick().find({username}) as UserModel
    fetchByID = async (id: number) => await this.quick().find(id) as UserModel
    fetchByToken = async (access_token: string) => await this.quick().find({ access_token }) as UserModel
}

export class UserSpecificList extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [UserSpecificModel, UserSpecificList], options)
    }

    //update
    //create = async (d: any) => await this.ctx().push(d).save()

    //fetch
    fetchByUsername = async (username: string) => await this.quick().find({username}) as UserSpecificModel
    fetchByID = async (id: number) => await this.quick().find(id) as UserSpecificModel
    fetchByToken = async (access_token: string) => await this.quick().find({ access_token }) as UserSpecificModel
}

export const posts = new PostList([], {table: 'posts'})
export const devices = new DeviceList([], {table: 'devices'})
export const users = new UserList([], {table: 'users'})
export const spots = new SpotList([], {table: 'spots'})
export const messages = new MessageList([], {table: 'messages'})
export const chats = new ChatList([], {table: 'chats'})
export const specificUsers = new UserSpecificList([], {table: 'specific_users'})
export const todos = new TodoList([], {table: 'todos'})