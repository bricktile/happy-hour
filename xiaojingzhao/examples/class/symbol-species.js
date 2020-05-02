class Foo {
  static get [Symbol.species]() {
    return this;
  }

  spawn() {
    return new this.constructor[Symbol.species]();
  }
}

class Bar extends Foo {
  static get [Symbol.species]() {
    return Foo;
  }
}

var a = new Foo();
var b = a.spawn();

var x = new Bar();
var y = x.spawn();

console.log("a instance Foo", a instanceof Foo); // true
console.log("b instance Foo", b instanceof Foo); // true
console.log("x instance Foo", x instanceof Foo); // true
console.log("x instance Bar", x instanceof Bar); // true
console.log("y instance Bar", y instanceof Bar); // false
console.log("y instance Foo", y instanceof Foo); // true
