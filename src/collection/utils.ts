import Manager from '../manager'
import _ from 'lodash'
import Collection from "./"
import Model from "../model"

export const populate = async (c: Collection) => {
    if (!c.option().isConnected()){
        throw new Error("Collection needs to be connected to perform populate.")
    }
    if (c.count() === 0)
        return

        const foreigns = c.joi().getForeignKeys()
    const toFetchKeys = []
    const values = []

    for (let i = 0; i < c.count(); i++){
        const m = c.state[i] as Model
        const m_keys = []
        for (let foreign of foreigns){
            const { key_reference, table_reference, key } = foreign
            const collectionRef = Manager.collections().node(table_reference) as Collection
            if (collectionRef.joi().getPrimaryKey() === key_reference){
                i == 0 && toFetchKeys.push([key, key_reference, table_reference])
                m_keys.push(m.state[key])
            }
        }
        values.push(m_keys)
    }
    
    for (let i = 0; i < toFetchKeys.length; i++){
        const current = toFetchKeys[i]
        const [key, key_reference, table_reference] = current
        const collectionRef = Manager.collections().node(table_reference) as Collection
        const rows = await collectionRef.sql().query().whereIn(key_reference, values.map((value) => value[i]))
        for (let m of c.state){
            m.state[key] = collectionRef.newNode(_.find(rows, {[key_reference]: m.state[key]}))
        }
    }
    
}