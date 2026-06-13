const clients = new Set();

function addClient(res) {
  clients.add(res);
  res.write(`event: ready\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  return () => {
    clients.delete(res);
  };
}

function publish(event, payload) {
  const frame = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    client.write(frame);
  }
}

module.exports = { addClient, publish };

