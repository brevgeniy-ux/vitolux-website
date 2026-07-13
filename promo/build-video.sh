#!/bin/bash
# VitoLux yacht promo video builder
set -e
W="$(cd "$(dirname "$0")" && pwd)/build_tmp"; mkdir -p "$W"/{txt,clips}
U="${PHOTOS_DIR:-./photos}"  # папка с исходными фото IMG_*.jpeg
FB=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
FR=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
cd "$W"

# --- text files (avoid drawtext escaping issues) ---
printf 'VITOLUX' > txt/brand.txt
printf 'Морские прогулки на яхте' > txt/s1.txt
printf 'Весёлая компания и шампанское на борту' > txt/s2.txt
printf 'Купание в лазурных бухтах' > txt/s3.txt
printf 'Встречайте закат в открытом море' > txt/s4.txt
printf 'Романтический ужин под шум волн' > txt/s5.txt
printf 'Забронируйте прогулку своей мечты' > txt/cta1.txt
printf 'info@vitoluxua.com' > txt/cta2.txt
printf 'Craft Ferretti  •  моторная яхта 14 м' > txt/sub1.txt

FADE="alpha='if(lt(t,0.9),t/0.9,if(lt(t,5.0),1,max(0,(6-t)/1.0)))'"
FADE8="alpha='if(lt(t,0.9),t/0.9,1)'"
PRE="crop=iw:iw*9/16,scale=3840:2160"
ZIN="zoompan=z='min(1.0+0.0010*on,1.18)':x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2':d=180:s=1920x1080:fps=30"
ZOUT="zoompan=z='max(1.18-0.0010*on,1.0)':x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2':d=180:s=1920x1080:fps=30"
PANR="zoompan=z='1.12':x='(iw-iw/zoom)*on/179':y='ih/2-(ih/zoom)/2':d=180:s=1920x1080:fps=30"
PANL="zoompan=z='1.12':x='(iw-iw/zoom)*(1-on/179)':y='ih/2-(ih/zoom)/2':d=180:s=1920x1080:fps=30"
ENC="-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p"

# Scene 1: hero shot, zoom in, brand title
ffmpeg -y -i "$U/63034796-IMG_6854.jpeg" -filter_complex "\
$PRE,$ZIN,\
drawtext=fontfile=$FB:textfile=txt/brand.txt:fontsize=140:fontcolor=white:x=(w-text_w)/2:y=h*0.13:shadowcolor=black@0.55:shadowx=4:shadowy=4:$FADE,\
drawtext=fontfile=$FR:textfile=txt/s1.txt:fontsize=54:fontcolor=white:x=(w-text_w)/2:y=h*0.13+185:shadowcolor=black@0.55:shadowx=3:shadowy=3:$FADE" \
-frames:v 180 $ENC clips/c1.mp4

# Scene 2: bow party, pan left
ffmpeg -y -i "$U/880642a9-IMG_6853.jpeg" -filter_complex "\
$PRE,$PANL,\
drawtext=fontfile=$FB:textfile=txt/s2.txt:fontsize=58:fontcolor=white:x=(w-text_w)/2:y=h*0.80:shadowcolor=black@0.55:shadowx=3:shadowy=3:$FADE" \
-frames:v 180 $ENC clips/c2.mp4

# Scene 3: turquoise bay + swim platform, pan right, model caption
ffmpeg -y -i "$U/2df42492-IMG_6832.jpeg" -filter_complex "\
$PRE,$PANR,\
drawtext=fontfile=$FB:textfile=txt/s3.txt:fontsize=58:fontcolor=white:x=(w-text_w)/2:y=h*0.80:shadowcolor=black@0.55:shadowx=3:shadowy=3:$FADE,\
drawtext=fontfile=$FR:textfile=txt/sub1.txt:fontsize=40:fontcolor=white@0.9:x=(w-text_w)/2:y=h*0.80+80:shadowcolor=black@0.55:shadowx=3:shadowy=3:$FADE" \
-frames:v 180 $ENC clips/c3.mp4

