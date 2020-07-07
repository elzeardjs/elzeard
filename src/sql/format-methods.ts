import knex from 'knex'
import Collection from '../collection'
import Model from '../model'

export default (collection: Collection) => {

    const toModel = async (result: knex.Select) => !Model._isObject(result) ? null : await collection.newNode(result).populate()
    
    const toCollection = async (result: any[]) => {
        const c = await collection.new(result).populate()
        return c.fillPrevStateStore()
    }

    const pull = async (result: any[]) => {
        collection.set(result)
        await collection.populate()
        return collection.fillPrevStateStore()
    }

    return { toModel, toCollection, pull }
}