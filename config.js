// Where the explorer reads its data.
// Local files (default): keep the CSVs in /data and host the folder on GitHub Pages or any static host.
// Google Sheets: File > Share > Publish to web > choose the tab > CSV, then paste each tab's link below.
window.EXPLORER_CONFIG = {
  title: "Kerala GSB Konkani",
  lexicon:  "data/lexicon.csv",
  hotspots: "data/hotspots.csv",
  scenes:   "data/scenes.csv",
  audioBase: "audio/"   // audio_file values are looked up here, e.g. audio/K0001.mp3
};
