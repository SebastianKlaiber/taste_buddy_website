#!/bin/zsh
# Rebuilds the website's app screenshots from the framed App Store iPhone set
# in the app repo (1320x2868 PNGs, upload/<locale>/<slot>.png).
#
# Usage: scripts/refresh-app-screenshots.sh [app-store-upload-dir]
# Needs ImageMagick 7 (`magick`), the Inter static fonts in ~/Library/Fonts and
# SF Pro Text Semibold in /Library/Fonts (status bar clock).
set -euo pipefail

SRC=${1:-$HOME/Dev/taste_buddy/output/iphone-screenshot-upload-20261007/upload}
# Hero backdrop. AI-generated food still from the Sept 2026 paid-social set
# (see output/paid-social-de-2026-09-26/source-manifest.json in the app repo).
FOOD=${FOOD:-$HOME/Dev/taste_buddy/output/paid-social-de-2026-09-26/sources/food-original.png}
OUT=${0:A:h}/../public/images
FONTS=$HOME/Library/Fonts
STATUS_FONT=${STATUS_FONT:-/Library/Fonts/SF-Pro-Text-Semibold.otf}

# Inner phone screen inside the framed store screenshot: the #17181A device
# border ends at x=144, y=521 in every slot of the 2026-10-07 template.
CROP=1030x2239+145+522

raw() { # locale slot name
  # Slots 01 and 08 have a photo behind the status bar, where the patch below shows. A light
  # top scrim (like iOS's scroll-edge effect) hides it; the Wi-Fi and battery glyphs, lifted
  # from slot 02's white status bar, go back on top in black.
  local scrim=()
  if [[ $2 == 01 || $2 == 08 ]]; then
    scrim=(
      '(' -size 660x110 gradient:'rgba(255,255,255,0.88)-rgba(255,255,255,0)' ')' -geometry +0+0 -composite
      '(' -size 100x30 xc:black
        '(' "$SRC/$1/02.png" -crop $CROP +repage -resize '660x1434!' -crop 100x30+498+40 +repage -colorspace gray -negate ')'
        -alpha off -compose copyopacity -composite ')'
      -geometry +498+40 -compose over -composite
    )
  fi
  # Status bar: the captures show assorted clock times and no-SIM dots. Wipe both with a
  # feathered median patch, then set the clock to Apple's 9:41 (centred on x=134.5, baseline 64).
  # Transparent rounded corners hide the device-frame slivers left by the rectangular crop.
  magick "$SRC/$1/$2.png" -crop $CROP +repage -resize '660x1434!' \
    \( +clone -crop 150x90+60+8 +repage -statistic median 29x29 -crop 110x50+20+20 +repage -blur 0x3 \) \
    \( -size 110x50 xc:black -fill white -draw "rectangle 10,8 99,41" -blur 0x4 \) -geometry +80+28 -composite \
    \( +clone -crop 96x70+424+20 +repage -statistic median 29x29 -crop 56x30+20+20 +repage -blur 0x3 \) \
    \( -size 56x30 xc:black -fill white -draw "rectangle 6,4 49,25" -blur 0x3 \) -geometry +444+40 -composite \
    "${scrim[@]}" \
    -font "$STATUS_FONT" -pointsize 31 -fill black -annotate +103+64 '9:41' \
    -alpha set \( -size 660x1434 xc:none -fill white -draw "roundrectangle 0,0,659,1433,78,78" \) \
    -compose DstIn -composite -strip -quality 84 -define webp:method=6 -define webp:alpha-quality=100 "$OUT/$3"
}

share_card() { # locale name
  # Slot 01's share sheet spills past the phone edge, so the crop above cuts it.
  # Export the whole card; PhoneFrame users float it over the screen.
  magick "$SRC/$1/01.png" -crop 1228x484+46+1868 +repage -resize 736x290 -alpha set \
    \( -size 736x290 xc:none -fill white -draw "roundrectangle 0,0,735,289,22,22" \) \
    -compose DstIn -composite -strip -quality 86 -define webp:method=6 -define webp:alpha-quality=100 "$OUT/$2"
}

