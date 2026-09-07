import gzip,json,re
from pathlib import Path
import vl_convert as vlc
root=Path(__file__).resolve().parents[3]
with gzip.open(Path(__file__).with_name('source-charts.json.gz'),'rt') as f:
 charts=json.load(f)
out=root/'static/images/highlights/research-acceleration';out.mkdir(parents=True,exist_ok=True)
colors={'blue':['#d8e7ff','#85b4ff','#3469ce','#21468e','#13284f'],'gray':['#dedee3','#adaeb7','#777b88','#444955'],'green':['#d0eee1','#8cd1ad','#399b78','#216b53'],'orange':['#ffe2bd','#f9bd75','#df8d39','#a56220'],'purple':['#e4dbfa','#b9a0e8','#8863bc','#594180'],'pink':['#f9dbe9','#e9a3c4','#bd6395','#853d64'],'yellow':['#f8edc0','#e6d580','#b5a446','#827325'],'red':['#f9d8d8','#db9494','#b75b5b']}
def clean(o):
 if isinstance(o,dict):return {k:clean(v) for k,v in o.items()}
 if isinstance(o,list):return [clean(x) for x in o]
 if isinstance(o,str):
  if o=='$$,.2f':return '$,.2f'
  if o=='OpenAI Sans':return 'Arial'
  if o=='theme3':return '#3469ce'
  if 'stripes' in o:return {'theme2_stripes3_filled_green':'#97d4b7','theme3_stripes2_filled_green':'#397d60','theme3_stripes3':'#87a8e4'}.get(o,'#3469ce')
  m=re.fullmatch(r'theme(\d)_(\w+)',o)
  if m:return colors[m[2]][int(m[1])-1]
  return o if 'datum.' in o else o.replace('\\n',' ')
 return o
for id,chart in charts.items():
 spec=clean(chart['vegaLiteSpec']);title=spec.pop('title',None)
 spec['width']=720;spec['height']=360
 if id=='1nabj561MakfHpgk8Nau7M':
  spec['layer'][-1]['encoding']['color']['value']='#525862'
 spec['config']={'background':'white','font':'Arial','view':{'stroke':None},'axis':{'labelFontSize':12,'titleFontSize':12,'labelLimit':210,'titleLimit':700,'gridColor':'#eceef1'},'legend':{'labelFontSize':11,'titleFontSize':12,'orient':'bottom','columns':2,'labelLimit':500}}
 if id in ['276xfN35M5ZRRCHqaGoeqc','6uxQo7OTnJrk6arDtdYQGt']:
  spec['width']=340;spec['height']=270
  spec['config']['axis'].update({'labelFontSize':14,'titleFontSize':14})
 if 'params' in spec:
  for p in spec['params']:p.pop('bind',None)
 try:
  svg=vlc.vegalite_to_svg(spec)
  suffix='-paired' if id in ['276xfN35M5ZRRCHqaGoeqc','6uxQo7OTnJrk6arDtdYQGt'] else ''
  (out/f'{id}{suffix}.svg').write_text(svg)
  print('OK',id,len(svg))
 except Exception as e: print('ERROR',id,str(e)[:1500])
