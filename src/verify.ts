import Model from './model'
import Errors from './errors'
import _ from 'lodash'

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