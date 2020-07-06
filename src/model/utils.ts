import _ from 'lodash'
import { IPopulate } from 'joi-to-sql'
import Collection from '../collection'
import Model from './'
import Manager from '../manager'

//Return the state to JSONified object.
//It implies that the state is an array, an object or a Model typed class (model or extended from Model)
export const toPlain = (m: Model, opt: string | void): any => {
    const ret: any = {}; 
    
    const recur = (o: any, path: string, groupKeys: string[] = []) => {
        
        //if this is a plain object
        if (Model._isObject(o) && Object.keys(o).length > 0){
            for (var key in o){
                if (groupKeys.length == 0 || groupKeys.indexOf(key) != -1) {
                    recur(o[key], !path ? key : path + '.' + key)
                }
            }
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
            recur(o.state, path, opt === 'group' ? o.group : [])
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

export const isPopulatable = (m: Model) => m.schema().getPopulate().length > 0

export const unpopulate = (m: Model) => {
    for (const key in m.state){
        if (m.state[key] instanceof Model){
            const populateKey = _.find(m.schema().getPopulate(), { key })
            if (!populateKey){
                delete m.state[key]
                continue;
            }
            const { key_reference } = populateKey
            m.state[key] = m.state[key].state[key_reference]
        }
    }
}

export const handleModelGroup = (populate: IPopulate, m: Model | null) => {
    const { group_id } = populate
    if (group_id && m){
        const groupKeys = m.schema().getGroups()[group_id]
        groupKeys && m.fillGroup(groupKeys)
    }
    return m
}

export const plainPopulateToPopulate = (m: Model) => {
    if (m.is().plainPopulated()){
        const populates = m.schema().getPopulate()

        for (let p of populates){
            const { table_reference, key } = p
            const collectionRef = Manager.collections().node(table_reference) as Collection
            if (Model._isObject(m.state[key])){
                const mRef = collectionRef.newNode(m.state[key])
                m.state[key] = handleModelGroup(p, mRef)
            }
        }
    }
}

export const populate = async (m: Model) => {
    if (!m.option().isKidsPassed())
        throw new Error("Model need to be bound to a collection to perform populate. You can pass `kids` method as option.")

    if (m.is().plainPopulated())
        return plainPopulateToPopulate(m)

    const populates = m.schema().getPopulate()

    for (let p of populates){
        const { key_reference, table_reference, key } = p
        const collectionRef = Manager.collections().node(table_reference) as Collection
        const mRef = await collectionRef.sql().fetch().where({[key_reference]: m.state[key] })
        m.state[key] = handleModelGroup(p, mRef)
    }
}
