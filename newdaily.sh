set -ue
DATE=`date "+%Y%m%d"`
cat tmpl.md | sed -E "s/\{DATE\}/$DATE/g" | sed -E "s/\{AUTHOR\}/$AUTHOR/g" > $TARGET/$DATE.md
