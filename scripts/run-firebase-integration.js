import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

function findWindowsJava21Home() {
  const adoptiumRoot = "C:\\Program Files\\Eclipse Adoptium";
  if (!fs.existsSync(adoptiumRoot)) {
    return null;
  }

  const candidate = fs
    .readdirSync(adoptiumRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("jdk-21"))
    .map((entry) => path.join(adoptiumRoot, entry.name))
    .sort()
    .at(-1);

  return candidate ?? null;
}

function buildJavaAwareEnvironment() {
  const env = { ...process.env };

  if (process.platform !== "win32") {
    return env;
  }

  const detectedJava21Home = findWindowsJava21Home();
  const javaHome = detectedJava21Home ?? env.JAVA_HOME;
  if (!javaHome) {
    return env;
  }

  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "Path";
  const currentPath = env[pathKey] ?? env.PATH ?? env.Path ?? "";
  const javaBinPath = path.join(javaHome, "bin");

  env.JAVA_HOME = javaHome;
  env[pathKey] = `${javaBinPath};${currentPath}`;
  env.PATH = env[pathKey];
  env.Path = env[pathKey];
  return env;
}

const firebaseCliScript = path.resolve("node_modules", "firebase-tools", "lib", "bin", "firebase.js");

const child = spawn(
  process.execPath,
  [firebaseCliScript, "emulators:exec", "--only", "firestore", "npm run test:integration:run"],
  {
    stdio: "inherit",
    env: buildJavaAwareEnvironment()
  }
);

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
