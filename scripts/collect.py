"""Build the public atlas from official bulk files. Python 3.11+, standard library."""
import argparse
import csv
import gzip
import hashlib
import io
import json
import shutil
import subprocess
import tempfile
import zipfile
from explorer import extend
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
WB = "https://datacatalogfiles.worldbank.org/ddh-published/"
UN = "https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/"
EU = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
POWER = "https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M,PRECTOTCORR&community=AG"
sources = [
 ("wdi.zip","Dünya Kalkınma Göstergeleri","Dünya Bankası","https://databank.worldbank.org/data/download/WDI_CSV.zip","https://data.worldbank.org/summary-terms-of-use"),
 ("findex.csv","Dijital erişim ve finansal dayanıklılık","Global Findex","https://thedocs.worldbank.org/en/doc/be6615202d1f08a25855c8ac2d615122-0050012025/related/GlobalFindexDatabase2025.csv","https://www.worldbank.org/en/publication/globalfindex/download-data"),
 ("pip.csv","Gelir ve tüketim yüzdelikleri","Poverty and Inequality Platform",WB+"0063646/DR0090357/world_100bin.csv","https://datacatalog.worldbank.org/search/dataset/0063646"),
 ("gdim.csv","Kuşaklar arası eğitim hareketliliği","GDIM",WB+"0050771/3/DR0065670/GDIM_2023_03.csv","https://datacatalog.worldbank.org/search/dataset/0050771"),
 ("gsap.xlsx","Bölgesel yoksulluk","Global Subnational Poverty Atlas",WB+"0042041/DR0052555/AM26%20-%20GSAP%20data.xlsx","https://datacatalog.worldbank.org/search/dataset/0042041"),
 ("housing.json","Konut giderlerinin yükü","Eurostat",EU+"ilc_lvho07a?sex=T&unit=PC&lang=en","https://ec.europa.eu/eurostat/databrowser/view/ilc_lvho07a/default/table"),
 ("regionbirths.json","Bölgesel doğumlar · NUTS 3","Eurostat",EU+"demo_r_births?geoLevel=nuts3&sinceTimePeriod=2010&lang=en","https://ec.europa.eu/eurostat/databrowser/view/demo_r_births/default/table"),
 ("time.json","Ücretsiz çalışma ve zaman kullanımı","Eurostat",EU+"tus_20npaywork?lang=en","https://ec.europa.eu/eurostat/databrowser/view/tus_20npaywork/default/table"),
 ("jmp.csv","Su, sanitasyon ve hijyen","WHO / UNICEF JMP","https://api.washdata.org/v1/household/estimates/country?format=csv","https://washdata.org/data/api"),
 ("wpp.csv.gz","Nüfus, doğumlar ve projeksiyonlar","UN DESA · WPP 2024",UN+"WPP2024_Demographic_Indicators_Medium.csv.gz","https://population.un.org/wpp/"),
 ("life.csv.gz","Yaşa göre yaşam tabloları · 1950–2023","UN DESA · WPP 2024",UN+"WPP2024_Life_Table_Abridged_Medium_1950-2023.csv.gz","https://population.un.org/wpp/"),
]
for city, point in [("ankara","32.85&latitude=39.93"),("tokyo","139.69&latitude=35.68"),("lagos","3.38&latitude=6.52")]:
    sources.append((city+".json",city.title()+" · sıcaklık ve yağış","NASA POWER",POWER+"&longitude="+point+"&format=JSON","https://power.larc.nasa.gov/"))

# A small Turkish-language selection for the visual explorer. Archives keep the full series.
featured = {
"SP.DYN.LE00.IN":("Yaşam beklentisi","Sağlık","yıl"),
"SP.DYN.IMRT.IN":("Bebek ölüm hızı","Sağlık","1.000 canlı doğumda"),
"SP.DYN.TFRT.IN":("Doğurganlık","Nüfus","kadın başına doğum"),
"SP.URB.TOTL.IN.ZS":("Kentte yaşayan nüfus","Nüfus","%"),
"IT.NET.USER.ZS":("İnternet kullanımı","Teknoloji","%"),
"EG.ELC.ACCS.ZS":("Elektriğe erişim","Altyapı","%"),
"SH.H2O.BASW.ZS":("Temel içme suyuna erişim","Altyapı","%"),
"SL.UEM.1524.ZS":("Genç işsizliği","Çalışma","genç işgücünün %’si"),
"SE.SEC.ENRR":("Ortaöğretimde brüt okullaşma","Eğitim","%"),
"NY.GDP.PCAP.PP.KD":("Kişi başına üretim","Ekonomi","sabit uluslararası $"),
"SI.POV.GINI":("Gelir eşitsizliği","Ekonomi","Gini endeksi"),
"SP.POP.TOTL":("Toplam nüfus","Nüfus","kişi"),
}
def write_json(path, obj):
    path.write_text(json.dumps(obj,ensure_ascii=False,separators=(",",":"),allow_nan=False))

def acquire(cache, name, url):
    path = cache / ("ihtimal-"+name)
    if not path.exists():
        tmp = path.with_suffix(path.suffix+".part")
        subprocess.run(["curl","-fLsS","--retry","3","--max-time","600",url,"-o",str(tmp)],check=True)
        tmp.replace(path)
    return path

