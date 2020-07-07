import Collection from './collection'
import Model from './model'
import Errors from './errors'
import Manager from './manager'
import _ from 'lodash'


export const verifyCrossedPopulateValues = (v: Model) => {
    const origin_table = v.sql().table().name()

    const recur = (v: Model) => {
        const populate = v.schema().getPopulate()
        for (let p of populate){
            const { table_reference: table } = p
            if (table === origin_table){
                throw new Error(`Crossed populate found in node Model of the collection: ${origin_table}. You can use the method noPopulate() on your shema to disable auto-population mode on foreign keys pointed on primary keys.`)
            }
            const c = Manager.collections().node(table) as Collection
            recur(c.newNode(undefined))
        }
    }

    recur(v)
}


export const verifyIfContainArrayOfModel = (v: Model) => {

    let doesContain = false
    const recur = (v: any) => {

        if (doesContain)
            return

        if (!v || v instanceof Date)
            return

        if (v instanceof Model){
            for (let key in v.state)
                recur(v.state[key])
            return
        }

        if (Array.isArray(v)){
            for (let e of v){
                if (e instanceof Model){
                    doesContain = true
                    return
                }
                recur(e)
            }
            return
        }

        if (typeof v === 'object'){
            for (let key in v)
                recur(v[key])
        }
    }

    recur(v)
    return doesContain
}

export const verifyAllModel = (m: Model) => {
    if (verifyIfContainArrayOfModel(m))
        throw Errors.forbiddenArrayModel(m)
}