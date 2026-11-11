# Kerala GSB Konkani explorer

Two pages, three sheets, one image per scene. No build step, no server code.

## Files

| File | Purpose |
|---|---|
| `index.html` | The explorer visitors use |
| `editor.html` | Your tool for drawing clickable areas on a scene image |
| `play.html` | Match game: drag or tap words onto pictures |
| `config.js` | Where the data lives (local CSVs or Google Sheets links) |
| `data/lexicon.csv` | One row per word |
| `data/hotspots.csv` | One row per clickable object |
| `data/scenes.csv` | One row per scene image |
| `images/` | Scene illustrations (`kitchen.svg` is a placeholder) |
| `audio/` | Recordings, named by `word_id` (e.g. `K0001.mp3`) |

## How the pieces connect

`lexicon.hotspot_id` → `hotspots.hotspot_id` → `hotspots.scene_id` → `scenes.scene_id` → `scenes.image`

Hotspot polygons are stored as fractions of the image width and height (0–1), so they survive re-exporting the illustration at a different resolution as long as the composition doesn't move.

## Lexicon columns

| Column | Notes |
|---|---|
| `word_id` | Permanent. Never reuse or renumber. |
| `status` | `draft`, `verified` or `published`. Only `published` appears in the explorer. |
| `hotspot_id` | Blank or unknown → word shows under "Not yet placed" |
| `game` | `yes` only for words that name a single object. Verbs, processes and words that share an object with others stay `no`. |
| `thumb` | Square photo of the object for the match game, e.g. `images/thumbs/K0001.webp`. Without one, the game shows the meaning as text. |
| `romanized`, `meaning` | Required |
| `malayalam_script`, `devanagari`, `kannada_script`, `ipa`, `pos` | Optional |
| `example_konkani`, `example_english` | Optional |
| `etymology`, `etymology_lang`, `source` | Etymology without a source is flagged |
| `confidence` | `attested`, `proposed` or `speculative` |
| `cmp_mangalore_gsb`, `cmp_goan`, `cmp_malayalam` | Comparison forms |
| `audio_file`, `speaker_region`, `notes` | `notes` is never shown to visitors |

## Routine updates

**New word on an existing object:** add a row to the lexicon. Set `status` to `published` when verified.

**New object already drawn in the image:** open `editor.html`, outline the object, enter `hotspot_id` and label, save. Then either *Copy row for Google Sheets* and paste it into the hotspots tab, or *Download hotspots.csv* and replace the file in `data/`.

**New object not in the image:** illustrator adds it (keep the same canvas size and layout), replace the image file, then trace the hotspot as above.

**New scene:** add the image to `images/`, add a row to `scenes.csv`, trace its hotspots in the editor.

**After any change:** open the explorer and check the data-check button in the header. It flags duplicate ids, words pointing to missing hotspots, bad polygons, invalid status/confidence values, and etymologies without sources. "Check audio files" lists missing recordings.

## Match game

`play.html` picks 6 random words that are published and have `game` set to `yes`.

- Players drag a word onto its picture, or tap the word and then the picture (works with a keyboard too).
- **Show words as:** Malayalam script, Devanagari, romanized, or sound only. If a word lacks the chosen script, it falls back to romanized.
- **Show meanings** is off by default, so players recognise the object rather than translate the English.
- A correct match plays the recording. After two misses on the same word, the game states its meaning and highlights the right picture.
- Tries and accuracy are counted. Best accuracy per display mode is saved in the player's browser.

Thumbnails: crop to a square, about 400 px, WebP or JPEG under 60 KB. The placeholder thumbs in `images/thumbs/` are crops of the sketch.

## Hosting

1. Put the folder in a GitHub repository and turn on GitHub Pages (Settings → Pages → deploy from branch). Any static host works.
2. To edit data in Google Sheets instead of CSV files: make one sheet with three tabs named `lexicon`, `hotspots`, `scenes` using the same column headers. For each tab, File → Share → Publish to web → select the tab → CSV, then paste the three links into `config.js`. Edits go live on page refresh (Google caches published sheets for a few minutes).

Opening `index.html` directly from disk blocks data loading in most browsers; the page then asks you to pick the three CSVs manually. To preview locally, run `python -m http.server` in the folder and open http://localhost:8000.

## Current word list

`data/lexicon.csv` holds 126 kitchen and food entries (110 nouns and adjectives, 16 verbs) from Saratchandra Shenoi, *A Handbook for Writing Better Konkani* (Sukrtindra Oriental Research Institute, Kochi), English–Konkani vocabulary, pp. 59–95. Each row cites its page.

- **devanagari** is the book's first form; **variants** lists the other forms the book gives for the same sense.
- **romanized**, **malayalam_script** and **kannada_script** are machine-transliterated from the Devanagari, with a heuristic for silent vowels. Expect some errors; correct them in the sheet.
- 83 rows are marked for the match game. Their **thumb** paths are named `meaning-romanized.jpg`; `images/thumbs/shotlist.csv` lists every filename to supply. The current files are placeholder sketches. Replace each with a photo saved under the same filename (square, about 400 px, JPEG, under 60 KB); no other change is needed. If a file is missing, the game shows the meaning as text and the explorer shows no picture.
- Audio: name recordings the same way (e.g. `coconut-narlu.mp3`) and fill **audio_file**.

## Old sample data

The 10 lexicon rows are placeholders. Three demonstrate edge cases: K0008 points to a hotspot that doesn't exist (flagged), K0009 is a draft (hidden), K0010 has no hotspot (shown under "Not yet placed"). Delete them once real entries go in.
