class Foo {
  constructor() {
    console.log("Foo: ", new.target.name);
  }
}

class Bar extends Foo {
  constructor() {
    super();
    console.log("Bar: ", new.target.name);
  }

  baz() {
    console.log("baz: ", new.target);
  }
}

let a = new Foo(); // Foo: Foo
let b = new Bar(); // Foo: Bar; Bar: Bar
b.baz(); // baz: undefined
