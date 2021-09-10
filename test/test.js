const expect = chai.expect;
mocha.setup({ ui: "bdd" });
const test_data = get_random_data();

async function runTest() {
  return new Promise((_, reject) => {
    const test = (execute) => {
      try {
        execute();
      } catch (err) {
        console.log(err);
        reject(new Error(err));
        throw err;
      }
    };

    describe("Cytoscape", function () {
      describe(".loadGraph()", function () {
        let test_data;
        this.timeout(5000);
        beforeEach(() => (test_data = get_random_data()));

        it("should not load the same graph as before", async function () {
          await document.loadGraph(test_data);
          const response = await document.loadGraph(test_data);
          test(() => expect(response).to.be.false);
        });

        it("should animate the graph", async function () {
          const response = await document.loadGraph(test_data);
          test(() => expect(response).to.be.true);
        });
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.runTest();
  mocha.run();
});

document.runTest = runTest;
