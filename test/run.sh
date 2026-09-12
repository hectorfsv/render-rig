#!/usr/bin/env bash
# Verify the Render Rig front end. Read-only: nothing is sent, nothing is spent.
#
#   ./test/run.sh            everything
#   ./test/run.sh mobile     phone + landscape layout
#   ./test/run.sh desktop    wide layout, hub, guide
#   ./test/run.sh price      the guide's numbers vs what the meter computes
#   ./test/run.sh stage      a render lands, shows its seed, and can be cleared
#   ./test/run.sh credit     credit left on screen, and every way the lookup fails
#   ./test/run.sh gallery    the gallery: flagged work, prompts, empty and failed states
#   ./test/run.sh segs       every segmented control reacts to the click that made it
#   ./test/run.sh zoom       no field under 16px (iOS zooms the page and stays)
#   ./test/run.sh tape       the rail marquee: pitch, seam, direction, speed
#   ./test/run.sh shots      write previews to test/build/*.png
#
# Every harness is REGENERATED from the current index.html on every run. Never
# edit a file in test/build - it is disposable, and a harness that is a stale
# copy of the page has cost this project hours more than once.
set -u
cd "$(dirname "$0")/.."
ROOT="$PWD"; B="$ROOT/test/build"; INJ="$ROOT/test/inject"
CHR="$HOME/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-x64/chrome-headless-shell"
[ -x "$CHR" ] || { echo "chrome-headless-shell not found at:"; echo "  $CHR"; exit 2; }
mkdir -p "$B"; [ -f "$B/imgs.js" ] || python3 "$ROOT/test/make-fixtures.py" >/dev/null

build(){ python3 - "$1" "$2" <<'PY'
import sys, pathlib
root = pathlib.Path(__file__).parent if False else pathlib.Path('.')
src = open('index.html').read()
inj = open(sys.argv[1]).read()
assert src.count('</body>') == 1, 'index.html has no single </body>'
open(sys.argv[2], 'w').write(src.replace('</body>', inj + '\n</body>'))
PY
}
title(){ "$CHR" --headless --disable-gpu --hide-scrollbars --virtual-time-budget="${4:-4500}" \
  --window-size="$1","$2" --dump-dom "$3" 2>/dev/null | tr -d '\n' \
  | sed -n 's/.*<title>§\(.*\)§<\/title>.*/\1/p'; }

WHAT="${1:-all}"; PASS=0; FAIL=0
line(){ printf '%s\n' "----------------------------------------------------------"; }

if [ "$WHAT" = all ] || [ "$WHAT" = mobile ]; then
  build "$INJ/mob.txt" "$B/m.html"
  line; echo "MOBILE  (6 viewports x 4 modes)"
  for v in "393 852" "393 700" "360 780" "852 393" "430 900" "932 430"; do
    for m in video image compose upscale; do set -- $v
      R=$(title "$1" "$2" "file://$B/m.html?m=$m")
      p=$(printf '%s' "$R" | grep -o PASS | wc -l | tr -d ' ')
      f=$(printf '%s' "$R" | grep -o FAIL | wc -l | tr -d ' ')
      PASS=$((PASS+p)); FAIL=$((FAIL+f))
      [ "$f" != 0 ] && { echo "  ${1}x${2} $m"; printf '%s' "$R" | sed 's/FAIL/\nFAIL/g' | grep FAIL | sed 's/^/     /'; }
    done
  done
  echo "  -> $PASS pass / $FAIL fail"
fi

