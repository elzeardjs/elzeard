import Manager from '../manager'
import _ from 'lodash'
import Collection from "./"
import Model from "../model"
import { handleModelGroup } from '../model/utils'

export const plainPopulatedToPopulate = (c: Collection) => {
    if (c.super().is().plainPopulated()){
        c.local().state.forEach((elem: Model) => elem.populate())
    }
}

export const populate = async (c: Collection) => {
    if (c.local().count() === 0 || c.super().is().populated() || !c.super().is().populatable())
        return
    if (c.super().is().plainPopulated())
        return plainPopulatedToPopulate(c)

    const populates = c.super().schemaSpecs().getPopulate()
    const toFetchKeys = []
    const values = []

    for (let i = 0; i < c.local().count(); i++){
        const m = c.local().state[i] as Model
        const m_keys = []
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

        const listNested = []
        let j = 0;
        while (j < c.local().count()){
            const m = c.local().nodeAt(j) as Model
            if (emptyIdx.indexOf(j) == -1 && m.state[key]){
                const mRef = collectionRef.newNode(_.find(rows, {[key_reference]: m.state[key]}))
                m.state[key] = handleModelGroup(toFetchKeys[i], mRef)
                listNested.push(m.state[key])
            }
            j++
        }
        await populate(collectionRef.new(listNested))
    }

}