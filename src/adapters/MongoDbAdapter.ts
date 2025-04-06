import { MongoClient } from "mongodb";
import { User } from "../models/User";

export class MongoDbAdapter {
    private client: MongoClient;
    private databaseName: string;

    constructor(uri: string, databaseName: string) {
        this.client = new MongoClient(uri, {
            serverApi: {
                version: "1",
                strict: true,
                deprecationErrors: true,
            },
        });
        this.databaseName = databaseName;
    }

    /**
     * Factory method to create an instance of MongoDbAdapter using environment variables.
     */
    public static fromEnvironment(): MongoDbAdapter {
        const mongoDbUri = process.env.MONGO_DB_URI || '';
        const mongoDbDatabase = process.env.MONGO_DB_DATABASE || '';

        if (!mongoDbUri || !mongoDbDatabase) {
            throw new Error('Missing required MongoDB configuration.');
        }

        return new MongoDbAdapter(mongoDbUri, mongoDbDatabase);
    }

    public async getAllUsers(req: any): Promise<User[]> {
        const database = this.client.db(this.databaseName);
        const usersCollection = database.collection("users");

        console.log("Request Parameters", req);

        const filter: any = {};
        if (req.username) {
            filter.username = req.username;
        }
        if (req.password) {
            filter.password = req.password;
        }

        const users = await usersCollection.find(filter).toArray();

        return users.map(user => ({
            id: user._id.toString(),
            username: user.username,
            password: user.password,
            token: user.token,
        } as User));
    }

    public async dispose(): Promise<void> {
        await this.client.close();
        console.log("MongoDB connection closed.");
    }
}