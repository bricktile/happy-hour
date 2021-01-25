- date: 20201202 
- author: ShiKaiWi

## Target 
- Understand the write procedure;
- Understand the startup procedure;
- Understand the query procedure;
- Find out some key designs.
- Understand all components.

## Notes
### Write Procedure
1. Encode the input lines to raw data (partitioned by hour);
2. Write the structured lines to write buffer;
3. Persist the raw data to WAL.

### Startup Procedure
1. Restore all data in wal to write buffer.

### Query Procedure
1. Parse sql to obtain the relavent tables (no filter for tags & time range);
2. Fetch all the columns from queried tables;
3. Use datafusion to execute the sql on the fetched data.


### Key designs
- Error handling: Snafu
- Tracing: tracing
- Arrow + Datafusion to handle the sql

### Components
#### segment_store
hierachy: SegmenetStore -> Database -> Partition -> Table -> Segment -> Column.

## Questions
### 1. Why are data written to write buffer before to wal?
### 2. When to flush data in write buffer?
### 3. Why to fetch all data in the write buffer?
### 4. Why not to use Arrow for storing column data so that to avoid rebuilding it every time sql query comes?
