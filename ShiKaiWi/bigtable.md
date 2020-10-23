- date: 20201024 
- author: ShiKaiWi

## Target 
- Understand what is bigtable.
- Understand how the bigtable is implemented.

## Notes
### What is BigTable?
- Bigtableis a distributed storage system for managing structured data that is designed to scale to a very large size: petabytes of data across thousands of commodity servers.
- Data model: [row key: string, column: string, time: i64] => string

### How the bigtable is implemented?

### How the bigtable is implemented?
- Data model: [row key: string, column: string, time: i64] => string
Architecture:
         +-------------------------+                                     
         |  meta cluster (Chubby)  |                                     
         +-------------------------+                                     
                                                                         
                                               split     +--------------+
                                                 by      |Tablet Server0|
+-----------+   +-----------+   +-----------+   meta     +--------------+
|  Tablet   |   |  Tablet   |   |  Tablet   | - - - - >                  
|  Server   |   |  Server   |   |  Server   |            +--------------+
+-----------+   +-----------+   +-----------+            |Tablet Server1|
                                                         +--------------+
                                                                         
+----+----+      +----+----+      +----+----+                            
|WAL |SST | * *  |WAL |SST | * *  |WAL |SST |                            
+----+----+------+----+----+------+----+----+                            
|                                           |                            
|                    GFS                    |                            
|                                           |                            
+-------------------------------------------+                            

## Questions
