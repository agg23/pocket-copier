// @ts-ignore
import { Drive, list as driveList } from "drivelist";
// @ts-ignore
import { eject } from "eject-media";

export type ConnectedDrive =
  | {
      connected: true;
      path: string;
    }
  | {
      connected: false;
    };

export const detectDrive = (
  driveName: string,
  callback: (drive: ConnectedDrive) => void
) => {
  const checkInterval = 2;

  let lastConnected: boolean | undefined = undefined;

  setInterval(() => {
    // Check drives
    driveList().then((list: Drive[]) => {
      const matchingDrives = list.flatMap((drive) =>
        drive.mountpoints.filter((mountpoint) =>
          mountpoint.path.startsWith(driveName)
        )
      );

      const connected = matchingDrives.length > 0;

      if (lastConnected === undefined) {
        // Set initial value
        lastConnected = connected;
      } else if (lastConnected !== connected) {
        callback({
          connected,
          path: matchingDrives[0]?.path,
        });
        lastConnected = connected;
      }
    });
  }, checkInterval * 1000);
};

export const ejectDrive = (path: string) => {
  eject(path, (error: string, _stdin: string, _stdout: string) => {
    if (!error) {
      console.log("Ejected successfully");
    } else {
      console.error(error);
    }
  });
};
