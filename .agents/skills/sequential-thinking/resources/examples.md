# Sequential Thinking Examples

## Example 1: Simple Math Problem

**Problem:** If a train travels 120 km in 2 hours, then 180 km in the next 3 hours, what's the average speed?

**Thought 1/5:** Breaking down the problem - we have two segments of travel with different distances and times. Need to calculate total distance and total time first.

**Thought 2/5:** First segment: 120 km in 2 hours. Second segment: 180 km in 3 hours. Total distance = 120 + 180 = 300 km. Total time = 2 + 3 = 5 hours.

**Thought 3/5:** Average speed formula = Total distance / Total time = 300 km / 5 hours = 60 km/h.

**Thought 4/5:** Verifying: Does this make sense? First segment speed = 60 km/h, second segment = 60 km/h. Wait, that can't be right.

**Thought 5/6 (Revision of Thought 4):** Let me recalculate segment speeds. First: 120/2 = 60 km/h. Second: 180/3 = 60 km/h. Actually, both segments are at 60 km/h, so average is correctly 60 km/h. My suspicion was unfounded.

**Solution:** The average speed is 60 km/h.

## Example 2: Complex Design Decision with Branching

**Problem:** Design a caching strategy for a high-traffic API with both user-specific and global data.

**Thought 1/8:** Initial analysis - need to consider cache hit rate, memory usage, invalidation complexity, and latency requirements. Two data types suggest a multi-layered approach.

**Thought 2/8:** Hypothesis: Use Redis with separate key namespaces for user-specific (user:*) and global (global:*) data. User data could have shorter TTL due to personalization.

**Thought 3/8:** Considering TTL strategy - global data changes infrequently, could use 1-hour TTL. User-specific data needs 5-15 minute TTL to stay fresh.

**Thought 4/8:** Wait, need to think about invalidation. What happens when global data updates? Broadcasting invalidation to all instances could be expensive.

**Thought 5/10 (Branching from Thought 4):** Alternative approach - use cache versioning. Include version number in global cache keys. When data updates, increment version. Old cached entries naturally expire.

**Thought 6/10:** This versioning approach adds complexity but eliminates broadcast invalidation. Trade-off: some stale data until TTL expires vs. system complexity.

**Thought 7/10:** For user-specific data, simple TTL should work since each user's data is independent. No cross-user invalidation needed.

**Thought 8/10:** Hypothesis verification - versioned global cache + TTL-based user cache provides good balance. Testing memory usage: assume 100K users, 10KB user cache, 50MB global = ~1GB total. Acceptable.

**Thought 9/10:** Edge case consideration - what if version wraps around? Use timestamp-based versioning (YYYYMMDDHHMMSS) to prevent collisions.

**Thought 10/10:** Final design validated. Global cache with timestamp versioning, user cache with 10-minute TTL. Monitoring on cache hit rates and memory usage post-deployment.

**Solution:** Implement a two-tier Redis caching strategy with timestamp-versioned keys for global data (1-hour TTL) and simple key-value with 10-minute TTL for user-specific data. Monitor hit rates and memory usage after deployment.

## Example 3: Debugging with Multiple Revisions

**Problem:** API returning 500 errors intermittently, logs show database timeout.

**Thought 1/6:** Initial hypothesis - database connection pool exhaustion. Check current pool size and active connections.

**Thought 2/6:** Pool size = 20, monitoring shows peak usage of 18 connections. Not exhausted. Need to look elsewhere.

**Thought 3/7 (Revised estimate):** Query performance issue? Check slow query log. Found several queries taking 5-10 seconds during error periods.

**Thought 4/7:** Slow queries all involve joins on large tables without proper indexes. Hypothesis: missing indexes causing table scans.

**Thought 5/7:** Wait, these queries worked fine last week. What changed? Checking deployment history... no schema changes, no new queries.

**Thought 6/8 (Revision of Thought 4):** The queries themselves haven't changed, but data volume has. Tables grew 300% last week due to marketing campaign. Indexes exist but statistics are stale.

**Thought 7/8:** Hypothesis: Stale query planner statistics causing poor query plans. Solution: Run ANALYZE on affected tables to update statistics.

**Thought 8/8:** Verified - after ANALYZE, query plans improved and execution times dropped to <500ms. Root cause was stale statistics, not missing indexes.

**Solution:** Run ANALYZE on the affected database tables to update query planner statistics. Implement automated ANALYZE job to run after bulk data imports to prevent future occurrences.
