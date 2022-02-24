import Model from '../model'
import Collection from '../collection'
import { insertOrUpdate } from '../knex-tools'
import isEmpty from 'lodash/isEmpty'
import { convertAllDateToISOString } from '../utils'
import Errors from '../errors'

//Perform SQL requests based on a list of Models or Objects, in a specific collection
export default (list: Model[] | {[key: string]: any}[], collection: Collection) => {
    const sql = collection.sql()
    const format = sql.format()
    const query = sql.table().query()
    const primary = collection.super().schemaSpecs().getPrimaryKey()

    const jsonData: any[] = list.map((elem) => convertAllDateToISOString(elem.to().plainUnpopulated() ))
    const arrayIDs = collection.new(list).local().to().arrayPrimary()

    const isArrayModel = () => {
        if (list.length == 0)
            return true
        if (list[0] instanceof Model)
            return true
        return false
    }

    const insert = async () => await update()

    const update = async () => {
        if (isEmpty(jsonData))
            throw new Error(`List can't be empty.`)
        const res = await insertOrUpdate(sql.table().name(), jsonData)

        for (let i = 0; i < res.length; i++){
            const { insertId } = res[i][0]
            insertId !== list[i].state[primary] && list[i].setState({[primary]: insertId})
        }
        return res
    }

    const remove = async () => {
        if (!isArrayModel())
            throw Errors.modelArrayOnly()
        return await query.whereIn(primary, arrayIDs).del()
    }
    const pull = async () => {
        if (!isArrayModel())
            throw Errors.modelArrayOnly()
        return await format.toCollection(await query.whereIn(primary, arrayIDs))
    }
    
    return { remove, update, insert, pull, query }

}