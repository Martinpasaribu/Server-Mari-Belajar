// // redis.provider.ts
// import Redis from 'ioredis';

// export const RedisProvider = {
//   provide: 'REDIS_CLIENT',
//   useFactory: () => {
//     const url = process.env.REDIS_URL || 'rediss://localhost:6379';
//     return new Redis(url, {
//       tls: {}, // penting untuk koneksi ke Upstash
//     });
//   },
// };
