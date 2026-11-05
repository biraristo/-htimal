"""Derive the compact game inputs from the checked-in archive, without network access."""
import csv
import gzip
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]/"public"
def records(prefix):
    for path in sorted((ROOT/"data"/"archive").glob(prefix+"-*.csv.gz")):
        with gzip.open(path,"rt",encoding="utf-8-sig",newline="") as stream:
            yield from csv.DictReader(stream)

world={}
for r in records("wpp"):
    if r["Time"]=="2023" and r["LocTypeName"]=="Country/Area" and r["ISO3_code"] and float(r["Births"] or 0)>0:
        world[r["ISO3_code"]]={"name":r["Location"],"iso2":r["ISO2_code"],"births":float(r["Births"]),"srb":float(r["SRB"] or 105),"life":{}}
for r in records("life"):
    key=r["ISO3_code"]
    if key in world and r["Time"]=="2023" and r["SexID"] in {"1","2"}:
        world[key]["life"].setdefault(r["SexID"],[]).append([int(r["AgeGrpStart"]),int(float(r["AgeGrpSpan"])),float(r["qx"]),float(r["ex"]) if r["AgeGrpStart"]=="100" else 0])
for r in records("pip"):
    key=r["country_code"]
    if key not in world or r["reporting_level"]!="national" or float(r["year"])>2023: continue
    p=world[key].get("welfare")
    year=float(r["year"])
    if not p or year>p["year"]:
        p=world[key]["welfare"]={"year":year,"type":r["welfare_type"],"values":{}}
    if year==p["year"] and p["type"]==r["welfare_type"] and r["avg_welfare"]:
        p["values"][r["percentile"]]=round(float(r["avg_welfare"]),3)
for c in world.values():
    for arr in c["life"].values():arr.sort()
    if "welfare" in c and len(c["welfare"]["values"])!=100:del c["welfare"]
for metric,field in [("IT.NET.USER.ZS","internet"),("EG.ELC.ACCS.ZS","electricity")]:
    data=json.loads((ROOT/"data"/(metric+".json")).read_text())
    for code,series in data.items():
        years=[y for y in series if int(y)<=2023]
        if code in world and years:
            year=max(years)
            world[code][field]=[int(year),series[year]]
with (ROOT/"bolgeler"/"turkiye-dogumlar.csv").open() as stream:
    world["TUR"]["provinces"]={r["label"]:int(r["live_births"]) for r in csv.DictReader(stream) if r["year"]=="2022"}
assert len(world["TUR"]["provinces"])==81, "Incomplete provincial birth coverage"
countries={k:v for k,v in world.items() if set(v["life"])=={"1","2"}}
assert len(countries)>200 and all(c['life']['1'][0][0]==0 for c in countries.values())
(ROOT/"world.json").write_text(json.dumps(countries,ensure_ascii=False,separators=(",",":")))
print(len(countries),"countries;",sum("welfare" in c for c in countries.values()),"with survey distributions")
