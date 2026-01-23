import app from "./app.js";

const port = 5080;

app.listen(port, () => {
  console.log(`Servern körs på http://localhost:${port}`);
});