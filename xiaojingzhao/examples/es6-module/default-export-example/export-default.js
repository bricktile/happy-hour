function foo() {
  console.log("11111");
}

export default foo; // 立即求值

foo = function () {
  console.log("foo is changed here");
};
