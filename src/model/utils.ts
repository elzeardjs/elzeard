import _ from 'lodash'
import { Engine } from 'joi-to-sql'
import Collection from '../collection'
import config from '../config'
import Model from './'
import Manager from '../manager'

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

        _.set(ret, path, o)
    }

    recur(m.state, '')

    return ret
}

export const isUnpopulatedFormat = (m: Model) => !(doesContainNestedModel(m) || doesContainNestedObject(m))
export const isPopulatedFormat = (m: Model) => doesContainNestedModel(m)
export const isPlainPopulated = (m: Model) => doesContainNestedObject(m)

export const doesContainNestedObject = (m: Model) => {
    for (const key in m.state){        
        if (Model._isObject(m.state[key]))
            return true
    }
    return false
}

export const doesContainNestedModel = (m: Model) => {
    for (const key in m.state){        
        if (m.state[key] instanceof Model)
            return true
    }
    return false
}

export const isPopulatable = (m: Model) => {
    const foreigns = m.schema().getForeignKeys()

    for (let foreign of foreigns){
        const { key_reference, table_reference, key } = foreign
        const collectionRef = Manager.collections().node(table_reference) as Collection
        if (collectionRef.schema().getPrimaryKey() === key_reference){
            return true
        }
    }
    return false
}

export const unpopulate = (m: Model) => {

    for (const key in m.state){
        if (m.state[key] instanceof Model){
            const foreignKey = _.find(m.schema().getForeignKeys(), { key })
            if (!foreignKey){
                delete m.state[key]
                continue;
            }
            const { key_reference } = foreignKey
            m.state[key] = m.state[key].state[key_reference]
        }
    }
}

export const plainPopulateToPopulate = (m: Model) => {
    if (m.is().plainPopulated()){
        const foreigns = m.schema().getForeignKeys()

        for (let foreign of foreigns){
            const { key_reference, table_reference, key } = foreign
            const collectionRef = Manager.collections().node(table_reference) as Collection
            if (collectionRef.schema().getPrimaryKey() === key_reference && Model._isObject(m.state[key]))
                m.state[key] = collectionRef.newNode(m.state[key])
        }
    }
}

export const populate = async (m: Model) => {
    if (!m.option().hasReceivedKids())
        throw new Error("Model need to be bound to a collection to perform populate. You can pass `kids` method as option.")

    if (m.is().plainPopulated())
        return plainPopulateToPopulate(m)

    const foreigns = m.schema().getForeignKeys()

    for (let foreign of foreigns){
        const { key_reference, table_reference, key } = foreign
        const collectionRef = Manager.collections().node(table_reference) as Collection
        if (collectionRef.schema().getPrimaryKey() === key_reference)
            m.state[key] = await collectionRef.sql().fetch().byPrimary(m.state[key])
    }
}
