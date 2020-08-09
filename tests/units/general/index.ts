import  { config } from '../../../index'
const main = async () => {

    config.setMySQLConfig({
        host: '185.212.226.103',
        user: 'root',
        password: 'fH95b88kCE!',
        database: 'inspirationeum'
    })
    config.setHistoryDirPath('./history')
    require('./general')
}

main()