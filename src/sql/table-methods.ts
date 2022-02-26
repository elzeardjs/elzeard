import SQLManager from './index'
import Collection from '../collection'
import {TableEngine } from 'joixsql'

//Perform simple requests on the table of a collection
export default (collection: Collection) => {

    const query = () => SQLManager.mysql()(name())
    const name = () => collection.super().option().table()
    const create = async () => {
        if (!(await isCreated())){
            const { schema, tableName } = collection.super().schemaSpecs().ecosystemModel()
            return await TableEngine.buildTable(schema, tableName) 
        }
    }
    const drop = async () => await SQLManager.mysql().schema.dropTableIfExists(name())
    const isCreated = () => SQLManager.isTableCreated(name())
    const truncate = async () => await SQLManager.mysql().table(collection.super().option().table()).truncate()

    return { create, drop, isCreated, name, query, truncate }
}