- date: 20201017 
- author: ShiKaiWi

## Target 
1. Understanding the startup procedure of golang runtime.

## Notes
The procedure:
1. `getg()` and clear the `racectx` of `getg().m.g0`.
2. Create a new m:
    2.1 Allocate a new m unassociated with any thread and set its `mstartfn` as `sysmon`
    2.2 `newm1().newosproc()`: start a thread running `mstart_stub` with created `m` as args.

## Questions
Q1: what does the systemstack call means?
From https://groups.google.com/g/golang-nuts/c/JCKWH8fap9o?pli=1:
>> runtime.systemstack() allows a function to be run on the "system stack".
>>
>> Is that the stack the garbage collector uses? What are the implications on
>> running a func on the system stack?
>
>Ordinary goroutines run on a small stack. Each ordinary Go function
>checks on entry that it has enough stack space to run. If it doesn't,
>it allocates a new larger stack and copies the existing stack into the
>new space. But of course this copying code needs to run on some
>stack, and it clearly can not be the stack that has run out of room.
>
>The system stack is the stack that the operating system creates for a
>new thread. It's larger than a goroutine stack. Stack copying is run
>on this stack. There is one system stack per thread, not per
>goroutine. In general there are many more goroutines than threads.
>
>Some garbage collection steps are also run on the system stack, to do
>things like provide a clear separation between what the GC is doing
>and examining the stack for live objects that should not be collected.
>
>The implication of running a function on the system stack is that the
>function is not going to be able to grow the stack, and it can't be
>preempted by the scheduler. So it can only be used for short
>self-contained operations.
>
>
>> What happens if said func panic()s? Can other goroutines be scheduled while
>> the system stack is running? Or is it always running anyway?
>
>A function running on the system stack should not panic.
>
>Other goroutines can run, on different threads, while one goroutine is
>running on the system stack.
>
>Ian

Q2: What's the implementation of  mstart_stub?

Q3: When is the `g0` created?

Q4: What does the sysmon do?
