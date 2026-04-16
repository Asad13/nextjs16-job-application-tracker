import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import dbConnect from './db';

const mongoose = await dbConnect();
const client = mongoose.connection.getClient();
const db = mongoose.connection.db!;

export const auth = betterAuth({
  database: mongodbAdapter(
    db,
    process.env.NODE_ENV === 'production' ? { client } : {},
  ),
  emailAndPassword: { enabled: true, autoSignIn: false },
});
