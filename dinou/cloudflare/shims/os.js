// dinou/cloudflare/shims/os.js
export const cpus = () => [{ model: "Cloudflare Workers Edge vCPU", speed: 2000 }];
export const freemem = () => 128 * 1024 * 1024;
export const totalmem = () => 128 * 1024 * 1024;
export const platform = () => "workerd";
export const arch = () => "x64";
export const homedir = () => "/";
export const tmpdir = () => "/tmp";
export const hostname = () => "cloudflare-worker";
export const type = () => "Linux";
export const release = () => "edge";
export const uptime = () => 0;
export const loadavg = () => [0, 0, 0];
export const networkInterfaces = () => ({});
export default {
  cpus,
  freemem,
  totalmem,
  platform,
  arch,
  homedir,
  tmpdir,
  hostname,
  type,
  release,
  uptime,
  loadavg,
  networkInterfaces,
};
