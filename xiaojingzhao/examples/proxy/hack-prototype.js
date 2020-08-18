let handlers = {
  get(target, key, context) {
    if (Reflect.has(target, key)) {
      return Reflect.get(target, key, context);
    } else {
      return Reflect.get(target[Symbol.for("[[Prototype]]")], key, context);
    }
  },
};

let originalObj = {
  name: "obj-1",
  foo() {
    console.log("foo: ", this.name);
  },
};

let obj1 = new Proxy(originalObj, handlers);
let obj2 = Object.assign(Object.create(obj1), {
  name: "obj-2",
  bar() {
    console.log("bar: ", this.name);
  },
});
obj1[Symbol.for("[[Prototype]]")] = obj2; // 绑定在target上，会报错w

obj1.bar();
