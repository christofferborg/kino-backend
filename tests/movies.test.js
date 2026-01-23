import request from "supertest";
import app from "../app.js";
import { jest } from "@jest/globals";

describe("Filmsidans integrationstester", () => {
  test("En sida som inte finns svarar med status 404", async () => {
    const response = await request(app).get("/denna-sida-finns-inte");

    expect(response.status).toBe(404);
    expect(response.text).toContain("404");
  });
  
  test("Sidan visar titel", async () => {
    const myFakeMovie = {
      data: {
        id: 8,
        attributes: {
          title: "Min egen film",
          intro: "Detta är en testbeskrivning",
          image: { url: "https://bild.se/test.jpg" },
        },
      },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(myFakeMovie),
    });

    const response = await request(app).get("/richards-filmer/8");
    expect(response.status).toBe(200);
    expect(response.text).toContain("<h1>Min egen film</h1>");
  });
});
