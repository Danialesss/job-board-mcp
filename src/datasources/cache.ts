import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, "../../data/cache.db");

const db = new Database(dbPath);

export interface Job {
  id: string;
  source: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  url?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  postedDate?: string;
}

export function initializeCache() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS job_listings (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      url TEXT,
      salary_min REAL,
      salary_max REAL,
      posted_date TEXT,
      cached_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_title ON job_listings(title);
    CREATE INDEX IF NOT EXISTS idx_location ON job_listings(location);
    CREATE INDEX IF NOT EXISTS idx_cached_at ON job_listings(cached_at);
  `);
  console.error("Cache initialized at:", dbPath);
}

export function cacheJob(job: Job) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO job_listings 
    (id, source, title, company, location, description, url, salary_min, salary_max, posted_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    job.id,
    job.source,
    job.title,
    job.company,
    job.location,
    job.description ?? null,
    job.url ?? null,
    job.salaryMin ?? null,
    job.salaryMax ?? null,
    job.postedDate ?? null
  );
}

export function getJobFromCache(jobId: string): Job | undefined {
  const stmt = db.prepare("SELECT * FROM job_listings WHERE id = ?");
  return stmt.get(jobId) as Job | undefined;
}

export function searchCache(query: string, location?: string, limit: number = 10): Job[] {
  let sql = "SELECT * FROM job_listings WHERE (title LIKE ? OR company LIKE ?)";
  const params: any[] = [`%${query}%`, `%${query}%`];
  
  if (location) {
    sql += " AND location LIKE ?";
    params.push(`%${location}%`);
  }
  
  sql += " ORDER BY cached_at DESC LIMIT ?";
  params.push(limit);
  
  const stmt = db.prepare(sql);
  return stmt.all(...params) as Job[];
}

export function clearExpiredCache(days: number = 7) {
  const stmt = db.prepare(`
    DELETE FROM job_listings 
    WHERE datetime(cached_at) < datetime('now', '-${days} days')
  `);
  stmt.run();
}