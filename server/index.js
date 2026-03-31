const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const renewalsRouter = require('./routes/renewals');
const authRouter = require('./routes/auth');
const { scheduleDaily } = require('./utils/scheduler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/renewals', renewalsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve React frontend in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);

  if (process.env.GOOGLE_SHEETS_URL) {
    console.log('Data source: Google Sheets');
    const refreshHour = parseInt(process.env.REFRESH_HOUR || '6', 10);
    scheduleDaily(refreshHour, async () => {
      try {
        const { refreshSnapshot } = require('./routes/renewals');
        await refreshSnapshot();
        console.log(`Daily refresh completed at ${new Date().toISOString()}`);
      } catch (err) {
        console.error('Daily refresh failed:', err.message);
      }
    });
    console.log(`Daily auto-refresh scheduled at ${refreshHour}:00`);
  } else {
    console.log('No GOOGLE_SHEETS_URL configured — serving from snapshot only');
  }
});
