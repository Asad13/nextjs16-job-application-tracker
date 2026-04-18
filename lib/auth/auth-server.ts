import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import dbConnect from '../db';
import { initDefaultBoard } from '../init-default-board';

const mongoose = await dbConnect();
const client = mongoose.connection.getClient();
const db = client.db(); //mongoose.connection.db!;

export const auth = betterAuth({
  database: mongodbAdapter(
    db,
    process.env.NODE_ENV === 'production' ? { client } : {},
  ),
  emailAndPassword: { enabled: true, autoSignIn: false },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          console.log('Initilizing Deafult Board');
          await initDefaultBoard(user.id);
        },
      },
    },
  },
  user: {
    modelName: 'users',
    fields: {
      name: 'firstName',
    },
    additionalFields: {
      lastName: {
        type: 'string',
        required: true,
      },
      isNewUser: {
        type: 'boolean',
        required: true,
        defaultValue: true,
      },
    },
  },
  session: {
    modelName: 'sessions',
  },
  account: {
    modelName: 'accounts',
  },
});

export type FullSession = typeof auth.$Infer.Session;
export type User = FullSession['user'];
export type Session = FullSession['session'];
