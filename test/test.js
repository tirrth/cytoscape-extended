(() => {
  document.test = { runTest, scrollZoomTest }
  Object.keys(document.test).map(key => {
    const fn = document.test[key]
    document.test[key] = () => (mocha.run(), fn())
  })
})()

const test_data = get_random_data()
const expect = chai.expect
mocha.setup({
  ui: "bdd",
  cleanReferencesAfterRun: true,
  fullTrace: false,
  globals: ["CY", "jQuery"],
  timeout: 5000,
})

function filterTestData(data) {
  return {
    body: data.body,
    duration: data.duration,
    err: data.err,
    sucess: !data.err,
    title: data.title,
    // async: data.async,
    // file: data.file,
    // pending: data.pending,
    // state: data.state,
    // sync: data.sync,
    // timedOut: data.timedOut,
    // timer: data.timer,
    // type: data.type,
  }
}

function reduceArrayOfObjects(arr, property) {
  return arr.reduce((acc, curr) => (acc || 0) + (curr[property] || 0), 0)
}

function getTestData() {
  const { tests, title } = this.test.parent
  return {
    title,
    timeout: this.timeout(),
    tests: tests.map(filterTestData),
    duration: reduceArrayOfObjects.bind(this, tests, "duration")(),
    failures: tests.filter((t) => !!t.err).length,
    get passes() { return tests.length - this.failures },
    // slow: this.slow(),
  }
}

function getRandomElementFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function loadGraphTest() {
  return new Promise((resolve, _) => {
    describe(".loadGraph()", function () {
      let test_data = {}

      beforeEach(() => (test_data = get_random_data()))

      after(function () { resolve(getTestData.bind(this)()) })

      it("should not load the same graph as before", async function () {
        await document.loadGraph(test_data)
        const response = await document.loadGraph(test_data)
        expect(response).to.be.false
      })

      it("should animate the graph", async function () {
        const response = await document.loadGraph(test_data)
        expect(response).to.be.true
      })
    })
  })
}

function scrollZoomTest() {
  return new Promise((resolve, _) => {
    describe(".scrollZoom()", function () {
      let test_data = {}

      beforeEach(() => (test_data = get_random_data()))

      after(function () { resolve(getTestData.bind(this)()) })

      it("should not load the same graph as before", async function () {
        await document.loadGraph(test_data)
        const response = await document.loadGraph(test_data)
        expect(response).to.be.false
      })

      it("should animate the graph", async function () {
        const response = await document.loadGraph(test_data)
        expect(response).to.be.true
      })
    })
  })
}

function eventListenersTest() {
  return new Promise((resolve, _) => {
    describe(".on(event)", function () {
      let test_data = {}
      const tests = []

      beforeEach(async (done) => {
        test_data = get_random_data()
        document.loadGraph(test_data).then(() => done())
      })

      after(function () {
        const response = {
          ...getTestData.bind(this)(),
          tests: tests,
          duration: reduceArrayOfObjects.bind(this, tests, "duration")(),
          passes: reduceArrayOfObjects.bind(this, tests, "passes")(),
          failures: reduceArrayOfObjects.bind(this, tests, "failures")(),
        }
        resolve(response)
      })

      describe("Single Click", function () {

        after(function () { tests.push(getTestData.bind(this)()) })

        it("should trigger canvas one click event", function () {
          const elements = CY.elements().filter(e => e.attr("id") !== "@@startnode" && e.attr("id") !== "@@endnode")
          const randomElement = getRandomElementFromArray(elements)
          CY.emit({ type: "oneclick", originalEvent: jQuery.Event(), target: CY })
          expect(elements.hasClass("click")).to.be.false
          expect(elements.hasClass("highlight")).to.be.false
          randomElement.emit({ type: "oneclick", originalEvent: jQuery.Event(), target: !CY })
          if (randomElement.isEdge() && randomElement.connectedNodes().length < 2) {
            expect(randomElement.hasClass("click")).to.be.false
          } else expect(randomElement.hasClass("click")).to.be.true
        })

        it("should trigger node one click event", function () {
          const nodes = CY.nodes().filter(n => n.attr("id") !== "@@startnode" && n.attr("id") !== "@@endnode")
          const randomNode = getRandomElementFromArray(nodes)
          randomNode.emit("oneclick")
          expect(randomNode.hasClass("click")).to.be.true
        })

        it("should trigger edge one click event", function () {
          const edges = CY.edges()
          const randomEdge = getRandomElementFromArray(edges)
          randomEdge.emit({ type: "oneclick", originalEvent: jQuery.Event() })
          const randomEdgeConnectedNodes = randomEdge.connectedNodes()
          if (randomEdgeConnectedNodes.length < 2) {
            expect(randomEdge.hasClass("click")).to.be.false
            expect(randomEdgeConnectedNodes.hasClass("click")).to.be.false
          } else {
            expect(randomEdge.hasClass("click")).to.be.true
            expect(randomEdgeConnectedNodes.hasClass("click")).to.be.true
          }
        })
      })

      describe("Double Click", function () {

        after(function () { tests.push(getTestData.bind(this)()) })

        it("should trigger canvas double click event", function () {
          (() => {
            const prevZoom = CY.zoom()
            CY.emit({ type: "dblclick", originalEvent: jQuery.Event(), target: CY })
            expect(CY.zoom()).to.equal(prevZoom + 0.25)
          })()
          const elements = CY.elements().filter(e => e.attr("id") !== "@@startnode" && e.attr("id") !== "@@endnode")
          const randomElement = getRandomElementFromArray(elements)
          const prevZoom = CY.zoom()
          randomElement.emit({ type: "dblclick", originalEvent: jQuery.Event(), target: !CY })
          expect(CY.zoom()).to.not.equal(prevZoom + 0.25)
        })

        it("should trigger node double click event", function () {
          const nodes = CY.nodes().filter(n => n.attr("id") !== "@@startnode" && n.attr("id") !== "@@endnode")
          const randomNode = getRandomElementFromArray(nodes)
          randomNode.emit("dblclick")
          return true
        })

        it("should trigger edge double click event", function () {
          const edges = CY.edges()
          const randomEdge = getRandomElementFromArray(edges)
          randomEdge.emit({ type: "dblclick", originalEvent: jQuery.Event() })
          return true
        })
      })
    })
  })
}

const testFunctions = [loadGraphTest, eventListenersTest]
function runTest() {
  return new Promise((resolve, _) => {
    describe("Cytoscape", async function () {
      const testResults = await Promise.all(testFunctions.map((t) => t()))
      const response = {
        title: this.title,
        tests: testResults,
        duration: reduceArrayOfObjects.bind(this, testResults, "duration")(),
        passes: reduceArrayOfObjects.bind(this, testResults, "passes")(),
        failures: reduceArrayOfObjects.bind(this, testResults, "failures")(),
      }
      resolve(response)
    })
  })
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const resp = await document.test.runTest()
    console.log(resp)
    // const response = await document.test.scrollZoomTest()
    // console.log(response)
  } catch (err) {
    console.log("Error: ", err)
  }
})
