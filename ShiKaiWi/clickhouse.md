- date: 20210120 
- author: ShiKaiWi

## Target 
- learning ClickHouse

## Notes
### Begin
#### Developing
https://clickhouse.tech/docs/en/development/developer_instruction/

常用编译命令:
```bash
ninja -j 2 clickhouse-server clickhouse-client
```

server 启动命令:
```bash
cd ./dbms/programs/server/
../../../build/dbms/programs/clickhouse server
```

client 连接命令:
```bash
build/dbms/programs/clickhouse client
```

#### LLDB debug
本来尝试通过日志来观察整个写入流程，目前发现了更好的方式: **lldb debug**。
本来想采用 attach 的方式进行 debug，但是无论怎么尝试都会遇到 attach 上去，process 就跪掉的问题，没有动力去搞明白这个问题，因此我就尝试直接使用 lldb 启动 server:
```bash
cd ./dbms/programs/server/
lldb ../../../build/dbms/programs/clickhouse
breakpoint set --file src/Access/AccessRightsContext.cpp --line 141
run server
```

有两件事情需要注意一下：
- 不设置断点的话，会因为一直跑，停不下来，而无法进行调试
- run server 第二个参数是作为 clickhouse 的参数传入

启动好了 server，设置好了断点之后，我们就可以使用 client 接上去，注意很有可能一连接上去就会触发断点，触发了断点之后就很好操作了:
```bash
# continue to run
continue
# step over
n
# step in
s
# check variable value
fr v $var_name
```

#### Basic Architecture
没有仔细的阅读整个文档，着重浏览了 MergeTreee:
- 和 LSM 不一样，没有 WAL 和 memtable 的结构，只有纯粹的 tree file，所以写入性能不怎么样。
- 同时和 LSM 一样的是，存在 background merge thread，需要去做 tree 的合并，存在写放大。
- 此外由于数据按照 block 存储，查询少量数据也没有优势，存在读放大。
- 但是他有非常重要的特性: 查询大量数据、进行复杂的聚合操作时，性能非常好。

至于是如何这种查询场景性能优化的，ClickHouse 有两个比较重要的优化：vectorized query execution and runtime code generation，有[相应的论文](./Resources/p5-sompolski.pdf) 可以阅读。

### Basic Procedure
主要进行了主流程的理解，目前知道初始化工作是在 dbms/programs/server/Server.cpp 的 main 方法中启动的，其中所有的 databases 放在了 `global_context` 中，目前了解到的层级是：`Server->global_context->Databases(IDataBase)->Tables(IStorage)`。

其中 IDatabase 是是管理 table 的，而 table 是本质上是一个 IStorage，IStorage 管理具体的数据存储，因此明天的主体流程可以把经历集中在 IStorage 上面。

借助 lldb 的调试功能，摸清了写入流程：
```
┌──────────────────────────────┐                             
│TCPHandler.cpp:249            │                             
│executeQuery                  │                             
└──────────────────────────────┘                             
     ┌──────────────────────────────┐                        
     │executeQuery.cpp:572          │                        
     │executeQueryImpl              │                        
     └──────────────────────────────┘                        
         ┌──────────────────────────────┐                    
         │executeQuery.cpp:328          │                    
         │res = interpreter->execute(); │                    
         └──────────────────────────────┘                    
              ┌───────────────────────────────────────┐      
              │InterpreterInsertQuery.cpp:204         │      
              │res.pipeline.addStorageHolder(table);  │      
              └───────────────────────────────────────┘      
              ┌───────────────────────────────────────┐      
              │InterpreterInsertQuery.cpp:146         │      
              │make PushingToViewsBlockOutputStream   │      
              └───────────────────────────────────────┘      
                    ┌───────────────────────────────────────┐
                    │PushingToViewsBlockOutputStream.cpp:23 │
                    │make PushingToViewsBlockOutputStream   │
                    └───────────────────────────────────────┘
                                                             
 ┌──────────────────────────────┐                            
 │TCPHandler.cpp:660            │                            
 │state.io.onFinish();          │                            
 └──────────────────────────────┘                            
```

