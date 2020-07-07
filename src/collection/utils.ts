import Manager from '../manager'
import _ from 'lodash'
import Collection from "./"
import Model from "../model"
import { handleModelGroup } from '../model/utils'

export const plainPopulatedToPopulate = (c: Collection) => {
    if (c.is().plainPopulated()){
        c.state.forEach((elem: Model) => elem.populate())
    }
}

export const populate = async (c: Collection) => {
    if (c.count() === 0 || c.is().populated() || !c.is().populatable())
        return
    if (c.is().plainPopulated())
        return plainPopulatedToPopulate(c)

    const populates = c.schema().getPopulate()
    const toFetchKeys = []
    const values = []

    for (let i = 0; i < c.count(); i++){
        const m = c.state[i] as Model
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

        const currentValues = values.map((value) => value[i])
        //indexes of the value that are empty
        const emptyIdx = currentValues.map((v, idx) => v == null || v == undefined ? idx : undefined).filter((v) => v != undefined)
        const rows = await collectionRef.sql().query().whereIn(key_reference, currentValues.filter((v) => v != null && v != undefined))

        const listNested = []
        let j = 0;
        while (j < c.count()){
            const m = c.nodeAt(j)
            if (emptyIdx.indexOf(j) == -1){
                const mRef = collectionRef.newNode(_.find(rows, {[key_reference]: m.state[key]}))
                m.state[key] = handleModelGroup(toFetchKeys[i], mRef)
                listNested.push(m.state[key])
            }
            j++
        }
        await populate(collectionRef.new(listNested))
    }

}