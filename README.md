## Details about Fork

Mostly addressing the hero banner to make it more pretty.

<img width="1783" height="696" alt="image" src="https://github.com/user-attachments/assets/30d2c493-9be0-4a9d-b500-8388d7653432" />


## About
Editor's Choice is a plugin for the Jellyfin web UI that adds a full-width slider to the main page to feature selected content, similar to the main Netflix home page.

The featured content list is drawn from a specified user's favourited items, or a totally random selection of shows and films. Random mode can be limited to specific movie, TV, or mixed-content libraries, and the selection can also be filtered by minimum community or critic rating.

Banner descriptions use the item's Jellyfin overview and support safe Markdown formatting, including emphasis, lists, headings, block quotes, code, tables, and links. Raw HTML is disabled and rendered links are sanitised.

Each banner can display its community/content rating, year, and either movie runtime or series episode count. The Play button uses the active user's Jellyfin progress: resumable movies continue from their saved position, and started series show and play the current or next episode.

**Default mode**

![Screenshot of Jellyfin with Editor's Choice banner slider](https://github.com/NekoShinobi/jellyfin-editors-choice-plugin/blob/main/example.png?raw=true)

**Hero mode**

![Screenshot of Jellyfin with Editor's Choice in hero mode](https://github.com/NekoShinobi/jellyfin-editors-choice-plugin/blob/main/example-hero.png?raw=true)

## Building

Install the .NET 10 SDK, then run `dotnet build EditorsChoicePlugin.sln --configuration Release` to build for Jellyfin 12. A ready-to-zip package is written to `EditorsChoicePlugin/bin/Release/net10.0/Editor's Choice_<version>/`. It contains the plugin metadata and every required DLL, including the Markdown renderer and sanitizer.

Run the regression tests with `dotnet test tests/EditorsChoicePlugin.Tests/EditorsChoicePlugin.Tests.csproj --configuration Release`. They cover array-backed library results in random, favourites, and recent-release modes.

To build for Jellyfin 10.11 instead, run `dotnet build EditorsChoicePlugin.sln --configuration Release -p:JellyfinVersion=10.11.0`. That package is written under `net9.0`. Add the same `-p:JellyfinVersion=10.11.0` option to the test command to test that target (requires the .NET 9 runtime).

| Jellyfin server | Plugin version series | Runtime | Package target ABI |
| --- | --- | --- | --- |
| 12.x | 2.0.0.x | .NET 10 | 12.0.0.0 |
| 10.11.x | 1.5.2.x | .NET 9 | 10.11.0.0 |

Install the package matching your server version. The repository manifest lets Jellyfin select the compatible build automatically. File Transformation users also need a File Transformation build compatible with their server.

Pushes and pull requests build both server targets in a downloadable workflow artifact. Every push to
`main` also publishes both packages in a new GitHub release and adds both versions to
`manifest.json`, using the pushed commit message as their changelog. Each manifest entry takes its compatibility version from the packaged `meta.json`. A release can
also be started manually with a custom changelog by running the **Build and
release** workflow from the `main` branch. Each release replaces the fourth
component of the version in `Directory.Build.props` with the workflow run
number.

Note that the plugin only works for the web UI (and therefore also the mobile app), but does not and can not work for the Android TV app or other apps due to limitations of those platforms.

## Installation

There are four ways to install this plugin.

The first step is to install this plugin by adding the repository:

1. Add `https://raw.githubusercontent.com/NekoShinobi/jellyfin-editors-choice-plugin/main/manifest.json` as a Jellyfin plugin repository
2. Install **Editor's Choice** from the repository

By default, Editor's Choice automatically uses the first available frontend injection method in this order:

1. File Transformation
2. JavaScript Injector
3. Direct `jellyfin-web/index.html` injection

You can override the automatic selection under **Editor's Choice → Technical settings**. Install either of the two helper plugins below to avoid direct changes to Jellyfin Web.

### Option 1: Install the File Transformation plugin (recommended)
The easiest way to load the frontend script is to use the [File Transformation plugin](https://github.com/IAmParadox27/jellyfin-plugin-file-transformation):

3. Add `https://www.iamparadox.dev/jellyfin/plugins/manifest.json` as a plugin source repository on your Jellyfin server.
4. Find "File Transformation" in the list and install it.
5. Restart server

### Option 2: Install the JavaScript Injector plugin
Alternatively, install [JavaScript Injector](https://github.com/n00bcodr/Jellyfin-JavaScript-Injector). Editor's Choice registers its frontend loader automatically; no script needs to be pasted into the injector settings.

3. Add the JavaScript Injector repository that matches your Jellyfin version.
4. Find "JavaScript Injector" in the plugin catalog and install it.
5. Restart server.

### Option 3: Direct script injection
If neither helper plugin is available, **Editor's Choice** falls back to injecting the necessary script into the main web file. This requires correct permissions.

3. Make sure the user executing the Jellyfin server application has permissions to write to the `jellyfin-web/index.html` file.
4. Restart server.

**The client script will fail to inject automatically into the jellyfin-web server if there is a difference in permission between the owner of the web files (root, or www-data, etc.) and the executor of the main jellyfin-server. This often happens because...**
* **Docker** - the container is being run as a non-root user while having been built as a root user, causing the web files to be owned by root. To solve this, you can remove any lines like `User: 1000:1000`, `GUID:`, `PID:`, etc. from the jellyfin docker compose file.
* **Install from distro repositories** - the jellyfin-server will execute as the `jellyfin` user while the web files will be owned by `root`, `www-data`, etc. This can *likely* be fixed by adding the `jellyfin` (or whichever user your main jellyfin server runs as) user to the same group the jellyfin-web folders are owned by. You should only do this if they are owned by a group other than root, and will have to lookup how to manage permissions on your specific distro.

### Option 4: Manually insert script tag
The final way is to manually amend the `jellyfin-web/index.html` file yourself.

If you manually insert the script tag, you will have to manually insert it on every Jellyfin update, as the index.html file will get overwritten.

3. Select "Disabled / manual injection" under **Editor's Choice → Technical settings**.
4. In Jellyfin's program files, open `jellyfin-web/index.html`.
5. Before the `</body>` tag, insert the following: `<script plugin="EditorsChoice" defer="defer" src="/editorschoice/script"></script>`. If you have a base path set, change `src="/editorschoice/script"` to `src="/YOUR_BASE_PATH/editorschoice/script"`.
6. Clear your site cookies / local storage to get rid of the cached index file and receive a new one from the server.
