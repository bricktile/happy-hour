var a = 1;
var b = 2;
function* foo() {
  a++;
  yield;
  b = b * a;
  a = (yield b) + 3;
}
function* bar() {
  b--;
  yield;
  a = (yield 8) + b;
  b = a * (yield 2);
}
function step(gen) {
  var it = gen();
  var last;
  return () => {
    last = it.next(last).value;
  };
}
