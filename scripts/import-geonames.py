"""Build a bounded, attributed city subset from official GeoNames country dumps.

Usage: python -X utf8 scripts/import-geonames.py <directory-with-geonames-XX.zip>
No downloads or credentials; preserves source archive hashes for provenance.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re
import zipfile

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('directory', type=Path, help='Directory containing geonames-CN/HK/MO/TW.zip')
folder = parser.parse_args().directory.resolve()
cn = re.compile(r"^[\u4e00-\u9fff]{2,16}$")
provinces = dict(zip(
    '01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 18 19 20 21 22 23 24 25 26 28 29 30 31 32 33'.split(),
    '安徽 浙江 江西 江苏 吉林 青海 福建 黑龙江 河南 河北 湖南 湖北 新疆 西藏 甘肃 广西 贵州 辽宁 内蒙古 宁夏 北京 上海 山西 山东 陕西 天津 云南 广东 海南 四川 重庆'.split()))
records, sources = [], []
for country in ['CN', 'HK', 'MO', 'TW']:
    archive = folder / f'geonames-{country}.zip'
    sources.append({'url': f'https://download.geonames.org/export/dump/{country}.zip', 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest()})
    with zipfile.ZipFile(archive) as z:
        rows = [line.split('\t') for line in z.read(f'{country}.txt').decode('utf-8').splitlines()]
    for r in rows:
        if len(r) != 19 or r[6] != 'P' or not (r[7] in ['PPLC', 'PPLA', 'PPLA2', 'PPLA3'] or int(r[14] or 0) >= 100000):
            continue
        aliases = [a for a in [r[1], *r[3].split(',')] if cn.fullmatch(a)]
        # Keep source names and aliases; no inferred Chinese translations.
        name = next((a for a in aliases if a.endswith(('市', '县', '區', '区'))), next(iter(aliases), r[1]))
        name = {'1816670': '北京', '1796236': '上海', '1529102': '乌鲁木齐', '1819729': '香港', '1821274': '澳门', '1668341': '台北'}.get(r[0], name)
        region = provinces.get(r[10], r[10]) if country == 'CN' else {'HK': '香港', 'MO': '澳门', 'TW': '台湾'}[country]
        aliases = list(dict.fromkeys([name, r[1], r[2], *aliases]))
        # Suffixless forms support normal Chinese city queries; ambiguous names
        # remain ambiguous in the runtime index and require province qualification.
        aliases += [a[:-1] for a in aliases if len(a) > 2 and a.endswith(('市', '县'))]
        records.append({'id': 'geonames:' + r[0], 'name': name, 'region': region, 'area': country,
                        'admin1': r[10], 'latitude': float(r[4]), 'longitude': float(r[5]),
                        'feature': r[7], 'aliases': sorted(set(aliases)), 'modified': r[18]})
records.sort(key=lambda r: (r['region'], r['name'], r['id']))
data = {'version': 'geonames-2026-10-21', 'retrieved': '2026-10-21', 'crs': 'WGS84',
        'attribution': 'GeoNames.org, Creative Commons Attribution 4.0', 'license': 'https://creativecommons.org/licenses/by/4.0/',
        'selection': 'PPLC/PPLA/PPLA2/PPLA3 or populated places with population >=100000; source names preserved, not a complete administrative registry',
        'sources': sources, 'cities': records}
(root / 'data/cities.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(f'Wrote {len(records)} unique sourced city points')
