require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const db = require('./db');

const REGION = process.env.AWS_REGION || 'eu-central-1';
const BUCKET = process.env.S3_BUCKET || 'minitube-videos-test';
if(!REGION || !BUCKET) { console.error('Setează AWS_REGION și S3_BUCKET în .env!'); }

const s3 = new S3Client({ region: REGION });

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

function generateKey(originalName) {
  const ext = path.extname(originalName) || '';
  const base = Date.now() + '-' + Math.round(Math.random()*1e9);
  return `uploads/${base}${ext}`;
}

// POST /api/presign
app.post('/api/presign', async (req, res) => {
  try {
    const { filename, contentType, size } = req.body;
    if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType required' });

    const key = generateKey(filename);
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType
    });
    const expiresIn = 15 * 60;
    const url = await getSignedUrl(s3, command, { expiresIn });
    return res.json({ url, key, expiresIn });
  } catch (err) {
    console.error('presign error', err);
    return res.status(500).json({ error: 'presign failed' });
  }
});

// POST /api/complete
app.post('/api/complete', async (req, res) => {
  try {
    const { key, originalname, title, channel, description, size } = req.body;
    if (!key || !originalname) return res.status(400).json({ error: 'key and originalname required' });
    const stmt = db.prepare(`INSERT INTO videos (s3key, originalname, title, channel, description, duration, size) VALUES (?,?,?,?,?,?,?)`);
    stmt.run(key, originalname, title || originalname, channel || 'Anonim', description || '', 0, size || 0, function(err) {
      if (err) { console.error('DB insert error', err); return res.status(500).json({ error: 'DB error' }); }
      const id = this.lastID;
      return res.json({ ok: true, id });
    });
  } catch (err) {
    console.error('complete error', err);
    return res.status(500).json({ error: 'complete failed' });
  }
});

// GET /api/videos
app.get('/api/videos', (req, res) => {
  db.all(`SELECT id, s3key, originalname, title, channel, description, duration, size, created_at FROM videos ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    const result = rows.map(r => ({
      id: r.id,
      title: r.title,
      channel: r.channel,
      description: r.description,
      duration: r.duration,
      size: r.size,
      created_at: r.created_at,
      url: `/s3proxy/${encodeURIComponent(r.s3key)}`,
      originalname: r.originalname
    }));
    res.json(result);
  });
});

// GET /s3proxy/:key - redirect to presigned GET url (keeps bucket private)
app.get('/s3proxy/:key', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const url = await getSignedUrl(s3, getCmd, { expiresIn: 60 * 60 });
    return res.redirect(url);
  } catch (err) {
    console.error('s3proxy error', err);
    return res.status(500).send('Error generating presigned GET');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Backend presign server listening at http://localhost:${PORT}`));