def archive_table(stream, stem, folder, keep=lambda r: True, replacements=None):
    """Write complete CSV rows with headers in bounded, independently usable gzip parts."""
    reader=csv.DictReader(stream)
    writer=None
    parts=[]
    count=0
    target=None
    for row in reader:
        if replacements:
            row=replacements.get((row.get("LocID"),row.get("Time"),row.get("VarID")),row)
        if not keep(row):
            continue
        if count % 10000 == 0:
            if target:
                target.close()
            name=f"{stem}-{len(parts)+1:03}.csv.gz"
            parts.append(name)
            target=gzip.open(folder/name,"wt",encoding="utf-8",newline="")
            writer=csv.DictWriter(target,fieldnames=reader.fieldnames)
            writer.writeheader()
        writer.writerow(row)
        count+=1
    if target:
        target.close()
    return parts,count

def build(cache, output):
    archive=output/"archive"
    archive.mkdir(parents=True)
    catalog=[]
    atlas={"metrics":featured,"countries":{},"series":{}}
    for name,title,provider,url,about in sources:
        print("Preparing",name,flush=True)
        path=acquire(cache,name,url)
        item={"name":title,"provider":provider,"url":url,"about":about,"files":[],"sha256":hashlib.file_digest(path.open("rb"),"sha256").hexdigest()}
        if name=="wdi.zip":
            with zipfile.ZipFile(path) as z:
                def table(name):
                    return io.TextIOWrapper(z.open(name),encoding="utf-8-sig",newline="")
                series={r["Series Code"]:r for r in csv.DictReader(table("WDISeries.csv")) if r["License Type"] in {"CC BY-4.0","CC BY 3.0 IGO"}}
                countries={r["Country Code"]:r["Short Name"] for r in csv.DictReader(table("WDICountry.csv")) if r["Region"]}
                atlas["countries"]=countries
                atlas["iso2"]={r["Country Code"]:r["2-alpha code"] for r in csv.DictReader(table("WDICountry.csv")) if r["Region"]}
                for filename,key in [("WDISeries.csv","Series Code"),("WDICountry.csv",None),("WDIfootnote.csv","SeriesCode"),("WDIcountry-series.csv","SeriesCode"),("WDIseries-time.csv","SeriesCode")]:
                    stream=table(filename)
                    header=next(csv.reader(table(filename)))
                    field=next((k for k in header if k.replace(" ","").lower()=="seriescode"),key)
                    if key and field not in header:
                        raise ValueError((filename,header))
                    parts,_=archive_table(stream,filename[:-4],archive,lambda r: not key or r[field] in series)
                    item["files"].extend(parts)
                total=0
                seen=set()
                def include(row):
                    nonlocal total
                    code=row["Indicator Code"]
                    country=row["Country Code"]
                    if code not in series:
                        return False
                    values={y:v for y,v in row.items() if y and y.isdigit() and v}
                    total+=len(values)
                    if values:
                        seen.add(code)

                    return bool(values)
                files,count=archive_table(table("WDICSV.csv"),"wdi",archive,include)
                item.update(rows=count,observations=total,indicators=len(seen))
                item["files"]=files+item["files"]
                atlas["attribution"]={}
                extend(output,atlas,series)
        elif ".csv" in name:
            replacements={}
            if name=="wpp.csv.gz":
                update_url=UN.replace("CSV_FILES/","")+"WPP2024_CSV_files_update.zip"
                update=acquire(cache,"togo.zip",update_url)
                with zipfile.ZipFile(update) as z:
                    with io.TextIOWrapper(z.open("WPP2024_Demographic_Indicators_Medium_Update.csv"),encoding="utf-8-sig") as corrections:
                        replacements={(r["LocID"],r["Time"],r["VarID"]):r for r in csv.DictReader(corrections)}
                item["revision_url"]=update_url
                item["replacement_rows"]=len(replacements)
            opener=gzip.open if name.endswith(".gz") else open
            with opener(path,"rt",encoding="utf-8-sig",newline="") as f:
                item["files"],item["rows"]=archive_table(f,name.split(".")[0],archive,replacements=replacements)
            if not item["rows"]:
                raise ValueError("Empty table "+name)
        else:
            if name.endswith(".json"):
                obj=json.loads(path.read_text())
                if not (obj.get("value") or obj.get("properties",{}).get("parameter")):
                    raise ValueError(name)
            elif not zipfile.is_zipfile(path):
                raise ValueError(name)
            shutil.copyfile(path,archive/name)
            item["files"]=[name]
        catalog.append(item)
    atlas["date"]=date.today().isoformat()
    write_json(output/"catalog.json",catalog)
    write_json(output/"index.json",{k:v for k,v in atlas.items() if k!="series"})
    for code, series in atlas["series"].items():
        write_json(output/(code+".json"),series)

if __name__=="__main__":
    args=argparse.ArgumentParser()
    args.add_argument("--cache",type=Path,default=Path(".cache"))
    opts=args.parse_args()
    opts.cache.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(dir=PUBLIC) as tmp:
        out=Path(tmp)/"data"
        build(opts.cache,out)
        dest=PUBLIC/"data"
        if dest.exists():
            dest.rename(Path(tmp)/"old")
        try:
            out.rename(dest)
        except OSError:
            old=Path(tmp)/"old"
            if old.exists():
                old.rename(dest)
            raise
