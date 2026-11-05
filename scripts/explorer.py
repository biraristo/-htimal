"""Create browser series and a downloadable, indexed SQLite pilot from the WDI archive."""
import csv
import gzip
import json
import sqlite3
import tempfile
from itertools import groupby
from pathlib import Path

def extend(output, atlas, metadata):
    folder=output/"archive"
    countries=atlas["countries"]
    with tempfile.TemporaryDirectory() as tmp, sqlite3.connect(Path(tmp)/"stage.db") as stage, sqlite3.connect(Path(tmp)/"pilot.sqlite") as pilot:
        stage.execute("CREATE TABLE series(metric TEXT, country TEXT, values_json TEXT, PRIMARY KEY(metric,country)) WITHOUT ROWID")
        pilot.executescript("""
        CREATE TABLE indicator(code TEXT PRIMARY KEY, name TEXT, unit TEXT, source TEXT, license TEXT);
        CREATE TABLE observation(metric TEXT REFERENCES indicator, country TEXT, year INTEGER, value REAL,
          PRIMARY KEY(metric,country,year)) WITHOUT ROWID;
        CREATE VIEW latest AS SELECT o.* FROM observation o JOIN
          (SELECT metric,country,max(year) year FROM observation GROUP BY metric,country) t USING(metric,country,year);
        """)
        pilot.executemany("INSERT INTO indicator VALUES (?,?,?,?,?)",[(c,m["Indicator Name"],m["Unit of measure"],m["Source"],m["License Type"]) for c,m in metadata.items()])
        for path in sorted(folder.glob("wdi-*.csv.gz")):
            with gzip.open(path,"rt",newline="") as stream:
                for row in csv.DictReader(stream):
                    country,code=row["Country Code"],row["Indicator Code"]
                    if country not in countries:continue
                    values={y:float(v) for y,v in row.items() if y.isdigit() and v}
                    stage.execute("INSERT INTO series VALUES(?,?,?)",(code,country,json.dumps(values,separators=(",",":"))))
                    if country in {"TUR","NGA","JPN"}:
                        pilot.executemany("INSERT INTO observation VALUES (?,?,?,?)",[(code,country,int(y),v) for y,v in values.items()])
        pilot.commit()
        with (Path(tmp)/"pilot.sqlite").open("rb") as src, gzip.open(folder/"pilot.sqlite.gz","wb") as dest:
            import shutil
            shutil.copyfileobj(src,dest)
        cursor=stage.execute("SELECT metric,country,values_json FROM series ORDER BY metric,country")
        for code, group in groupby(cursor,key=lambda r:r[0]):
            with (output/(code+".json")).open("w") as dest:
                dest.write("{"+",".join(json.dumps(country)+":"+values for _,country,values in group)+"}")
            m=metadata[code]
            atlas["metrics"].setdefault(code,[m["Indicator Name"],m["Topic"],m["Unit of measure"]])
            atlas["attribution"][code]=m["Source"]
