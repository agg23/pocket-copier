import { Command } from "commander";
import { detectDrive, ejectDrive } from "./drive";
import chokidar from "chokidar";
import { copyFile, existsSync, mkdirSync } from "fs";
import path from "path";

const program = new Command();

program
  .name("pocket-copier")
  .description(
    "A simple tool for automatically copying files to the Analogue Pocket during development"
  )
  .version("0.1.0");

program
  .requiredOption("-d, --drive <drive>", "The path of the drive to copy to")
  .requiredOption(
    "-i, --input <input>",
    "The directory or file to watch and copy to the destination"
  )
  .requiredOption("-o, --output <output-dir>", "The directory to copy to");

program.parse(process.argv);

const { drive, input, output } = program.opts() as {
  drive: string;
  input: string;
  output: string;
};

let updatedPaths = new Set<string>();

chokidar
  .watch(input, {
    ignoreInitial: true,
  })
  .on("all", (eventName, updatedPath) => {
    updatedPaths.add(updatedPath);

    console.log(eventName, updatedPaths);
  });

detectDrive(drive, (connectedDrive) => {
  console.log(connectedDrive.connected ? "Connected" : "Disconnected");

  if (connectedDrive.connected) {
    for (const updatedPath of updatedPaths) {
      // Remove `input` from path
      let pathDiff = updatedPath.slice(input.length);

      if (pathDiff.length < 1) {
        // No content left. Changed path must be the file that was watched
        pathDiff = path.basename(updatedPath);
      }

      const destPath = path.join(connectedDrive.path, output, pathDiff);

      const destFolder = path.dirname(destPath);

      if (!existsSync(destFolder)) {
        // Create missing directory
        console.log(`Creating dir ${destFolder}`);
        mkdirSync(destFolder, { recursive: true });
      }

      console.log(`Copying ${updatedPath} to ${destPath}`);
      copyFile(updatedPath, destPath, (error) => {
        if (error) {
          console.error(error);
        }
      });
    }

    updatedPaths = new Set();

    setTimeout(() => {
      ejectDrive(connectedDrive.path);
    }, 1000);
  }
});
