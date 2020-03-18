var iteratorObj = { 1: 1, 2: 2, 3: 3 };

function transferToIterator(iteratorMap) {
  Object.defineProperty(iteratorMap, Symbol.iterator, {
    value() {
      var index = 0;
      var keys = Object.keys(iteratorMap);
      return {
        next() {
          return {
            value: iteratorMap[keys[index++]],
            done: index >= keys.length
          };
        }
      };
    }
  });
}

transferToIterator(iteratorObj);
