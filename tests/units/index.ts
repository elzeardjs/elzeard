import  { config } from '../../index'
import runInitTests from './init-tests'
import runDefaultTests from './default-tests'
import runCollectionLocalTests from './collection-local-tests'
import runSQLTests from './sql-tests'
import runUtilTests from './utils-test'

const SQL_CONFIG = {
    host: 'localhost',
    user: 'fanta',
    password: 'aqw12345',
    database: 'inspirationeum',
    timezone: 'utc',
}

const HISTORY_FOLDER = './history'

const main = async () => {
    config.setMySQLConfig(SQL_CONFIG)
    config.setHistoryDirPath(HISTORY_FOLDER)
    runInitTests(HISTORY_FOLDER)
    runCollectionLocalTests()
    runSQLTests()
    runUtilTests()
    runDefaultTests(false)
}

main()
