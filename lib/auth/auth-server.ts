import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import dbConnect from '../db';
import { initDefaultBoard } from '../init-default-board';

const mongoose = await dbConnect();
const client = mongoose.connection.getClient();
const db = client.db(); //mongoose.connection.db!;

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
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
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },
  account: {
    modelName: 'accounts',
  },
});

export type FullSession = typeof auth.$Infer.Session;
export type User = FullSession['user'];
export type Session = FullSession['session'];
