-- This has been copied from https://github.com/ankidroid/Anki-Android/wiki/Database-Structure 
-- Cards are what you review. 
-- There can be multiple cards for each note, as determined by the Template.
CREATE TABLE IF NOT EXISTS cards (
    id              integer primary key,
      -- the epoch milliseconds of when the card was created
    nid             integer not null, 
      -- notes.id
    did             integer not null,
      -- deck id (available in col table)
    ord             integer not null,
      -- ordinal : identifies which of the card templates or cloze deletions it corresponds to 
      --   for card templates, valid values are from 0 to num templates - 1
      --   for cloze deletions, valid values are from 0 to max cloze index - 1 (they're 0 indexed despite the first being called `c1`)
    mod             integer not null,
      -- modificaton time as epoch seconds
    usn             integer not null,
      -- update sequence number : used to figure out diffs when syncing. 
      --   value of -1 indicates changes that need to be pushed to server. 
      --   usn < server usn indicates changes that need to be pulled from server.
    type            integer not null,
      -- 0=new, 1=learning, 2=due, 3=relearning
    queue           integer not null,
      -- -3=user buried(In scheduler 2),
      -- -2=sched buried (In scheduler 2), 
      -- -2=buried(In scheduler 1),
      -- -1=suspended,
      -- 0=new, 1=learning, 2=due (as for type)
      -- 3=in learning, next rev in at least a day after the previous review
    due             integer not null,
     -- Due is used differently for different card types: 
     --   new: note id or random int
     --   due: integer day, relative to the collection's creation time
     --   learning: integer timestamp
    ivl             integer not null,
      -- interval (used in SRS algorithm). Negative = seconds, positive = days
    factor          integer not null,
      -- The ease factor of the card in permille (parts per thousand). If the ease factor is 2500, the card’s interval will be multiplied by 2.5 the next time you press Good.
    reps            integer not null,
      -- number of reviews
    lapses          integer not null,
      -- the number of times the card went from a "was answered correctly" 
      --   to "was answered incorrectly" state
    left            integer not null,
      -- of the form a*1000+b, with:
      -- b the number of reps left till graduation
      -- a the number of reps left today
    odue            integer not null,
      -- original due: In filtered decks, it's the original due date that the card had before moving to filtered.
                    -- If the card lapsed in scheduler1, then it's the value before the lapse. (This is used when switching to scheduler 2. At this time, cards in learning becomes due again, with their previous due date)
                    -- In any other case it's 0.
    odid            integer not null,
      -- original did: only used when the card is currently in filtered deck
    flags           integer not null,
      -- an integer. This integer mod 8 represents a "flag", which can be see in browser and while reviewing a note. Red 1, Orange 2, Green 3, Blue 4, no flag: 0. This integer divided by 8 represents currently nothing
    data            text not null
      -- currently unused
);
-- col contains a single row that holds various information about the collection
CREATE TABLE IF NOT EXISTS col (
    id              integer primary key,
      -- arbitrary number since there is only one row
    crt             integer not null,
      -- timestamp of the creation date. It's correct up to the day. For V1 scheduler, the hour corresponds to starting a new day. By default, new day is 4.
    mod             integer not null,
      -- last modified in milliseconds
    scm             integer not null,
      -- schema mod time: time when "schema" was modified. 
      --   If server scm is different from the client scm a full-sync is required
    ver             integer not null,
      -- version
    dty             integer not null,
      -- dirty: unused, set to 0
    usn             integer not null,
      -- update sequence number: used for finding diffs when syncing. 
      --   See usn in cards table for more details.
    ls              integer not null,
      -- "last sync time"
    conf            text not null,
      -- json object containing configuration options that are synced
    models          text not null,
      -- json array of json objects containing the models (aka Note types)
    decks           text not null,
      -- json array of json objects containing the deck
    dconf           text not null,
      -- json array of json objects containing the deck options
    tags            text not null
      -- a cache of tags used in the collection (This list is displayed in the browser. Potentially at other place)
);
-- Contains deleted cards, notes, and decks that need to be synced. 
-- usn should be set to -1, 
-- oid is the original id.
-- type: 0 for a card, 1 for a note and 2 for a deck
CREATE TABLE IF NOT EXISTS graves (
    usn             integer not null,
    oid             integer not null,
    type            integer not null
);
-- Notes contain the raw information that is formatted into a number of cards
-- according to the models
CREATE TABLE IF NOT EXISTS notes (
    id              integer primary key,
      -- epoch miliseconds of when the note was created
    guid            text not null,
      -- globally unique id, almost certainly used for syncing
    mid             integer not null,
      -- model id
    mod             integer not null,
      -- modification timestamp, epoch seconds
    usn             integer not null,
      -- update sequence number: for finding diffs when syncing.
      --   See the description in the cards table for more info
    tags            text not null,
      -- space-separated string of tags. 
      --   includes space at the beginning and end, for LIKE "% tag %" queries
    flds            text not null,
      -- the values of the fields in this note. separated by 0x1f (31) character.
    sfld            text not null,
      -- sort field: used for quick sorting and duplicate check
    csum            integer not null,
      -- field checksum used for duplicate check.
      --   integer representation of first 8 digits of sha1 hash of the first field
    flags           integer not null,
      -- unused
    data            text not null
      -- unused
);
-- revlog is a review history; it has a row for every review you've ever done!
CREATE TABLE IF NOT EXISTS revlog (
    id              integer primary key,
       -- epoch-milliseconds timestamp of when you did the review
    cid             integer not null,
       -- cards.id
    usn             integer not null,
        -- update sequence number: for finding diffs when syncing. 
        --   See the description in the cards table for more info
    ease            integer not null,
       -- which button you pushed to score your recall. 
       -- review:  1(wrong), 2(hard), 3(ok), 4(easy)
       -- learn/relearn:   1(wrong), 2(ok), 3(easy)
    ivl             integer not null,
       -- interval (i.e. as in the card table)
    lastIvl         integer not null,
       -- last interval (i.e. the last value of ivl. Note that this value is not necessarily equal to the actual interval between this review and the preceding review)
    factor          integer not null,
      -- factor
    time            integer not null,
       -- how many milliseconds your review took, up to 60000 (60s)
    type            integer not null
       --  0=learn, 1=review, 2=relearn, 3=cram
);
CREATE INDEX IF NOT EXISTS ix_cards_nid on cards (nid);
CREATE INDEX IF NOT EXISTS ix_cards_sched on cards (did, queue, due);
CREATE INDEX IF NOT EXISTS ix_cards_usn on cards (usn);
CREATE INDEX IF NOT EXISTS ix_notes_csum on notes (csum);
CREATE INDEX IF NOT EXISTS ix_notes_usn on notes (usn);
CREATE INDEX IF NOT EXISTS ix_revlog_cid on revlog (cid);
CREATE INDEX IF NOT EXISTS ix_revlog_usn on revlog (usn);
-- empty comment, do not delete, necessary for cleaning functions to work properly