import mongoose from 'mongoose';

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongoose: MongooseCache; // This must be a `var` and not a `let / const`
}

// Base connection options for all environments
const BASE_OPTS: mongoose.ConnectOptions = {
  bufferCommands: false,
};

// ─── Environment-specific options ────────────────────────────────────────────

const DEV_OPTS: mongoose.ConnectOptions = {
  ...BASE_OPTS,
  serverSelectionTimeoutMS: 5000, // Fail fast in dev
};

const VERCEL_OPTS: mongoose.ConnectOptions = {
  ...BASE_OPTS,
  // Serverless: keep connections short and pool small
  maxPoolSize: 5,
  minPoolSize: 0,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 10000,
};

const SELF_HOSTED_OPTS: mongoose.ConnectOptions = {
  ...BASE_OPTS,
  // Long-running: larger pool, rely on Mongoose auto-reconnect
  maxPoolSize: 20,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000, // Check server health every 10s
};

function getConnectionOptions(): mongoose.ConnectOptions {
  if (process.env.NODE_ENV === 'development') return DEV_OPTS;
  if (process.env.VERCEL) return VERCEL_OPTS; // Vercel sets this automatically
  return SELF_HOSTED_OPTS;
}

// ─── Dev-only: health check for manual MongoDB restarts ──────────────────────
async function isConnectionAlive(): Promise<boolean> {
  try {
    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting, 99 = uninitialized
    if (mongoose.connection.readyState !== 1) return false;
    // Ping the actual server to confirm it's reachable
    await mongoose.connection.db?.admin().ping();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function attachReconnectListeners() {
  const conn = mongoose.connection;

  conn.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected. Mongoose will auto-reconnect...');
    // Reset cache so next call gets a fresh connection
    if (global.mongoose) {
      global.mongoose.conn = null;
      global.mongoose.promise = null;
    }
  });

  conn.on('reconnected', () => {
    console.log('[MongoDB] Reconnected successfully.');
  });

  conn.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err);
  });
}

// ─── Main dbConnect ───────────────────────────────────────────────────────────

// In production (Vercel serverless), skip the global cache entirely —
// each Lambda handles its own lifecycle.
// In dev and self-hosted, use the global to survive HMR / process restarts.
const useGlobalCache =
  process.env.NODE_ENV === 'development' || !process.env.VERCEL;

if (!global.mongoose) {
}

const cached: MongooseCache = useGlobalCache
  ? (global.mongoose ?? (global.mongoose = { conn: null, promise: null }))
  : { conn: null, promise: null };

let reconnectListenersAttached = false;

async function dbConnect() {
  // ── DEVELOPMENT: ping to detect stale connection from MongoDB restart ──
  if (process.env.NODE_ENV === 'development' && cached.conn) {
    // ✅ Check if existing connection is actually alive before reusing it
    const alive = await isConnectionAlive();
    if (alive) {
      return cached.conn;
    }

    // Connection is dead — reset the cache and reconnect
    cached.conn = null;
    cached.promise = null;

    // Close the broken connection cleanly before reconnecting
    try {
      await mongoose.connection.close();
    } catch {
      // Ignore close errors on a dead connection
    }
  }

  // ── PRODUCTION (self-hosted or Vercel): trust Mongoose's reconnect logic ──
  if (process.env.NODE_ENV !== 'development' && cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const MONGODB_URI = process.env.MONGODB_URI!;

    if (!MONGODB_URI) {
      throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local',
      );
    }
    const opts = getConnectionOptions();
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      // Attach reconnect listeners once for self-hosted long-running process
      if (!process.env.VERCEL && !reconnectListenersAttached) {
        attachReconnectListeners();
        reconnectListenersAttached = true;
      }
      return mongoose;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
