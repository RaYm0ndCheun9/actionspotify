import { log, sleep, writeJSON } from "./functions";
import {
  createClient,
} from "./spotify";

async function main() {
  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID as string;
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET as string;
  const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN as string;

  const missing: string[] = [];
  if (!SPOTIFY_CLIENT_ID) missing.push("SPOTIFY_CLIENT_ID");
  if (!SPOTIFY_CLIENT_SECRET) missing.push("SPOTIFY_CLIENT_SECRET");
  if (!SPOTIFY_REFRESH_TOKEN) missing.push("SPOTIFY_REFRESH_TOKEN");
  if (missing.length > 0) {
    throw new Error(`Missing required inputs: ${missing.join(", ")}`);
  }

  log(`Creating Spotify client…`);
  const client = await createClient(
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REFRESH_TOKEN,
  );

  log(`Getting current user…`);
  // Strip email from profile data to prevent exposure.
  const { email: _email, ...me } = await client.getProfile();
  log(`Logged in as ${me.display_name} (${me.id}).`);
  writeJSON("me", me);

  log(`Getting all playlists…`);
  let playlists = await client.getAllSavedPlaylists();
  let total = playlists.length;
  log(`Found ${total} playlists.`);

  if (process.env.SPOTIFY_PUBLIC_PLAYLISTS_ONLY === "true") {
    playlists = playlists.filter((playlist) => playlist.public);
    total = playlists.length;
    log(`Will only write ${total} public playlists.`);
  }
  let output = { total, playlists };

  log(`Writing playlists data…`);
  writeJSON("playlists", output);

  log(`Waiting for 1.5 second…`);
  await sleep(1500);

    // Spotify's API rate limit is calculated in a rolling 30 second window.
    // Sleep for half a second between playlist requests to avoid hitting the
    // rate limit.
    log(`Waiting for 1000 milliseconds…`);
    await sleep(1000);

  log(`Done!`);
}

main();
