- date: 20210310 
- author: ShiKaiWi

## Difference between memory and disk
- Faster access time.
- Volatile.
- Fixed cost per access to disk so they are block-oriented storage devices but memory is not.
- Sequential access to disk is critical but not to memory.

## History
### 1984-1994
- IMS Fast Path(1976)
    - Fine-grained record-level locking(?).
    - Install record updates at commit time(?).
- MM-DBMS
    - Use of pointers for direct recored accesses.
    - New memory-optimized indexing methods(T-Trees).
    - Optimized two-pahse locking.
    - New recovery techniques.

### 1994-2007
- ClustRa
    - Prototype of distributed main-memory architecture.
- Dali
    - Allow applications direct shared-memory access to data records(not common yet in modern mmdb).
    - Perform redo-only loggingg during recovery(A transient undo log in memory which discarded after commit).
    - Fuzzy action-consistent checkpointing to reduce lock conetention on checkpointing worker.
- System K
    - Process transactions sequentially on a cpu core.
    - Logical logging(?).
- TimesTen
    - An optimized checkpointing and logging scheme for main memory execution.
    - High-performance mmdb solution or Oracle.
- P*Time
    - L2-cache consciousness.
    - Latch-free interal data structures.
    - Optimized for durability and recovery by performing fine-grained parallel differential logging and recovery.
    - Multi-level locking.

## Trends
### Embedded Key-Value stores
Provide a high-performance, memory-optimized data structure(hash or range-based access).

Examples of memory-optimized key-value store designs include:
- Masstree: Employs a cache-conscious index layout using a 'trie-of-B+-tree' and implements an optimistic concurrency-control scheme that does not block readers.
- Bw-tree: latch-free B+-tree in memory and implements a log-structured page store that writes sequentailly batck to stable storage.
- MICA: Optimizes the complete request-handling stack(from network request at the NIC through to data structure design) and use a lossy hash index for highly concurrent reads and writes.

### Distributed Key-Value stores
Not just a cache, recent projects have build distributed main-meory key-value stores for primary data storage -- durability and high performance.

Examples: RAM-Cloud and FaRM.

## Issues and Architectural Choices


## Questions
