import Model from '../model'
import Collection from '../collection'
import { insertOrUpdate } from '../knex-tools'
import isEmpty from 'lodash/isEmpty'
import { convertAllDateToISOString } from '../utils'
import Errors from '../errors'

//Perform SQL requests based on a list of Models
export default (list: Model[], collection: Collection) => {
    const sql = collection.sql()
    const format = sql.format()
    const query = sql.table().query()
    const primary = collection.super().schemaSpecs().getPrimaryKey()

    const jsonData: any[] = list.map((elem) => convertAllDateToISOString(elem.to().plainUnpopulated() ))
    const arrayIDs = collection.new(list).local().to().arrayPrimary()

    const insert = () => update()

    const update = async () => {
        if (isEmpty(jsonData))
            throw new Error(`List can't be empty.`)
        const res = await insertOrUpdate(sql.table().name(), jsonData)

        for (let i = 0; i < res.length; i++){
            const { insertId } = res[i][0]
            insertId != 0 && insertId !== list[i].state[primary] && list[i].setState({[primary]: insertId})
        }
        return res
    }

    const remove = async () => await query.whereIn(primary, arrayIDs).del()
    const pull = async () => await format.toCollection(await query.whereIn(primary, arrayIDs))
    
    return { remove, update, insert, pull, query }

}