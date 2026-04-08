// init-replset.js — Initialize MongoDB replica set
const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient('mongodb://127.0.0.1:27017/?directConnection=true');
  try {
    await client.connect();
    const admin = client.db('admin');
    try {
      const status = await admin.command({ replSetGetStatus: 1 });
      console.log('Replica set already initialized. Status:', status.ok);
    } catch (e) {
      console.log('Initializing replica set...');
      const result = await admin.command({ replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: '127.0.0.1:27017' }] } });
      console.log('Replica set initiated:', JSON.stringify(result));
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
}

main();
