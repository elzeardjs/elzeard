import Model from '../model'
import Collection from '../collection'
import { insertOrUpdate } from '../knex-tools'
import isEmpty from 'lodash/isEmpty'
import errors from '../errors'
import { convertAllDateToISOString } from '../utils'

//Perform SQL requests based on a Model, in a specific collection
export default (m: Model, collection: Collection) => {
    const sql = collection.sql()
    const format = sql.format()
    const query = sql.table().query()
    const jsonData: any = m.to().plainUnpopulated()
    const primary = collection.super().schemaSpecs().getPrimaryKey() as string
    
    const insert = async () => {
        if (isEmpty(jsonData))
            throw new Error(`Object can't be empty.`)
        const res = await insertOrUpdate(sql.table().name(), convertAllDateToISOString(jsonData))
        const id = res[0][0].insertId
        m.setState({[primary]: id})
        return id
    }

    const update = async () => {
        if (isEmpty(jsonData))
            throw new Error(`Object can't be empty.`)
        if (!(primary in jsonData))
            throw errors.noPrimaryKey(sql.table().name())
        const idValue = jsonData[primary]
        delete jsonData[primary]
        return await query.where(primary, idValue).update(convertAllDateToISOString(jsonData))
    }

    const remove = async () => {
        if (!(primary in jsonData))
            throw errors.noPrimaryKey(sql.table().name())
        return await query.where(primary, jsonData[primary]).del()
    }

    const fetch = async () => {
        return await format.toModel(await query.where(convertAllDateToISOString(jsonData)).first())
    }

    return { insert, update, delete: remove, fetch }
}