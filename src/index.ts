import express, { Request, Response, Application } from 'express';
import path from 'path';
import { getDatabasePool } from './getDatabasePool';

const app: Application = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));

const pool = getDatabasePool();

app.get('/', async (request: Request, response: Response) => {
  try {
    const routes = await pool.query(/* sql */ `
      WITH routes_with_stops AS
      (
        SELECT DISTINCT
          routes.agency_id,
          routes.route_id,
          routes.route_short_name,
          trips.trip_headsign,
          trips.trip_id,
          stop_times.stop_sequence::INTEGER,
          CONCAT(stops.stop_lon, ',', stops.stop_lat) AS stop_coordinates
        FROM routes
        JOIN trips ON routes.route_id = trips.route_id
        JOIN stop_times ON trips.trip_id = stop_times.trip_id
        JOIN stops ON stop_times.stop_id = stops.stop_id
        ORDER BY
          routes.agency_id,
          routes.route_id,
          trips.trip_headsign,
          trips.trip_id,
          stop_times.stop_sequence::INTEGER
      ),
      routes_with_stops_path AS
      (
        SELECT
          route_id,
          route_short_name,
          trip_headsign,
          trip_id,
          JSON_AGG(stop_coordinates ORDER BY stop_sequence) AS stops_path,
          ROW_NUMBER() OVER(PARTITION BY route_id) AS occurrence
        FROM routes_with_stops
        GROUP BY
          route_id,
          route_short_name,
          trip_headsign,
          trip_id
        ORDER BY route_id
      )
        SELECT
          route_id,
          route_short_name,
          stops_path
        FROM routes_with_stops_path
        WHERE occurrence = 1
    ;`);

    const geoJson = routes.rows.map((route) => ({
      type: 'Feature',
      properties: {
        id: route.route_id,
        name: route.route_short_name,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
      },
      geometry: {
        type: 'LineString',
        coordinates: route.stops_path.map((point: string) => {
          const [lon, lat] = point.split(',');
          return [parseFloat(lon), parseFloat(lat)];
        })
      }
    }));

    response.render('index', { routes: JSON.stringify(geoJson) });
  } catch (error) {
    console.error(error);
    response.status(500).send('Internal Server Error');
  }
});

app.listen(4000, () => {
  console.log(`Server listening on http://localhost:4000/`);
});
