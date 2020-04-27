import foo from "A";

export default function bar(y) {
  if (y > 5) {
    return foo(y / 2);
  }
  return y * 3;
}
