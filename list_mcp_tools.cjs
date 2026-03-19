const { spawn } = require('child_process');

const mcp = spawn('npx', ['-y', '@supabase/mcp-server-supabase@0.5.0-dev.3', '--project-ref=iodcpnfbmvghdzyywaec'], {
  env: { ...process.env, SUPABASE_ACCESS_TOKEN: 'sbp_bb21b69d25f2fe9434e5ea0340ea7c686cd0e629' }
});

let output = '';

mcp.stdout.on('data', (data) => {
  const str = data.toString();
  output += str;
  // Try parsing to see if we got the list
  try {
    const messages = output.trim().split('\n');
    for (const msg of messages) {
      if (msg) {
        const json = JSON.parse(msg);
        if (json.id === 2) {
          console.log(JSON.stringify(json.result.tools, null, 2));
          mcp.kill();
          process.exit(0);
        }
      }
    }
  } catch (e) {}
});

mcp.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

// Send Initialize
const initReq = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test", version: "1.0.0" }
  }
};
mcp.stdin.write(JSON.stringify(initReq) + '\n');

// After 1 sec, send tools/list
setTimeout(() => {
  const toolsReq = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  };
  mcp.stdin.write(JSON.stringify(toolsReq) + '\n');
}, 1000);
