// Small datasets for the Zero to Hero widgets.
//
// The name list is written for this course rather than taken from any lecture
// dataset: common given names are facts, and keeping our own short list means
// the workbench ships nothing that belongs to someone else. It is intentionally
// tiny — the point is a model you can train in a browser tab and a held-out
// split that overfits visibly, not a representative sample of any population.

export const NAMES = [
  "ada", "adrian", "agnes", "aisha", "alba", "alice", "amara", "amir", "anders", "anita",
  "arjun", "asha", "aurora", "bela", "bram", "cadence", "caleb", "camila", "carys", "cedar",
  "chiara", "cira", "clara", "cyrus", "dahlia", "daniela", "dario", "delia", "dimitri", "dora",
  "edmund", "eira", "elena", "elias", "elodie", "emeka", "esme", "ewan", "fabian", "farah",
  "felix", "fiona", "flora", "gabriel", "galia", "gideon", "greta", "hana", "harold", "hazel",
  "helio", "ida", "idris", "ilana", "imani", "ingrid", "iris", "isolde", "ivan", "jonah",
  "juno", "kai", "kamila", "kiran", "lara", "leif", "lena", "leon", "lucia", "lukas",
  "mabel", "maeve", "malik", "mara", "marcel", "mateo", "maya", "mira", "mohan", "nadia",
  "nadir", "nella", "nico", "nils", "nora", "nuria", "olive", "omar", "oona", "orion",
  "otto", "paloma", "pavel", "petra", "priya", "quentin", "rafael", "rania", "rhea", "rosa",
  "rudi", "saba", "salim", "selma", "senna", "sergio", "sienna", "silas", "sonia", "soren",
  "tamar", "tariq", "tessa", "theo", "tomas", "uma", "vera", "vidal", "wren", "xavier",
  "yara", "yusuf", "zahra", "zeno", "zoya",
];

/**
 * Tokenizer sample text. Written here so the merge sequence is reproducible and
 * so the widget can show the cases that matter: repeated words, leading spaces,
 * digits split apart, an accented word, and indentation-heavy code.
 */
export const TOKENIZER_SAMPLE = `A tokenizer turns text into tokens, and the tokens are what the model sees.
The tokenizer sees bytes, not letters: the word "tokenizer" is not one thing to it.
Numbers such as 1234 and 1235 split in ways no one intends, and café is not one byte per letter.

def step(loss):
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()
`;

/** Short sequence for the attention widget: five words, one clear dependency. */
export const ATTENTION_SENTENCE = ["the", "cat", "sat", "on", "the", "mat"];
