import bar from "./B";

export default function foo(x) {
  if (x > 10) {
    return bar(x - 1);
  }
  return x * 2;
}
