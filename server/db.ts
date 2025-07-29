import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

// Konfigurasi WebSocket agar bisa connect ke Neon
neonConfig.webSocketConstructor = ws;

// Pastikan URL basis data tersedia
if (!process.env.URL_BASIS_DATA) {
  throw new Error("DATABASE_URL harus diatur. Apakah Anda lupa menyediakannya?");
}

// Buat koneksi pool ke Neon
export const pool = new Pool({ connectionString: process.env.URL_BASIS_DATA });

// Inisialisasi Drizzle ORM
export const db = drizzle(pool, { schema });
