// const expect = chai.expect;
// mocha.setup({ ui: "bdd", cleanReferencesAfterRun: true, fullTrace: true });
// const test_data = get_random_data();

// async function testLoadGraph() {
//   return new Promise((_, reject) => {
//     mocha.run();
//     const test = (execute) => {
//       try {
//         execute();
//       } catch (err) {
//         reject(new Error(err));
//       }
//     };

//     after(() => {
//       setTimeout(() => {
//         mocha.dispose();
//       }, 5000);
//     });

//     describe(".loadGraph()", function () {
//       let test_data;
//       this.timeout(5000);
//       beforeEach(() => (test_data = get_random_data()));

//       it("should not load the same graph as before", async function () {
//         await document.loadGraph(test_data);
//         const response = await document.loadGraph(test_data);
//         test(() => expect(response).to.be.false);
//       });

//       it("should animate the graph", async function () {
//         const response = await document.loadGraph(test_data);
//         test(() => expect(response).to.be.true);
//       });
//     });
//   });
// }

// async function testScrollZoom() {
//   // resetTests(mocha.suite);
//   // mocha.run();

//   return new Promise((_, reject) => {
//     mocha.run((failures) => reject(failures));
//     const test = (execute) => {
//       try {
//         execute();
//       } catch (err) {
//         reject(new Error(err));
//         throw err;
//       }
//     };

//     describe(".scrollZoom()", function () {
//       let test_data;
//       this.timeout(5000);
//       beforeEach(() => (test_data = get_random_data()));

//       it("should not load the same graph as before", async function () {
//         await document.loadGraph(test_data);
//         const response = await document.loadGraph(test_data);
//         expect(response).to.be.false;
//       });

//       it("should animate the graph", async function () {
//         const response = await document.loadGraph(test_data);
//         expect(response).to.be.true;
//       });
//     });
//   });
// }

// document.addEventListener("DOMContentLoaded", () => {
//   document
//     .testLoadGraph()
//     .then((res) => console.log(res))
//     .catch((err) => console.log("Err: ", err));
// });

// document.testLoadGraph = testLoadGraph;
// document.testScrollZoom = testScrollZoom;

const test_data = get_random_data();
const expect = chai.expect;
mocha.setup({ ui: "bdd", fullTrace: true, globals: ["CY"] });

function filterTestData(data) {
  const resp = {
    async: data.async,
    body: data.body,
    duration: data.duration,
    err: data.err,
    file: data.file,
    pending: data.pending,
    state: data.state,
    sync: data.sync,
    timedOut: data.timedOut,
    timer: data.timer,
    title: data.title,
    type: data.type,
  };
  return resp;
}

async function runTests() {
  mocha.run();
  return new Promise((resolve, _) => {
    describe(".loadGraph()", function () {
      let test_data;
      this.timeout(5000);

      beforeEach(() => (test_data = get_random_data()));

      after(function () {
        const { tests, title } = this.test.parent;
        const response = {
          title,
          tests: tests.map(filterTestData),
          get duration() {
            return this.tests.reduce((acc, curr) => acc + curr.duration, 0);
          },
        };
        resolve(response);
      });

      it("should not load the same graph as before", async function () {
        await document.loadGraph(test_data);
        const response = await document.loadGraph(test_data);
        expect(response).to.be.true;
      });

      it("should animate the graph", async function () {
        const response = await document.loadGraph(test_data);
        expect(response).to.be.true;
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const resp = await document.runTests();
  console.log(resp);
});

document.runTests = runTests;
