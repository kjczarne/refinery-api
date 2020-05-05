# Anki Conversion Engine

Work done in this part of repo is partly based on the `anki-apkg-export` package. Check out the creators and show your love: https://github.com/repeat-space/anki-apkg-export.

Another resource I used liberally in the process was Anki Wiki: https://github.com/ankidroid/Anki-Android/wiki/Database-Structure. That's where I snatched the Schema description from:

## Behavior

The module attempts to work with a connection to an instance of an Anki Database which can be a DB on your hosted Anki Server of even a local instance that you will then sync through Anki app. It will always attempt to create tables in a connected database if they don't exist already, so that behavior can be adapted to obtain exported `.apkg` files and this is in fact planned for the near future.

This part of the repo is still in very early development stage and README will be updated in the future to accurately describe how to acheive Anki database connection and export generated flashcards there.