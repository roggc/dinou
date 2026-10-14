// dinou/cloudflare/shims/child_process.js
export const fork = () => {
  return {
    on: () => {},
    stdout: { on: () => {} },
    stderr: { on: () => {} },
    stdio: [null, null, null, null, { write: () => {}, end: () => {} }],
    kill: () => {},
  };
};
export const spawn = () => ({ on: () => {} });
export const exec = () => {};
export const execSync = () => "";
export default { fork, spawn, exec, execSync };
