import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { MongoDbAdapter } from "../src/adapters/MongoDbAdapter";
import { UserService } from "../src/services/UserService";
import * as dotenv from 'dotenv';
dotenv.config();

const dbAdapter = MongoDbAdapter.fromEnvironment();
const userService = new UserService(dbAdapter);

const funcGetUsers: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log(`Http function processed request for url "${req.url}"`);

    try {
        const users = await userService.getAllUsers();
        context.res = {
            status: 200,
            body: JSON.stringify(users)
        };
    } catch (error) {
        context.log("Error retrieving users:", error);
        context.res = {
            status: 500,
            body: JSON.stringify({ error: "Failed to retrieve users!" })
        };
    } finally {
        await userService.dispose();
    }
};

export default funcGetUsers;