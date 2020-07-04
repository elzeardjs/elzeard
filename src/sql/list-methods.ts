import Model from '../model'
import Collection from '../collection'
import { insertOrUpdate } from '../knex-tools'
import _ from 'lodash'

export default (list: Model[], collection: Collection) => {
    const sql = collection.sql()
    const format = sql.format()
    const query = sql.table().query()
    const primary = collection.schema().getPrimaryKey()

    const jsonData: any[] = list.map((elem) => elem.to().plainUnpopulated())
    const arrayIDs = collection.new(list).to().arrayPrimary()
    
    const insert = async () => await update()

    const update = async () => {
        if (_.isEmpty(jsonData))
            throw new Error(`List can't be empty.`)
        const res = await insertOrUpdate(sql.table().name(), jsonData)

        for (let i = 0; i < res.length; i++){
            const { insertId } = res[i][0]
            insertId !== list[i].state[primary] && list[i].setState({[primary]: insertId})
        }
        return res
    }

    const remove = async () => await query.whereIn(primary, arrayIDs).del()
    const pull = async () => await format.toCollection(await query.whereIn(primary, arrayIDs))

    return { remove, update, insert, pull, query }

}