phone() { # src dst width
  # Same proportions as src/components/marketing/PhoneFrame.astro.
  local w=$3 pad sw sh h r iw ih it
  pad=$(printf '%.0f' $(( w * 0.032 ))); sw=$(( w - 2 * pad )); sh=$(printf '%.0f' $(( sw * 1434.0 / 660 )))
  h=$(( sh + 2 * pad )); r=$(printf '%.0f' $(( w * 0.15 )))
  iw=$(printf '%.0f' $(( w * 0.27 ))); ih=$(printf '%.0f' $(( w * 0.078 ))); it=$(printf '%.0f' $(( w * 0.056 )))
  magick -size ${w}x${h} xc:none -fill '#121410' -draw "roundrectangle 0,0,$(( w - 1 )),$(( h - 1 )),$r,$r" \
    \( "$1" -resize "${sw}x${sh}!" \) -geometry +$pad+$pad -composite \
    -fill black -draw "roundrectangle $(( (w - iw) / 2 )),$it,$(( (w + iw) / 2 )),$(( it + ih )),$(( ih / 2 )),$(( ih / 2 ))" "$2"
}

# Landing hero (src/components/marketing/LandingPage.astro)
raw en-US 02 landing-recipe-collection.webp
raw en-US 08 landing-recipe-detail.webp
raw de-DE 02 landing-recipe-collection-de.webp
raw de-DE 08 landing-recipe-detail-de.webp
# Mirrored so the curry, not the rice, sits in the open space left of the phones.
magick "$FOOD" -crop 1024x1000+0+262 +repage -flop -strip -quality 72 -define webp:method=6 "$OUT/landing-hero-food.webp"

# How it works trail (src/components/marketing/HowItWorksPage.astro); the homepage
# workflow section reuses the save, find and meal-planning screens.
raw en-US 01 tastebuddy-save-recipes.webp
raw en-US 08 tastebuddy-recipe-details.webp
raw en-US 05 tastebuddy-find-recipes.webp
raw en-US 06 tastebuddy-meal-planning.webp
raw en-US 03 tastebuddy-cooking-steps.webp
raw de-DE 01 tastebuddy-rezepte-speichern.webp
raw de-DE 08 tastebuddy-rezept-details.webp
raw de-DE 05 tastebuddy-rezepte-finden.webp
raw de-DE 06 tastebuddy-wochenplanung.webp
raw de-DE 03 tastebuddy-kochschritte.webp
share_card en-US share-card.webp
share_card de-DE share-card-de.webp

# Default 1200x630 social card (src/layouts/Layout.astro)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
# Mirrors the homepage hero: food panel bleeding off the bottom, recipe list phone low on the
# left, recipe detail phone rising above the panel on the right.
phone "$OUT/landing-recipe-collection.webp" "$TMP/p1.png" 206
phone "$OUT/landing-recipe-detail.webp" "$TMP/p2.png" 262
magick "$OUT/landing-hero-food.webp" -resize '564x548^' -gravity north -extent 564x548 +gravity \
  \( -size 564x548 gradient:'rgba(0,52,14,0.35)-rgba(0,52,14,0)' \) -composite \
  \( -size 564x548 xc:none -fill white -draw "roundrectangle 0,0,563,600,28,28" \) -alpha set -compose DstIn -composite "$TMP/panel.png"
magick -size 1200x630 xc:'#F7F4ED' \
  -font "$FONTS/Inter_18pt-SemiBold.ttf" -pointsize 28 -fill '#00340E' -annotate +72+104 'TasteBuddy' \
  -font "$FONTS/Inter_24pt-Bold.ttf" -pointsize 58 -interline-spacing -8 -fill '#00340E' -annotate +68+216 $'Recipes worth\nsaving. Finally\nworth cooking.' \
  -font "$FONTS/Inter_18pt-Regular.ttf" -pointsize 24 -interline-spacing 6 -fill '#66685F' -annotate +72+424 $'Save from TikTok, Instagram and any\nwebsite. Plan, shop and cook in one app.' \
  "$TMP/panel.png" -geometry +596+82 -composite \
  \( -size 1200x630 xc:none -fill 'rgba(0,25,8,0.4)' -draw "roundrectangle 640,262,846,700,30,30" -draw "roundrectangle 862,52,1124,620,39,39" -blur 0x14 \) -composite \
  "$TMP/p1.png" -geometry +640+246 -composite \
  "$TMP/p2.png" -geometry +862+36 -composite \
  -strip -quality 86 -define webp:method=6 "$OUT/tastebuddy-app-screenshots.webp"

echo "Refreshed screenshots in $OUT"