目前发现写入流程的关键控制在于 PushingToViewsBlockOutputStream.cpp 里面的实现，明天需要再深入研究一下，明天的断点可以设置在：
```
breakpoint set --file src/DataStreams/PushingToViewsBlockOutputStream.cpp --line 168
```

ClickHouse 的主体流程是一个 TCP server，定义在 TCPHandler.cpp 里面，处理所有的 query，其中 Insert 也是 query。

今天通过调试把写入流程过了一遍，有几个问题留下来了：
- 可以看到 checksum 和一些元数据的写入点，但是究竟是什么持久化数据和 index 的呢？
- 经常看到的 mark 是什么呢？（dbms/src/Storages/MergeTree/MergeTreeDataPartWriterWide.cpp）

gdb 新命令 get：
```
# switch to specific thread
thread $number

# print expression value
p $expr
```

入口的断点可以打在：
```
breakpoint set --file programs/server/TCPHandler.cpp --line 478
```

明天可以从这个断点开始看：
```
breakpoint set --file src/Storages/MergeTree/MergeTreeDataPartWriterWide.cpp --line 90
```

### Processors
structs:
- PipelineExecutor
    - ExecutingGraph
        - Edge
        - Node
    - ThreadsQueue
        - Manage the threads by thread id.
        - Use two arrays instead of ordered map(more efficient).
    - TaskQueue
        - Record which thread a task belongs to in a two-dimensions vector.
    - ExecuteContexts: [thread_id] -> ExecuteContext
        - ExecuteContext
            - Node: current processor to run.
            - task_list: expanded pipeline tasks
            - async_tasks 
            - node: current processing Node(one ExecuteContext is for one thread and it may be used to process multiple nodes).

procedures:
- Initialize
    - Create ExecutingGraph
- Execute
    - Initialize Execution
        - Init TaskQueue.
        - Init ThreadsQueue.
        - Init ExecuteCongtext.
        - addChildlessProcessToStack(Stack is a stack for processor id).
        - prepareProcessor for every processor in the Stack(Childless processor).
            - Call prepare on Childless processor.
            - Set node ExecStatus and push the node to task queue or async task queue.
            - Try to find updated edges belonging to the node and call prepare on the node that the edge points to.
            - Do expand pipeline if necessary(ExecStatus==ExpandPipeline).
                - Create ExpandPipelineTask and execute it concurrently(?).
                - Do prepareProcessor for the current node and some other nodes(?) again.
    - (Execute concurrently or single thread) executeStepImpl
        - Find any task from local thread task queue or other thread task queue.
        - Execute the task(node) by calling `processor.work()` and prepare it(why prepare?).
        - Keeping finding and executiong until all the tasks are finished or executiong is yeilt.

## Questions
- global_context 中设定了一个指针用于指向自己，有什么用处？
- 动态绑定的逻辑确实是符合逻辑的，但是在这种模式下，是不是 OOP 使用起来会有比较多的误区？(可以参考 Server 和 Application 的关系)。

### CPP language
#### 动态绑定
基类里面调用一个 virtual method，如果 this 指针实际上是一个派生类的话，会动态绑定到派生类的方法上，可以参考下面的例子：
```cpp
#include <iostream>

class Base {
public:
  virtual void run() {
    init();
    std::cout << "Base::run" << std::endl;
  }
  virtual void init() { std::cout << "Base::init " << std::endl; }
};

class Derived : public Base {
public:
  void run() override {
    std::cout << "Derived::run" << std::endl;
    Base::run();
  }
  void init() override { std::cout << "Derived::init" << std::endl; }
};

int main() {
  Derived d;
  d.run();
  return 1;
}
```
#### try catch
此外还看到这样的 try catch block，用于 catch 所有的异常:
```cpp
try {

}catch(...) {

}
```

#### 继承模版类
一个模版类如果实例化之后，那么就是一个实例类，那么也就可以用来继承。

#### SCOPE_EXIT 
```cpp
#define SCOPE_EXIT_CONCAT(n, ...) \
const auto scope_exit##n = ext::make_scope_guard([&] { __VA_ARGS__; })
#define SCOPE_EXIT_FWD(n, ...) SCOPE_EXIT_CONCAT(n, __VA_ARGS__)
#define SCOPE_EXIT(...) SCOPE_EXIT_FWD(__LINE__, __VA_ARGS__)
```
