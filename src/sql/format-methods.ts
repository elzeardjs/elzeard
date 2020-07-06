import knex from 'knex'
import Collection from '../collection'
import Model from '../model'

export default (collection: Collection) => {

    const toModel = async (result: knex.Select) => !Model._isObject(result) ? null : await collection.newNode(result).populate()
    const toCollection = async (result: any[]) => {
        const c = await collection.new(result).populate()
        c.fillPrevStateStore()
        return c
    }

    return { toModel, toCollection }
}