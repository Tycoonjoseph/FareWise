const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const ROUTES = [
  {
    id: 'nairobi-ngong',
    name: 'Nairobi to Ngong',
    stage: 'CBD to Ngong',
    typicalPeak: '6:00-9:00 AM',
    typicalOffPeak: '10:00 AM-4:00 PM'
  },
  {
    id: 'nairobi-thika',
    name: 'Nairobi to Thika',
    stage: 'CBD to Thika Superhighway',
    typicalPeak: '5:30-9:30 AM',
    typicalOffPeak: '11:00 AM-4:00 PM'
  },
  {
    id: 'nairobi-nakuru',
    name: 'Nairobi to Nakuru',
    stage: 'Country bus routes',
    typicalPeak: 'Friday evenings',
    typicalOffPeak: 'Mid-morning weekdays'
  }
];

let fares = [
  { route: 'nairobi-ngong', price: 80, period: 'Off-peak', notes: 'Normal traffic', time: '2026-04-24T07:10:00.000Z' },
  { route: 'nairobi-ngong', price: 120, period: 'Peak', notes: 'Morning rush', time: '2026-04-24T06:35:00.000Z' },
  { route: 'nairobi-thika', price: 150, period: 'Off-peak', notes: 'Midday', time: '2026-04-24T11:40:00.000Z' },
  { route: 'nairobi-thika', price: 220, period: 'Peak', notes: 'Heavy traffic near Roysambu', time: '2026-04-24T17:20:00.000Z' },
  { route: 'nairobi-nakuru', price: 450, period: 'Off-peak', notes: 'Morning travel', time: '2026-04-23T08:00:00.000Z' },
  { route: 'nairobi-nakuru', price: 600, period: 'Peak', notes: 'Friday demand', time: '2026-04-23T15:00:00.000Z' }
];

function findRoute(routeId) {
  return ROUTES.find((route) => route.id === routeId);
}

function getRouteFares(routeId) {
  return fares
    .filter((fare) => fare.route === routeId)
    .sort((a, b) => new Date(b.time) - new Date(a.time));
}

function buildSummary(routeId) {
  const filtered = getRouteFares(routeId);
  if (filtered.length === 0) {
    return {
      route: routeId,
      average: null,
      lowest: null,
      highest: null,
      count: 0,
      latest: null
    };
  }

  const prices = filtered.map((fare) => fare.price);
  const sum = prices.reduce((total, price) => total + price, 0);

  return {
    route: routeId,
    average: Math.round(sum / filtered.length),
    lowest: Math.min(...prices),
    highest: Math.max(...prices),
    count: filtered.length,
    latest: filtered[0]
  };
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'FareWise API' });
});

app.get('/routes', (_req, res) => {
  res.json(ROUTES);
});

app.post('/fare', (req, res) => {
  const { route, price, period, notes } = req.body;
  const normalizedPrice = Number(price);

  if (!findRoute(route)) {
    return res.status(400).json({ error: 'Please choose a valid route.' });
  }

  if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
    return res.status(400).json({ error: 'Please enter a valid fare amount.' });
  }

  const fare = {
    route,
    price: normalizedPrice,
    period: period || 'Unspecified',
    notes: typeof notes === 'string' ? notes.trim().slice(0, 120) : '',
    time: new Date().toISOString()
  };

  fares.push(fare);

  res.status(201).json({
    message: 'Fare reported successfully.',
    fare,
    summary: buildSummary(route)
  });
});

app.get('/fares', (req, res) => {
  const route = req.query.route;
  if (!route) {
    return res.json(fares);
  }

  if (!findRoute(route)) {
    return res.status(400).json({ error: 'Unknown route.' });
  }

  res.json(getRouteFares(route).slice(0, 8));
});

app.get('/average', (req, res) => {
  const route = req.query.route;
  if (!route) {
    return res.status(400).json({ error: 'Route required.' });
  }

  if (!findRoute(route)) {
    return res.status(400).json({ error: 'Unknown route.' });
  }

  res.json(buildSummary(route));
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FareWise backend running at http://localhost:${PORT}`);
});
