import Model from './'
import Manager from '../manager'
import _ from 'lodash'
import { Engine } from 'joi-to-sql'
import Collection from '../collection'
export const STORE_OPTION = 'store'
const isStoreOption = (option: any) => option === STORE_OPTION
const DATE_PATTERN = '____AS-Date____'

//Return the state to JSONified object.
//It implies that the state is an array, an object or a Model typed class (model or extended from Model)
export const toPlain = (m: Model, option: any): any => {
    const ret: any = {}; 
    
    const recur = (o: any, path: string) => {
        
        //if this is a plain object
        if (Model._isObject(o) && Object.keys(o).length > 0){
            for (var key in o)
                recur(o[key], !path ? key : path + '.' + key)
            return
        }

        //if this is an array
        if (Model._isArray(o) && o.length > 0){
            for (let i = 0; i < o.length; i++)
                recur(o[i], path + '.' + i.toString())
            return
        }

        //if this is a Model class
        if (o instanceof Model){
            recur(o.state, path)
            return
        }

        if (isStoreOption(option) && o instanceof Date){
            o = `${DATE_PATTERN}${o.getTime().toString()}`
        }

        _.set(ret, path, o)
    }

    recur(m.state, '')

    return ret
}

export const turnToBack = (m: Model) => {
    const node = m.option().nodeModel() as any
    for (const key in m.state){
        if (m.state[key] instanceof Model){
            const foreignKey = _.find(new Engine(node.schema, {}).analyze().foreign_keys, { key })
            if (!foreignKey){
                delete m.state[key]
                continue;
            }
            const { key_reference } = foreignKey
            m.state[key] = m.state[key].state[key_reference]
        }
    }
}

export const turnToFront = async (m: Model) => {
    if (!m.option().hasReceivedKids())
        throw new Error("Model need to be bound to a collection to perform toAceyObject. You can pass `kids` method as option.")

    for (let foreign of m.sql().getForeignKeys()){
        const { key_reference, table_reference, key } = foreign
        const collectionRef = Manager.collections().node(table_reference) as Collection
        const node = collectionRef.option().nodeModel() as Model
        if (new Engine(node.schema as any, {}).analyze().primary_key === key_reference){
            console.log(collectionRef.sql().tableName())
            m.state[key] = await collectionRef.sql().fetchPrimary(m.state[key])
        }
    }
}