import  { config } from '../../../index'
const main = async () => {

    config.setMySQLConfig({
        host: '',
        user: '',
        password: '',
        database: ''
    })
    config.setHistoryDirPath('./history')
    require('./general')
}

main()