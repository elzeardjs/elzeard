import Manager from './manager/'
import { config, Ecosystem } from 'joi-to-sql'
import knex, { MySqlConnectionConfig } from 'knex'

class Config {

    done = async () => await Manager.init()

    constructor(){
        config.setEcoystem(new Ecosystem())
    }

    setHistoryDirPath = (historyFolderPath: string) => config.set({historyDir: historyFolderPath})

    ecosystem = () => config.ecosystem() as Ecosystem
    mysqlConnexion = () => config.mysqlConnexion() as knex<any, unknown[]>
    
    setMySQLConfig = (conf: MySqlConnectionConfig) => config.set({mysqlConfig: conf})
    setCriticalCode = (code: string) => config.set({criticalCode: code})
    
    enableCriticalConfirmation = () => config.enableCriticalConfirmation()
    disableCriticalConfirmation = () => config.disableCriticalConfirmation()

    enableLog = () => config.enableLog()
    disableLog = () => config.disableLog()

}

export default new Config()