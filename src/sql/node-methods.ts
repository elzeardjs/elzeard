import Model from '../model'
import Collection from '../collection'
import { insertOrUpdate } from '../knex-tools'
import _ from 'lodash'

export default (m: Model, collection: Collection) => {
    const sql = collection.sql()
    const format = sql.format()
    const query = sql.table().query()
    const jsonData: any = m.to().plainUnpopulated()
    const primary = collection.schema().getPrimaryKey() as string
    
    const insert = async () => {
        const res = await update()
        const id = res[0][0].insertId
        m.setState({[primary]: id})
        return id
    }

    const update = async () => {
        if (_.isEmpty(jsonData))
            throw new Error(`Object can't be empty.`)
        return await insertOrUpdate(sql.table().name(), jsonData)
    }

    const remove = async () => {
        if (!(primary in jsonData))
            throw new Error("This Model needs to have a primary key to perform a node targeted delete action")
        return await query.where(primary, jsonData[primary]).del()
    }

    const fetch = async () => await format.toModel(await query.where(jsonData).first())

    return { insert, update, delete: remove, fetch }
}