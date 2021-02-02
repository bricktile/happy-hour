- date: 20201202 
- author: ShiKaiWi

## Target 
- Understand the write procedure;
- Understand the startup procedure;
- Understand the query procedure;
- Find out some key designs.
- Understand all components.

## Notes
### Debug Procedure
```bash
curl --location --request PUT 'http://localhost:8080/iox/api/v1/databases/company_sensors' \
--header 'Content-Type: application/json' \
-d '{
    "name": "company_sensors"
}'
```

```bash
curl -v "http://127.0.0.1:8080/api/v2/write?org=company&bucket=sensors" --data-binary @tests/fixtures/lineproto/metrics.lp
curl -v -G -d 'org=company' -d 'bucket=sensors' --data-urlencode 'sql_query=select * from processes' "http://127.0.0.1:8080/api/v2/read"
```

### Write Procedure
- Http handler parses the input to lines and then call server.write_lines(lines).
- Find the written database.
- Partition the lines according to the rules of the database.
- Write to mutable_buffer if exists.
  - Find the table in the open chunk of the partition of the database.
  - Write lines to columns whose type is `Vec<Column>` and they are arranged like a column store in memory.
- Write to wal_buffer if exists.
  - Persist the old segment to object store if the written lines cause the current segment to be full and closed.
- Replicate the lines if necessary.
- Broadcast the lines to subscribers if exists.

### SQL Query Procedure
- Create SQL planner.
- Use the planner and the database to create physical plan.
  - Parse table names from the sql.
  - Collect all the chunks from the databases belonging to the tables.
  - Create the datafusion Execution Context and register the chunks into it.
  - Generate the physical plan by the execution context.
- Collect the results of exceution of the physical plan.

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
