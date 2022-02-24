import  { config } from '../../../index'
import {  HISTORY_FOLDER, SQL_CONFIG} from './config'

const main = async () => {
    config.setMySQLConfig(SQL_CONFIG)
    config.setHistoryDirPath(HISTORY_FOLDER)
    require('./general')
}

main()
