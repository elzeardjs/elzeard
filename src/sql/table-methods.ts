import SQLManager from './index'
import Collection from '../collection'

export default (collection: Collection) => {

    const query = () => SQLManager.mysql()(name())
    const name = () => collection.option().table()
    const create = async () => !(await isCreated()) && await collection.schema().engine().table(name())
    const drop = async () => await SQLManager.mysql().schema.dropTableIfExists(name())
    const isCreated = () => async () => await SQLManager.isTableCreated(name())

    return { create, drop, isCreated, name, query }
}