// dinou/env.d.ts
/// <reference path="./assets.d.ts" />
/// <reference path="./css.d.ts" />

declare var process: NodeJS.Process;

declare namespace NodeJS {
  interface Process {
    env: ProcessEnv;
  }

  interface ProcessEnv {
    NODE_ENV?: "development" | "production" | "test";
    PORT?: string;
    HOST?: string;
    HMR_PORT?: string;
    IDLE_TIMEOUT?: string;
    DINOU_WRITE_TO_DISK?: string;
    DINOU_UNVENDORIZED?: string;
    [key: `DINOU_PUBLIC_${string}`]: string | undefined;
    [key: string]: string | undefined;
  }
}
