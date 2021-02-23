- date: 20210223 
- author: ShiKaiWi

## Target 
1. Understand the memory allocation procedure.
2. Understand how does the gc work?

## Notes

## Questions
### meaning of mheap_.sweepgen?
```golang
if s != &emptymspan {
    // Mark this span as no longer cached.
    if s.sweepgen != mheap_.sweepgen+3 {
        throw("bad sweepgen in refill")
    }
    atomic.Store(&s.sweepgen, mheap_.sweepgen)
}
```

### How to update the mspan.gcmarkBits or mspan.allocBits?
Nowhere the updates are found to gcmarkBits & allocBits?
