CREATE TABLE urls (
  id SERIAL PRIMARY KEY,
  short_id VARCHAR(10) UNIQUE NOT NULL,
  long_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE url_counter (
  num_value BIGINT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics (
  id SERIAL PRIMARY KEY,
  short_id TEXT NOT NULL,
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address TEXT,
  CONSTRAINT analytics_short_id_fkey FOREIGN KEY (short_id) REFERENCES urls(short_id)
);
