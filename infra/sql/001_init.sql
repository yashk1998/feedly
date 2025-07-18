-- 001_init.sql
-- Initial schema for rivsy RSS SaaS (MySQL 8)

-- USERS ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              VARCHAR(36)  PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  name            VARCHAR(255),
  tz              VARCHAR(64),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TEAMS ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(255) NOT NULL,
  owner_user_id     VARCHAR(36) NOT NULL,
  plan              ENUM('free','pro','power') NOT NULL DEFAULT 'free',
  slack_webhook_url VARCHAR(500),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_teams_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TEAM MEMBERS --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
  team_id  BIGINT UNSIGNED NOT NULL,
  user_id  VARCHAR(36)      NOT NULL,
  role     ENUM('owner','editor','viewer') NOT NULL DEFAULT 'viewer',
  PRIMARY KEY (team_id, user_id),
  CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams(id)  ON DELETE CASCADE,
  CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- FEEDS ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feeds (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  url             VARCHAR(2048) NOT NULL UNIQUE,
  title           VARCHAR(255),
  site_url        VARCHAR(2048),
  last_fetched_at DATETIME,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SUBSCRIPTIONS -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id    BIGINT UNSIGNED,
  user_id    VARCHAR(36),
  feed_id    BIGINT UNSIGNED NOT NULL,
  category   VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sub_feed  FOREIGN KEY (feed_id) REFERENCES feeds(id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_team  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_user  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ARTICLES ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS articles (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  feed_id        BIGINT UNSIGNED NOT NULL,
  guid           VARCHAR(765) NOT NULL,
  title          TEXT,
  url            TEXT,
  published_at   DATETIME,
  author         VARCHAR(255),
  summary_html   MEDIUMTEXT,
  content_html   LONGTEXT,
  checksum       CHAR(64) NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_feed_guid (feed_id, guid(255)),
  KEY idx_checksum (checksum),
  KEY idx_published (published_at),
  CONSTRAINT fk_articles_feed FOREIGN KEY (feed_id) REFERENCES feeds(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ARTICLE READ --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS article_read (
  article_id BIGINT UNSIGNED NOT NULL,
  user_id    VARCHAR(36)      NOT NULL,
  read_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (article_id, user_id),
  CONSTRAINT fk_read_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_read_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- AI CREDITS ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_credits (
  user_id      VARCHAR(36) NOT NULL,
  cycle_start  DATETIME    NOT NULL,
  cycle_end    DATETIME    NOT NULL,
  used         INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, cycle_start),
  CONSTRAINT fk_ai_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SOCIAL TOKENS -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS social_tokens (
  user_id      VARCHAR(36) NOT NULL,
  network      ENUM('twitter','linkedin','reddit') NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at   DATETIME,
  PRIMARY KEY (user_id, network),
  CONSTRAINT fk_social_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PAYMENTS ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  razorpay_subscription_id VARCHAR(64) PRIMARY KEY,
  user_id      VARCHAR(36) NOT NULL,
  plan         ENUM('pro','power') NOT NULL,
  status       ENUM('active','canceled','past_due','trial') NOT NULL,
  current_period_start DATETIME,
  current_period_end   DATETIME,
  CONSTRAINT fk_pay_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ADMIN LOGS ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_logs (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  action     VARCHAR(255) NOT NULL,
  details    JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 