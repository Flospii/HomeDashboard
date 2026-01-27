import { defineEventHandler } from "h3";
import os from "node:os";

export default defineEventHandler(async (event) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercentage = Math.round((usedMem / totalMem) * 100);

  const cpus = os.cpus();
  const loadAvg = os.loadavg(); // [1, 5, 15] minute load averages

  // Calculate a simple CPU usage percentage from load average
  // (load / number of CPUs) * 100
  const cpuPercentage = Math.min(
    100,
    Math.round((loadAvg[0] / cpus.length) * 100),
  );

  const uptime = os.uptime();
  const platform = os.platform();
  const release = os.release();

  return {
    cpu: {
      usage: cpuPercentage,
      cores: cpus.length,
      model: cpus[0].model,
      loadAvg,
    },
    memory: {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      percentage: memPercentage,
    },
    uptime,
    os: {
      platform,
      release,
      hostname: os.hostname(),
    },
  };
});
