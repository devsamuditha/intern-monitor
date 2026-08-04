import http from "node:http";

const BASE = "http://localhost:3000";

async function login(username, password) {
  const body = JSON.stringify({ username, password });
  return new Promise((resolve, reject) => {
    const req = http.request(BASE + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  let r = await login("superadmin", "superadminmob");
  console.log("=== superadmin / superadminmob ===");
  console.log("status:", r.status);
  console.log("set-cookie:", r.headers["set-cookie"] || "(none)");
  console.log("body:", r.body);
  console.log();

  r = await login("superadmin", "wrongpassword");
  console.log("=== superadmin / wrongpassword ===");
  console.log("status:", r.status);
  console.log("body:", r.body);
  console.log();

  r = await login("nobody", "x");
  console.log("=== nobody / x ===");
  console.log("status:", r.status);
  console.log("body:", r.body);
})();
