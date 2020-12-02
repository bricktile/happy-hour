- date: 20201202 
- author: ShiKaiWi

## Target 
1. Understand the write procedure;
2. Understand the query procedure;
3. Understand the startup procedure;
3. Find out some key designs.

## Notes
### Write Procedure
1. Encode the input lines to raw data (partitioned by hour);
2. Write the structured lines to write buffer;
3. Persist the raw data to WAL.


## Questions
### 1. Why are data written to write buffer before to wal?