if [ "$WHAT" = all ] || [ "$WHAT" = desktop ]; then
  build "$INJ/inj.txt" "$B/h.html"
  line; echo "DESKTOP  (5 viewports: console x4 modes, hub, guide)"
  dp=0; df=0
  for v in "2560 1400" "2026 1037" "1440 900" "1180 820" "1040 800"; do set -- $v
    for m in video image compose upscale; do
      E=$(title "$1" "$2" "file://$B/h.html?s=scr-console&m=$m" 3500 | python3 -c "
import json,sys
r=json.load(sys.stdin); bad=[]
if r['hscroll']>0: bad.append('horizontal overflow %d'%r['hscroll'])
if r['genHit']!='yes': bad.append('Generate '+r['genHit'])
if r['vscroll']>0: bad.append('console scrolls the page %d'%r['vscroll'])
e=[r['stage']['b'],r['gen']['b'],r['hist']['b']]
if max(e)-min(e)>60: bad.append('columns ragged')
print('|'.join(bad))")
      [ -z "$E" ] && dp=$((dp+1)) || { df=$((df+1)); echo "  FAIL ${1}x${2} $m: $E"; }
    done
    for s in scr-hub scr-guide; do
      E=$(title "$1" "$2" "file://$B/h.html?s=$s" 3500 | python3 -c "
import json,sys
r=json.load(sys.stdin); bad=[]
if r['hscroll']>0: bad.append('horizontal overflow')
if r.get('noteW',0)>620: bad.append('guide measure %dpx (cap 620)'%r['noteW'])
if r.get('cards') is not None and (r['cards']!=4 or 'NO' in r.get('hit','')): bad.append('hub cards %s %s'%(r['cards'],r.get('hit')))
print('|'.join(bad))")
      [ -z "$E" ] && dp=$((dp+1)) || { df=$((df+1)); echo "  FAIL ${1}x${2} $s: $E"; }
    done
  done
  echo "  -> $dp pass / $df fail"; PASS=$((PASS+dp)); FAIL=$((FAIL+df))
fi

if [ "$WHAT" = all ] || [ "$WHAT" = price ]; then
  build "$INJ/cost.txt" "$B/c.html"
  line; echo "PRICE  (every figure the guide quotes vs what the meter computes)"
  R=$(title 1600 1000 "file://$B/c.html")
  printf '%s' "$R" | sed 's/PASS/\nPASS/g; s/FAIL/\nFAIL/g' | grep -E '^(PASS|FAIL)' | sed 's/^/  /'
  p=$(printf '%s' "$R" | grep -o PASS | wc -l | tr -d ' '); f=$(printf '%s' "$R" | grep -o FAIL | wc -l | tr -d ' ')
  PASS=$((PASS+p)); FAIL=$((FAIL+f)); echo "  -> $p pass / $f fail"
fi

if [ "$WHAT" = all ] || [ "$WHAT" = segs ]; then
  build "$INJ/segs.txt" "$B/sg.html"
  line; echo "SEGS  (every segmented control shows the choice the instant it is clicked)"
  ep=0; ef=0
  for v in "2026 1037" "1440 900" "393 852" "393 700"; do set -- $v
    R=$(title "$1" "$2" "file://$B/sg.html" 25000)
    p=$(printf '%s' "$R" | grep -o PASS | wc -l | tr -d ' ')
    f=$(printf '%s' "$R" | grep -o FAIL | wc -l | tr -d ' ')
    ep=$((ep+p)); ef=$((ef+f))
    if [ "$f" != 0 ]; then echo "  ${1}x${2}"; printf '%s' "$R" | sed 's/FAIL/\nFAIL/g' | grep FAIL | sed 's/^/     /'; fi
  done
  echo "  -> $ep pass / $ef fail"; PASS=$((PASS+ep)); FAIL=$((FAIL+ef))
fi

if [ "$WHAT" = all ] || [ "$WHAT" = gallery ]; then
  build "$INJ/gallery.txt" "$B/gl.html"
  line; echo "GALLERY  (flagged work, the prompt behind it, and both failure states)"
  gp=0; gf=0
  for m in ok empty fail http; do
    for v in "2026 1037" "1440 900" "393 852" "393 700"; do set -- $v
      R=$(title "$1" "$2" "file://$B/gl.html?g=$m" 25000)
      p=$(printf '%s' "$R" | grep -o PASS | wc -l | tr -d ' ')
      f=$(printf '%s' "$R" | grep -o FAIL | wc -l | tr -d ' ')
      gp=$((gp+p)); gf=$((gf+f))
      if [ "$f" != 0 ]; then echo "  g=$m ${1}x${2}"; printf '%s' "$R" | sed 's/FAIL/\nFAIL/g' | grep FAIL | sed 's/^/     /'; fi
    done
  done
  echo "  -> $gp pass / $gf fail"; PASS=$((PASS+gp)); FAIL=$((FAIL+gf))
fi

if [ "$WHAT" = all ] || [ "$WHAT" = credit ]; then
  build "$INJ/credit.txt" "$B/cr.html"
  line; echo "CREDIT  (balance on screen, and every way it can fail)"
  cp=0; cf=0
  for m in ok low tiny fail http junk; do
    for v in "2026 1037" "393 852"; do set -- $v
      R=$(title "$1" "$2" "file://$B/cr.html?bal=$m" 20000)
      p=$(printf '%s' "$R" | grep -o PASS | wc -l | tr -d ' ')
      f=$(printf '%s' "$R" | grep -o FAIL | wc -l | tr -d ' ')
      cp=$((cp+p)); cf=$((cf+f))
      if [ "$f" != 0 ]; then echo "  bal=$m ${1}x${2}"; printf '%s' "$R" | sed 's/FAIL/\nFAIL/g' | grep FAIL | sed 's/^/     /'; fi
    done
  done
  echo "  -> $cp pass / $cf fail"; PASS=$((PASS+cp)); FAIL=$((FAIL+cf))
fi

if [ "$WHAT" = all ] || [ "$WHAT" = stage ]; then
  build "$INJ/stage.txt" "$B/st.html"
  line; echo "STAGE  (submit -> land -> seed -> every way out of a result)"
  sp=0; sf=0
  for v in "2026 1037" "1440 900" "393 852" "393 700" "852 393"; do set -- $v
    R=$(title "$1" "$2" "file://$B/st.html" 90000)
    p=$(printf '%s' "$R" | grep -o PASS | wc -l | tr -d ' ')
    f=$(printf '%s' "$R" | grep -o FAIL | wc -l | tr -d ' ')
    sp=$((sp+p)); sf=$((sf+f))
    [ "$f" != 0 ] && { echo "  ${1}x${2}"; printf '%s' "$R" | sed 's/FAIL/\nFAIL/g' | grep FAIL | sed 's/^/     /'; }
  done
  echo "  -> $sp pass / $sf fail"; PASS=$((PASS+sp)); FAIL=$((FAIL+sf))
fi

if [ "$WHAT" = all ] || [ "$WHAT" = zoom ]; then
  build "$INJ/zoom.txt" "$B/z.html"
  line; echo "ZOOM  (no field under 16px - iOS zooms the page and stays there)"
  zp=0; zf=0
  for v in "393 852" "393 700" "852 393" "2026 1037"; do set -- $v
    R=$(title "$1" "$2" "file://$B/z.html" 6000)
    p=$(printf '%s' "$R" | grep -o PASS | wc -l | tr -d ' ')
    f=$(printf '%s' "$R" | grep -o FAIL | wc -l | tr -d ' ')
    zp=$((zp+p)); zf=$((zf+f))
    [ "$f" != 0 ] && { echo "  ${1}x${2}"; printf '%s' "$R" | sed 's/FAIL/\nFAIL/g' | grep FAIL | sed 's/^/     /'; }
  done
  echo "  -> $zp pass / $zf fail"; PASS=$((PASS+zp)); FAIL=$((FAIL+zf))
fi

if [ "$WHAT" = all ] || [ "$WHAT" = tape ]; then
  build "$INJ/tape.txt" "$B/tp.html"; build "$INJ/speed.txt" "$B/sp.html"
  line; echo "TAPE  (rail marquee)"
  title 2026 1037 "file://$B/tp.html" | sed 's/&#10;/\n/g' | sed 's/^/  /'
  title 2026 1037 "file://$B/sp.html" | sed 's/^/  /'
fi

if [ "$WHAT" = shots ]; then
  # Transitions OFF: an infinite CSS animation stops headless virtual time, so a
  # 0.14s transition never settles and a screenshot shows the PREVIOUS state.
  python3 - <<'PY'
src=open('index.html').read()
inj=open('test/inject/pop.txt').read().replace('<script src="imgs.js"></script>',
  '<style>.sheet-tabs button,.go,.card{transition:none!important}</style><script src="build/imgs.js"></script>')
open('test/build/p.html','w').write(src.replace('</body>', inj+'\n</body>'))
PY
  cp "$B/imgs.js" "$ROOT/imgs.js" 2>/dev/null
  line; echo "PREVIEWS -> test/build/"
  shot(){ "$CHR" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=30000 \
    --force-device-scale-factor="$5" --window-size="$1","$2" --screenshot="$B/$3.png" \
    "file://$B/p.html?$4" >/dev/null 2>&1; echo "  $3.png"; }
  shot 393 852  phone-setup "full=1&m=image&p=pane-ctl" 3
  shot 393 852  phone-stage "full=1&m=image&shut=1"     3
  shot 852 393  phone-land  "full=1&m=image&p=pane-ctl" 2
  shot 2026 1037 desk       "full=1&m=image&p=pane-ctl" 1
  rm -f "$ROOT/imgs.js"
  exit 0
fi

line
if [ "$FAIL" = 0 ]; then echo "ALL GREEN — $PASS assertions, 0 failures"; else
  echo "$PASS pass / $FAIL FAIL"; exit 1; fi
