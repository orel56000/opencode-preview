fetch("http://127.0.0.1:3000")
  .then((res) => res.json())
  .then((data) => {
    document.querySelector("#app").innerHTML = `
      <h1>Multi-service example</h1>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `
  })
  .catch((err) => {
    document.querySelector("#app").innerHTML = `
      <h1>Multi-service example</h1>
      <p>API not reachable: ${err.message}</p>
    `
  })