# Scene 4: sun flare silhouette, zoom out
ffmpeg -y -i "$U/444483da-IMG_6838.jpeg" -filter_complex "\
$PRE,$ZOUT,\
drawtext=fontfile=$FB:textfile=txt/s4.txt:fontsize=58:fontcolor=white:x=(w-text_w)/2:y=h*0.80:shadowcolor=black@0.55:shadowx=3:shadowy=3:$FADE" \
-frames:v 180 $ENC clips/c4.mp4

# Scene 5: evening light, zoom in
ffmpeg -y -i "$U/e8c3eaab-IMG_6839.jpeg" -filter_complex "\
$PRE,$ZIN,\
drawtext=fontfile=$FB:textfile=txt/s5.txt:fontsize=58:fontcolor=white:x=(w-text_w)/2:y=h*0.80:shadowcolor=black@0.55:shadowx=3:shadowy=3:$FADE" \
-frames:v 180 $ENC clips/c5.mp4

# Scene 6 (8s): CTA card on darkened hero shot
ffmpeg -y -i "$U/63034796-IMG_6854.jpeg" -filter_complex "\
$PRE,zoompan=z='min(1.0+0.0006*on,1.15)':x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2':d=240:s=1920x1080:fps=30,\
eq=brightness=-0.28:saturation=1.05,vignette=PI/5,\
drawtext=fontfile=$FB:textfile=txt/brand.txt:fontsize=120:fontcolor=white:x=(w-text_w)/2:y=h*0.30:shadowcolor=black@0.6:shadowx=4:shadowy=4:$FADE8,\
drawtext=fontfile=$FR:textfile=txt/cta1.txt:fontsize=56:fontcolor=white:x=(w-text_w)/2:y=h*0.30+180:shadowcolor=black@0.6:shadowx=3:shadowy=3:$FADE8,\
drawtext=fontfile=$FB:textfile=txt/cta2.txt:fontsize=48:fontcolor=0xFFD98A:x=(w-text_w)/2:y=h*0.30+290:shadowcolor=black@0.6:shadowx=3:shadowy=3:$FADE8" \
-frames:v 240 $ENC clips/c6.mp4

# --- concatenate with 1s crossfades: durations 6,6,6,6,6,8 => offsets 5,10,15,20,25 ---
ffmpeg -y -i clips/c1.mp4 -i clips/c2.mp4 -i clips/c3.mp4 -i clips/c4.mp4 -i clips/c5.mp4 -i clips/c6.mp4 -filter_complex "\
[0][1]xfade=transition=fade:duration=1:offset=5[v1];\
[v1][2]xfade=transition=fade:duration=1:offset=10[v2];\
[v2][3]xfade=transition=fade:duration=1:offset=15[v3];\
[v3][4]xfade=transition=fade:duration=1:offset=20[v4];\
[v4][5]xfade=transition=fade:duration=1:offset=25,fade=t=out:st=32:d=1,format=yuv420p[v]" \
-map "[v]" $ENC video_silent.mp4

# --- ambient audio: soft sea + warm pad (33s) ---
ffmpeg -y -filter_complex "\
anoisesrc=color=pink:seed=42:duration=33,lowpass=f=500,volume='0.30*(0.62+0.38*sin(2*PI*0.09*t))':eval=frame[waves];\
aevalsrc='(0.85+0.15*sin(2*PI*0.05*t))*(0.05*sin(2*PI*220*t)+0.045*sin(2*PI*277.18*t)+0.045*sin(2*PI*329.63*t)+0.03*sin(2*PI*440*t)+0.02*sin(2*PI*164.81*t))':s=44100:d=33,aecho=0.7:0.5:400|700:0.25|0.18[pad];\
[waves][pad]amix=inputs=2:duration=first:normalize=0,afade=t=in:st=0:d=2.5,afade=t=out:st=29.5:d=3.5[a]" \
-map "[a]" -ar 44100 audio.wav

# --- mux ---
ffmpeg -y -i video_silent.mp4 -i audio.wav -c:v copy -c:a aac -b:a 160k -shortest vitolux-yacht-promo.mp4
echo DONE
