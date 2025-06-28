import { MongoClient } from 'mongodb'

const dbURL = 'mongodb+srv://shmuellevy16:anutkkuh123@cluster1.lmlbw5y.mongodb.net/?retryWrites=true&w=majority'
const dbName = 'boardDB'

async function printSampleBoard() {
    try {
        const client = await MongoClient.connect(dbURL)
        const db = client.db(dbName)
        const board = await db.collection('board').findOne({})
        console.log(JSON.stringify(board, null, 2))
        await client.close()
    } catch (err) {
        console.error('Error:', err)
    }
}

printSampleBoard() 