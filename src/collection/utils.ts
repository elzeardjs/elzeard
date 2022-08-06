import Manager from '../manager'
import find from 'lodash/find'
import Collection from "./"
import Model from "../model"
import { handleModelGroup } from '../model/utils'
import { IPopulate } from 'joixsql'

export const plainPopulatedToPopulate = (c: Collection) => {
    if (c.super().is().plainPopulated()){
        c.local().state.forEach((elem: Model) => elem.populate())
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

export const populate = async (c: Collection) => {
    if (c.local().count() === 0 || c.super().is().populated() || !c.super().is().populatable())
        return
    if (c.super().is().plainPopulated())
        return plainPopulatedToPopulate(c)

    const populates = c.super().schemaSpecs().getPopulate()
    const toFetchKeys: IPopulate[] = []
    const values: any[] = []

    for (let i = 0; i < c.local().count(); i++){
        const m = c.local().state[i] as Model
        const m_keys: any[] = []
        for (let p of populates){
            i == 0 && toFetchKeys.push(p)
            m_keys.push(m.state[p.key])
        }
        values.push(m_keys)
    }

    for (let i = 0; i < toFetchKeys.length; i++){
        const {key, key_reference, table_reference } = toFetchKeys[i]        
        const collectionRef = Manager.collections().node(table_reference) as Collection

        const allValues = values.map((value) => value[i])
        //indexes of the value that are empty.
        const emptyIdx = allValues.map((v, idx) => v == null || v == undefined ? idx : undefined).filter((v) => v != undefined)
        //non-empty values.
        const filledValues = allValues.filter((v) => v != null && v != undefined)
        //rows pulled from the DB
        const rows = await collectionRef.sql().query().whereIn(key_reference, filledValues)

        const listNested: any[] = []
        let j = 0;
        while (j < c.local().count()){
            const m = c.local().nodeAt(j) as Model
            if (emptyIdx.indexOf(j) == -1 && m.state[key]){
                const mRef = collectionRef.newNode(find(rows, {[key_reference]: m.state[key]}))
                m.state[key] = handleModelGroup(toFetchKeys[i], mRef)
                listNested.push(m.state[key])
            }
            j++
        }
        await populate(collectionRef.new(listNested))
    }

}