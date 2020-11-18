- date: 20201117 
- author: ShiKaiWi

## Target 
- Understand the replication mode of tikv

## Notes
### tikv startup procedure
1. choose the raft enigne by config.raft_engine: RocksEngine(use rocksdb as wal) or RaftLogEngine(real wal + memtable);
2. pass the raft engine as type parameter to TiKVServer to start up the tikv server instance;
3. init the store path, thread pool, encryption;
4. create the raw `engines`(consisting of a raft engine and a kv engine);
5. use the raw `engines` to build tikv engine(consisting of `store_meta`, `engines`, `engine`?);
6. **build the server and register the kv service**(this is the point to reach the target);
7. register other services, init the metrics flusher;
8. run the tikv server;
9. run status server;

### best practice
#### yatp
yet another thread pool by pingcap.

## Questions
1. there is a diagnosis service and how to design such a service?
