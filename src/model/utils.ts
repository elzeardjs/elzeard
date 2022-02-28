import set from 'lodash/set'
import find from 'lodash/find'
import { IPopulate } from 'joixsql'
import Collection from '../collection'
import Model from './'
import Manager from '../manager'
import errors from '../errors'

//Return the state to JSONified object.
//It implies that the state is an array, an object or a Model typed class (model or extended from Model)
export const toPlain = (m: Model): any => {
    const ret: any = {}; 
    
    const recur = (o: any, path: string, groupKeys: string[] = []) => {
        
        //if this is a plain object
        if (Model._isObject(o) && Object.keys(o).length > 0){
            for (var key in o){
                if (groupKeys.length == 0 || groupKeys.indexOf(key) != -1)
                    recur(o[key], !path ? key : path + '.' + key)
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
            recur(o.state, path, o.super().group)
            return
        }

        set(ret, path, o)
    }

    recur(m, '')

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

//Returns true if the model contains at least a key/value that has the option foreignKey() or populate()
export const isPopulatable = (m: Model) => m.super().schemaSpecs().getPopulate().length > 0

//Opposite than the populate method
export const unpopulate = (m: Model) => {
    for (const key in m.state){
        if (m.state[key] instanceof Model){
            const populateKey = find(m.super().schemaSpecs().getPopulate(), { key })
            if (!populateKey){
                delete m.state[key]
                continue;
            }
            const { key_reference } = populateKey
            m.state[key] = m.state[key].state[key_reference]
        }
    }
}

/*
    i) Groups allows to remove unnecessary data from an object by specyfing only the required key/value
    Format a populated objects if a group is mentionned by selecting the needed key/value
*/
export const handleModelGroup = (populate: IPopulate, m: Model | null) => {
    const { group_id } = populate
    if (group_id && m){
        const groupKeys = m.super().schemaSpecs().getGroups()[group_id]
        groupKeys && m.super().fillGroup(groupKeys)
    }
    return m
}

//Transform a populated Model with nested objects into a populated Model with nested Models
export const plainPopulateToPopulate = (m: Model) => {
    if (m.super().is().plainPopulated()){
        const populates = m.super().schemaSpecs().getPopulate()

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

/*
    Populate is the key feature of Elzeard.
    Populate() allows to gather common lines in different table and to format them in a common object. 
    This function only affects columns carrying the extension foreignKey() or populate() in the Schema of your Model.
    Example:
    static schema = Joi.object({
        //Through populate(), here:
        user: Joi.number().positive().required().populate('users', 'id')
        //Or through foreignKey(), here:
        user2: Joi.number().required().foreignKey('users', 'id')
    })

    What's the use of foreignKey() and populate() in the schema declaration, what is their difference ?

    - foreignKey(): Is a SQL foreign key. A column specifying this option will benefit SQL dependance features with the table and column
    linked with. foreignKey() use also the populate() method features.
    
    - populate(): Enable to indicate a link with a column from a different table to then format the 2 lines of these 2 tables in a one common object. 
    (This method doesn't have any involvement on the SQL plan and doesn't have the security of foreign key in terms of data dependance.)

    Populate will format your Model, replacing all values where the keys carry the foreignKey() or populate(), by the reference Model of these last ones.
    Example: https://gist.github.com/Fantasim/dde84408323bdcc89d971fe54ca3b45f
*/
export const populate = async (m: Model) => {
    if (!m.super().option().isKidsPassed())
        throw errors.noCollectionBinding(m)

    if (m.super().is().plainPopulated())
        return plainPopulateToPopulate(m)

    const populates = m.super().schemaSpecs().getPopulate()

    for (let p of populates){
        const { key_reference, table_reference, key } = p
        const collectionRef = Manager.collections().node(table_reference) as Collection
        if (m.state[key] != null && m.state[key] != undefined){
            const mRef = await collectionRef.sql().find().where({[key_reference]: m.state[key] })
            m.state[key] = handleModelGroup(p, mRef)
        }
    }
}
