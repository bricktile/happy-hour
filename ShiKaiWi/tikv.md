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

### tikv raw_put procedure
1. build raft command and send it by the router;
2. the router is built by [create_raft_batch_system](components/raftstore/src/store/fsm/store.rs:1376) and the router is also paired by a batch system;
3. the batch system is used to spawn raft worker(src/server/node.rs:394) and the node is started also;

### BatchSystem
1. This is an actor model;
2. An FSM is a actor;

#### fundamental concepts of actor model
>The actor model adopts the philosophy that everything is an actor. This is similar to the everything is an object philosophy used by some object-oriented programming languages.
>
>An actor is a computational entity that, in response to a message it receives, can concurrently:
>
>send a finite number of messages to other actors;
>create a finite number of new actors;
>designate the behavior to be used for the next message it receives.
>There is no assumed sequence to the above actions and they could be carried out in parallel.
>
>Decoupling the sender from communications sent was a fundamental advance of the actor model enabling asynchronous communication and control structures as patterns of passing messages.[8]
>
>Recipients of messages are identified by address, sometimes called "mailing address". Thus an actor can only communicate with actors whose addresses it has. It can obtain those from a message it receives, or if the address is for an actor it has itself created.
>
>The actor model is characterized by inherent concurrency of computation within and among actors, dynamic creation of actors, inclusion of actor addresses in messages, and interaction only through direct asynchronous message passing with no restriction on message arrival order.

### best practice
#### yatp
yet another thread pool by pingcap.

## Questions
1. there is a diagnosis service and how to design such a service?
