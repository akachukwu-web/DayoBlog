import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    family: 4 // Force IPv4 to avoid network resolution issues
});

let db;

async function connectDB() {
    if (db) return db;
    try {
        await client.connect();
        console.log("Connected successfully to MongoDB Atlas");
        db = client.db(process.env.DB_NAME);
        return db;
    } catch (e) {
        console.error("Could not connect to MongoDB", e);
        process.exit(1);
    }
}

export { connectDB };
