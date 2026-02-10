module.exports = {
  randomEmail() {
    const ts = Date.now();
    return `test+${ts}@example.com`;
  }
};
