function bar() {
  console.log("this is bar");
}

export { bar as default }; // 标识符

bar = function () {
  console.log("bar changed");
};
