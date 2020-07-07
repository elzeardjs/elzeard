import { JoiMySQL } from 'joi-to-sql'
import { IOptions } from './src/state/option'

import Model from './src/model'
import Collection from './src/collection'
import manager from './src/manager/index'
import config from './src/config'

const Joi = JoiMySQL(require('@hapi/joi'))

export {
    IOptions, 
    Model,
    Collection,
    manager,
    config,
    Joi
}